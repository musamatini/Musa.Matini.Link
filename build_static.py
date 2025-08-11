import os
import json
import shutil
from datetime import datetime

DIST_DIR = 'dist'
STATIC_DIR = os.path.join(DIST_DIR, 'static')
CONTENT_DIR = 'content'
NEWSLETTER_DIR = os.path.join(CONTENT_DIR, 'newsletters')
PROJECTS_VISIBLE_COUNT = 4
BASE_URL = "https://musamatini.link"  # Change this to your actual domain

def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_newsletters():
    newsletters = []
    if not os.path.exists(NEWSLETTER_DIR):
        return newsletters
    
    for filename in sorted(os.listdir(NEWSLETTER_DIR)):
        if filename.endswith('.txt'):
            file_path = os.path.join(NEWSLETTER_DIR, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                title = lines[0].strip()
                content = "".join(lines[1:]).strip().replace('\n', '<br>')
                newsletter_id = os.path.splitext(filename)[0]
                newsletters.append({
                    "id": newsletter_id,
                    "title": title,
                    "content": content
                })
    return newsletters

# --- YOUR EXISTING HTML GENERATION FUNCTIONS ARE UNCHANGED ---
def create_project_html(project, lang, is_hidden):
    # (This function is the same as before)
    hidden_class = " hidden-project" if is_hidden else ""
    name = project[lang]['name']
    description = project[lang]['description']
    images = json.dumps(project['images'])
    thumb = project['thumb']
    external_link = project.get('external_link_image', '')
    external_link_attr = f'data-external-link-image="{external_link}"' if external_link else ''
    return f"""<div class="project{hidden_class}" data-name="{name}" data-description="{description}" data-images='{images}' {external_link_attr}><div class="project-inner"><img src="{thumb}" alt="A clickable image of my project, {name}." class="project-img" draggable="false"><h2 class="project-name">{name}</h2></div></div>"""

def generate_all_projects_html(projects_data, lang, texts):
    # (This function is the same as before)
    projects_html = ""
    project_count = 0
    hidden_items_exist = False
    for project in projects_data:
        is_hidden = False
        if project.get('category') == 'project':
            if project_count >= PROJECTS_VISIBLE_COUNT:
                is_hidden = True
                hidden_items_exist = True
            project_count += 1
        projects_html += create_project_html(project, lang, is_hidden)
    if hidden_items_exist:
        projects_html += f"""<div class="view-all-container"><button id="view-all-btn" class="view-all-btn" data-state="hidden" data-show-text="{texts['view_all']}" data-hide-text="{texts['show_less']}">{texts['view_all']}</button></div>"""
    return projects_html

def generate_newsletter_html(newsletters, texts):
    # (This function is the same as before)
    if not newsletters: return ""
    list_items = ""
    for newsletter in newsletters:
        list_items += f'<li data-id="{newsletter["id"]}">{newsletter["title"]}</li>'
    newsletter_data_json = json.dumps(newsletters)
    return f"""<h1 class="title">{texts['title']}</h1><div class="newsletter-container"><div class="newsletter-list"><ul>{list_items}</ul></div><div class="newsletter-content"><p>{texts['prompt']}</p></div></div><script>const newsletterData = {newsletter_data_json};</script>"""


# --- NEW FUNCTION TO GENERATE THE SITEMAP ---
def generate_sitemap(languages):
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Start of the XML file
    sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # Add the main (index) page
    sitemap_content += '  <url>\n'
    sitemap_content += f'    <loc>{BASE_URL}/</loc>\n'
    sitemap_content += f'    <lastmod>{today}</lastmod>\n'
    sitemap_content += '    <priority>1.0</priority>\n'
    sitemap_content += '  </url>\n'

    # Add each language page (en.html, tr.html, etc.)
    for lang in languages.keys():
        sitemap_content += '  <url>\n'
        sitemap_content += f'    <loc>{BASE_URL}/{lang}.html</loc>\n'
        sitemap_content += f'    <lastmod>{today}</lastmod>\n'
        sitemap_content += '    <priority>0.8</priority>\n'
        sitemap_content += '  </url>\n'
    
    sitemap_content += '</urlset>'

    # Write the file to the dist directory
    with open(os.path.join(DIST_DIR, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(sitemap_content)
    print("Sitemap generated successfully.")


def build():
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
    os.makedirs(STATIC_DIR)
    
    shutil.copytree('static', STATIC_DIR, dirs_exist_ok=True)

    projects_data = load_data('projects.json')
    about_data = load_data(os.path.join(CONTENT_DIR, 'about_text.json'))
    newsletters = load_newsletters()

    languages = {
        "en": { "template": "templates/en.html", "texts": { "view_all": "Show All Projects", "show_less": "Show Less", "newsletter_title": "My Newsletters", "newsletter_prompt": "Select a newsletter from the list to read it." } },
        "tr": { "template": "templates/tr.html", "texts": { "view_all": "Tüm Projeleri Göster", "show_less": "Daha Az Göster", "newsletter_title": "Bültenlerim", "newsletter_prompt": "Okumak için listeden bir bülten seçin." } },
        "ar": { "template": "templates/ar.html", "texts": { "view_all": "عرض كل المشاريع", "show_less": "عرض أقل", "newsletter_title": "نشراتي الإخبارية", "newsletter_prompt": "اختر نشرة من القائمة لقراءتها." } }
    }

    for lang, config in languages.items():
        with open(config['template'], 'r', encoding='utf-8') as f:
            template = f.read()

        projects_html = generate_all_projects_html(projects_data, lang, config['texts'])
        about_text = about_data[lang]
        template = template.replace('{{ABOUT_TEXT}}', about_text)
        template = template.replace('{{PROJECTS_HTML}}', projects_html)
        
        newsletter_html = ""
        if newsletters:
            newsletter_ui_texts = {"title": config['texts']['newsletter_title'], "prompt": config['texts']['newsletter_prompt']}
            newsletter_html = generate_newsletter_html(newsletters, newsletter_ui_texts)
        template = template.replace('{{NEWSLETTER_SECTION_HTML}}', newsletter_html)
        
        with open(os.path.join(DIST_DIR, f'{lang}.html'), 'w', encoding='utf-8') as f:
            f.write(template)

    # --- Copying root files AND generating sitemap ---
    shutil.copy('templates/index.html', os.path.join(DIST_DIR, 'index.html'))
    shutil.copy('favicon.png', os.path.join(DIST_DIR, 'favicon.png'))
    shutil.copy('googleec5f59a1e99626bf.html', os.path.join(DIST_DIR, 'googleec5f59a1e99626bf.html'))
    shutil.copy('robots.txt', os.path.join(DIST_DIR, 'robots.txt'))
    
    # Call the new sitemap generator function
    generate_sitemap(languages)
    
    print("Website built successfully in 'dist' directory!")

if __name__ == '__main__':
    build()
