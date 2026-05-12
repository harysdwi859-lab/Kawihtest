# Kawihfy v2.0 — Setup

## File yang ada:
- `index.html` — Frontend utama (semua fitur)
- `server.js` — Backend Node.js (search + download)
- `package.json` — Dependencies
- `qr-donate.png` — Taruh file QR kamu di sini

---

## Cara Install & Jalankan

### 1. Install Node.js dependencies
```bash
npm install
```

### 2. Install yt-dlp (WAJIB untuk download & search)
```bash
# Linux/Mac
pip install yt-dlp

# Windows
winget install yt-dlp
# ATAU
pip install yt-dlp
```

### 3. Jalankan server
```bash
node server.js
```

Buka browser: `http://localhost:3000`

---

## Fitur Baru v2.0

### ❤️ Playlist Disuka (Liked)
- Tap ikon ❤️ di lagu mana saja untuk menyukai
- Semua lagu tersimpan di LocalStorage per-user
- Bisa diputar semua, reorder drag-drop, hapus individual/semua
- Data: `localStorage["kw_liked_{username}"]`

### 🔍 Search Autocomplete
- Ketik di search → muncul suggestion langsung
- Riwayat pencarian tersimpan otomatis
- Klik suggestion untuk langsung search

### 🎵 Lirik Real-time
- Lirik dari lrclib.net (gratis, tanpa API key)
- Kalau ada synced lyrics → highlight baris aktif real-time
- Klik baris lirik → lompat ke bagian itu di lagu

### ⬇️ Download MP3
- Backend: `GET /api/download?videoId=xxx&title=yyy`
- yt-dlp download & convert ke MP3 192kbps
- Nama file: `Kawihfy-{Nama Lagu}.mp3`
- Log download tersimpan di localStorage

### 🔢 Unlimited Search
- Request 50 lagu sekaligus (sebelumnya 20)
- Bisa ditambah lagi di `fetchFromAPI(query, 50)`

### 🗝️ QR Donasi Fix
- Multiple fallback paths: `./qr-donate.png`, `/qr-donate.png`
- Taruh `qr-donate.png` di folder yang sama dengan `index.html`

---

## Struktur Google Spreadsheet

### Sheet1 (Login)
| A (Akun) | B (Sandi) |
|----------|-----------|
| Kawihfy  | 123321    |
| User_1   | PlayOg    |

### Sheet2 (Liked per User) — untuk export/backup
| A (Kawihfy) | B (User_1) | C (User_2) | ... |
|-------------|------------|------------|-----|
| videoId1    | videoId2   | ...        |     |

### Sheet3 (Download Log)
| A (User) | B (Judul Lagu) |
|----------|----------------|
| User_1   | Los Dol        |

---

## Deploy ke Vercel

Tambahkan `vercel.json`:
```json
{
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

**PENTING:** yt-dlp tidak jalan di Vercel serverless karena limitasi binary.
Untuk Vercel, ganti search API dengan YouTube Data API v3.
Download tidak bisa di-host serverless — perlu VPS/dedicated server.
