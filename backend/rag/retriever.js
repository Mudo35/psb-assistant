// rag/retriever.js
// Memuat index ke memori lalu mencari chunk yang paling mirip dengan pertanyaan.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { embedTexts } from './embed.js';
import { chunkMarkdown } from './chunker.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_FILE = path.join(ROOT, 'data', 'index.json');
const KNOWLEDGE_DIR = path.join(ROOT, 'knowledge');

let store = [];
let mode = 'none'; // 'vector' = pakai index.json, 'all' = tanpa index (semua dokumen dikirim)

export function loadIndex(file = INDEX_FILE) {
  if (fs.existsSync(file)) {
    store = JSON.parse(fs.readFileSync(file, 'utf8')).chunks;
    mode = 'vector';
    console.log(`[RAG] ${store.length} chunk dimuat dari data/index.json`);
    return store.length;
  }

  // Cadangan: index belum dibuat -> pakai seluruh isi knowledge/ apa adanya.
  // Aman karena dokumen sekolah kecil. Jalankan "npm run ingest" untuk RAG penuh.
  if (fs.existsSync(KNOWLEDGE_DIR)) {
    store = fs
      .readdirSync(KNOWLEDGE_DIR)
      .filter((f) => f.endsWith('.md'))
      .flatMap((f) => chunkMarkdown(fs.readFileSync(path.join(KNOWLEDGE_DIR, f), 'utf8'), f));
    mode = 'all';
    console.warn(`[RAG] data/index.json tidak ada. Memakai ${store.length} chunk dari knowledge/ (jalankan: npm run ingest)`);
    return store.length;
  }

  store = [];
  mode = 'none';
  console.warn('[RAG] knowledge/ dan data/index.json tidak ditemukan.');
  return 0;
}

// Vektor sudah dinormalisasi, jadi dot product = cosine similarity.
const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

export async function retrieve(ai, query, { topK = 5, minScore = 0.4 } = {}) {
  if (store.length === 0) return [];
  if (mode === 'all') return store.slice(0, 40).map((c) => ({ ...c, score: 1 }));

  try {
    const [qVec] = await embedTexts(ai, [query], 'RETRIEVAL_QUERY');
    const ranked = store
      .map((c) => ({ source: c.source, heading: c.heading, text: c.text, score: dot(qVec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // log untuk kalibrasi ambang skor
    console.log('[RAG]', query.slice(0, 60).replace(/\n/g, ' '), '=>', ranked.map((r) => r.score.toFixed(2)).join(', '));
    return ranked.filter((r) => r.score >= minScore);
  } catch (err) {
    // embedding gagal (kuota/jaringan): kirim sebagian dokumen agar bot tetap bisa menjawab
    console.error('[RAG] retrieval gagal, memakai cadangan:', err.message);
    return store.slice(0, 12).map((c) => ({ source: c.source, heading: c.heading, text: c.text, score: 0 }));
  }
}
