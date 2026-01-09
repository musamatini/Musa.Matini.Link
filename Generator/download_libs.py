import os
import requests

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
LIBS_DIR = os.path.join(ASSETS_DIR, 'libs')

if not os.path.exists(LIBS_DIR):
    os.makedirs(LIBS_DIR)

urls = {
    "p5.min.js": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/p5.min.js",
    "vanta.topology.min.js": "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.topology.min.js"
}

print("--- DOWNLOADING LIBRARIES ---")
for filename, url in urls.items():
    print(f"Downloading {filename}...")
    response = requests.get(url)
    with open(os.path.join(LIBS_DIR, filename), 'wb') as f:
        f.write(response.content)

print("Done! Files saved to assets/libs/")