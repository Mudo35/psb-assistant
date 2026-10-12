import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY belum diisi di file .env');
  process.exit(1);
}

const app = express();
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(express.json({ limit: '1mb' }));

// ===== CORS (frontend Next.js di port 3000) =====
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ===== Upload =====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // maks 10 MB
});

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // maks 15 MB
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('audio/')
      ? cb(null, true)
      : cb(new Error('File harus berupa audio (mp3, wav, m4a, ogg, dll.)')),
});

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // maks 100 MB
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('video/')
      ? cb(null, true)
      : cb(new Error('File harus berupa video (mp4, mov, webm, dll.)')),
});

// ===== Konteks sekolah untuk PSB Assistant =====
const SYSTEM_INSTRUCTION = `Kamu adalah "PSB Assistant", asisten AI dari SMK Muhammadiyah 1 Kota Sukabumi. Kamu bisa menjawab pertanyaan tentang APA SAJA (pelajaran, teknologi, coding, umum, saran, dan lainnya), dan juga membantu soal sekolah serta Penerimaan Siswa Baru (PSB).

Informasi sekolah (gunakan jika pertanyaan menyangkut sekolah):
- Nama: SMK Muhammadiyah 1 Kota Sukabumi, Jawa Barat.
- Visi: membentuk generasi yang unggul, berkarakter, berilmu, berakhlak, dan siap berkarya untuk masyarakat.
- Lima kompetensi keahlian:
  1. PPLG - Pengembangan Perangkat Lunak dan Gim: membangun aplikasi, website, gim, dan solusi digital.
  2. TJKT - Teknik Jaringan Komputer dan Telekomunikasi: jaringan, perangkat komputer, keamanan siber, teknologi komunikasi.
  3. AKL - Akuntansi dan Keuangan Lembaga: pencatatan, pengelolaan keuangan, perpajakan, administrasi bisnis.
  4. MPLB - Manajemen Perkantoran dan Layanan Bisnis: administrasi, pelayanan, pengelolaan kantor.
  5. AKC - Asisten Keperawatan dan Caregiving: dasar keperawatan, perawatan pasien, pertolongan pertama, pendampingan penuh empati.

Aturan:
- Jawab dalam bahasa yang dipakai penanya (default bahasa Indonesia), ramah, sopan, jelas, dan ringkas. Boleh lebih panjang jika pertanyaannya memang butuh penjelasan detail.
- Untuk pertanyaan umum di luar sekolah, jawab langsung dengan pengetahuanmu seperti asisten AI pada umumnya.
- Untuk pertanyaan tentang sekolah, jangan mengarang biaya, tanggal, kuota, syarat, alamat, atau nomor kontak. Jika datanya tidak ada di atas, arahkan untuk menghubungi panitia PSB melalui kontak resmi sekolah.
- Jika tidak yakin atau tidak tahu, katakan terus terang.
- Tolak dengan sopan permintaan yang berbahaya atau melanggar hukum.`;

// ===== Chat widget (dipakai frontend) =====
// Body: { pesan: string, riwayat?: [{ role: 'user' | 'assistant', text: string }] }
app.post('/chat', async (req, res) => {
  const { pesan, riwayat } = req.body ?? {};
  if (typeof pesan !== 'string' || !pesan.trim()) {
    return res.status(400).json({ error: 'Pesan wajib diisi!' });
  }

  const history = (Array.isArray(riwayat) ? riwayat : [])
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-10)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

  // Gemini mensyaratkan percakapan diawali pesan 'user'
  while (history.length && history[0].role !== 'user') history.shift();

  try {
    const hasil = await gemini.models.generateContent({
      model: MODEL_NAME,
      contents: [...history, { role: 'user', parts: [{ text: pesan.trim() }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });
    res.status(200).json({ jawaban: hasil.text });
  } catch (error) {
    console.error('Error chat:', error);
    res.status(500).json({ error: 'Gagal memproses API Gemini' });
  }
});

// ===== Tanya teks =====
app.post('/tanya-ai', async (req, res) => {
  const { pertanyaan } = req.body ?? {};
  if (!pertanyaan) {
    return res.status(400).json({ error: 'Pertanyaan wajib diisi!' });
  }

  try {
    const hasil = await gemini.models.generateContent({
      model: MODEL_NAME,
      contents: pertanyaan,
    });
    res.status(200).json({ jawaban: hasil.text });
  } catch (error) {
    console.error('Error Gemini:', error);
    res.status(500).json({ error: 'Gagal memproses API Gemini' });
  }
});

// ===== Analisis gambar =====
app.post('/analisis-gambar', upload.single('gambar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Gambar wajib diupload!' });
  }

  const prompt = req.body.pertanyaan || 'Jelaskan isi gambar ini.';

  try {
    const hasil = await gemini.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
            { text: prompt },
          ],
        },
      ],
    });
    res.status(200).json({ jawaban: hasil.text });
  } catch (error) {
    console.error('Error analisis gambar:', error);
    res.status(500).json({ error: 'Gagal menganalisis gambar' });
  }
});

