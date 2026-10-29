import React, { useState } from 'react';
import {
  BellRing,
  AlertTriangle,
  Clock,
  Calendar,
  MessageCircle,
  Mail,
  Copy,
  CheckCircle2,
  Building2,
  Users,
  Search,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  SaleOrder,
  PurchaseOrder,
  Client,
  ConsultantProfile,
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  formatPhone,
  getDueStatus,
  buildClientWhatsAppMessage,
  generateWhatsAppUrl,
  generateMailtoUrl,
} from '../utils/formatters';

interface DueRemindersViewProps {
  sales: SaleOrder[];
  purchases: PurchaseOrder[];
  clients: Client[];
  profile: ConsultantProfile;
  onUpdateSale: (sale: SaleOrder) => void;
  onUpdatePurchase: (purchase: PurchaseOrder) => void;
}

export const DueRemindersView: React.FC<DueRemindersViewProps> = ({
  sales,
  purchases,
  clients,
  profile,
  onUpdateSale,
  onUpdatePurchase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'purchases'>('clients');
  const [filterDueType, setFilterDueType] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Coleta todas as parcelas pendentes dos clientes
  const clientDueItems: Array<{
    id: string;
    saleId: string;
    clientId: string;
    clientName: string;
    whatsapp: string;
    email: string;
    howWeMet: string;
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
    dueDate: string;
    daysDiff: number;
    status: 'overdue' | 'today' | 'upcoming' | 'future';
    label: string;
  }> = [];

  sales.forEach((s) => {
    const client = clients.find((c) => c.id === s.clientId);
    s.installments.forEach((inst) => {
      if (!inst.isPaid) {
        const dueInfo = getDueStatus(inst.dueDate);
        clientDueItems.push({
          id: `${s.id}-inst-${inst.installmentNumber}`,
          saleId: s.id,
          clientId: s.clientId,
          clientName: s.clientName,
          whatsapp: s.clientWhatsapp || client?.whatsapp || '',
          email: s.clientEmail || client?.email || '',
          howWeMet: client?.howWeMet || 'Cliente',
          installmentNumber: inst.installmentNumber,
          totalInstallments: s.installmentsCount,
          amount: inst.amount,
          dueDate: inst.dueDate,
          daysDiff: dueInfo.daysDiff,
          status: dueInfo.status,
          label: dueInfo.label,
        });
      }
    });
  });

  // Coleta todas as parcelas / boletos pendentes da consultora com as marcas
  const purchaseDueItems: Array<{
    id: string;
    purchaseId: string;
    brandName: string;
    cycle: string;
    installmentNumber?: number;
    totalInstallments?: number;
    amount: number;
    dueDate: string;
    daysDiff: number;
    status: 'overdue' | 'today' | 'upcoming' | 'future';
    label: string;
    paymentType: string;
  }> = [];

  purchases.forEach((p) => {
    if (p.paymentMethod === 'boleto_parcelado' && p.paymentDetails.installments) {
      p.paymentDetails.installments.forEach((inst) => {
        if (!inst.isPaid) {
          const dueInfo = getDueStatus(inst.dueDate);
          purchaseDueItems.push({
            id: `${p.id}-inst-${inst.installmentNumber}`,
            purchaseId: p.id,
            brandName: p.brandName,
            cycle: p.cycle,
            installmentNumber: inst.installmentNumber,
            totalInstallments: p.paymentDetails.installmentsCount || p.paymentDetails.installments?.length,
            amount: inst.amount,
            dueDate: inst.dueDate,
            daysDiff: dueInfo.daysDiff,
            status: dueInfo.status,
            label: dueInfo.label,
            paymentType: 'Boleto Parcelado',
          });
        }
      });
    } else if (p.paymentMethod === 'boleto_a_vista' && p.status !== 'pago' && p.paymentDetails.boletoDueDate) {
      const dueInfo = getDueStatus(p.paymentDetails.boletoDueDate);
      purchaseDueItems.push({
        id: `${p.id}-boleto`,
        purchaseId: p.id,
        brandName: p.brandName,
        cycle: p.cycle,
        amount: p.paymentDetails.boletoAmount || p.totalAmount,
        dueDate: p.paymentDetails.boletoDueDate,
        daysDiff: dueInfo.daysDiff,
        status: dueInfo.status,
        label: dueInfo.label,
        paymentType: 'Boleto à Vista',
      });
    }
  });

  // Filtros aplicados para clientes
  const filteredClientItems = clientDueItems.filter((item) => {
    if (filterDueType === 'overdue' && item.status !== 'overdue') return false;
    if (filterDueType === 'today' && item.status !== 'today') return false;
    if (filterDueType === 'upcoming' && item.status !== 'upcoming') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.clientName.toLowerCase().includes(term) ||
        item.howWeMet.toLowerCase().includes(term) ||
        item.whatsapp.includes(term)
      );
    }
    return true;
  });

  // Filtros aplicados para compras
  const filteredPurchaseItems = purchaseDueItems.filter((item) => {
    if (filterDueType === 'overdue' && item.status !== 'overdue') return false;
    if (filterDueType === 'today' && item.status !== 'today') return false;
    if (filterDueType === 'upcoming' && item.status !== 'upcoming') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return item.brandName.toLowerCase().includes(term) || item.cycle.toLowerCase().includes(term);
    }
    return true;
  });

  // Ação de dar baixa na parcela do cliente
  const handleMarkClientPaid = (saleId: string, instNum: number) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    const updatedInst = sale.installments.map((inst) => {
      if (inst.installmentNumber === instNum) {
        return {
          ...inst,
          isPaid: true,
          paidDate: new Date().toISOString().split('T')[0],
        };
      }
      return inst;
    });

    const allPaid = updatedInst.every((i) => i.isPaid);
    const anyPaid = updatedInst.some((i) => i.isPaid);

    onUpdateSale({
      ...sale,
      installments: updatedInst,
      status: allPaid ? 'pago' : anyPaid ? 'parcialmente_pago' : 'pendente',
    });
  };

  // Ação de dar baixa no boleto da compra
  const handleMarkPurchasePaid = (purchaseId: string, instNum?: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) return;

    if (instNum && purchase.paymentDetails.installments) {
      const updatedInst = purchase.paymentDetails.installments.map((inst) => {
        if (inst.installmentNumber === instNum) {
          return {
            ...inst,
            isPaid: true,
            paidDate: new Date().toISOString().split('T')[0],
          };
        }
        return inst;
      });

      const allPaid = updatedInst.every((i) => i.isPaid);
      const anyPaid = updatedInst.some((i) => i.isPaid);

      onUpdatePurchase({
        ...purchase,
        paymentDetails: {
          ...purchase.paymentDetails,
          installments: updatedInst,
        },
        status: allPaid ? 'pago' : anyPaid ? 'parcialmente_pago' : 'pendente',
      });
    } else {
      onUpdatePurchase({
        ...purchase,
        status: 'pago',
      });
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
          Central de Avisos de Vencimento & Cobranças
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Envie lembretes diretos por WhatsApp e e-mail com 1 clique para clientes e monitore seus próprios boletos das marcas parceiras.
        </p>
      </div>

      {/* Segmented Tabs: Clientes vs Marcas */}
      <div className="flex items-center gap-4 border-b border-stone-200/80 pb-1">
        <button
          onClick={() => setActiveSubTab('clients')}
          className={`py-2 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'clients'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Cobranças de Clientes ({clientDueItems.length})
        </button>

        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`py-2 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'purchases'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Minhas Compras das Marcas ({purchaseDueItems.length})
        </button>
      </div>

      {/* Filtros de Vencimento e Busca */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilterDueType('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterDueType === 'all'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Todos os Pendentes
          </button>
          <button
            onClick={() => setFilterDueType('overdue')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterDueType === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Vencidos (Em Atraso)
          </button>
          <button
            onClick={() => setFilterDueType('today')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterDueType === 'today'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Vencendo Hoje
          </button>
          <button
            onClick={() => setFilterDueType('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterDueType === 'upcoming'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-[#FFF0F3] text-rose-600 hover:bg-rose-100'
            }`}
          >
            Próximos (1 a 3 dias)
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome ou vínculo..."
            className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-900 placeholder-stone-400"
          />
        </div>
      </div>

      {/* Visualização de Clientes (Contas a Receber) */}
      {activeSubTab === 'clients' && (
        <div className="space-y-4">
          {filteredClientItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#EFE5DF] p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#342428]">
                Tudo em dia com seus clientes!
              </h3>
              <p className="text-xs text-[#7A6167] max-w-sm mx-auto mt-1">
                Não há parcelas pendentes com os filtros selecionados. Suas cobranças estão em ordem!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClientItems.map((item) => {
                const waMessage = buildClientWhatsAppMessage({
                  clientName: item.clientName,
                  consultantName: profile.name,
                  installmentNumber: item.installmentNumber,
                  totalInstallments: item.totalInstallments,
                  amount: item.amount,
                  dueDate: item.dueDate,
                  pixKey: profile.pixKey,
                  pixKeyType: profile.pixKeyType,
                });
                const waUrl = generateWhatsAppUrl(item.whatsapp, waMessage);
                const mailtoUrl = generateMailtoUrl({
                  email: item.email,
                  clientName: item.clientName,
                  consultantName: profile.name,
                  amount: item.amount,
                  dueDate: item.dueDate,
                  pixKey: profile.pixKey,
                });

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
                      item.status === 'overdue'
                        ? 'border-rose-300 bg-gradient-to-b from-[#FFFDFD] to-[#FFF8F7]'
                        : item.status === 'today'
                        ? 'border-amber-300 bg-gradient-to-b from-[#FFFDFB] to-[#FFFBF5]'
                        : 'border-[#EFE5DF]'
                    }`}
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#342428]">{item.clientName}</h4>
                          <span className="text-[11px] text-[#C85A3D] font-medium block">
                            {item.howWeMet}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : item.status === 'today'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* Detalhes da Parcela */}
                      <div className="bg-[#FAF7F5] rounded-xl p-3 border border-[#EDE0D8] space-y-1.5 text-xs my-3">
                        <div className="flex justify-between">
                          <span className="text-[#7A6167]">Parcela:</span>
                          <span className="font-semibold text-[#342428]">
                            {item.installmentNumber}ª de {item.totalInstallments}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A6167]">Vencimento:</span>
                          <span className="font-mono font-bold text-[#342428]">
                            {formatDateBR(item.dueDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-[#F0E4DC]">
                          <span className="text-[#7A6167] font-semibold">Valor da Parcela:</span>
                          <span className="font-mono text-base font-bold text-[#C85A3D] tabular-nums">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Contatos do Cliente */}
                      <div className="text-xs text-[#7A6167] space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <span>WhatsApp:</span>
                          <span className="font-mono text-[#128C7E] font-medium">
                            {formatPhone(item.whatsapp) || 'Sem telefone'}
                          </span>
                        </div>
                        {item.email && (
                          <div className="flex items-center justify-between">
                            <span>E-mail:</span>
                            <span className="truncate max-w-[170px] text-[#342428]">{item.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação Direta (WhatsApp, E-mail, Copiar, Baixa) */}
                    <div className="space-y-2 pt-3 border-t border-[#F0E4DC]">
                      <div className="grid grid-cols-2 gap-2">
                        {/* WhatsApp Direto */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          title="Abrir WhatsApp e enviar lembrete"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>

                        {/* E-mail Direto */}
                        {item.email ? (
                          <a
                            href={mailtoUrl}
                            className="py-2 px-2.5 bg-[#FAF3F0] hover:bg-[#F2E5DF] text-[#4A373C] text-xs font-semibold rounded-xl border border-[#E8DAD3] flex items-center justify-center gap-1.5 transition-colors"
                            title="Enviar e-mail para a cliente"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            E-mail
                          </a>
                        ) : (
                          <button
                            disabled
                            className="py-2 px-2.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" /> Sem e-mail
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        {/* Copiar mensagem */}
                        <button
                          onClick={() => handleCopyMessage(waMessage, item.id)}
                          className="text-[11px] text-[#7A6167] hover:text-[#342428] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar texto
                            </>
                          )}
                        </button>

                        {/* Dar Baixa / Marcar Pago */}
                        <button
                          onClick={() => handleMarkClientPaid(item.saleId, item.installmentNumber)}
                          className="py-1.5 px-3 bg-[#EAF7EE] hover:bg-[#DCF3E2] text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Marcar Pago
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Visualização de Minhas Compras com as Marcas (Contas a Pagar) */}
      {activeSubTab === 'purchases' && (
        <div className="space-y-4">
          {filteredPurchaseItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#EFE5DF] p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#342428]">
                Todos os boletos das marcas parceiras estão quitados!
              </h3>
              <p className="text-xs text-[#7A6167] max-w-sm mx-auto mt-1">
                Nenhum boleto em aberto para Natura, Avon, O Boticário ou outras marcas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPurchaseItems.map((item) => {
                const selfReminderMsg = `Lembrete BellaGestão: Você possui um boleto da marca *${item.brandName}* (${item.cycle}) no valor de *${formatCurrency(item.amount)}* com vencimento em *${formatDateBR(item.dueDate)}*.`;
                const selfWaUrl = generateWhatsAppUrl(profile.whatsapp, selfReminderMsg);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
                      item.status === 'overdue'
                        ? 'border-rose-300 bg-gradient-to-b from-[#FFFDFD] to-[#FFF8F7]'
                        : item.status === 'today'
                        ? 'border-amber-300 bg-gradient-to-b from-[#FFFDFB] to-[#FFFBF5]'
                        : 'border-[#EFE5DF]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-bold text-[#C85A3D] block">
                            {item.brandName}
                          </span>
                          <h4 className="font-bold text-sm text-[#342428]">{item.cycle}</h4>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : item.status === 'today'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      <div className="bg-[#FAF7F5] rounded-xl p-3 border border-[#EDE0D8] space-y-1.5 text-xs my-3">
                        <div className="flex justify-between">
                          <span className="text-[#7A6167]">Forma:</span>
                          <span className="font-semibold text-[#342428]">
                            {item.paymentType} {item.installmentNumber ? `(${item.installmentNumber}ª de ${item.totalInstallments})` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A6167]">Vencimento:</span>
                          <span className="font-mono font-bold text-[#342428]">
                            {formatDateBR(item.dueDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-[#F0E4DC]">
                          <span className="text-[#7A6167] font-semibold">Valor a Pagar:</span>
                          <span className="font-mono text-base font-bold text-[#C85A3D] tabular-nums">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-[#F0E4DC]">
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={selfWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 bg-[#FAF3F0] hover:bg-[#F2E5DF] text-[#4A373C] text-xs font-semibold rounded-xl border border-[#E8DAD3] flex items-center justify-center gap-1.5 transition-colors"
                          title="Enviar lembrete para meu próprio WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#128C7E]" />
                          Lembrete p/ Mim
                        </a>

                        <button
                          onClick={() => handleMarkPurchasePaid(item.purchaseId, item.installmentNumber)}
                          className="py-2 px-2.5 bg-[#EAF7EE] hover:bg-[#DCF3E2] text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Marcar Pago
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
