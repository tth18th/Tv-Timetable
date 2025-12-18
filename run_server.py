#!/usr/bin/env python3
"""
Prayer Times Dashboard Server
Automatically opens browser in fullscreen mode on startup
"""
#!/usr/bin/env python3
"""
Prayer Times Dashboard Server
Loads data from existing files - NO SAMPLE DATA CREATION
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import time
import json
from pathlib import Path
import threading
import datetime

# Configuration
PORT = 8000
HOST = "localhost"
DASHBOARD_URL = f"http://{HOST}:{PORT}/index.html"

def check_data_files():
    """Check if data files exist and list them - NO CREATION"""
    data_dir = Path("data")

    if not data_dir.exists():
        print("❌ Data directory not found: data/")
        print("   Please create a 'data' folder with JSON prayer time files")
        print("   Expected format: jamaah_times_YYYY_MM.json")
        return []

    # List all JSON files
    json_files = list(data_dir.glob("jamaah_times_*.json"))

    if not json_files:
        print("⚠️  No prayer data files found in data/ folder")
        print("   Expected format: jamaah_times_YYYY_MM.json")
        print("   Example: jamaah_times_2024_12.json")
        return []

    print(f"✅ Found {len(json_files)} data file(s):")
    for file in sorted(json_files):
        size_kb = file.stat().st_size / 1024
        print(f"   📄 {file.name} ({size_kb:.1f} KB)")

    return json_files

def check_current_month_data():
    """Check if current month data exists"""
    today = datetime.datetime.now()
    current_year = today.year
    current_month = today.month

    filename = f"jamaah_times_{current_year}_{current_month:02d}.json"
    filepath = Path("data") / filename

    if filepath.exists():
        print(f"✅ Current month data found: {filename}")
        return True
    else:
        print(f"⚠️  Current month data not found: {filename}")
        print(f"   Using nearest available data file")
        return False

def validate_json_files():
    """Validate JSON files for correct format"""
    data_dir = Path("data")
    if not data_dir.exists():
        return False

    json_files = list(data_dir.glob("*.json"))
    valid_files = []

    for file in json_files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Check structure
            if isinstance(data, dict):
                # Check for expected keys
                has_prayer_times = 'prayer_times' in data
                has_dates = any(isinstance(v, dict) for v in data.values())

                if has_prayer_times or has_dates:
                    valid_files.append(file)
                    print(f"✅ Valid JSON: {file.name}")
                else:
                    print(f"⚠️  Invalid structure: {file.name}")
            else:
                print(f"⚠️  Invalid JSON (not an object): {file.name}")

        except json.JSONDecodeError as e:
            print(f"❌ JSON syntax error in {file.name}: {e}")
        except Exception as e:
            print(f"❌ Error reading {file.name}: {e}")

    return valid_files

def open_browser_in_fullscreen():
    """Open browser in fullscreen/kiosk mode"""
    time.sleep(2)  # Wait for server to start

    # Try different methods for fullscreen
    fullscreen_methods = [
        # Chrome with kiosk mode
        f'start chrome --kiosk --fullscreen "{DASHBOARD_URL}?tv=1"',
        # Chrome with app mode (no browser UI)
        f'start chrome --app="{DASHBOARD_URL}?tv=1" --start-fullscreen',
        # Edge with kiosk mode
        f'start msedge --kiosk "{DASHBOARD_URL}?tv=1"',
        # Firefox with kiosk mode
        f'start firefox --kiosk "{DASHBOARD_URL}?tv=1"',
        # Default browser (no fullscreen)
        f'start "" "{DASHBOARD_URL}?tv=1"'
    ]

    for method in fullscreen_methods:
        try:
            os.system(method)
            print(f"✅ Browser opened using: {method.split()[1]}")
            return True
        except:
            continue

    # Fallback: just open URL
    try:
        webbrowser.open(DASHBOARD_URL)
        print("⚠️  Browser opened in normal mode (no fullscreen)")
        return True
    except:
        print("❌ Could not open browser automatically")
        return False

def create_images_list():
    """Create a list of available images from existing files"""
    images_dir = Path("images")

    if not images_dir.exists():
        print("⚠️  Images directory not found: images/")
        print("   Creating empty images directory...")
        images_dir.mkdir(exist_ok=True)
        return []

    # Check for images
    image_files = list(images_dir.glob("*.jpg")) + \
                  list(images_dir.glob("*.jpeg")) + \
                  list(images_dir.glob("*.png")) + \
                  list(images_dir.glob("*.webp"))

    if not image_files:
        print("⚠️  No images found in images/ folder")
        print("   Add images to the images/ folder for slideshow")
        return []

    # Create list from existing images
    images = []
    for img in image_files[:20]:  # Limit to 20 images
        images.append({
            "src": f"images/{img.name}",
            "caption": img.stem.replace("_", " ").replace("-", " ").split('.')[0].title()
        })

    print(f"✅ Found {len(images)} images in images/ folder")
    return images

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler with API endpoints"""

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Handle API endpoints
        if self.path == '/api/images':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            images = create_images_list()
            self.wfile.write(json.dumps({"images": images}).encode())
            return

        elif self.path == '/api/data-status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            # List all data files
            data_dir = Path("data")
            files = []
            if data_dir.exists():
                for file in sorted(data_dir.glob("*.json")):
                    files.append({
                        "name": file.name,
                        "size": file.stat().st_size,
                        "modified": file.stat().st_mtime
                    })

            self.wfile.write(json.dumps({
                "files": files,
                "count": len(files)
            }).encode())
            return

        elif self.path.startswith('/api/data/'):
            # Serve specific data file
            filename = self.path.split('/')[-1]
            filepath = Path("data") / filename

            if filepath.exists() and filepath.suffix == '.json':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()

                with open(filepath, 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "File not found",
                    "filename": filename
                }).encode())
            return

        # Serve static files normally
        return super().do_GET()

    def log_message(self, format, *args):
        """Custom logging - only show errors"""
        if self.path.startswith('/data/') or self.path.startswith('/api/'):
            # Log data access
            print(f"📥 {self.address_string()} - {self.path}")

