'use client'

import { useEffect } from 'react'

// template.tsx dipasang ulang di setiap pindah halaman:
// memberi transisi fade antar halaman + animasi muncul saat di-scroll.
export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-stagger] > *'))
    if (reduce || !('IntersectionObserver' in window)) return

    items.forEach((el) => {
      const parent = el.parentElement
      if (parent?.hasAttribute('data-stagger')) {
        const index = Array.from(parent.children).indexOf(el)
        el.style.setProperty('--reveal-delay', `${index * 90}ms`)
      }
      el.classList.add('reveal')
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    items.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      items.forEach((el) => el.classList.remove('reveal', 'in'))
    }
  }, [])

  return <div className="page-enter">{children}</div>
}
