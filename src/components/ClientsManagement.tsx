import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Mail,
  MapPin,
  HeartHandshake,
  Edit2,
  Trash2,
  ShoppingBag,
} from 'lucide-react';
import { Client, SaleOrder, ConsultantProfile } from '../types';
import {
  formatCurrency,
  formatDateBR,
  formatPhone,
  generateWhatsAppUrl,
} from '../utils/formatters';

interface ClientsManagementProps {
  clients: Client[];
  sales: SaleOrder[];
  profile: ConsultantProfile;
  onSaveClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onStartSaleForClient: (client: Client) => void;
}

export const ClientsManagement: React.FC<ClientsManagementProps> = ({
  clients,
  sales,
  profile,
  onSaveClient,
  onUpdateClient,
  onDeleteClient,
  onStartSaleForClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [howWeMet, setHowWeMet] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenNew = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setWhatsapp('');
    setAddress('');
    setHowWeMet('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setWhatsapp(client.whatsapp);
    setAddress(client.address);
    setHowWeMet(client.howWeMet);
    setNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const clientData: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      address: address.trim(),
      howWeMet: howWeMet.trim(),
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    if (editingClient) {
      onUpdateClient(clientData);
    } else {
      onSaveClient(clientData);
    }
    setIsModalOpen(false);
  };

  // Filtragem
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.howWeMet.toLowerCase().includes(term) ||
      c.whatsapp.includes(term) ||
      c.address.toLowerCase().includes(term)
    );
  });

  // Mapa de saldo devedor e compras do cliente
  const clientStatsMap = new Map<string, { totalBought: number; totalPending: number; salesCount: number }>();
  sales.forEach((s) => {
    const current = clientStatsMap.get(s.clientId) || { totalBought: 0, totalPending: 0, salesCount: 0 };
    current.totalBought += s.totalAmount;
    current.salesCount += 1;
    s.installments.forEach((inst) => {
      if (!inst.isPaid) current.totalPending += inst.amount;
    });
    clientStatsMap.set(s.clientId, current);
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Cadastro de Clientes
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Gerencie contatos, WhatsApp, e-mail, endereços e o local onde conheceu cada cliente para estreitar o relacionamento.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-3 flex items-center gap-2 shadow-xs">
        <Search className="w-4 h-4 text-stone-400 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nome, local onde conheceu, telefone ou endereço..."
          className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-900 placeholder-stone-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-stone-400 hover:text-stone-700 mr-1"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Grid de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
          <Users className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">
            Nenhum cliente cadastrado
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Cadastre suas clientes para registrar compras, mandar avisos no WhatsApp e manter o histórico em dia.
          </p>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            + Cadastrar Primeira Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const stats = clientStatsMap.get(client.id) || { totalBought: 0, totalPending: 0, salesCount: 0 };
            const waMsg = `Olá ${client.name}! Tudo bem com você? ✨ Aqui é a ${profile.name || 'sua consultora de beleza'}. Passando para desejar uma ótima semana e saber se está precisando repor algum cosmético ou se quer ver as novidades das revistas! 💕`;
            const waUrl = generateWhatsAppUrl(client.whatsapp, waMsg);

            return (
              <div
                key={client.id}
                className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all"
              >
                <div>
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-stone-900">{client.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-0.5">
                        <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{client.howWeMet || 'Cliente'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer"
                        title="Editar dados"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a cliente ${client.name}?`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dados de Contato e Endereço */}
                  <div className="space-y-2 text-xs text-stone-600 py-2.5 border-y border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">WhatsApp:</span>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[#128C7E] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {formatPhone(client.whatsapp)}
                      </a>
                    </div>

                    {client.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">E-mail:</span>
                        <a
                          href={`mailto:${client.email}`}
                          className="text-stone-700 hover:text-rose-600 hover:underline truncate max-w-[170px]"
                          title={client.email}
                        >
                          {client.email}
                        </a>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-start gap-1.5 text-stone-600 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{client.address}</span>
                      </div>
                    )}

                    {client.notes && (
                      <div className="text-[11px] text-stone-500 italic pt-1">
                        Preferências: "{client.notes}"
                      </div>
                    )}
                  </div>

                  {/* Histórico Financeiro do Cliente */}
                  <div className="mt-3 bg-[#FCFAF8] rounded-2xl p-3 border border-stone-200/60 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Total Comprado</span>
                      <span className="font-mono font-bold text-stone-900 tabular-nums">
                        {formatCurrency(stats.totalBought)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-stone-400 block text-[10px]">Saldo Pendente</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          stats.totalPending > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(stats.totalPending)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ação de Venda Direta */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 text-xs font-semibold text-[#128C7E] bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>

                  <button
                    onClick={() => onStartSaleForClient(client)}
                    className="py-2 px-3.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    + Vender
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição do Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Nova Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nome Completo da Cliente *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Beatriz Albuquerque"
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    WhatsApp com DDD *
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: (11) 98711-2233"
                    className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    E-mail da Cliente
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: beatriz@gmail.com"
                    className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Local que Conheço * (Como ou onde conheceu a cliente)
                </label>
                <input
                  type="text"
                  value={howWeMet}
                  onChange={(e) => setHowWeMet(e.target.value)}
                  placeholder="Ex: Vizinha do 4º andar, Academia, Trabalho, Igreja, Indicação da Maria..."
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Endereço Completo (para entregas)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 142 - Apt 62, Jardins"
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Preferências / Produtos Favoritos da Cliente
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Ama fragrâncias doces, compra hidratante todo mês..."
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