def start_server():
    """Start the HTTP server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print("="*60)
    print("🕌 PRAYER TIMES DASHBOARD SERVER")
    print("="*60)
    print("📁 Checking data files...")

    # Check existing data - NO CREATION
    json_files = validate_json_files()
    if not json_files:
        print("\n❌ NO VALID PRAYER DATA FILES FOUND")
        print("="*60)
        print("ACTION REQUIRED:")
        print("1. Create a 'data' folder in the same directory")
        print("2. Add prayer time JSON files with format:")
        print("   jamaah_times_YYYY_MM.json")
        print("3. Example: jamaah_times_2024_12.json")
        print("="*60)
        print("The server will start but dashboard will use fallback data.")
        print("Press Ctrl+C to stop and add your data files.")
        print("="*60)
        time.sleep(3)
    else:
        check_current_month_data()

    # Check images
    images = create_images_list()
    if not images:
        print("⚠️  No images found. Slideshow will use default images.")

    # Create images folder if it doesn't exist
    images_dir = Path("images")
    images_dir.mkdir(exist_ok=True)

    handler = DashboardHandler

    try:
        with socketserver.TCPServer((HOST, PORT), handler) as httpd:
            print(f"\n🚀 Server started at {DASHBOARD_URL}")
            print(f"📡 Serving from: {os.getcwd()}")
            print(f"📊 Data files: {len(json_files)} valid JSON file(s)")
            print(f"🖼️  Images: {len(images)} image(s)")
            print("\n" + "="*50)
            print("🎯 DASHBOARD READY")
            print("="*50)
            print("📺 Opening in fullscreen mode...")
            print("🛑 Press Ctrl+C to stop the server")
            print("="*50 + "\n")

            # Open browser in fullscreen mode
            browser_thread = threading.Thread(target=open_browser_in_fullscreen)
            browser_thread.daemon = True
            browser_thread.start()

            # Start server
            httpd.serve_forever()

    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"\n❌ Port {PORT} is already in use!")
            print("="*50)
            print("SOLUTIONS:")
            print("1. Wait a minute and try again")
            print("2. Kill the existing process:")
            print(f"   Windows: netstat -ano | findstr :{PORT}")
            print("   Linux/Mac: lsof -i :{PORT}")
            print("="*50)
            sys.exit(1)
        else:
            print(f"❌ Server error: {e}")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
