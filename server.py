from http.server import SimpleHTTPRequestHandler, HTTPServer

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # This line tells the browser "It's okay to load this file from anywhere!"
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

print("🌐 Hosting model on http://localhost:8000")
HTTPServer(('localhost', 8000), CORSRequestHandler).serve_forever()