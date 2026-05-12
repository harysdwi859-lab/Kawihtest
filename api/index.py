from http.server import BaseHTTPRequestHandler
from ytmusicapi import YTMusic
import json

yt = YTMusic()

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        query_components = parse_qs(parsed.query)
        q = query_components.get("q", ["Sunda"])[0]
        limit = int(query_components.get("limit", ["50"])[0])

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        try:
            search_results = yt.search(q, filter="songs", limit=limit)

            # Normalize ke format yang dipakai index.html
            normalized = []
            for item in search_results:
                try:
                    video_id = item.get("videoId", "")
                    if not video_id:
                        continue

                    title = item.get("title", "(Unknown)")

                    # Artists bisa list of dict atau string
                    artists_raw = item.get("artists", [])
                    if isinstance(artists_raw, list):
                        artist = ", ".join(
                            a.get("name", "") if isinstance(a, dict) else str(a)
                            for a in artists_raw
                        )
                    else:
                        artist = str(artists_raw)

                    # Thumbnail: ambil yang paling besar
                    thumbs = item.get("thumbnails", [])
                    if thumbs:
                        thumb = thumbs[-1].get("url", f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg")
                    else:
                        thumb = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"

                    # Duration
                    duration = item.get("duration", "") or item.get("duration_seconds", "")

                    normalized.append({
                        "videoId": video_id,
                        "title": title,
                        "artist": artist,
                        "thumb": thumb,
                        "duration": duration,
                    })
                except Exception:
                    continue

            self.wfile.write(json.dumps(normalized).encode())

        except Exception as e:
            self.wfile.write(json.dumps({"error": str(e)}).encode())
