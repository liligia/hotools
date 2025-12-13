'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'

interface Hospede {
  id: string
  nome: string
  documento: string
  telefone: string | null
  email: string | null
  observacoes: string | null
  created_at: string
}

const emptyForm = { nome: '', documento: '', telefone: '', email: '', observacoes: '' }

export default function HospedesPage() {
  const [hospedes, setHospedes] = useState<Hospede[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Hospede | null>(null)
  const [form, setForm] = useState(emptyForm)

  function getSobrenome(nome: string) {
    const partes = nome.trim().split(/\s+/)
    return partes[partes.length - 1].toLowerCase()
  }

  async function load() {
    const { data } = await supabase.from('hospedes').select('*')
    const sorted = (data ?? []).sort((a, b) => getSobrenome(a.nome).localeCompare(getSobrenome(b.nome), 'pt-BR'))
    setHospedes(sorted)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(h: Hospede) {
    setEditing(h)
    setForm({
      nome: h.nome,
      documento: h.documento,
      telefone: h.telefone ?? '',
      email: h.email ?? '',
      observacoes: h.observacoes ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      await supabase.from('hospedes').update(form).eq('id', editing.id)
    } else {
      await supabase.from('hospedes').insert(form)
    }
    setModalOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este hospede?')) return
    await supabase.from('hospedes').delete().eq('id', id)
    load()
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hospedes</h1>
        <button
          onClick={openNew}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Novo Hospede
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Documento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Telefone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {hospedes.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{h.nome}</td>
                <td className="px-4 py-3 text-gray-600">{h.documento}</td>
                <td className="px-4 py-3 text-gray-600">{h.telefone || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{h.email || '-'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(h)} className="text-primary hover:underline cursor-pointer">Editar</button>
                  <button onClick={() => handleDelete(h.id)} className="text-red-600 hover:underline cursor-pointer">Excluir</button>
                </td>
              </tr>
            ))}
            {hospedes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum hospede cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Hospede' : 'Novo Hospede'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento *</label>
            <input required value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
