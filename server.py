import http.server
import socketserver
import sys
import subprocess
import os
import glob

PORT = int(sys.argv[1])

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/freeze':
            subprocess.run(['pkill', '-STOP', '-i', 'hubstaff'])
            subprocess.run(['pkill', '-STOP', '-i', 'workpuls'])
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        elif self.path == '/api/unfreeze':
            subprocess.run(['pkill', '-CONT', '-i', 'hubstaff'])
            subprocess.run(['pkill', '-CONT', '-i', 'workpuls'])
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        elif self.path == '/api/scrub':
            home = os.path.expanduser('~')
            dbs = glob.glob(f"{home}/Library/Application Support/Hubstaff/*.sqlite") + \
                  glob.glob(f"{home}/Library/Application Support/Hubstaff/*.db") + \
                  glob.glob(f"{home}/Library/Application Support/workpuls-agent/*.sqlite") + \
                  glob.glob(f"{home}/Library/Application Support/workpuls-agent/*.db")
            
            keywords = ['HYBO', 'Netflix', 'YouTube', 'Hulu', 'Prime']
            for db in dbs:
                for kw in keywords:
                    # Ignore errors if tables/columns don't exist
                    subprocess.run(['sqlite3', db, f"DELETE FROM logs WHERE window_title LIKE '%{kw}%';"], stderr=subprocess.DEVNULL)
                    subprocess.run(['sqlite3', db, f"DELETE FROM activity WHERE title LIKE '%{kw}%';"], stderr=subprocess.DEVNULL)
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        elif self.path == '/api/clean':
            home = os.path.expanduser('~')
            paths = [
                f"{home}/Library/Application Support/Hubstaff",
                f"{home}/Library/Application Support/workpuls-agent",
                f"{home}/Library/Preferences/com.netsoft.Hubstaff.plist",
                f"{home}/Library/Preferences/com.workpuls.Agent.plist",
                f"{home}/Library/HTTPStorages/com.netsoft.Hubstaff"
            ]
            # Deep Tracker IndexedDB Purge
            browser_globs = [
                f"{home}/Library/Application Support/Google/Chrome/*/IndexedDB/https_*hubstaff.com*",
                f"{home}/Library/Application Support/Google/Chrome/*/IndexedDB/https_*workpuls.com*",
                f"{home}/Library/Application Support/BraveSoftware/Brave-Browser/*/IndexedDB/https_*hubstaff.com*",
                f"{home}/Library/Application Support/BraveSoftware/Brave-Browser/*/IndexedDB/https_*workpuls.com*"
            ]
            for bg in browser_globs:
                paths.extend(glob.glob(bg))

            for p in paths:
                subprocess.run(['rm', '-rf', p])
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
    httpd.serve_forever()
