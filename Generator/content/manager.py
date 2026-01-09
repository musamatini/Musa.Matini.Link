import os
import json
import tkinter as tk
from tkinter import ttk, messagebox

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECTS_DIR = os.path.join(BASE_DIR, 'projects')
CERTS_DIR = os.path.join(BASE_DIR, 'certificates')

class DragDropListbox(tk.Listbox):
    """ A Tkinter Listbox with Drag & Drop reordering capabilities """
    def __init__(self, master, **kw):
        kw['selectmode'] = tk.SINGLE
        tk.Listbox.__init__(self, master, kw)
        self.bind('<Button-1>', self.setCurrent)
        self.bind('<B1-Motion>', self.shiftSelection)
        self.curIndex = None

    def setCurrent(self, event):
        self.curIndex = self.nearest(event.y)

    def shiftSelection(self, event):
        i = self.nearest(event.y)
        if i < self.curIndex:
            x = self.get(i)
            self.delete(i)
            self.insert(i+1, x)
            self.curIndex = i
        elif i > self.curIndex:
            x = self.get(i)
            self.delete(i)
            self.insert(i-1, x)
            self.curIndex = i

class ContentManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Content Order Manager")
        self.root.geometry("600x500")

        # Data stores
        self.projects_data = [] # Stores (folder_name, full_path, current_metadata)
        self.certs_data = []

        # Styles
        style = ttk.Style()
        style.configure("TButton", font=("Helvetica", 12), padding=10)
        
        # Tabs
        self.tab_control = ttk.Notebook(root)
        self.tab1 = ttk.Frame(self.tab_control)
        self.tab2 = ttk.Frame(self.tab_control)
        
        self.tab_control.add(self.tab1, text='Projects')
        self.tab_control.add(self.tab2, text='Certificates')
        self.tab_control.pack(expand=1, fill="both")

        # --- Tab 1: Projects ---
        self.lb_projects = DragDropListbox(self.tab1, font=("Courier", 12), activestyle='none')
        self.lb_projects.pack(expand=True, fill="both", padx=10, pady=10)
        
        # --- Tab 2: Certificates ---
        self.lb_certs = DragDropListbox(self.tab2, font=("Courier", 12), activestyle='none')
        self.lb_certs.pack(expand=True, fill="both", padx=10, pady=10)

        # Save Button Area
        btn_frame = tk.Frame(root, bg="#f0f0f0")
        btn_frame.pack(fill="x", pady=10)
        
        save_btn = tk.Button(btn_frame, text="SAVE NEW ORDER", bg="#4CAF50", fg="white", 
                             font=("Arial", 12, "bold"), command=self.save_all)
        save_btn.pack(side="right", padx=20)
        
        refresh_btn = tk.Button(btn_frame, text="Reload/Refresh", command=self.load_data)
        refresh_btn.pack(side="left", padx=20)

        # Initial Load
        self.load_data()

    def get_metadata(self, folder_path):
        """ Reads existing metadata or returns empty dict """
        meta_path = os.path.join(folder_path, 'metadata.json')
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def load_folder_items(self, base_dir):
        """ Scans folder, reads metadata, returns sorted list """
        if not os.path.exists(base_dir):
            return []
        
        items = []
        for folder_name in os.listdir(base_dir):
            full_path = os.path.join(base_dir, folder_name)
            if os.path.isdir(full_path):
                meta = self.get_metadata(full_path)
                order = int(meta.get('order', 999))
                
                # Try to get an English title for display, else folder name
                display_name = folder_name
                if 'title' in meta:
                    if isinstance(meta['title'], dict):
                        display_name = f"{meta['title'].get('en', folder_name)} ({folder_name})"
                    elif isinstance(meta['title'], str):
                        display_name = f"{meta['title']} ({folder_name})"

                items.append({
                    'folder': folder_name,
                    'path': full_path,
                    'meta': meta,
                    'order': order,
                    'display': display_name
                })
        
        # Sort by existing order first
        items.sort(key=lambda x: x['order'])
        return items

    def load_data(self):
        # Clear Listboxes
        self.lb_projects.delete(0, tk.END)
        self.lb_certs.delete(0, tk.END)

        # Load Projects
        self.projects_data = self.load_folder_items(PROJECTS_DIR)
        for item in self.projects_data:
            self.lb_projects.insert(tk.END, item['display'])

        # Load Certs
        self.certs_data = self.load_folder_items(CERTS_DIR)
        for item in self.certs_data:
            self.lb_certs.insert(tk.END, item['display'])

    def save_list_order(self, listbox, data_list):
        # The listbox only has strings, but they are in the new order.
        # We match the string back to our data object.
        
        new_items = listbox.get(0, tk.END) # Get all items in current order
        
        for index, display_text in enumerate(new_items):
            # Find the original data object for this display text
            # (In a production app we'd use IDs, but this is fine for local)
            item = next((x for x in data_list if x['display'] == display_text), None)
            
            if item:
                meta = item['meta']
                new_order = index + 1 # Start from 1
                
                # Only write if order changed or tag missing
                meta['order'] = new_order
                
                # Write back to file
                meta_path = os.path.join(item['path'], 'metadata.json')
                
                # Ensure we don't delete other metadata
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump(meta, f, indent=4, ensure_ascii=False)

    def save_all(self):
        try:
            self.save_list_order(self.lb_projects, self.projects_data)
            self.save_list_order(self.lb_certs, self.certs_data)
            messagebox.showinfo("Success", "Metadata updated successfully!\n\nBuild your site to see changes.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save: {str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = ContentManagerApp(root)
    root.mainloop()