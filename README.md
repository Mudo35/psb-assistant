# PSB Assistant — SMK Muhammadiyah 1 Kota Sukabumi

```
psb-assistant/
├── backend/    Express + Gemini  (port 3001)
└── frontend/   Next.js           (port 3000)
```

## Menjalankan

Terminal 1 — backend:
```bash
cd backend
npm install
npm run dev
```

Terminal 2 — frontend:
```bash
cd frontend
npm install        # atau: pnpm install
npm run dev
```

Buka http://localhost:3000 lalu klik tombol chat di kanan bawah.

## Alur integrasi

`Widget chat (page.tsx)` → `POST /api/chat` (Next.js rewrites) → `POST http://localhost:3001/chat` (Express) → Gemini

- API key Gemini ada di `backend/.env` (`GEMINI_API_KEY`), tidak pernah dikirim ke browser.
- Backend URL bisa diubah lewat `frontend/.env.local` (`BACKEND_URL`).
- Saat deploy, set `FRONTEND_ORIGIN` di backend sesuai domain frontend.
- Endpoint lama (`/tanya-ai`, `/analisis-gambar`, `/analisis-dokumen`, `/transkrip-audio`, `/analisis-video`, `/buat-gambar`) tetap ada.

## RAG (data sekolah)

Data sekolah ada di `backend/knowledge/*.md` (biaya, jurusan, fasilitas, ekskul, guru, siswa). Bot mengambil potongan yang relevan sebelum menjawab.

Setelah mengubah isi `knowledge/`:
```bash
cd backend
npm run ingest          # membuat data/index.json (butuh internet + GEMINI_API_KEY)
npm run dev
```
Cek pencarian: `npm run test:rag -- "berapa SPP per bulan?"`

- Kalau `data/index.json` belum ada, bot tetap jalan dengan memakai seluruh isi `knowledge/`.
- Untuk deploy, **commit `data/index.json` dan `knowledge/`** lalu push (jangan masukkan ke `.gitignore`). Gunakan repo GitHub Private.
- Atur ambang pencarian lewat `RAG_MIN_SCORE` (default 0.4) dan `RAG_TOP_K` (default 5).
