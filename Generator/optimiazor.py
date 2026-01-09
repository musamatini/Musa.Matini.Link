import os
from PIL import Image
from pathlib import Path

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FOLDERS_TO_SCAN = [
    os.path.join(BASE_DIR, 'assets'),
    os.path.join(BASE_DIR, 'content')
]

VALID_EXTS = ('.png', '.jpg', '.jpeg', '.webp')

# 1. COMPRESSION: 0-100 (80 is the sweet spot)
QUALITY = 80 

# 2. RESIZING: The longest side will never exceed this number.
# 1280px is standard "720p" width. Great for web.
MAX_DIMENSION = 1280 

def get_size(path):
    return os.path.getsize(path)

def optimize_images_v2():
    saved_space = 0
    count = 0
    resized_count = 0
    
    print(f"--- STARTING OPTIMIZER V2 (WebP + 720p Limit) ---")
    print(f"Max Dimension allowed: {MAX_DIMENSION}px")

    for folder in FOLDERS_TO_SCAN:
        if not os.path.exists(folder):
            continue
        
        print(f"Scanning: {folder}...")

        for root, dirs, files in os.walk(folder):
            for file in files:
                file_path = os.path.join(root, file)
                
                if file.lower().endswith(VALID_EXTS):
                    
                    # Skip files that look like thumbnails already if you want
                    # if "_thumb" in file: continue 

                    file_stem = Path(file).stem
                    new_file_path = os.path.join(root, f"{file_stem}.webp")
                    
                    try:
                        with Image.open(file_path) as img:
                            old_size = get_size(file_path)
                            original_w, original_h = img.size
                            
                            # --- RESIZE LOGIC ---
                            # thumbnail() modifies the image in-place, preserving aspect ratio.
                            # It only shrinks; it never makes small images bigger.
                            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
                            
                            new_w, new_h = img.size
                            was_resized = (new_w != original_w) or (new_h != original_h)

                            # --- SAVE AS WEBP ---
                            # If the file is already a webp and didn't need resizing, we might be re-saving it.
                            # But this ensures the compression quality is applied.
                            img.save(new_file_path, 'webp', quality=QUALITY, optimize=True)
                            
                            new_size = get_size(new_file_path)
                            diff = old_size - new_size
                            saved_space += diff
                            count += 1
                            if was_resized: resized_count += 1
                            
                            # Clean logs: Only show if we saved meaningful space (>1KB) or resized
                            if diff > 1024 or was_resized:
                                action = "RESIZED & CONVERTED" if was_resized else "CONVERTED"
                                print(f"[{action}] {file}")
                                if was_resized:
                                    print(f"    Dims: {original_w}x{original_h} -> {new_w}x{new_h}")
                                print(f"    Size: {old_size/1024:.1f}KB -> {new_size/1024:.1f}KB")

                        # --- CLEANUP ---
                        # If we created a new .webp from a .png/.jpg, delete the old one
                        if file_path != new_file_path:
                            os.remove(file_path)

                    except Exception as e:
                        print(f"ERROR processing {file}: {e}")

    # Final Stats
    mb_saved = saved_space / 1024 / 1024
    print("-" * 30)
    print(f"Done! Processed {count} images.")
    print(f"Images Resized: {resized_count}")
    print(f"Total Space Saved: {mb_saved:.2f} MB")
    print("-" * 30)

if __name__ == "__main__":
    optimize_images_v2()