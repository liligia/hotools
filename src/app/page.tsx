'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

interface DashboardData {
  checkinsHoje: number
  checkoutsHoje: number
  quartosDisponiveis: number
  reservasAtivas: number
  proximosCheckins: Array<{
    id: string
    data_checkin: string
    hospedes: { nome: string } | null
    quartos: { numero: string } | null
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    checkinsHoje: 0,
    checkoutsHoje: 0,
    quartosDisponiveis: 0,
    reservasAtivas: 0,
    proximosCheckins: [],
  })

  useEffect(() => {
    async function load() {
      const hoje = new Date().toISOString().split('T')[0]

      const [checkins, checkouts, quartos, ativas, proximos] = await Promise.all([
        supabase.from('reservas').select('id', { count: 'exact', head: true }).eq('data_checkin', hoje).in('status', ['confirmada', 'checkin']),
        supabase.from('reservas').select('id', { count: 'exact', head: true }).eq('data_checkout', hoje).eq('status', 'checkin'),
        supabase.from('quartos').select('id', { count: 'exact', head: true }).eq('status', 'disponivel'),
        supabase.from('reservas').select('id', { count: 'exact', head: true }).in('status', ['confirmada', 'checkin']),
        supabase.from('reservas').select('id, data_checkin, hospedes(nome), quartos(numero)').gte('data_checkin', hoje).in('status', ['confirmada']).order('data_checkin', { ascending: true }).limit(5),
      ])

      setData({
        checkinsHoje: checkins.count ?? 0,
        checkoutsHoje: checkouts.count ?? 0,
        quartosDisponiveis: quartos.count ?? 0,
        reservasAtivas: ativas.count ?? 0,
        proximosCheckins: (proximos.data ?? []) as unknown as DashboardData['proximosCheckins'],
      })
    }
    load()
  }, [])

  const cards = [
    { label: 'Check-ins Hoje', value: data.checkinsHoje, color: 'bg-blue-500' },
    { label: 'Check-outs Hoje', value: data.checkoutsHoje, color: 'bg-orange-500' },
    { label: 'Quartos Disponiveis', value: data.quartosDisponiveis, color: 'bg-green-500' },
    { label: 'Reservas Ativas', value: data.reservasAtivas, color: 'bg-purple-500' },
  ]

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm p-5">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white text-lg font-bold mb-3`}>
              {card.value}
            </div>
            <p className="text-sm text-gray-600">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Proximos Check-ins</h2>
        </div>
        <div className="divide-y">
          {data.proximosCheckins.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Nenhum check-in proximo.</p>
          ) : (
            data.proximosCheckins.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.hospedes?.nome || 'Hospede'}</p>
                  <p className="text-xs text-gray-500">Quarto {r.quartos?.numero || '?'}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(r.data_checkin + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
