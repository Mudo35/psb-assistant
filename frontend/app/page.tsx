'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, ChevronDown, GraduationCap, Globe, Loader2, Menu, MessageCircle, Minus, Send, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ChatMarkdown } from '@/components/chat-markdown'
import { LOCALES } from '@/lib/locales'
import { useLocale } from '@/lib/use-locale'

type Message = { id: number; role: 'assistant' | 'user'; text: string }

const vocations = [
  { code: 'PPLG', title: 'Pengembangan Perangkat Lunak dan Gim', description: 'Membangun aplikasi, website, gim, dan solusi digital melalui pemrograman serta desain teknologi.', accent: 'bg-blue-50 text-blue-700' },
  { code: 'TJKT', title: 'Teknik Jaringan Komputer dan Telekomunikasi', description: 'Mempelajari jaringan, perangkat komputer, keamanan siber, dan teknologi komunikasi masa kini.', accent: 'bg-cyan-50 text-cyan-700' },
  { code: 'AKL', title: 'Akuntansi dan Keuangan Lembaga', description: 'Mengembangkan keterampilan pencatatan, pengelolaan keuangan, perpajakan, dan administrasi bisnis.', accent: 'bg-amber-50 text-amber-700' },
  { code: 'MPLB', title: 'Manajemen Perkantoran dan Layanan Bisnis', description: 'Menyiapkan siswa menjadi tenaga profesional dalam administrasi, pelayanan, dan pengelolaan kantor.', accent: 'bg-rose-50 text-rose-700' },
  { code: 'AKC', title: 'Asisten Keperawatan dan Caregiving', description: 'Mempelajari dasar-dasar keperawatan, perawatan pasien, pertolongan pertama, serta pendampingan yang penuh empati.', accent: 'bg-emerald-50 text-emerald-700' },
]

const starterMessages: Message[] = [
  { id: 1, role: 'assistant', text: 'Assalamu’alaikum! Saya PSB Assistant dari SMK Muhammadiyah 1 Kota Sukabumi.' },
  { id: 2, role: 'assistant', text: 'Saya siap membantu menjawab pertanyaan tentang sekolah, jurusan, dan pendaftaran.' },
]

async function askBackend(pesan: string, riwayat: Message[], locale: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pesan,
      locale,
      riwayat: riwayat.map(({ role, text }) => ({ role, text })),
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan pada server')
  return data.jawaban as string
}

