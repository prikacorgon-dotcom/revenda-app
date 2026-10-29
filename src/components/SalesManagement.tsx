import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  MessageCircle,
  Mail,
  CheckCircle2,
  Gift,
  ArrowRight,
  TrendingUp,
  Percent,
  Search,
  FileText,
  Printer,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import {
  Client,
  PurchaseOrder,
  SaleOrder,
  SaleItem,
  ConsultantProfile,
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  calculateInstallmentDates,
  buildClientWhatsAppMessage,
  generateWhatsAppUrl,
  generateMailtoUrl,
} from '../utils/formatters';

interface SalesManagementProps {
  sales: SaleOrder[];
  clients: Client[];
  purchases: PurchaseOrder[];
  profile: ConsultantProfile;
  onSaveSale: (sale: SaleOrder) => void;
  onUpdateSale: (sale: SaleOrder) => void;
  onDeleteSale: (id: string) => void;
  isOpenNewModal: boolean;
  onCloseNewModal: () => void;
  onOpenNewModal: () => void;
  preSelectedClient?: Client | null;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({
  sales,
  clients,
  purchases,
  profile,
  onSaveSale,
  onUpdateSale,
  onDeleteSale,
  isOpenNewModal,
  onCloseNewModal,
  onOpenNewModal,
  preSelectedClient,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<SaleOrder | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Form State para Nova Venda
  const todayStr = new Date().toISOString().split('T')[0];
  const [clientId, setClientId] = useState<string>(preSelectedClient ? preSelectedClient.id : clients[0]?.id || '');
  const [saleDate, setSaleDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<SaleOrder['paymentMethod']>('carne_parcelado');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);
  const [firstDueDate, setFirstDueDate] = useState<string>(todayStr);
  const [intervalDays, setIntervalDays] = useState<number>(30); // 15 ou 30 dias
  const [notes, setNotes] = useState<string>('');

  // Catálogo de todos os produtos comprados no estoque (incluindo brindes)
  const stockProducts = React.useMemo(() => {
    const list: Array<{
      productId: string;
      productCode: string;
      name: string;
      brandName: string;
      unitCost: number;
      suggestedSalePrice: number;
      imageUrl?: string;
      isFromGift: boolean;
    }> = [];

    purchases.forEach((po) => {
      po.items.forEach((it) => {
        list.push({
          productId: it.id,
          productCode: it.productCode,
          name: it.name,
          brandName: it.brandName,
          unitCost: it.unitCost,
          suggestedSalePrice: it.suggestedSalePrice || it.unitCost * 1.8,
          imageUrl: it.imageUrl,
          isFromGift: false,
        });
      });

      if (po.giftItems) {
        po.giftItems.forEach((gift) => {
          list.push({
            productId: gift.id,
            productCode: gift.productCode,
            name: `${gift.name} (Brinde da Marca)`,
            brandName: gift.brandName,
            unitCost: 0,
            suggestedSalePrice: gift.suggestedSalePrice || 39.9,
            imageUrl: gift.imageUrl,
            isFromGift: true,
          });
        });
      }
    });

    return list;
  }, [purchases]);

  // Itens da venda
  const [saleItems, setSaleItems] = useState<Array<{
    tempId: string;
    productId: string;
    productCode: string;
    name: string;
    brandName: string;
    quantity: number;
    unitCost: number;
    salePrice: number;
    isFromGift: boolean;
    imageUrl?: string;
  }>>([]);

  // Inicializa o primeiro item ao abrir
  React.useEffect(() => {
    if (isOpenNewModal && saleItems.length === 0) {
      if (stockProducts.length > 0) {
        const first = stockProducts[0];
        setSaleItems([
          {
            tempId: `item-${Date.now()}`,
            productId: first.productId,
            productCode: first.productCode,
            name: first.name,
            brandName: first.brandName,
            quantity: 1,
            unitCost: first.unitCost,
            salePrice: first.suggestedSalePrice,
            isFromGift: first.isFromGift,
            imageUrl: first.imageUrl,
          },
        ]);
      } else {
        // Se ainda não cadastrou compras, permite preencher manualmente produto do zero
        setSaleItems([
          {
            tempId: `item-${Date.now()}`,
            productId: `prod-manual-${Date.now()}`,
            productCode: '',
            name: '',
            brandName: '',
            quantity: 1,
            unitCost: 0,
            salePrice: 0,
            isFromGift: false,
          },
        ]);
      }
    }
  }, [isOpenNewModal, stockProducts]);

  // Se veio cliente pré-selecionado
  React.useEffect(() => {
    if (preSelectedClient) {
      setClientId(preSelectedClient.id);
    }
  }, [preSelectedClient]);

  // Adicionar produto
  const handleAddProduct = () => {
    const defaultProd = stockProducts[0] || {
      productId: `manual-${Date.now()}`,
      productCode: '',
      name: '',
      brandName: '',
      unitCost: 0,
      suggestedSalePrice: 0,
      isFromGift: false,
    };

    setSaleItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}`,
        productId: defaultProd.productId,
        productCode: defaultProd.productCode,
        name: defaultProd.name,
        brandName: defaultProd.brandName,
        quantity: 1,
        unitCost: defaultProd.unitCost,
        salePrice: defaultProd.suggestedSalePrice,
        isFromGift: defaultProd.isFromGift,
        imageUrl: defaultProd.imageUrl,
      },
    ]);
  };

  const handleRemoveProduct = (idx: number) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Quando seleciona produto pelo código ou nome -> puxa automaticamente todos os dados!
  const handleSelectStockProduct = (idx: number, selectedCodeOrId: string) => {
    const found = stockProducts.find(
      (p) => p.productCode === selectedCodeOrId || p.productId === selectedCodeOrId
    );
    if (!found) return;

    setSaleItems((prev) =>
      prev.map((it, i) => {
        if (i === idx) {
          return {
            ...it,
            productId: found.productId,
            productCode: found.productCode,
            name: found.name,
            brandName: found.brandName,
            unitCost: found.unitCost,
            salePrice: found.suggestedSalePrice,
            isFromGift: found.isFromGift,
            imageUrl: found.imageUrl,
          };
        }
        return it;
      })
    );
  };

  // Cálculos financeiros da venda
  const subtotal = saleItems.reduce((acc, it) => acc + (it.salePrice * it.quantity || 0), 0);
  const totalCost = saleItems.reduce((acc, it) => acc + (it.unitCost * it.quantity || 0), 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalProfit = totalAmount - totalCost;
  const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

  // Cálculo automático das parcelas e datas
  const isSinglePay =
    paymentMethod === 'dinheiro_a_vista' ||
    paymentMethod === 'pix_a_vista' ||
    paymentMethod === 'cartao_debito';
  const effectiveInstallmentsCount = isSinglePay ? 1 : installmentsCount;

  const calculatedInstallments = calculateInstallmentDates(
    firstDueDate,
    effectiveInstallmentsCount,
    isSinglePay ? 0 : intervalDays,
    totalAmount
  );

  const handleSaveSaleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find((c) => c.id === clientId);
    if (!selectedClient) return;

    const newSale: SaleOrder = {
      id: `venda-${Date.now()}`,
      clientId,
      clientName: selectedClient.name,
      clientWhatsapp: selectedClient.whatsapp,
      clientEmail: selectedClient.email,
      saleDate,
      items: saleItems.map((it) => ({
        id: `sale-item-${Date.now()}-${Math.random()}`,
        productId: it.productId,
        productCode: it.productCode,
        name: it.name,
        brandName: it.brandName,
        imageUrl: it.imageUrl,
        quantity: it.quantity,
        unitCost: it.unitCost,
        salePrice: it.salePrice,
        unitProfit: it.salePrice - it.unitCost,
        totalProfit: (it.salePrice - it.unitCost) * it.quantity,
        isFromGift: it.isFromGift,
      })),
      subtotal,
      discountAmount,
      totalAmount,
      totalCost,
      totalProfit,
      paymentMethod,
      installmentsCount: effectiveInstallmentsCount,
      installmentAmount: totalAmount / effectiveInstallmentsCount,
      firstDueDate,
      intervalDays: isSinglePay ? 0 : intervalDays,
      installments: calculatedInstallments.map((inst) => ({
        ...inst,
        isPaid: isSinglePay,
        paidDate: isSinglePay ? saleDate : undefined,
      })),
      status: isSinglePay ? 'pago' : 'pendente',
      notes,
    };

    onSaveSale(newSale);
    onCloseNewModal();
  };

  // Alternar pagamento da parcela
  const handleToggleInstallment = (sale: SaleOrder, instNumber: number) => {
    const updatedInst = sale.installments.map((inst) => {
      if (inst.installmentNumber === instNumber) {
        return {
          ...inst,
          isPaid: !inst.isPaid,
          paidDate: !inst.isPaid ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return inst;
    });

    const allPaid = updatedInst.every((i) => i.isPaid);
    const anyPaid = updatedInst.some((i) => i.isPaid);

    const updatedSale: SaleOrder = {
      ...sale,
      installments: updatedInst,
      status: allPaid ? 'pago' : anyPaid ? 'parcialmente_pago' : 'pendente',
    };

    onUpdateSale(updatedSale);
    if (selectedReceiptSale?.id === sale.id) {
      setSelectedReceiptSale(updatedSale);
    }
  };

  // Filtragem
  const filteredSales = sales.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        s.clientName.toLowerCase().includes(term) ||
        s.items.some(
          (it) =>
            it.name.toLowerCase().includes(term) ||
            it.brandName.toLowerCase().includes(term)
        )
      );
    }
    return true;
  });

  // Gerador de Recibo Textual para Copiar ou Enviar no WhatsApp
  const generateReceiptText = (sale: SaleOrder): string => {
    const itemsList = sale.items
      .map(
        (it) =>
          `• ${it.quantity}x ${it.name} (${it.brandName}) - ${formatCurrency(
            it.salePrice * it.quantity
          )}`
      )
      .join('\n');

    const installmentsText = sale.installments
      .map(
        (inst) =>
          `  - Parcela ${inst.installmentNumber}: ${formatCurrency(
            inst.amount
          )} (Venc: ${formatDateBR(inst.dueDate)}) ${inst.isPaid ? '✓ PAGO' : 'PENDENTE'}`
      )
      .join('\n');

    return `🧾 *COMPROVANTE DE PEDIDO / VENDA*\n*${profile.businessName || 'Consultoria de Beleza'}*\nConsultora: ${profile.name}\nWhatsApp: ${profile.whatsapp}\n\nCliente: ${sale.clientName}\nData: ${formatDateBR(sale.saleDate)}\n\n*Produtos:*\n${itemsList}\n\nSubtotal: ${formatCurrency(sale.subtotal)}${sale.discountAmount > 0 ? `\nDesconto: -${formatCurrency(sale.discountAmount)}` : ''}\n*VALOR TOTAL:* ${formatCurrency(sale.totalAmount)}\nForma: ${sale.paymentMethod.replace(/_/g, ' ')}\n\n*Parcelamento:*\n${installmentsText}\n\n🔑 *Chave Pix para pagamentos:* ${profile.pixKey} (${profile.pixKeyType})\n\nMuito obrigada pela preferência e carinho! 💕`;
  };

  const handleCopyReceipt = (sale: SaleOrder) => {
    navigator.clipboard.writeText(generateReceiptText(sale));
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Vendas & Pedidos dos Clientes
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Puxe produtos do estoque por código ou nome, veja o cálculo automático de lucro e gere recibos com 1 clique.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Registrar Nova Venda
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, produto ou marca vendida..."
            className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-900 placeholder-stone-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 focus:outline-none focus:border-rose-400"
          >
            <option value="all">Todas as Vendas</option>
            <option value="pendente">Pendente de Pagamento</option>
            <option value="parcialmente_pago">Parcialmente Pago</option>
            <option value="pago">Quitado / Pago</option>
            <option value="atrasado">Em Atraso</option>
          </select>
        </div>
      </div>

      {/* Grid de Vendas */}
      {filteredSales.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">
            Nenhuma venda encontrada
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Registre sua primeira venda para clientes e acompanhe lucros e vencimentos automáticos!
          </p>
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            + Fazer Primeira Venda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSales.map((sale) => {
            const client = clients.find((c) => c.id === sale.clientId);
            const pendingInst = sale.installments.find((i) => !i.isPaid);

            return (
              <div
                key={sale.id}
                className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all"
              >
                <div>
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">{sale.clientName}</h3>
                      <span className="text-[11px] text-stone-500 block">
                        {formatDateBR(sale.saleDate)} · {client?.howWeMet || 'Cliente'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sale.status === 'pago'
                          ? 'bg-emerald-50 text-emerald-700'
                          : sale.status === 'parcialmente_pago'
                          ? 'bg-amber-50 text-amber-700'
                          : sale.status === 'atrasado'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sale.status === 'pago'
                        ? 'Pago'
                        : sale.status === 'parcialmente_pago'
                        ? 'Parcial'
                        : sale.status === 'atrasado'
                        ? 'Em Atraso'
                        : 'Pendente'}
                    </span>
                  </div>

                  {/* Produtos da Venda */}
                  <div className="mt-3 space-y-1.5 py-2.5 border-y border-stone-100">
                    {sale.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 text-rose-600 rounded shrink-0">
                            {it.brandName}
                          </span>
                          <span className="text-stone-800 truncate">{it.name}</span>
                          <span className="text-stone-400 shrink-0 font-mono text-[11px]">
                            (x{it.quantity})
                          </span>
                        </div>
                        <span className="font-mono text-stone-900 shrink-0 tabular-nums font-semibold">
                          {formatCurrency(it.salePrice * it.quantity)}
                        </span>
                      </div>
                    ))}

                    {sale.discountAmount > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-700 pt-1">
                        <span>Desconto concedido:</span>
                        <span className="font-mono">-{formatCurrency(sale.discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Resumo de Lucro & Forma de Pagamento */}
                  <div className="mt-3 bg-[#FCFAF8] rounded-2xl p-3 border border-stone-200/60 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">Lucro Líquido Real:</span>
                      <span className="font-mono font-bold text-emerald-700 tabular-nums text-sm">
                        +{formatCurrency(sale.totalProfit)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-stone-500">
                      <span>Forma:</span>
                      <span className="capitalize font-medium text-stone-800">
                        {sale.paymentMethod.replace(/_/g, ' ')} ({sale.installmentsCount}x)
                      </span>
                    </div>
                  </div>

                  {/* Parcelas */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-500 block">
                      Parcelas ({sale.installments.filter((i) => i.isPaid).length}/{sale.installments.length} pagas)
                    </span>

                    {sale.installments.map((inst) => (
                      <div
                        key={inst.installmentNumber}
                        className="flex items-center justify-between text-xs bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-100"
                      >
                        <button
                          onClick={() => handleToggleInstallment(sale, inst.installmentNumber)}
                          className="flex items-center gap-2 cursor-pointer text-left"
                          title="Clique para alternar status pago"
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              inst.isPaid ? 'text-emerald-600 fill-emerald-100' : 'text-stone-300'
                            }`}
                          />
                          <span className={inst.isPaid ? 'line-through text-stone-400' : 'text-stone-800'}>
                            {inst.installmentNumber}ª Parcela · {formatDateBR(inst.dueDate)}
                          </span>
                        </button>

                        <span className="font-mono font-bold text-stone-900 tabular-nums">
                          {formatCurrency(inst.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rodapé com Total e Ações (Recibo, WhatsApp, Excluir) */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Total da Venda</span>
                    <span className="font-mono text-base font-bold text-rose-600 tabular-nums">
                      {formatCurrency(sale.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botão Ver Recibo Digital */}
                    <button
                      onClick={() => setSelectedReceiptSale(sale)}
                      className="p-2 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Ver e Imprimir Recibo da Venda"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Botão WhatsApp Direto */}
                    {pendingInst && (
                      <a
                        href={generateWhatsAppUrl(
                          sale.clientWhatsapp,
                          buildClientWhatsAppMessage({
                            clientName: sale.clientName,
                            consultantName: profile.name,
                            installmentNumber: pendingInst.installmentNumber,
                            totalInstallments: sale.installmentsCount,
                            amount: pendingInst.amount,
                            dueDate: pendingInst.dueDate,
                            pixKey: profile.pixKey,
                            pixKeyType: profile.pixKeyType,
                          })
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-xl transition-colors cursor-pointer"
                        title="Enviar lembrete de vencimento via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a venda de ${sale.clientName}?`)) {
                          onDeleteSale(sale.id);
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Excluir venda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Nova Venda */}
      {isOpenNewModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto sm:my-8 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-white to-[#FFF5F6]">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Registrar Nova Venda para Cliente
                </h3>
                <p className="text-xs text-stone-500">
                  Puxe produtos do seu estoque, visualize o lucro instantâneo ao lado e parcele com cálculo automático.
                </p>
              </div>
              <button
                onClick={onCloseNewModal}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulário com Scroll */}
            <form onSubmit={handleSaveSaleOrder} className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto text-xs">
              {/* Cliente e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Cliente *
                  </label>
                  {clients.length > 0 ? (
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                      required
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.howWeMet || 'Cliente'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                      Nenhum cliente cadastrado ainda. Cadastre um cliente primeiro na aba "Clientes".
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Data da Venda *
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>
              </div>

              {/* Seção de Produtos: Puxa pelo nome ou código + Cálculo Automático de Lucro ao Lado */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-stone-600">
                      Produtos Vendidos ({saleItems.length})
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Puxe pelo código ou nome do produto para preencher custo e marca automaticamente!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar outro produto
                  </button>
                </div>

                <div className="space-y-3">
                  {saleItems.map((item, idx) => {
                    const unitProfit = item.salePrice - item.unitCost;
                    const totalItemProfit = unitProfit * item.quantity;
                    const margin = item.salePrice > 0 ? (unitProfit / item.salePrice) * 100 : 0;

                    return (
                      <div
                        key={item.tempId}
                        className="p-4 bg-[#FCFAF8] border border-stone-200/90 rounded-2xl space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          {/* Selector de Produto comprado pelo código ou nome */}
                          <div className="flex-1 w-full">
                            <label className="block text-[10px] font-semibold text-stone-500 mb-1">
                              Puxar Produto Comprado (Nome ou Código) *
                            </label>
                            {stockProducts.length > 0 ? (
                              <select
                                value={item.productId || item.productCode}
                                onChange={(e) => handleSelectStockProduct(idx, e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-rose-400"
                              >
                                {stockProducts.map((sp, i) => (
                                  <option key={`${sp.productId}-${i}`} value={sp.productId}>
                                    [{sp.brandName}] {sp.productCode} - {sp.name} (Custo: {formatCurrency(sp.unitCost)})
                                    {sp.isFromGift ? ' ★ BRINDE DA MARCA' : ''}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSaleItems((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                                  );
                                }}
                                placeholder="Nome do produto vendido"
                                className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs"
                              />
                            )}
                          </div>

                          {/* Marca Comprada */}
                          <div className="w-full sm:w-36">
                            <label className="block text-[10px] font-semibold text-stone-500 mb-1">
                              Marca Comprada
                            </label>
                            <input
                              type="text"
                              value={item.brandName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSaleItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, brandName: val } : it))
                                );
                              }}
                              className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2 text-xs font-bold text-rose-700"
                            />
                          </div>

                          {saleItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(idx)}
                              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl mt-4 sm:mt-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Linha com Qtd, Custo, Valor de Venda e AO LADO: Cálculo Automático do Lucro */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-stone-200/70">
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-500">
                              Quantidade
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setSaleItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                                );
                              }}
                              className="w-full bg-[#FCFAF8] border border-stone-200 rounded-lg p-1.5 font-mono text-center text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-stone-500">
                              Custo Unitário (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSaleItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, unitCost: val } : it))
                                );
                              }}
                              className="w-full bg-[#FCFAF8] border border-stone-200 rounded-lg p-1.5 font-mono text-right text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-stone-800">
                              Valor de Venda (R$) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.salePrice}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSaleItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, salePrice: val } : it))
                                );
                              }}
                              className="w-full bg-[#FFF9F9] border border-rose-300 rounded-lg p-1.5 font-mono font-bold text-right text-xs text-rose-700"
                              required
                            />
                          </div>

                          {/* REQUISITO: AO LADO O VALOR AUTOMÁTICO DO GANHO */}
                          <div className="bg-emerald-50/70 border border-emerald-200 p-2 rounded-xl text-right">
                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-tight">
                              Ganho Automático
                            </label>
                            <div className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                              +{formatCurrency(totalItemProfit)}
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              {margin.toFixed(0)}% margem
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desconto Concedido */}
              <div className="bg-[#FFF8F9] p-4 rounded-2xl border border-rose-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-stone-900 block">Desconto Concedido ao Cliente (R$)</span>
                  <span className="text-[11px] text-stone-500">
                    Se concedeu desconto de amizade ou promoção especial.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-stone-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-white border border-rose-200 rounded-xl p-2 font-mono text-right text-xs"
                  />
                </div>
              </div>

              {/* Formas de Pagamento e Parcelas */}
              <div className="border border-stone-200 rounded-2xl p-4 space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-stone-500">
                  Forma de Pagamento & Parcelamento
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'carne_parcelado', label: 'Carnê / Fiado' },
                    { id: 'pix_a_vista', label: 'Pix à Vista' },
                    { id: 'cartao_credito', label: 'Cartão Crédito' },
                    { id: 'cartao_debito', label: 'Cartão Débito' },
                    { id: 'dinheiro_a_vista', label: 'Dinheiro' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-[#FCFAF8] text-stone-700 border-stone-200 hover:border-rose-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Campos do Parcelamento (Carnê ou Cartão) */}
                {!isSinglePay && (
                  <div className="bg-[#FCFAF8] p-4 rounded-2xl border border-stone-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Quantidade de Parcelas *
                        </label>
                        <select
                          value={installmentsCount}
                          onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                            <option key={n} value={n}>
                              {n} parcela(s)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Data da 1ª Parcela *
                        </label>
                        <input
                          type="date"
                          value={firstDueDate}
                          onChange={(e) => setFirstDueDate(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Espaço de quantos dias entre parcelas? *
                        </label>
                        <select
                          value={intervalDays}
                          onChange={(e) => setIntervalDays(parseInt(e.target.value, 10) || 30)}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs"
                        >
                          <option value="15">A cada 15 dias (Quinzenal)</option>
                          <option value="20">A cada 20 dias</option>
                          <option value="30">A cada 30 dias (Mensal)</option>
                        </select>
                      </div>
                    </div>

                    {/* Próximas Datas Calculadas Automaticamente */}
                    <div className="mt-3 pt-3 border-t border-stone-200">
                      <span className="text-[11px] font-bold text-stone-600 block mb-1.5">
                        Parcelas e Vencimentos Calculados Automaticamente:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {calculatedInstallments.map((inst) => (
                          <div
                            key={inst.installmentNumber}
                            className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs flex justify-between"
                          >
                            <span className="text-stone-700 font-medium">
                              {inst.installmentNumber}ª: {formatDateBR(inst.dueDate)}
                            </span>
                            <span className="font-mono font-bold text-stone-900 tabular-nums">
                              {formatCurrency(inst.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo Final da Venda e Lucro Líquido Real */}
              <div className="bg-gradient-to-r from-white via-[#FFF8F9] to-[#FFF0F3] border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-stone-600">
                  <div>Subtotal: <strong>{formatCurrency(subtotal)}</strong></div>
                  {discountAmount > 0 && (
                    <div>Desconto: <strong className="text-emerald-700">-{formatCurrency(discountAmount)}</strong></div>
                  )}
                  <div>Custo Total dos Produtos: <strong className="font-mono">{formatCurrency(totalCost)}</strong></div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-stone-500">Valor Total da Venda</div>
                  <div className="font-mono text-2xl font-bold text-stone-900 tabular-nums">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5 tabular-nums">
                    Lucro da Consultora: +{formatCurrency(totalProfit)} ({profitMargin.toFixed(0)}%)
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onCloseNewModal}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 cursor-pointer text-center"
                >
                  Confirmar e Registrar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Recibo Digital / Comprovante */}
      {selectedReceiptSale && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-4 sm:p-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <FileText className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Comprovante de Venda / Recibo
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptSale(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Visual do Recibo */}
            <div className="bg-[#FCFAF8] p-4 sm:p-5 rounded-2xl border border-stone-200/90 text-xs font-mono space-y-3">
              <div className="text-center pb-3 border-b border-dashed border-stone-300">
                <h4 className="font-bold text-sm text-stone-900">{profile.businessName || 'Consultoria de Beleza'}</h4>
                <p className="text-[11px] text-stone-500">Consultora: {profile.name}</p>
                <p className="text-[11px] text-stone-500">WhatsApp: {profile.whatsapp}</p>
              </div>

              <div>
                <p><strong>Cliente:</strong> {selectedReceiptSale.clientName}</p>
                <p><strong>Data:</strong> {formatDateBR(selectedReceiptSale.saleDate)}</p>
                <p><strong>Forma:</strong> {selectedReceiptSale.paymentMethod.replace(/_/g, ' ')}</p>
              </div>

              <div className="py-2 border-y border-dashed border-stone-300 space-y-1">
                <span className="font-bold block text-[11px]">ITENS:</span>
                {selectedReceiptSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.name}</span>
                    <span>{formatCurrency(it.salePrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <div>Subtotal: {formatCurrency(selectedReceiptSale.subtotal)}</div>
                {selectedReceiptSale.discountAmount > 0 && (
                  <div className="text-emerald-700">Desconto: -{formatCurrency(selectedReceiptSale.discountAmount)}</div>
                )}
                <div className="text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                  TOTAL: {formatCurrency(selectedReceiptSale.totalAmount)}
                </div>
              </div>

              {/* Parcelas */}
              <div className="pt-2 border-t border-dashed border-stone-300 space-y-1">
                <span className="font-bold block text-[11px]">VENCIMENTOS:</span>
                {selectedReceiptSale.installments.map((inst) => (
                  <div key={inst.installmentNumber} className="flex justify-between text-[11px]">
                    <span>Parcela {inst.installmentNumber} ({formatDateBR(inst.dueDate)})</span>
                    <span className={inst.isPaid ? 'text-emerald-700 font-bold' : 'text-stone-800'}>
                      {formatCurrency(inst.amount)} {inst.isPaid ? '✓ PAGO' : 'PENDENTE'}
                    </span>
                  </div>
                ))}
              </div>

              {profile.pixKey && (
                <div className="pt-2 border-t border-dashed border-stone-300 text-center text-[11px] bg-rose-50/50 p-2 rounded-lg">
                  <span className="font-bold block text-rose-700">PAGAMENTO VIA PIX:</span>
                  <span>Chave ({profile.pixKeyType}): <strong>{profile.pixKey}</strong></span>
                </div>
              )}
            </div>

            {/* Ações do Recibo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={() => handleCopyReceipt(selectedReceiptSale)}
                className="flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Recibo Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto do Recibo</span>
                  </>
                )}
              </button>

              <a
                href={generateWhatsAppUrl(
                  selectedReceiptSale.clientWhatsapp,
                  generateReceiptText(selectedReceiptSale)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20be5c] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs text-center"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
