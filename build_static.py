import os
import json
import shutil
import markdown2

DIST_DIR = 'dist'
STATIC_DIR = os.path.join(DIST_DIR, 'static')
CONTENT_DIR = 'content'
NEWSLETTER_DIR = os.path.join(CONTENT_DIR, 'newsletters')
PROJECTS_VISIBLE_COUNT = 4

def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_newsletters():
    newsletters = []
    if not os.path.exists(NEWSLETTER_DIR):
        return newsletters
    
    for filename in sorted(os.listdir(NEWSLETTER_DIR)):
        if filename.endswith('.md'):
            file_path = os.path.join(NEWSLETTER_DIR, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                title = lines[0].strip()
                markdown_content = "".join(lines[1:]).strip()
                html_content = markdown2.markdown(markdown_content, extras=["fenced-code-blocks", "tables"])
                
                newsletter_id = os.path.splitext(filename)[0]
                newsletters.append({
                    "id": newsletter_id,
                    "title": title,
                    "content": html_content
                })
    return newsletters

def create_project_html(project, lang, is_hidden):
    hidden_class = " hidden-project" if is_hidden else ""
    name = project[lang]['name']
    description = project[lang]['description']
    images = json.dumps(project['images'])
    thumb = project['thumb']
    external_link = project.get('external_link_image', '')
    external_link_attr = f'data-external-link-image="{external_link}"' if external_link else ''
    
    return f"""
    <div class="project{hidden_class}" data-name="{name}" data-description="{description}" data-images='{images}' {external_link_attr}>
        <div class="project-inner">
            <img src="{thumb}" alt="A clickable image of my project, {name}." class="project-img" draggable="false">
            <h2 class="project-name">{name}</h2>
        </div>
    </div>
    """

def generate_all_projects_html(projects_data, lang, texts):
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
        projects_html += f"""
        <div class="view-all-container">
            <button id="view-all-btn" class="view-all-btn" data-state="hidden" data-show-text="{texts['view_all']}" data-hide-text="{texts['show_less']}">
                {texts['view_all']}
            </button>
        </div>"""
    
    return projects_html

def generate_newsletter_html(newsletters, texts):
    if not newsletters:
        return ""

    list_items = ""
    for newsletter in newsletters:
        list_items += f'<li data-id="{newsletter["id"]}">{newsletter["title"]}</li>'

    newsletter_data_json = json.dumps(newsletters)

    # Note the <form> action points to Formspree now.
    # Replace YOUR_UNIQUE_ID with your actual Formspree endpoint ID.
    return f"""
    <h1 class="title">{texts['title']}</h1>
    <div class="newsletter-container">
        <div class="newsletter-list">
            <ul>{list_items}</ul>
            <div class="subscribe-box">
                <h4>{texts['subscribe_title']}</h4>
                <form action="https://formspree.io/f/YOUR_UNIQUE_ID" method="POST">
                    <input type="text" name="name" placeholder="{texts['subscribe_name_placeholder']}" required>
                    <input type="email" name="email" placeholder="{texts['subscribe_email_placeholder']}" required>
                    <button type="submit">{texts['subscribe_button']}</button>
                </form>
            </div>
        </div>
        <div class="newsletter-content">
            <p>{texts['prompt']}</p>
        </div>
    </div>
    <script>const newsletterData = {newsletter_data_json};</script>
    """

def build():
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
    os.makedirs(STATIC_DIR)
    
    shutil.copytree('static', STATIC_DIR, dirs_exist_ok=True)

    projects_data = load_data('projects.json')
    about_data = load_data(os.path.join(CONTENT_DIR, 'about_text.json'))
    newsletters = load_newsletters()

    languages = {
        "en": {
            "template": "templates/en.html", 
            "texts": { "view_all": "Show All Projects", "show_less": "Show Less", "newsletter_title": "My Newsletters", "newsletter_prompt": "Select a newsletter from the list to read it.", "subscribe_title": "Join the Newsletter", "subscribe_name_placeholder": "Your Name", "subscribe_email_placeholder": "Your Email", "subscribe_button": "Subscribe" }
        },
        "tr": {
            "template": "templates/tr.html", 
            "texts": { "view_all": "Tüm Projeleri Göster", "show_less": "Daha Az Göster", "newsletter_title": "Bültenlerim", "newsletter_prompt": "Okumak için listeden bir bülten seçin.", "subscribe_title": "Bültene Katıl", "subscribe_name_placeholder": "Adınız", "subscribe_email_placeholder": "E-posta Adresiniz", "subscribe_button": "Abone Ol" }
        },
        "ar": {
            "template": "templates/ar.html", 
            "texts": { "view_all": "عرض كل المشاريع", "show_less": "عرض أقل", "newsletter_title": "نشراتي الإخبارية", "newsletter_prompt": "اختر نشرة من القائمة لقراءتها.", "subscribe_title": "انضم إلى النشرة الإخبارية", "subscribe_name_placeholder": "اسمك", "subscribe_email_placeholder": "بريدك الإلكتروني", "subscribe_button": "اشتراك" }
        }
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
            newsletter_ui_texts = {k: v for k, v in config['texts'].items() if 'newsletter' in k or 'subscribe' in k}
            newsletter_ui_texts['title'] = config['texts']['newsletter_title']
            newsletter_ui_texts['prompt'] = config['texts']['newsletter_prompt']
            newsletter_html = generate_newsletter_html(newsletters, newsletter_ui_texts)
        
        template = template.replace('{{NEWSLETTER_SECTION_HTML}}', newsletter_html)
        
        with open(os.path.join(DIST_DIR, f'{lang}.html'), 'w', encoding='utf-8') as f:
            f.write(template)

    shutil.copy('templates/index.html', os.path.join(DIST_DIR, 'index.html'))
    shutil.copy('favicon.png', os.path.join(DIST_DIR, 'favicon.png'))
    print("Website built successfully in 'dist' directory!")

if __name__ == '__main__':
    build()
