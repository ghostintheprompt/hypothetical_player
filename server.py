import http.server
import socketserver
import sys
import subprocess
import os

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
        elif self.path == '/api/clean':
            home = os.path.expanduser('~')
            paths = [
                f"{home}/Library/Application Support/Hubstaff",
                f"{home}/Library/Application Support/workpuls-agent",
                f"{home}/Library/Preferences/com.netsoft.Hubstaff.plist",
                f"{home}/Library/Preferences/com.workpuls.Agent.plist",
                f"{home}/Library/HTTPStorages/com.netsoft.Hubstaff"
            ]
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
