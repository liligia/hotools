'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'

interface Quarto {
  id: string
  numero: string
  tipo: string
  status: 'disponivel' | 'ocupado' | 'limpeza'
}

interface ReservaAtiva {
  id: string
  hospede_id: string
  quarto_id: string
  data_checkin: string
  data_checkout: string
  hospedes: { nome: string; documento: string; telefone: string | null } | null
}

const statusColors: Record<string, string> = {
  disponivel: 'bg-green-100 border-green-400 text-green-800',
  ocupado: 'bg-red-100 border-red-400 text-red-800',
  limpeza: 'bg-yellow-100 border-yellow-400 text-yellow-800',
}

const statusLabels: Record<string, string> = {
  disponivel: 'Disponivel',
  ocupado: 'Ocupado',
  limpeza: 'Limpeza',
}

type QuartoForm = { numero: string; tipo: string; status: Quarto['status'] }
const emptyForm: QuartoForm = { numero: '', tipo: 'Standard', status: 'disponivel' }

export default function QuartosPage() {
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [reservasAtivas, setReservasAtivas] = useState<ReservaAtiva[]>([])
  const [novoModalOpen, setNovoModalOpen] = useState(false)
  const [form, setForm] = useState<QuartoForm>(emptyForm)

  // Modal de detalhes do quarto
  const [selectedQuarto, setSelectedQuarto] = useState<Quarto | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Modal de troca de quarto
  const [trocaOpen, setTrocaOpen] = useState(false)
  const [trocaReserva, setTrocaReserva] = useState<ReservaAtiva | null>(null)
  const [novoQuartoId, setNovoQuartoId] = useState('')

  async function load() {
    const [q, r] = await Promise.all([
      supabase.from('quartos').select('*').order('numero'),
      supabase
        .from('reservas')
        .select('id, hospede_id, quarto_id, data_checkin, data_checkout, hospedes(nome, documento, telefone)')
        .eq('status', 'checkin'),
    ])
    setQuartos(q.data ?? [])
    setReservasAtivas((r.data ?? []) as unknown as ReservaAtiva[])
  }

  useEffect(() => { load() }, [])

  function getHospedeDoQuarto(quartoId: string): ReservaAtiva | undefined {
    return reservasAtivas.find((r) => r.quarto_id === quartoId)
  }

  function openDetail(q: Quarto) {
    setSelectedQuarto(q)
    setDetailOpen(true)
  }

  function openTroca(reserva: ReservaAtiva) {
    setTrocaReserva(reserva)
    setNovoQuartoId('')
    setDetailOpen(false)
    setTrocaOpen(true)
  }

  async function handleTroca(e: React.FormEvent) {
    e.preventDefault()
    if (!trocaReserva || !novoQuartoId) return

    const quartoAntigoId = trocaReserva.quarto_id

    // Atualiza a reserva para o novo quarto
    await supabase.from('reservas').update({ quarto_id: novoQuartoId }).eq('id', trocaReserva.id)
    // Marca o quarto antigo como limpeza
    await supabase.from('quartos').update({ status: 'limpeza' }).eq('id', quartoAntigoId)
    // Marca o novo quarto como ocupado
    await supabase.from('quartos').update({ status: 'ocupado' }).eq('id', novoQuartoId)

    setTrocaOpen(false)
    setTrocaReserva(null)
    load()
  }

  async function handleNovoQuarto(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('quartos').insert(form)
    setNovoModalOpen(false)
    setForm(emptyForm)
    load()
  }

  async function changeStatus(id: string, status: string) {
    await supabase.from('quartos').update({ status }).eq('id', id)
    load()
  }

  const quartosDisponiveis = quartos.filter((q) => q.status === 'disponivel')
  const reservaDoSelected = selectedQuarto ? getHospedeDoQuarto(selectedQuarto.id) : undefined

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quartos</h1>
        <button
          onClick={() => { setForm(emptyForm); setNovoModalOpen(true) }}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Novo Quarto
        </button>
      </div>

      <div className="flex gap-4 mb-6 text-sm">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400" /> Disponivel</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400" /> Ocupado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400" /> Limpeza</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {quartos.map((q) => {
          const reserva = getHospedeDoQuarto(q.id)
          return (
            <div
              key={q.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-shadow hover:shadow-md ${statusColors[q.status]}`}
              onClick={() => openDetail(q)}
            >
              <p className="text-lg font-bold">{q.numero}</p>
              <p className="text-xs mt-1">{q.tipo}</p>
              <p className="text-xs font-medium mt-2">{statusLabels[q.status]}</p>
              {reserva && (
                <p className="text-xs font-semibold mt-2 truncate" title={reserva.hospedes?.nome}>
                  {reserva.hospedes?.nome}
                </p>
              )}
              <div className="flex gap-1 mt-3">
                {(['disponivel', 'ocupado', 'limpeza'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); changeStatus(q.id, s) }}
                    className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${q.status === s ? 'font-bold underline' : 'opacity-60 hover:opacity-100'}`}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {quartos.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-8">Nenhum quarto cadastrado.</p>
        )}
      </div>

      {/* Modal Detalhes do Quarto */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Quarto ${selectedQuarto?.numero || ''}`}>
        {selectedQuarto && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Tipo</span>
                <p className="font-medium text-gray-900">{selectedQuarto.tipo}</p>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <p className="font-medium text-gray-900">{statusLabels[selectedQuarto.status]}</p>
              </div>
            </div>

            <hr />

            {reservaDoSelected ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Hospede Atual</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                  <p><span className="text-gray-500">Nome:</span> <span className="font-medium text-gray-900">{reservaDoSelected.hospedes?.nome}</span></p>
                  <p><span className="text-gray-500">Documento:</span> <span className="font-medium text-gray-900">{reservaDoSelected.hospedes?.documento}</span></p>
                  {reservaDoSelected.hospedes?.telefone && (
                    <p><span className="text-gray-500">Telefone:</span> <span className="font-medium text-gray-900">{reservaDoSelected.hospedes.telefone}</span></p>
                  )}
                  <p><span className="text-gray-500">Check-in:</span> <span className="font-medium text-gray-900">{new Date(reservaDoSelected.data_checkin + 'T00:00:00').toLocaleDateString('pt-BR')}</span></p>
                  <p><span className="text-gray-500">Check-out:</span> <span className="font-medium text-gray-900">{new Date(reservaDoSelected.data_checkout + 'T00:00:00').toLocaleDateString('pt-BR')}</span></p>
                </div>

                {quartosDisponiveis.length > 0 ? (
                  <button
                    onClick={() => openTroca(reservaDoSelected)}
                    className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    Trocar de Quarto
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 text-center">Nenhum quarto disponivel para troca.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">Nenhum hospede neste quarto.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Troca de Quarto */}
      <Modal open={trocaOpen} onClose={() => setTrocaOpen(false)} title="Trocar de Quarto">
        {trocaReserva && (
          <form onSubmit={handleTroca} className="space-y-4">
            <p className="text-sm text-gray-600">
              Transferir <span className="font-semibold text-gray-900">{trocaReserva.hospedes?.nome}</span> para outro quarto:
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Novo Quarto *</label>
              <select
                required
                value={novoQuartoId}
                onChange={(e) => setNovoQuartoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione...</option>
                {quartosDisponiveis.map((q) => (
                  <option key={q.id} value={q.id}>{q.numero} - {q.tipo}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-400">
              O quarto atual sera marcado como &quot;Limpeza&quot; e o novo quarto como &quot;Ocupado&quot;.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTrocaOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">Cancelar</button>
              <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 cursor-pointer">Confirmar Troca</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Novo Quarto */}
      <Modal open={novoModalOpen} onClose={() => setNovoModalOpen(false)} title="Novo Quarto">
        <form onSubmit={handleNovoQuarto} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero *</label>
            <input required value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Standard</option>
              <option>Luxo</option>
              <option>Suite</option>
              <option>Presidencial</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setNovoModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">Cancelar</button>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark cursor-pointer">Salvar</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
