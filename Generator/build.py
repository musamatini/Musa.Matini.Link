import os
import json
import shutil
import markdown
from jinja2 import Environment, FileSystemLoader

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, 'content')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
OUTPUT_DIR = os.path.join(BASE_DIR, '..', 'StaticWebsite')
OUTPUT_MEDIA_DIR = os.path.join(OUTPUT_DIR, 'media')
VALID_MEDIA_EXTS = ('.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf')
VALID_IMG_EXTS_ONLY = ('.png', '.jpg', '.jpeg', '.webp', '.svg')

def clean_and_prep_output():
    """Cleans the output directory and recreates the media folder."""
    print(f"[DEBUG] Cleaning Output Dir: {OUTPUT_DIR}")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_MEDIA_DIR)

def copy_assets():
    print("-" * 30)
    print("[DEBUG] STARTING ASSET COPY...")
    print(f"[DEBUG] Looking for assets in: {ASSETS_DIR}")

    # 1. Copy Core Files
    files_to_copy = ['style.css', 'rtl.css', 'script.js']
    for f in files_to_copy:
        src = os.path.join(ASSETS_DIR, f)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(OUTPUT_DIR, f))
            print(f"[SUCCESS] Copied file: {f}")
        else:
            print(f"[WARNING] File missing: {f}")

    # 2. Copy Folders (Libs, Fonts, FontAwesome)
    folders_to_copy = ['libs', 'fonts', 'css', 'webfonts']
    
    for folder in folders_to_copy:
        src_path = os.path.join(ASSETS_DIR, folder)
        dest_path = os.path.join(OUTPUT_DIR, folder)
        
        if os.path.exists(src_path):
            # Check if empty
            if not os.listdir(src_path):
                print(f"[WARNING] Folder found but EMPTY: {folder}")
            else:
                shutil.copytree(src_path, dest_path, dirs_exist_ok=True)
                print(f"[SUCCESS] Copied folder: {folder} -> {dest_path}")
                # List a few files to verify
                files = os.listdir(src_path)[:3]
                print(f"       -> Contains: {files}")
        else:
            print(f"[CRITICAL FAIL] Folder MISSING in assets: {folder}")
            if folder == 'css' or folder == 'webfonts':
                print("       -> This is why your icons are broken!")

    # 3. Copy Images & PFP
    pfp_list = []
    print("[DEBUG] Processing Media/Images...")
    for file in os.listdir(ASSETS_DIR):
        if file.lower().endswith(VALID_IMG_EXTS_ONLY) or file == 'favicon.png':
            shutil.copy(os.path.join(ASSETS_DIR, file), os.path.join(OUTPUT_MEDIA_DIR, file))
            if file.startswith('me'):
                pfp_list.append(f"./media/{file}")
    
    print(f"[DEBUG] Found {len(pfp_list)} PFP images.")
    return pfp_list

def load_localized_text(base_path, lang):
    content = ""
    target_path = f"{base_path}.{lang}.md"
    fallback_en = f"{base_path}.en.md"
    fallback_generic = f"{base_path}.md"

    if os.path.exists(target_path): 
        with open(target_path, 'r', encoding='utf-8') as f: content = f.read()
    elif os.path.exists(fallback_en): 
        with open(fallback_en, 'r', encoding='utf-8') as f: content = f.read()
    elif os.path.exists(fallback_generic):
        with open(fallback_generic, 'r', encoding='utf-8') as f: content = f.read()
    
    if content:
        return markdown.markdown(content, extensions=['fenced_code', 'nl2br'])
    return ""