// ===== Analisis dokumen =====
app.post('/analisis-dokumen', upload.single('dokumen'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Berkas dokumen wajib diunggah!' });

  const instruksi = req.body.instruksi || 'Ringkas dokumen ini';

  try {
    const hasil = await gemini.models.generateContent({
      model: MODEL_NAME,
      contents: [
        instruksi,
        { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } },
      ],
    });
    res.status(200).json({ analisis_dokumen: hasil.text });
  } catch (error) {
    console.error('Error analisis dokumen:', error);
    res.status(500).json({ error: 'Gagal menganalisis dokumen' });
  }
});

// ===== Transkrip audio =====
app.post('/transkrip-audio', uploadAudio.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File audio wajib diupload!' });
  }

  const prompt =
    req.body.prompt ||
    'Transkripkan audio ini selengkapnya dalam bahasa aslinya. Berikan hanya teks transkrip.';

  try {
    const hasil = await gemini.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
            { text: prompt },
          ],
        },
      ],
    });
    res.status(200).json({ transkrip: hasil.text });
  } catch (error) {
    console.error('Error transkrip audio:', error);
    res.status(500).json({ error: 'Gagal mentranskrip audio' });
  }
});

// ===== Analisis video =====
app.post('/analisis-video', uploadVideo.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File video wajib diupload!' });
  }

  const prompt =
    req.body.prompt ||
    'Jelaskan isi video ini: apa yang terjadi, siapa/apa yang terlihat, dan ringkasannya.';

  let uploaded;
  try {
    uploaded = await gemini.files.upload({
      file: new Blob([req.file.buffer], { type: req.file.mimetype }),
      config: { mimeType: req.file.mimetype },
    });

    let info = uploaded;
    while (info.state === 'PROCESSING') {
      await new Promise((r) => setTimeout(r, 3000));
      info = await gemini.files.get({ name: uploaded.name });
    }
    if (info.state === 'FAILED') {
      throw new Error('Gemini gagal memproses video');
    }

    const hasil = await gemini.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            { fileData: { fileUri: info.uri, mimeType: info.mimeType } },
            { text: prompt },
          ],
        },
      ],
    });
    res.status(200).json({ jawaban: hasil.text });
  } catch (error) {
    console.error('Error analisis video:', error);
    res.status(500).json({ error: 'Gagal menganalisis video' });
  } finally {
    if (uploaded?.name) {
      gemini.files.delete({ name: uploaded.name }).catch(() => {});
    }
  }
});

// ===== Buat gambar (resep/prompt gambar) =====
app.post('/buat-gambar', async (req, res) => {
  const { deskripsi } = req.body ?? {};
  if (!deskripsi) return res.status(400).json({ error: 'Field deskripsi wajib diisi!' });

  try {
    const hasil = await gemini.models.generateContent({
      model: MODEL_NAME,
      contents: `Buatkan panduan resep gambar AI yang sangat mendetail, instruksi pencahayaan, aspek rasio, dan rekomendasi kata kunci estetik berdasarkan konsep berikut: ${deskripsi}`,
    });
    res.status(200).json({
      status: 'Sukses',
      pesan: 'Konsep gambar berhasil diolah dalam Mode Edukasi Gratis',
      detail_resep_ai: hasil.text,
    });
  } catch (error) {
    console.error('Error buat gambar:', error);
    res.status(500).json({ error: 'Gagal memproses bodi data API' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// ===== Error handler (harus setelah semua route) =====
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend PSB Assistant berjalan di http://localhost:${PORT}`);
});
