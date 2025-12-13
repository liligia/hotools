'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard', icon: '□' },
  { href: '/hospedes', label: 'Hospedes', icon: '☻' },
  { href: '/reservas', label: 'Reservas', icon: '▣' },
  { href: '/quartos', label: 'Quartos', icon: '⌂' },
  { href: '/solicitacoes', label: 'Solicitacoes', icon: '✉' },
]

const extrasLabels = [
  { label: 'Reservas Online', icon: '◈' },
  { label: 'Pagamentos', icon: '⬡' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-sidebar text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-sidebar-hover">
        <h1 className="text-xl font-bold tracking-wide">HoTools</h1>
        <p className="text-xs text-slate-400 mt-1">Sistema Hoteleiro</p>
      </div>

      <nav className="flex-1 py-4">
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}

        <div className="mt-4 pt-4 border-t border-sidebar-hover">
          {extrasLabels.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-3 px-5 py-3 text-sm text-slate-500 cursor-default"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-hover">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
