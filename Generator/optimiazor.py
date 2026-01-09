import os
from PIL import Image
from pathlib import Path

# --- CONFIGURATION ---
# 1. Get the directory where THIS script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Define folders relative to the script
FOLDERS_TO_SCAN = [
    os.path.join(BASE_DIR, 'assets'),
    os.path.join(BASE_DIR, 'content')
]

# Extensions to look for
VALID_EXTS = ('.png', '.jpg', '.jpeg')
# Quality (0-100). 80 is visually identical but much smaller.
QUALITY = 80 

def get_size(path):
    return os.path.getsize(path)

def optimize_images():
    saved_space = 0
    count = 0
    
    print(f"--- STARTING OPTIMIZATION ---")
    print(f"Script location: {BASE_DIR}")

    for folder in FOLDERS_TO_SCAN:
        if not os.path.exists(folder):
            print(f"CRITICAL: Could not find folder: {folder}")
            continue
        
        print(f"Scanning: {folder}...")

        for root, dirs, files in os.walk(folder):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Check if it's an image we want to convert
                if file.lower().endswith(VALID_EXTS):
                    
                    # Create new filename with .webp
                    file_stem = Path(file).stem
                    new_file_path = os.path.join(root, f"{file_stem}.webp")
                    
                    try:
                        # 1. Open Image
                        with Image.open(file_path) as img:
                            old_size = get_size(file_path)
                            
                            # 2. Convert and Save as WebP
                            img.save(new_file_path, 'webp', quality=QUALITY, optimize=True)
                            
                            new_size = get_size(new_file_path)
                            
                            # 3. Calculate savings
                            diff = old_size - new_size
                            saved_space += diff
                            count += 1
                            
                            print(f"Converted: {file} -> {file_stem}.webp")
                            print(f"   Saved: {diff / 1024:.2f} KB")

                        # 4. Remove the old original file
                        os.remove(file_path)

                    except Exception as e:
                        print(f"ERROR converting {file}: {e}")

    # Final Stats
    print("-" * 30)
    print(f"Done! Converted {count} images.")
    print(f"Total Space Saved: {saved_space / 1024 / 1024:.2f} MB")
    print("-" * 30)
    print("IMPORTANT: Check content/data.json and update 'me.png' to 'me.webp'!")

if __name__ == "__main__":
    optimize_images()