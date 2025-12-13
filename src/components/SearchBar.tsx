'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface SearchResult {
  type: 'hospede' | 'reserva' | 'quarto' | 'solicitacao'
  label: string
  sublabel: string
  href: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      const items: SearchResult[] = []

      const [hospedes, quartos, reservas, solicitacoes] = await Promise.all([
        supabase.from('hospedes').select('id, nome, documento').ilike('nome', `%${query}%`).limit(5),
        supabase.from('quartos').select('id, numero, tipo, status').ilike('numero', `%${query}%`).limit(5),
        supabase.from('reservas').select('id, status, hospedes(nome), quartos(numero)').limit(10),
        supabase.from('solicitacoes').select('id, descricao, status, quartos(numero)').ilike('descricao', `%${query}%`).limit(5),
      ])

      hospedes.data?.forEach((h) =>
        items.push({ type: 'hospede', label: h.nome, sublabel: h.documento, href: '/hospedes' })
      )

      quartos.data?.forEach((q) =>
        items.push({ type: 'quarto', label: `Quarto ${q.numero}`, sublabel: `${q.tipo} - ${q.status}`, href: '/quartos' })
      )

      // Filter reservas client-side since we need to match on joined fields
      reservas.data?.forEach((r: Record<string, unknown>) => {
        const hospede = r.hospedes as { nome: string } | null
        const quarto = r.quartos as { numero: string } | null
        const nome = hospede?.nome || ''
        const numero = quarto?.numero || ''
        if (nome.toLowerCase().includes(query.toLowerCase()) || numero.includes(query)) {
          items.push({
            type: 'reserva',
            label: `Reserva - ${nome}`,
            sublabel: `Quarto ${numero} | ${r.status as string}`,
            href: '/reservas',
          })
        }
      })

      solicitacoes.data?.forEach((s: Record<string, unknown>) => {
        const quarto = s.quartos as { numero: string } | null
        items.push({
          type: 'solicitacao',
          label: (s.descricao as string).substring(0, 50),
          sublabel: `Quarto ${quarto?.numero || '?'} | ${s.status as string}`,
          href: '/solicitacoes',
        })
      })

      setResults(items)
      setOpen(items.length > 0)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const typeLabels: Record<string, string> = {
    hospede: 'Hospede',
    reserva: 'Reserva',
    quarto: 'Quarto',
    solicitacao: 'Solicitacao',
  }

  const typeColors: Record<string, string> = {
    hospede: 'bg-blue-100 text-blue-800',
    reserva: 'bg-purple-100 text-purple-800',
    quarto: 'bg-green-100 text-green-800',
    solicitacao: 'bg-orange-100 text-orange-800',
  }

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <input
        type="text"
        placeholder="Pesquisar hospedes, quartos, reservas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
      />

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                router.push(r.href)
                setOpen(false)
                setQuery('')
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 cursor-pointer"
            >
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[r.type]}`}>
                {typeLabels[r.type]}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{r.label}</p>
                <p className="text-xs text-gray-500">{r.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