export default function Page() {
  const { locale, setLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>(starterMessages)
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isOpen])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || isLoading) return

    // riwayat percakapan sebelum pesan ini (tanpa sapaan awal)
    const history = messages.filter((m) => !starterMessages.some((s) => s.id === m.id))
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text }])
    setDraft('')
    setIsLoading(true)

    try {
      const answer = await askBackend(text, history, locale.code)
      setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: answer }])
    } catch {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: 'Maaf, saya sedang tidak dapat terhubung ke server. Silakan coba lagi sebentar lagi.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <img src="/logomuh1.jpg" alt="Logo SMK Muhammadiyah 1 Kota Sukabumi" className="size-11 rounded-xl object-cover shadow-lg shadow-sky-900/10" />
            <div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#075985]">SMK MUHAMMADIYAH 1</p><p className="text-sm text-slate-500">Kota Sukabumi</p></div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Navigasi utama"><Link href="/profil">Profil sekolah</Link><Link href="/jurusan">Kompetensi keahlian</Link><a href="#kontak">Kontak</a></nav>
          <Button variant="outline" size="icon" className="md:hidden" aria-label="Buka menu"><Menu /></Button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#075985] text-white">
        <img src="/gedungsmkMUH1.webp" alt="Gedung SMK Muhammadiyah 1 Kota Sukabumi" className="kenburns absolute inset-0 size-full object-cover opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[#075985]/75" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#075985] via-[#075985]/70 to-transparent" aria-hidden="true" />
        <div className="float-slow absolute -right-20 -top-28 size-80 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 py-20 lg:flex-row lg:items-center lg:px-10 lg:py-28">
          <div data-hero className="relative max-w-3xl lg:flex-1">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-100"><Sparkles className="size-3.5" /> Sekolah vokasi pilihan di Sukabumi</div>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">Membentuk generasi yang <span className="text-sky-300">unggul dan berkarakter.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-sky-100">Selamat datang di SMK Muhammadiyah 1 Kota Sukabumi. Tempat belajar, bertumbuh, dan mempersiapkan masa depan melalui pendidikan vokasi yang relevan.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild className="rounded-full bg-white px-5 text-[#075985] hover:bg-sky-50"><a href="#jurusan">Lihat kompetensi <ArrowRight data-icon="inline-end" /></a></Button><Button asChild variant="ghost" className="rounded-full text-white hover:bg-white/10 hover:text-white"><a href="#tentang">Kenali sekolah kami</a></Button></div>
          </div>
          <div className="float-cards hero-fade relative grid grid-cols-2 gap-3 lg:w-96"><div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><p className="text-3xl font-semibold">5</p><p className="mt-1 text-sm text-sky-100">Kompetensi keahlian</p></div><div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><p className="text-3xl font-semibold">SMK</p><p className="mt-1 text-sm text-sky-100">Pendidikan vokasi</p></div><div className="col-span-2 rounded-3xl border border-white/15 bg-sky-950/20 p-5"><p className="text-sm leading-6 text-sky-100">“Berilmu, berakhlak, dan siap berkarya untuk masyarakat.”</p></div></div>
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><div data-reveal className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0e7490]">Belajar dengan tujuan</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Pendidikan yang dekat dengan dunia nyata.</h2><p className="mt-4 leading-7 text-slate-600">Kami mendampingi siswa untuk mengembangkan kompetensi, kreativitas, dan karakter melalui pengalaman belajar yang aktif dan bermakna.</p></div></section>

      <section id="jurusan" className="bg-white px-6 py-20 lg:px-10"><div className="mx-auto max-w-7xl"><div data-reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0e7490]">Pilihan masa depan</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Kompetensi keahlian kami</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Temukan bidang yang sesuai dengan minat dan potensimu.</p></div><div data-stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{vocations.map((vocation) => <article key={vocation.code} className="group rounded-3xl border border-slate-200 bg-[#fbfcfe] p-5 transition-all hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/5"><div className={`mb-8 inline-flex rounded-xl px-3 py-1.5 text-xs font-bold tracking-wider ${vocation.accent}`}>{vocation.code}</div><h3 className="min-h-16 text-lg font-semibold leading-6 text-slate-900">{vocation.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{vocation.description}</p></article>)}</div></div></section>

      <footer data-reveal id="kontak" className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10"><p>© 2024 SMK Muhammadiyah 1 Kota Sukabumi</p><p>Siap melangkah menuju masa depan.</p></footer>

      <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
        {isOpen && <section className="chat-pop flex h-[min(590px,calc(100vh-112px))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_70px_-18px_rgba(7,89,133,0.35)] sm:w-[380px]" aria-label="PSB Assistant chat"><header className="flex items-center justify-between bg-[#075985] px-5 py-4 text-white"><div className="flex items-center gap-3"><div className="relative flex size-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20"><Bot className="size-5" /><span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#075985] bg-emerald-400" /></div><div><h2 className="text-sm font-semibold">PSB Assistant</h2><p className="text-xs text-sky-100">Info SMK Muhammadiyah 1</p></div></div><div className="flex gap-1"><Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="Minimize chat" onClick={() => setIsOpen(false)}><Minus /></Button><Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="Tutup chat" onClick={() => setIsOpen(false)}><X /></Button></div></header><div data-no-translate className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2"><Globe className="size-4 shrink-0 text-slate-400" /><select value={locale.code} onChange={(event) => setLocale(event.target.value)} aria-label="Language" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-400">{LOCALES.map((item) => <option key={item.code} value={item.code}>{item.label} · {item.currency}</option>)}</select></div><div className="flex-1 overflow-y-auto bg-[#fbfcfe] px-4 py-5" aria-live="polite"><div className="mb-5 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200" /> Hari ini <span className="h-px flex-1 bg-slate-200" /></div><div className="flex flex-col gap-3">{messages.map((message) => message.role === 'assistant' ? <div key={message.id} className="msg-in flex items-end gap-2"><div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Bot className="size-3.5" /></div><div {...(message.id > starterMessages.length ? { 'data-no-translate': '' } : {})} className="max-w-[85%] rounded-2xl rounded-bl-md bg-sky-50 px-4 py-3 text-sm leading-5 text-slate-700"><ChatMarkdown text={message.text} /></div></div> : <p key={message.id} data-no-translate className="msg-in ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-[#075985] px-4 py-3 text-sm leading-5 text-white">{message.text}</p>)}{isLoading && <div className="msg-in flex items-end gap-2"><div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Bot className="size-3.5" /></div><p className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-sky-50 px-4 py-3 text-sm text-slate-500"><Loader2 className="size-3.5 animate-spin" /> Mengetik...</p></div>}<div ref={bottomRef} /></div></div><form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-3"><div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 pl-4 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tanya tentang sekolah..." aria-label="Pesan untuk PSB Assistant" disabled={isLoading} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400" /><Button type="submit" size="icon" disabled={isLoading || !draft.trim()} className="size-9 rounded-xl bg-[#075985] hover:bg-[#064e75]" aria-label="Kirim pesan"><Send className="size-4" /></Button></div><p className="mt-2 text-center text-[10px] text-slate-400">Coba tanya: “Apa itu PPLG?”</p>{locale.currency !== 'IDR' && <p data-no-translate className="mt-1 text-center text-[9px] text-slate-400"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">Rates By Exchange Rate API</a></p>}</form></section>}
        {!isOpen && <p className="float-y rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-lg ring-1 ring-slate-200">Butuh informasi?</p>}
        <Button onClick={() => setIsOpen((current) => !current)} size="icon-lg" className="pulse-ring size-14 rounded-full bg-[#075985] transition-transform hover:scale-105 active:scale-95 shadow-[0_12px_28px_-8px_rgba(7,89,133,0.7)] hover:bg-[#064e75]" aria-label={isOpen ? 'Tutup PSB Assistant' : 'Buka PSB Assistant'}>{isOpen ? <ChevronDown /> : <MessageCircle />}</Button>
      </div>
    </main>
  )
}
