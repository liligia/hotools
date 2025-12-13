'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'

interface Solicitacao {
  id: string
  quarto_id: string
  descricao: string
  status: string
  created_at: string
  quartos: { numero: string } | null
}

interface Quarto { id: string; numero: string }

const statusColors: Record<string, string> = {
  aberta: 'bg-red-100 text-red-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  concluida: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluida',
}

const emptyForm = { quarto_id: '', descricao: '' }

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filtro, setFiltro] = useState('todas')

  async function load() {
    let query = supabase.from('solicitacoes').select('*, quartos(numero)').order('created_at', { ascending: false })
    if (filtro !== 'todas') {
      query = query.eq('status', filtro)
    }
    const { data } = await query
    setSolicitacoes((data ?? []) as Solicitacao[])
  }

  async function loadQuartos() {
    const { data } = await supabase.from('quartos').select('id, numero').order('numero')
    setQuartos(data ?? [])
  }

  useEffect(() => { load(); loadQuartos() }, [])
  useEffect(() => { load() }, [filtro])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('solicitacoes').insert(form)
    setModalOpen(false)
    setForm(emptyForm)
    load()
  }

  async function changeStatus(id: string, status: string) {
    await supabase.from('solicitacoes').update({ status }).eq('id', id)
    load()
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitacoes</h1>
        <button
          onClick={() => { setForm(emptyForm); setModalOpen(true) }}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Nova Solicitacao
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['todas', 'aberta', 'em_andamento', 'concluida'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filtro === f ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            {f === 'todas' ? 'Todas' : statusLabels[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {solicitacoes.map((s) => (
          <div key={s.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">Quarto {s.quartos?.numero || '?'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{s.descricao}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(s.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-1 ml-4">
                {s.status === 'aberta' && (
                  <button onClick={() => changeStatus(s.id, 'em_andamento')} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 cursor-pointer">
                    Iniciar
                  </button>
                )}
                {s.status === 'em_andamento' && (
                  <button onClick={() => changeStatus(s.id, 'concluida')} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 cursor-pointer">
                    Concluir
                  </button>
                )}
                {s.status !== 'concluida' && (
                  <button onClick={() => changeStatus(s.id, 'aberta')} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">
                    Reabrir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {solicitacoes.length === 0 && (
          <p className="text-center text-gray-500 py-8">Nenhuma solicitacao encontrada.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Solicitacao">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quarto *</label>
            <select required value={form.quarto_id} onChange={(e) => setForm({ ...form, quarto_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {quartos.map((q) => <option key={q.id} value={q.id}>{q.numero}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descricao *</label>
            <textarea required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Descreva a solicitacao..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">Cancelar</button>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark cursor-pointer">Salvar</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
