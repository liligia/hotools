'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'

interface Reserva {
  id: string
  codigo: number
  hospede_id: string
  quarto_id: string
  data_checkin: string
  data_checkout: string
  status: string
  numero_hospedes: number
  hospedes_adicionais: string | null
  hospedes: { nome: string } | null
  quartos: { numero: string } | null
}

interface Hospede { id: string; nome: string }
interface Quarto { id: string; numero: string }

const statusColors: Record<string, string> = {
  confirmada: 'bg-blue-100 text-blue-800',
  checkin: 'bg-green-100 text-green-800',
  checkout: 'bg-gray-100 text-gray-800',
  cancelada: 'bg-red-100 text-red-800',
}

const emptyForm = { hospede_id: '', quarto_id: '', data_checkin: '', data_checkout: '', status: 'confirmada', numero_hospedes: 1, hospedes_adicionais: '' }

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [hospedes, setHospedes] = useState<Hospede[]>([])
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Reserva | null>(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    const { data } = await supabase
      .from('reservas')
      .select('*, hospedes(nome), quartos(numero)')
      .order('data_checkin', { ascending: false })
    setReservas((data ?? []) as Reserva[])
  }

  async function loadOptions() {
    const [h, q] = await Promise.all([
      supabase.from('hospedes').select('id, nome').order('nome'),
      supabase.from('quartos').select('id, numero').order('numero'),
    ])
    setHospedes(h.data ?? [])
    setQuartos(q.data ?? [])
  }

  useEffect(() => { load(); loadOptions() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(r: Reserva) {
    setEditing(r)
    setForm({
      hospede_id: r.hospede_id,
      quarto_id: r.quarto_id,
      data_checkin: r.data_checkin,
      data_checkout: r.data_checkout,
      status: r.status,
      numero_hospedes: r.numero_hospedes,
      hospedes_adicionais: r.hospedes_adicionais ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      await supabase.from('reservas').update(form).eq('id', editing.id)
    } else {
      await supabase.from('reservas').insert(form)
    }
    setModalOpen(false)
    load()
  }

  async function doCheckin(r: Reserva) {
    await supabase.from('reservas').update({ status: 'checkin' }).eq('id', r.id)
    await supabase.from('quartos').update({ status: 'ocupado' }).eq('id', r.quarto_id)
    load()
  }

  async function doCheckout(r: Reserva) {
    await supabase.from('reservas').update({ status: 'checkout' }).eq('id', r.id)
    await supabase.from('quartos').update({ status: 'limpeza' }).eq('id', r.quarto_id)
    load()
  }

  async function doCancel(r: Reserva) {
    if (!confirm('Deseja cancelar esta reserva?')) return
    await supabase.from('reservas').update({ status: 'cancelada' }).eq('id', r.id)
    load()
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
        <button
          onClick={openNew}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Nova Reserva
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Hospede</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Hospedes</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Quarto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Check-in</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Check-out</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservas.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.codigo}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-900">{r.hospedes?.nome || '-'}</p>
                  {r.hospedes_adicionais && (
                    <p className="text-xs text-gray-400 mt-0.5">+ {r.hospedes_adicionais}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 text-center">{r.numero_hospedes}</td>
                <td className="px-4 py-3 text-gray-600">{r.quartos?.numero || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(r.data_checkin + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(r.data_checkout + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {r.status === 'confirmada' && (
                    <>
                      <button onClick={() => doCheckin(r)} className="text-green-600 hover:underline cursor-pointer">Check-in</button>
                      <button onClick={() => doCancel(r)} className="text-red-600 hover:underline cursor-pointer">Cancelar</button>
                    </>
                  )}
                  {r.status === 'checkin' && (
                    <button onClick={() => doCheckout(r)} className="text-orange-600 hover:underline cursor-pointer">Check-out</button>
                  )}
                  <button onClick={() => openEdit(r)} className="text-primary hover:underline cursor-pointer">Editar</button>
                </td>
              </tr>
            ))}
            {reservas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Nenhuma reserva cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Reserva' : 'Nova Reserva'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospede *</label>
            <select required value={form.hospede_id} onChange={(e) => setForm({ ...form, hospede_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {hospedes.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quarto *</label>
            <select required value={form.quarto_id} onChange={(e) => setForm({ ...form, quarto_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {quartos.map((q) => <option key={q.id} value={q.id}>{q.numero}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N. de Hospedes *</label>
            <input required type="number" min={1} value={form.numero_hospedes} onChange={(e) => setForm({ ...form, numero_hospedes: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {form.numero_hospedes > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospedes Adicionais</label>
              <textarea
                value={form.hospedes_adicionais}
                onChange={(e) => setForm({ ...form, hospedes_adicionais: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nomes dos acompanhantes, separados por virgula"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in *</label>
              <input required type="date" value={form.data_checkin} onChange={(e) => setForm({ ...form, data_checkin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out *</label>
              <input required type="date" value={form.data_checkout} onChange={(e) => setForm({ ...form, data_checkout: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="confirmada">Confirmada</option>
              <option value="checkin">Check-in</option>
              <option value="checkout">Check-out</option>
              <option value="cancelada">Cancelada</option>
            </select>
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
