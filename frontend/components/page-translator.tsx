'use client'

import { useEffect } from 'react'
import { SOURCE_LOCALE } from '@/lib/locales'
import { useLocale } from '@/lib/use-locale'

// Menerjemahkan seluruh teks website ke bahasa pilihan lewat endpoint /api/translate (Gemini).
// - Teks asli (Indonesia) disimpan, jadi bisa dikembalikan atau diterjemahkan ulang ke bahasa lain.
// - Hasil terjemahan di-cache di localStorage per bahasa.
// - Elemen dengan atribut data-no-translate (jawaban AI, pesan pengguna, menu bahasa) dilewati.
const SKIP = 'script,style,noscript,textarea,code,pre,select,svg,[data-no-translate]'
const ATTRS = ['placeholder', 'aria-label', 'alt', 'title']
const HAS_LETTER = /\p{L}/u
const CHUNK = 60
const RETRY_AFTER_MS = 10_000

type Store = { orig: string; shown: string }
type Slot = { store: Store; read: () => string; write: (v: string) => void }

const textStore = new WeakMap<Text, Store>()
const attrStore = new WeakMap<Element, Record<string, Store>>()
const memory = new Map<string, Record<string, string>>()
const failedAt = new Map<string, number>()

function track(store: Store | undefined, current: string): Store {
  if (!store) return { orig: current, shown: current }
  if (current !== store.shown) {
    // isi diubah oleh React (bukan oleh kita): anggap sebagai teks asli yang baru
    store.orig = current
    store.shown = current
  }
  return store
}

function collect(): Slot[] {
  const slots: Slot[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  })
  while (walker.nextNode()) {
    const n = walker.currentNode
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text
      const store = track(textStore.get(t), t.data)
      textStore.set(t, store)
      slots.push({ store, read: () => t.data, write: (v) => { t.data = v } })
    } else {
      const el = n as Element
      for (const attr of ATTRS) {
        const value = el.getAttribute(attr)
        if (value === null) continue
        const map = attrStore.get(el) ?? {}
        map[attr] = track(map[attr], value)
        attrStore.set(el, map)
        slots.push({ store: map[attr], read: () => el.getAttribute(attr) ?? '', write: (v) => el.setAttribute(attr, v) })
      }
    }
  }
  return slots
}

function split(text: string) {
  const lead = text.match(/^\s*/)?.[0] ?? ''
  const trail = text.slice(lead.length).match(/\s*$/)?.[0] ?? ''
  return { lead, trail, core: text.slice(lead.length, text.length - trail.length) }
}

function loadDict(code: string): Record<string, string> {
  let dict = memory.get(code)
  if (!dict) {
    try {
      dict = JSON.parse(localStorage.getItem(`psb-tr:${code}`) ?? '{}') as Record<string, string>
    } catch {
      dict = {}
    }
    memory.set(code, dict)
  }
  return dict
}

async function ensureTranslations(code: string, cores: string[]) {
  const dict = loadDict(code)
  const missing = cores.filter((c) => !(c in dict))
  if (missing.length === 0) return dict
  if (Date.now() - (failedAt.get(code) ?? 0) < RETRY_AFTER_MS) return dict

  try {
    for (let i = 0; i < missing.length; i += CHUNK) {
      const texts = missing.slice(i, i + CHUNK)
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: code, texts }),
      })
      if (!res.ok) throw new Error('translate gagal')
      const data = (await res.json()) as { translations: string[] }
      texts.forEach((t, j) => { dict[t] = data.translations[j] ?? t })
    }
    try {
      localStorage.setItem(`psb-tr:${code}`, JSON.stringify(dict))
    } catch {}
  } catch {
    failedAt.set(code, Date.now()) // teks tetap Indonesia; coba lagi nanti
  }
  return dict
}

async function apply(code: string, isAlive: () => boolean) {
  const slots = collect()
  const source = code === SOURCE_LOCALE
  let dict: Record<string, string> = {}

  if (!source) {
    const cores = [...new Set(slots.map((s) => split(s.store.orig).core).filter((c) => HAS_LETTER.test(c)))]
    dict = await ensureTranslations(code, cores)
    if (!isAlive()) return
  }

  for (const s of slots) {
    const { lead, trail, core } = split(s.store.orig)
    const desired = source || !HAS_LETTER.test(core) ? s.store.orig : lead + (dict[core] ?? core) + trail
    const current = s.read()
    if (current !== s.store.shown && current !== desired) continue // berubah saat menunggu; diproses putaran berikutnya
    if (current !== desired) s.write(desired)
    s.store.shown = desired
  }
}

export function PageTranslator() {
  const { locale } = useLocale()

  useEffect(() => {
    const code = locale.code
    document.documentElement.lang = locale.lang
    document.documentElement.dir = locale.rtl ? 'rtl' : 'ltr'

    let alive = true
    let running = false
    let again = false
    let timer: number | undefined

    const run = async () => {
      if (running) {
        again = true
        return
      }
      running = true
      try {
        do {
          again = false
          await apply(code, () => alive)
        } while (again && alive)
      } finally {
        running = false
      }
    }

    run()
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(run, 120)
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => {
      alive = false
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [locale.code, locale.lang, locale.rtl])

  return null
}
