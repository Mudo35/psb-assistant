'use client'

import { useCallback, useEffect, useState } from 'react'
import { findLocale, SOURCE_LOCALE, type AppLocale } from './locales'

const KEY = 'psb-locale'
const EVENT = 'psb-locale-change'

// Bahasa pilihan disimpan di localStorage, jadi dipakai di semua halaman dan komponen.
export function useLocale(): { locale: AppLocale; setLocale: (code: string) => void } {
  const [code, setCode] = useState(SOURCE_LOCALE)

  useEffect(() => {
    const read = () => {
      try {
        setCode(findLocale(localStorage.getItem(KEY)).code)
      } catch {}
    }
    read()
    window.addEventListener(EVENT, read)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener(EVENT, read)
      window.removeEventListener('storage', read)
    }
  }, [])

  const setLocale = useCallback((next: string) => {
    try {
      localStorage.setItem(KEY, next)
    } catch {}
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { locale: findLocale(code), setLocale }
}
