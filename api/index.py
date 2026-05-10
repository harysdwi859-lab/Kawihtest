from http.server import BaseHTTPRequestHandler
from ytmusicapi import YTMusic
import json

yt = YTMusic()

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        query_components = parse_qs(urlparse(self.path).query)
        q = query_components.get("q", ["Sunda"])[0]

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        # Mencari lagu di YouTube Music
        search_results = yt.search(q, filter="songs", limit=10)
        
        self.wfile.write(json.dumps(search_results).encode())
        return