def process_section_folders(section_name, lang):
    source_folder = os.path.join(CONTENT_DIR, section_name)
    items = []
    if not os.path.exists(source_folder): return []
    
    subfolders = [f.path for f in os.scandir(source_folder) if f.is_dir()]
    
    for folder in subfolders:
        folder_base_name = os.path.basename(folder)
        item_data = {}
        
        meta_path = os.path.join(folder, 'metadata.json')
        meta = {}
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as f:
                    meta = json.load(f)
            except Exception as e:
                print(f"Error reading metadata for {folder_base_name}: {e}")

        try:
            item_data['_order'] = int(meta.get('order', 999))
        except (ValueError, TypeError):
            item_data['_order'] = 999

        titles = meta.get('title', {})
        if isinstance(titles, dict):
            item_data['title'] = titles.get(lang, titles.get('en', folder_base_name))
        elif isinstance(titles, str):
            item_data['title'] = titles
        else:
            item_data['title'] = folder_base_name

        item_data['description'] = load_localized_text(os.path.join(folder, 'desc'), lang)
        
        thumb_file = next((f for f in os.listdir(folder) if f.startswith('thumb.') and f.lower().endswith(VALID_IMG_EXTS_ONLY)), None)
        thumb_path = ""
        if thumb_file:
            new_thumb = f"{folder_base_name}_thumb{os.path.splitext(thumb_file)[1]}"
            shutil.copy(os.path.join(folder, thumb_file), os.path.join(OUTPUT_MEDIA_DIR, new_thumb))
            thumb_path = f"./media/{new_thumb}"
            item_data['thumb'] = thumb_path
        else: 
            item_data['thumb'] = ""

        gallery_files = [f for f in os.listdir(folder) if f[0].isdigit() and f.lower().endswith(VALID_MEDIA_EXTS)]
        gallery_files.sort(key=lambda x: int(os.path.splitext(x)[0]))
        processed_paths = []
        for file in gallery_files:
            new_name = f"{folder_base_name}_{file}" 
            shutil.copy(os.path.join(folder, file), os.path.join(OUTPUT_MEDIA_DIR, new_name))
            processed_paths.append(f"./media/{new_name}")
        
        if not processed_paths and thumb_path:
            processed_paths.append(thumb_path)

        item_data['images_string'] = ",".join(processed_paths)
        items.append(item_data)
    
    items.sort(key=lambda x: (x['_order'], x['title']))
    return items

def generate_entry_point():
    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=en.html">
    <script>
        const lang = navigator.language || navigator.userLanguage;
        if (lang.startsWith('tr')) { window.location.replace("tr.html"); }
        else if (lang.startsWith('ar')) { window.location.replace("ar.html"); }
        else { window.location.replace("en.html"); }
    </script>
</head>
<body></body>
</html>"""
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)

def build_site():
    print("Building website...")
    clean_and_prep_output()
    
    pfps = copy_assets()
    pfps.sort()
    if not pfps: pfps = ["./media/me.png"]
    pfp_js_array = json.dumps(pfps)

    try:
        with open(os.path.join(CONTENT_DIR, 'data.json'), 'r', encoding='utf-8') as f:
            data_json = json.load(f)
    except FileNotFoundError:
        print("CRITICAL: data.json not found in content directory.")
        return

    env = Environment(loader=FileSystemLoader(os.path.join(BASE_DIR)))
    try:
        template = env.get_template('template.html')
    except Exception as e:
        print(f"CRITICAL: template.html not found or invalid. {e}")
        return

    for lang in ['en', 'tr', 'ar']:
        print(f"Generating {lang}.html...")
        lang_data = data_json.get(lang, data_json['en'])
        
        context = {
            'lang': lang,
            'page_title': lang_data.get('page_title', 'Musa Matini'),
            'profile': {**data_json['common'], **lang_data},
            'ui': lang_data,
            'about_html': load_localized_text(os.path.join(CONTENT_DIR, 'about'), lang),
            'projects': process_section_folders('projects', lang),
            'certificates': process_section_folders('certificates', lang),
            'pfp_list': pfp_js_array
        }
        
        output = template.render(**context)
        with open(os.path.join(OUTPUT_DIR, f'{lang}.html'), 'w', encoding='utf-8') as f:
            f.write(output)
            
    generate_entry_point()
    print("Build complete! Output located at:", OUTPUT_DIR)

if __name__ == "__main__":
    build_site()