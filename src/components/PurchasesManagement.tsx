import React, { useState } from 'react';
import {
  PackageCheck,
  Plus,
  Trash2,
  Calendar,
  CreditCard as CreditCardIcon,
  Truck,
  Bus,
  Gift,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Mail,
} from 'lucide-react';
import {
  Brand,
  CreditCard,
  PurchaseOrder,
  PurchaseItem,
  ConsultantProfile,
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  calculateInstallmentDates,
  generateWhatsAppUrl,
  generateMailtoUrl,
} from '../utils/formatters';

interface PurchasesManagementProps {
  purchases: PurchaseOrder[];
  brands: Brand[];
  creditCards: CreditCard[];
  profile: ConsultantProfile;
  onSavePurchase: (purchase: PurchaseOrder) => void;
  onUpdatePurchase: (purchase: PurchaseOrder) => void;
  onDeletePurchase: (id: string) => void;
  isOpenNewModal: boolean;
  onCloseNewModal: () => void;
  onOpenNewModal: () => void;
}

// Imagens pré-geradas de cosméticos de alta definição para seleção rápida
const PRESET_IMAGES = [
  {
    url: '/src/assets/images/perfume_luxury_fragrance_1793144539290.jpg',
    label: 'Fragrância / Perfumaria Fina',
  },
  {
    url: '/src/assets/images/skincare_antiaging_serum_1793144552608.jpg',
    label: 'Skincare / Sérum & Antissinais',
  },
  {
    url: '/src/assets/images/makeup_lipstick_compact_1793144567107.jpg',
    label: 'Maquiagem / Batom & Estojo',
  },
  {
    url: '/src/assets/images/body_lotion_moisturizer_1793144579197.jpg',
    label: 'Corpo & Banho / Hidratante',
  },
];

export const PurchasesManagement: React.FC<PurchasesManagementProps> = ({
  purchases,
  brands,
  creditCards,
  profile,
  onSavePurchase,
  onUpdatePurchase,
  onDeletePurchase,
  isOpenNewModal,
  onCloseNewModal,
  onOpenNewModal,
}) => {
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<PurchaseOrder | null>(null);

  // Form State para Nova Compra
  const todayStr = new Date().toISOString().split('T')[0];
  const [brandId, setBrandId] = useState<string>(brands[0]?.id || '');
  const [customBrandName, setCustomBrandName] = useState<string>('');
  const [cycle, setCycle] = useState<string>(brands[0]?.currentCycle || '');
  const [purchaseDate, setPurchaseDate] = useState<string>(todayStr);
  const [channel, setChannel] = useState<'site' | 'loja_fisica' | 'loja_online'>('site');
  const [travelExpense, setTravelExpense] = useState<number>(0);
  const [shippingExpense, setShippingExpense] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Itens normais da compra (começam 100% em branco para o usuário preencher)
  const [items, setItems] = useState<Array<{
    tempId: string;
    productCode: string;
    name: string;
    imageUrl: string;
    quantity: number;
    unitCost: number;
    suggestedSalePrice: number;
    points: number;
  }>>([
    {
      tempId: 'temp-1',
      productCode: '',
      name: '',
      imageUrl: PRESET_IMAGES[0].url,
      quantity: 1,
      unitCost: 0,
      suggestedSalePrice: 0,
      points: 0,
    },
  ]);

  // Produtos que a marca deu de brinde (custo zero!)
  const [giftItems, setGiftItems] = useState<Array<{
    tempId: string;
    productCode: string;
    name: string;
    imageUrl: string;
    quantity: number;
    suggestedSalePrice: number;
  }>>([]);

  // Forma de pagamento
  const [paymentMethod, setPaymentMethod] = useState<'boleto_a_vista' | 'boleto_parcelado' | 'pix_a_vista' | 'cartao_credito'>('boleto_parcelado');
  const [interestAmount, setInterestAmount] = useState<number>(0);

  // Boleto a vista
  const [boletoDueDate, setBoletoDueDate] = useState<string>(todayStr);
  const [boletoAmount, setBoletoAmount] = useState<number>(0);

  // Boleto parcelado
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);
  const [firstDueDate, setFirstDueDate] = useState<string>(todayStr);
  const [intervalDays, setIntervalDays] = useState<number>(30); // 15 ou 30 dias

  // Pix a vista
  const [pixPaymentDate, setPixPaymentDate] = useState<string>(todayStr);

  // Cartao de credito
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards[0]?.id || '');
  const [cardNickname, setCardNickname] = useState<string>(creditCards[0]?.cardNickname || '');
  const [cardNumber, setCardNumber] = useState<string>(creditCards[0]?.lastFourDigits || '');
  const [cardLimit, setCardLimit] = useState<number>(creditCards[0]?.creditLimit || 0);
  const [cardDueDate, setCardDueDate] = useState<string>(todayStr);
  const [cardInstallmentsCount, setCardInstallmentsCount] = useState<number>(1);

  // Totais calculados
  const itemsSubtotal = items.reduce((acc, it) => acc + (it.unitCost * it.quantity || 0), 0);
  const totalPoints = items.reduce((acc, it) => acc + (it.points * it.quantity || 0), 0);
  const effectiveExpense = channel === 'loja_fisica' ? travelExpense : (channel === 'loja_online' || channel === 'site') ? shippingExpense : 0;
  
  // Cálculo de diferença do boleto à vista caso haja
  const basePurchaseTotal = itemsSubtotal + effectiveExpense + interestAmount;
  const boletoDiff = paymentMethod === 'boleto_a_vista' && boletoAmount > 0 ? boletoAmount - basePurchaseTotal : 0;
  const finalPurchaseTotal = paymentMethod === 'boleto_a_vista' && boletoAmount > 0 ? boletoAmount : basePurchaseTotal;

  // Parcelas calculadas automaticamente
  const calculatedInstallments = paymentMethod === 'boleto_parcelado'
    ? calculateInstallmentDates(firstDueDate, installmentsCount, intervalDays, finalPurchaseTotal)
    : [];

  const calculatedCardInstallmentVal = cardInstallmentsCount > 0 ? finalPurchaseTotal / cardInstallmentsCount : finalPurchaseTotal;

  // Handlers para adicionar/remover produtos
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `temp-${Date.now()}`,
        productCode: '',
        name: '',
        imageUrl: PRESET_IMAGES[prev.length % PRESET_IMAGES.length].url,
        quantity: 1,
        unitCost: 0,
        suggestedSalePrice: 0,
        points: 0,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddGift = () => {
    setGiftItems((prev) => [
      ...prev,
      {
        tempId: `gift-${Date.now()}`,
        productCode: '',
        name: '',
        imageUrl: PRESET_IMAGES[3].url,
        quantity: 1,
        suggestedSalePrice: 0,
      },
    ]);
  };

  const handleRemoveGift = (idx: number) => {
    setGiftItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
    const found = creditCards.find((c) => c.id === cardId);
    if (found) {
      setCardNickname(found.cardNickname);
      setCardNumber(found.lastFourDigits);
      setCardLimit(found.creditLimit);
    }
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenBrand = brands.find((b) => b.id === brandId);
    const brandName = chosenBrand ? chosenBrand.name : 'Outra Marca';

    const newPurchase: PurchaseOrder = {
      id: `compra-${Date.now()}`,
      brandId,
      brandName,
      cycle,
      purchaseDate,
      channel,
      travelExpense: channel === 'loja_fisica' ? travelExpense : 0,
      shippingExpense: channel === 'loja_online' || channel === 'site' ? shippingExpense : 0,
      items: items.map((it) => ({
        id: `p-item-${Date.now()}-${Math.random()}`,
        brandId,
        brandName,
        productCode: it.productCode || 'SEM-COD',
        name: it.name || 'Produto Cosmético',
        imageUrl: it.imageUrl || PRESET_IMAGES[0].url,
        quantity: it.quantity,
        unitCost: it.unitCost,
        suggestedSalePrice: it.suggestedSalePrice || it.unitCost * 1.8,
        points: it.points,
      })),
      giftItems: giftItems.map((g) => ({
        id: `gift-${Date.now()}-${Math.random()}`,
        brandId,
        brandName,
        productCode: g.productCode,
        name: `${g.name || 'Produto Brinde'} (Brinde)`,
        imageUrl: g.imageUrl,
        quantity: g.quantity,
        unitCost: 0,
        suggestedSalePrice: g.suggestedSalePrice,
        points: 0,
        isGift: true,
      })),
      itemsSubtotal,
      interestAmount,
      differenceAmount: boletoDiff,
      totalAmount: finalPurchaseTotal,
      totalPoints,
      paymentMethod,
      paymentDetails: {
        boletoDueDate: paymentMethod === 'boleto_a_vista' ? boletoDueDate : undefined,
        boletoAmount: paymentMethod === 'boleto_a_vista' ? finalPurchaseTotal : undefined,
        differenceAmount: boletoDiff,
        installmentsCount: paymentMethod === 'boleto_parcelado' ? installmentsCount : undefined,
        installmentAmount: paymentMethod === 'boleto_parcelado' ? finalPurchaseTotal / installmentsCount : undefined,
        firstDueDate: paymentMethod === 'boleto_parcelado' ? firstDueDate : undefined,
        intervalDays: paymentMethod === 'boleto_parcelado' ? intervalDays : undefined,
        installments: calculatedInstallments,
        pixPaymentDate: paymentMethod === 'pix_a_vista' ? pixPaymentDate : undefined,
        pixAmount: paymentMethod === 'pix_a_vista' ? finalPurchaseTotal : undefined,
        cardId: paymentMethod === 'cartao_credito' ? selectedCardId : undefined,
        cardNumber: paymentMethod === 'cartao_credito' ? cardNumber : undefined,
        cardNickname: paymentMethod === 'cartao_credito' ? cardNickname : undefined,
        cardLimit: paymentMethod === 'cartao_credito' ? cardLimit : undefined,
        cardDueDate: paymentMethod === 'cartao_credito' ? cardDueDate : undefined,
        cardInstallmentsCount: paymentMethod === 'cartao_credito' ? cardInstallmentsCount : undefined,
        cardInstallmentAmount: paymentMethod === 'cartao_credito' ? calculatedCardInstallmentVal : undefined,
      },
      status: paymentMethod === 'pix_a_vista' ? 'pago' : 'pendente',
      notes,
    };

    onSavePurchase(newPurchase);
    onCloseNewModal();
  };

  const handleToggleInstallmentPaid = (purchase: PurchaseOrder, instNum: number) => {
    if (!purchase.paymentDetails.installments) return;
    const updatedInst = purchase.paymentDetails.installments.map((inst) => {
      if (inst.installmentNumber === instNum) {
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

    const updatedPurchase: PurchaseOrder = {
      ...purchase,
      paymentDetails: {
        ...purchase.paymentDetails,
        installments: updatedInst,
      },
      status: allPaid ? 'pago' : anyPaid ? 'parcialmente_pago' : 'pendente',
    };

    onUpdatePurchase(updatedPurchase);
    if (selectedPurchaseDetails?.id === purchase.id) {
      setSelectedPurchaseDetails(updatedPurchase);
    }
  };

  // Filtragem
  const filteredPurchases = purchases.filter((p) => {
    if (filterBrand !== 'all' && p.brandId !== filterBrand) return false;
    if (filterChannel !== 'all' && p.channel !== filterChannel) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header com Filtros e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Compras & Pedidos às Marcas
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Registre compras no site, loja física ou online, adicione fretes/passagens, calcule boletos e brindes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewModal}
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Registrar Compra à Marca
          </button>
        </div>
      </div>

      {/* Barra de Filtros Segmentados */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-stone-500 shrink-0">Marca:</span>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 focus:outline-none focus:border-rose-400"
          >
            <option value="all">Todas as Marcas</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-stone-500 ml-2 shrink-0">Canal:</span>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 focus:outline-none focus:border-rose-400"
          >
            <option value="all">Todos os Canais</option>
            <option value="site">Site da Marca</option>
            <option value="loja_fisica">Loja Física (com passagem)</option>
            <option value="loja_online">Loja Online (com frete)</option>
          </select>
        </div>

        <div className="text-xs text-stone-400">
          <span className="font-bold text-stone-900">{filteredPurchases.length}</span> compras encontradas
        </div>
      </div>

      {/* Lista de Compras */}
      {filteredPurchases.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">
            Nenhuma Compra Registrada
          </h3>
          <p className="text-xs text-stone-500 mb-6 leading-relaxed">
            Registre suas compras nas marcas parceiras (site, distribuidora ou aplicativo) para controlar boletos parcelados, despesas com frete/passagem, acúmulo de pontos e estoque com produtos reais e brindes grátis.
          </p>
          <button
            onClick={onOpenNewModal}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Registrar Primeira Compra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPurchases.map((purchase) => {
          const brand = brands.find((b) => b.id === purchase.brandId);
          const channelLabel =
            purchase.channel === 'loja_fisica'
              ? 'Loja Física'
              : purchase.channel === 'loja_online'
              ? 'Loja Online'
              : 'Site Oficial';

          return (
            <div
              key={purchase.id}
              className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all"
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-md inline-block mb-1"
                      style={{
                        backgroundColor: brand?.badgeColor.bg || '#FFF0F3',
                        color: brand?.badgeColor.text || '#E11D48',
                      }}
                    >
                      {purchase.brandName}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900">
                      {purchase.cycle}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      purchase.status === 'pago'
                        ? 'bg-emerald-50 text-emerald-700'
                        : purchase.status === 'parcialmente_pago'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {purchase.status === 'pago'
                      ? 'Pago'
                      : purchase.status === 'parcialmente_pago'
                      ? 'Parcial'
                      : 'Pendente'}
                  </span>
                </div>

                {/* Dados da Compra */}
                <div className="space-y-1.5 text-xs text-[#7A6167] py-2 border-y border-[#F7EFEA]">
                  <div className="flex justify-between">
                    <span>Data do Pedido:</span>
                    <span className="font-medium text-[#342428]">{formatDateBR(purchase.purchaseDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Canal de Compra:</span>
                    <span className="font-medium text-[#342428]">{channelLabel}</span>
                  </div>
                  {purchase.travelExpense > 0 && (
                    <div className="flex justify-between text-[#8B4836]">
                      <span>Passagem / Transporte:</span>
                      <span className="font-mono">{formatCurrency(purchase.travelExpense)}</span>
                    </div>
                  )}
                  {purchase.shippingExpense > 0 && (
                    <div className="flex justify-between text-[#8B4836]">
                      <span>Frete de Entrega:</span>
                      <span className="font-mono">{formatCurrency(purchase.shippingExpense)}</span>
                    </div>
                  )}
                  {purchase.interestAmount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Juros calculados:</span>
                      <span className="font-mono">+{formatCurrency(purchase.interestAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Pontos Acumulados:</span>
                    <span className="font-mono font-bold text-[#342428]">{purchase.totalPoints} pts</span>
                  </div>
                </div>

                {/* Itens Comprados & Fotos Reais */}
                <div className="mt-3">
                  <div className="text-[11px] font-semibold text-[#8C7379] mb-2 flex items-center justify-between">
                    <span>Produtos Comprados ({purchase.items.length})</span>
                    {purchase.giftItems && purchase.giftItems.length > 0 && (
                      <span className="text-[#C85A3D] font-bold flex items-center gap-1">
                        <Gift className="w-3 h-3" /> +{purchase.giftItems.length} Brinde(s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {purchase.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="relative group shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[#EDE1DA] bg-[#FBF7F5]"
                        title={`${it.name} (${it.productCode}) - Qtd: ${it.quantity}`}
                      >
                        <img
                          src={it.imageUrl}
                          alt={it.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 bg-[#342428]/80 text-white font-mono text-[9px] px-1 rounded-tl">
                          x{it.quantity}
                        </span>
                      </div>
                    ))}

                    {purchase.giftItems?.map((g, idx) => (
                      <div
                        key={`g-${idx}`}
                        className="relative group shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-[#E07A5F] bg-[#FFF3EE]"
                        title={`BRINDE: ${g.name}`}
                      >
                        <img
                          src={g.imageUrl}
                          alt={g.name}
                          className="w-full h-full object-cover opacity-90"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-0 right-0 bg-[#E07A5F] text-white text-[8px] font-bold px-1 rounded-bl">
                          GIFT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informações de Pagamento & Parcelas */}
                <div className="mt-3 pt-2 text-xs text-[#7A6167]">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Forma:</span>
                    <span className="text-[#342428]">
                      {purchase.paymentMethod === 'boleto_parcelado'
                        ? `Boleto Parcelado (${purchase.paymentDetails.installmentsCount || 2}x)`
                        : purchase.paymentMethod === 'boleto_a_vista'
                        ? 'Boleto à Vista'
                        : purchase.paymentMethod === 'cartao_credito'
                        ? `Cartão (${purchase.paymentDetails.cardInstallmentsCount || 1}x)`
                        : 'Pix à Vista'}
                    </span>
                  </div>

                  {/* Parcelas do boleto */}
                  {purchase.paymentMethod === 'boleto_parcelado' && purchase.paymentDetails.installments && (
                    <div className="mt-2 space-y-1">
                      {purchase.paymentDetails.installments.map((inst) => (
                        <div
                          key={inst.installmentNumber}
                          className="flex items-center justify-between text-[11px] bg-[#FAF3F0] p-1.5 rounded-md"
                        >
                          <span className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleInstallmentPaid(purchase, inst.installmentNumber)}
                              title={inst.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                              className="text-[#8C7379] hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                              <CheckCircle2
                                className={`w-3.5 h-3.5 ${
                                  inst.isPaid ? 'text-emerald-600 fill-emerald-100' : 'text-gray-300'
                                }`}
                              />
                            </button>
                            <span>Parcela {inst.installmentNumber}: {formatDateBR(inst.dueDate)}</span>
                          </span>
                          <span className="font-mono font-bold text-[#342428] tabular-nums">
                            {formatCurrency(inst.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé com Valor Total e Ações */}
              <div className="mt-4 pt-3 border-t border-[#F0E4DC] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#8C7379] block">Total a Pagar</span>
                  <span className="font-mono text-base font-bold text-[#C85A3D] tabular-nums">
                    {formatCurrency(purchase.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedPurchaseDetails(purchase)}
                    className="p-1.5 text-xs font-semibold text-[#8B4836] hover:bg-[#FAF0EC] rounded-lg transition-colors cursor-pointer"
                    title="Ver detalhes da compra"
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => onDeletePurchase(purchase.id)}
                    className="p-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir compra"
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

      {/* Modal / Gaveta de Nova Compra de Reabastecimento */}
      {isOpenNewModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto sm:my-8 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-white to-[#FFF5F6]">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Registrar Compra / Pedido à Marca Parceira
                </h3>
                <p className="text-xs text-stone-500">
                  Cadastre produtos, custos, frete ou passagens, brindes da marca e calcule parcelas automaticamente.
                </p>
              </div>
              <button
                onClick={onCloseNewModal}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <form onSubmit={handleSaveOrder} className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto text-xs">
              {/* Seção 1: Marca, Ciclo, Data e Canal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Empresa Parceira *
                  </label>
                  {brands.length > 0 ? (
                    <select
                      value={brandId}
                      onChange={(e) => {
                        setBrandId(e.target.value);
                        const b = brands.find((brand) => brand.id === e.target.value);
                        if (b) setCycle(b.currentCycle);
                      }}
                      className="w-full text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-rose-400"
                      required
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.requiredPoints} pts mín.)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={customBrandName}
                        onChange={(e) => setCustomBrandName(e.target.value)}
                        placeholder="Nome da marca (ex: Natura)"
                        className="w-full text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-rose-400"
                        required
                      />
                      <div className="flex flex-wrap gap-1">
                        {['Natura', 'Avon', 'Boticário', 'Mary Kay', 'Eudora'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCustomBrandName(preset)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            +{preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Ciclo da Revista / Venda *
                  </label>
                  <input
                    type="text"
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    placeholder="Ex: Ciclo 05/2026"
                    className="w-full text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Data do Pedido *
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Onde foi feito o pedido? *
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full text-xs bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-rose-400"
                  >
                    <option value="site">Site Oficial da Marca</option>
                    <option value="loja_fisica">Loja Física (Distribuidora)</option>
                    <option value="loja_online">Loja Online / App</option>
                  </select>
                </div>
              </div>

              {/* Seção Condicional de Passagem ou Frete conforme o canal */}
              <div className="bg-[#FFF5F6] p-4 rounded-2xl border border-rose-100">
                {channel === 'loja_fisica' ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl text-rose-600 shadow-xs shrink-0">
                      <Bus className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <label className="block font-bold text-stone-900">
                        Valor da Passagem / Transporte até a Loja Física (R$)
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Acrescentado ao custo total da compra para apuração do lucro líquido real.
                      </p>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={travelExpense || ''}
                      onChange={(e) => setTravelExpense(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-32 text-xs bg-white border border-stone-200 rounded-xl p-2 font-mono text-right font-bold text-stone-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl text-rose-600 shadow-xs shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <label className="block font-bold text-stone-900">
                        Valor do Frete de Entrega (R$)
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Se houver custo de frete na entrega, insira aqui para compor o custo total a pagar.
                      </p>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingExpense || ''}
                      onChange={(e) => setShippingExpense(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-32 text-xs bg-white border border-stone-200 rounded-xl p-2 font-mono text-right font-bold text-stone-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                )}
              </div>

              {/* Seção 2: Produtos Comprados no Dia */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-stone-700">
                      Produtos do Pedido ({items.length})
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Insira o código, nome e custo de cada item comprado neste pedido.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar mais um produto
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.tempId}
                      className="p-4 bg-[#FCFAF8] border border-stone-200/80 rounded-2xl flex flex-col md:flex-row items-center gap-3.5 shadow-2xs"
                    >
                      {/* Miniatura / Foto Real */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 bg-white shrink-0 shadow-2xs">
                        <img
                          src={item.imageUrl || PRESET_IMAGES[0].url}
                          alt="Produto"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Campos do Produto */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 flex-1 w-full">
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Código do Produto *
                          </label>
                          <input
                            type="text"
                            value={item.productCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, productCode: val } : it))
                              );
                            }}
                            placeholder="Ex: NAT-8421"
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 focus:outline-none focus:border-rose-400"
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Nome do Produto *
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                              );
                            }}
                            placeholder="Nome completo do produto"
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 focus:outline-none focus:border-rose-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Qtd Comprada
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                              );
                            }}
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 font-mono text-center focus:outline-none focus:border-rose-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Valor Custo (R$) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCost || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, unitCost: val } : it))
                              );
                            }}
                            placeholder="0,00"
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 font-mono text-right focus:outline-none focus:border-rose-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Venda Sugerida (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.suggestedSalePrice || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, suggestedSalePrice: val } : it))
                              );
                            }}
                            placeholder="0,00"
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 font-mono text-right focus:outline-none focus:border-rose-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Pontos (Unit.)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.points || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, points: val } : it))
                              );
                            }}
                            placeholder="0"
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 font-mono text-center focus:outline-none focus:border-rose-400"
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Foto / Imagem do Produto
                          </label>
                          <select
                            value={item.imageUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, imageUrl: val } : it))
                              );
                            }}
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 focus:outline-none focus:border-rose-400"
                          >
                            {PRESET_IMAGES.map((img, i) => (
                              <option key={i} value={img.url}>
                                {img.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Botão Remover */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 3: Anexar Produtos que a marca deu de BRINDE */}
              <div className="bg-gradient-to-br from-amber-50/60 to-rose-50/40 border border-amber-200/70 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-stone-900">
                      Anexar Brindes Recebidos da Marca (Custo R$ 0,00)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGift}
                    className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar brinde
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mb-3">
                  Produtos que vieram grátis por campanhas. Você pode vendê-los com 100% de margem ou presentear clientes!
                </p>

                {giftItems.length === 0 ? (
                  <div className="text-center py-2 text-xs text-stone-400 italic">
                    Nenhum brinde anexado. Se a marca enviou produtos grátis, clique em "+ Adicionar brinde".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {giftItems.map((gift, gIdx) => (
                      <div
                        key={gift.tempId}
                        className="bg-white p-3 rounded-xl border border-stone-200 flex items-center gap-3 text-xs shadow-2xs"
                      >
                        <input
                          type="text"
                          value={gift.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGiftItems((prev) =>
                              prev.map((g, i) => (i === gIdx ? { ...g, name: val } : g))
                            );
                          }}
                          placeholder="Nome do brinde (ex: Batom ou Hidratante)"
                          className="flex-1 bg-[#FCFAF8] border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-rose-400"
                          required
                        />
                        <input
                          type="text"
                          value={gift.productCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGiftItems((prev) =>
                              prev.map((g, i) => (i === gIdx ? { ...g, productCode: val } : g))
                            );
                          }}
                          placeholder="Código"
                          className="w-24 bg-[#FCFAF8] border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-rose-400"
                        />
                        <input
                          type="number"
                          min="1"
                          value={gift.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setGiftItems((prev) =>
                              prev.map((g, i) => (i === gIdx ? { ...g, quantity: val } : g))
                            );
                          }}
                          className="w-16 bg-[#FCFAF8] border border-stone-200 rounded-lg p-2 text-xs font-mono text-center focus:outline-none focus:border-rose-400"
                          title="Quantidade de brindes"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={gift.suggestedSalePrice || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setGiftItems((prev) =>
                              prev.map((g, i) => (i === gIdx ? { ...g, suggestedSalePrice: val } : g))
                            );
                          }}
                          placeholder="Preço Venda"
                          className="w-24 bg-[#FCFAF8] border border-stone-200 rounded-lg p-2 text-xs font-mono text-right focus:outline-none focus:border-rose-400"
                          title="Valor sugerido de venda para lucrar 100%"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGift(gIdx)}
                          className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 4: Formas de Pagamento e Cálculos */}
              <div className="border border-stone-200 rounded-2xl p-4 space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-stone-700">
                  Forma de Pagamento da Compra
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto_parcelado')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'boleto_parcelado'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-[#FCFAF8] text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    Boleto Parcelado
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto_a_vista')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'boleto_a_vista'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-[#FCFAF8] text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    Boleto à Vista
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix_a_vista')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'pix_a_vista'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-[#FCFAF8] text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    Pix à Vista
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao_credito')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'cartao_credito'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-[#FCFAF8] text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    Cartão de Crédito
                  </button>
                </div>

                {/* Campos do Boleto à Vista com Cálculo de Diferença */}
                {paymentMethod === 'boleto_a_vista' && (
                  <div className="bg-[#FCFAF8] p-4 rounded-xl border border-stone-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Data de Vencimento do Boleto *
                        </label>
                        <input
                          type="date"
                          value={boletoDueDate}
                          onChange={(e) => setBoletoDueDate(e.target.value)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Valor Cobrado no Boleto (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={boletoAmount || ''}
                          onChange={(e) => setBoletoAmount(parseFloat(e.target.value) || 0)}
                          placeholder={formatCurrency(basePurchaseTotal)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 font-mono text-right focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Cálculo da Diferença
                        </label>
                        <div className="text-xs font-mono font-bold py-2.5 text-stone-900 tabular-nums">
                          {boletoDiff !== 0 ? (
                            <span className={boletoDiff > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                              {boletoDiff > 0 ? `+${formatCurrency(boletoDiff)} a mais` : `${formatCurrency(boletoDiff)} desconto`}
                            </span>
                          ) : (
                            'Sem diferença (R$ 0,00)'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos do Boleto Parcelado com Cálculo Automático das Próximas Datas */}
                {paymentMethod === 'boleto_parcelado' && (
                  <div className="bg-[#FCFAF8] p-4 rounded-xl border border-stone-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Em quantas vezes parcelado? *
                        </label>
                        <select
                          value={installmentsCount}
                          onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10) || 2)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                        >
                          <option value="2">2 parcelas</option>
                          <option value="3">3 parcelas</option>
                          <option value="4">4 parcelas</option>
                          <option value="5">5 parcelas</option>
                          <option value="6">6 parcelas</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Data do 1º Vencimento *
                        </label>
                        <input
                          type="date"
                          value={firstDueDate}
                          onChange={(e) => setFirstDueDate(e.target.value)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Prazo entre Parcelas *
                        </label>
                        <select
                          value={intervalDays}
                          onChange={(e) => setIntervalDays(parseInt(e.target.value, 10) || 30)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                        >
                          <option value="15">A cada 15 dias</option>
                          <option value="21">A cada 21 dias (Padrão Natura)</option>
                          <option value="28">A cada 28 dias</option>
                          <option value="30">A cada 30 dias (Mensal)</option>
                        </select>
                      </div>
                    </div>

                    {/* Próximas Datas Calculadas Automaticamente */}
                    <div className="mt-3 pt-3 border-t border-stone-200">
                      <span className="text-[11px] font-bold text-stone-600 block mb-2">
                        Datas e Valores das Parcelas Calculados Automaticamente:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {calculatedInstallments.map((inst) => (
                          <div
                            key={inst.installmentNumber}
                            className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs flex justify-between items-center shadow-2xs"
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

                {/* Pix a Vista */}
                {paymentMethod === 'pix_a_vista' && (
                  <div className="bg-[#FCFAF8] p-4 rounded-xl border border-stone-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Data do Pagamento Pix *
                        </label>
                        <input
                          type="date"
                          value={pixPaymentDate}
                          onChange={(e) => setPixPaymentDate(e.target.value)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Valor Pago no Pix (R$)
                        </label>
                        <div className="text-base font-mono font-bold py-2 text-rose-600 tabular-nums">
                          {formatCurrency(finalPurchaseTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cartão de Crédito */}
                {paymentMethod === 'cartao_credito' && (
                  <div className="bg-[#FCFAF8] p-4 rounded-xl border border-stone-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Cartão Utilizado
                        </label>
                        {creditCards.length > 0 ? (
                          <select
                            value={selectedCardId}
                            onChange={(e) => handleCardSelect(e.target.value)}
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                          >
                            {creditCards.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.cardNickname} (Final {c.lastFourDigits})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="Últimos 4 dígitos (ex: 4821)"
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Limite do Cartão (R$)
                        </label>
                        <input
                          type="number"
                          value={cardLimit || ''}
                          onChange={(e) => setCardLimit(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 font-mono text-right focus:outline-none focus:border-rose-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Data de Vencimento da Fatura *
                        </label>
                        <input
                          type="date"
                          value={cardDueDate}
                          onChange={(e) => setCardDueDate(e.target.value)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Quantidade de Parcelas no Cartão *
                        </label>
                        <select
                          value={cardInstallmentsCount}
                          onChange={(e) => setCardInstallmentsCount(parseInt(e.target.value, 10) || 1)}
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                            <option key={n} value={n}>
                              {n}x de {formatCurrency(finalPurchaseTotal / n)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Juros no Cartão (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={interestAmount || ''}
                          onChange={(e) => setInterestAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2.5 font-mono text-right focus:outline-none focus:border-rose-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Valor da Parcela Calculado
                        </label>
                        <div className="text-sm font-mono font-bold py-2 text-rose-600 tabular-nums">
                          {formatCurrency(calculatedCardInstallmentVal)} / mês
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Juros gerais caso haja para as outras opções */}
                {paymentMethod !== 'cartao_credito' && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-500">Houve juros ou encargos na compra?</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-400">Juros (R$):</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={interestAmount || ''}
                        onChange={(e) => setInterestAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-24 text-xs bg-[#FCFAF8] border border-stone-200 rounded-lg p-1.5 font-mono text-right focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo Final da Compra */}
              <div className="bg-gradient-to-r from-rose-50 to-[#FFF0F3] border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-stone-600">
                  <div className="flex items-center gap-3">
                    <span>Subtotal Produtos: <strong>{formatCurrency(itemsSubtotal)}</strong></span>
                    <span>·</span>
                    <span>Frete/Passagem: <strong>{formatCurrency(effectiveExpense)}</strong></span>
                    {interestAmount > 0 && (
                      <>
                        <span>·</span>
                        <span>Juros: <strong>{formatCurrency(interestAmount)}</strong></span>
                      </>
                    )}
                  </div>
                  <div className="text-stone-500">
                    Total de Pontos do Pedido: <strong className="text-stone-900">{totalPoints} pontos</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 block font-medium">Valor Total a Pagar</span>
                  <span className="font-mono text-2xl font-bold text-rose-600 tabular-nums">
                    {formatCurrency(finalPurchaseTotal)}
                  </span>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onCloseNewModal}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 cursor-pointer transition-all text-center"
                >
                  Salvar Compra no Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Compra */}
      {selectedPurchaseDetails && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl p-4 sm:p-6 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-bold text-rose-600">
                  {selectedPurchaseDetails.brandName}
                </span>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Detalhes do Pedido - {selectedPurchaseDetails.cycle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPurchaseDetails(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Data do Pedido:</span>
                <span className="font-semibold text-stone-900">
                  {formatDateBR(selectedPurchaseDetails.purchaseDate)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Canal:</span>
                <span className="font-semibold text-stone-900">
                  {selectedPurchaseDetails.channel === 'loja_fisica'
                    ? 'Loja Física'
                    : selectedPurchaseDetails.channel === 'loja_online'
                    ? 'Loja Online'
                    : 'Site Oficial'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Total de Pontos:</span>
                <span className="font-mono font-bold text-stone-900">
                  {selectedPurchaseDetails.totalPoints} pts
                </span>
              </div>
            </div>

            {/* Lista dos Produtos */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 mb-2 uppercase tracking-wider">
                Produtos Comprados
              </h4>
              <div className="space-y-2">
                {selectedPurchaseDetails.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl text-xs border border-stone-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="w-9 h-9 rounded-lg object-cover border border-stone-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-semibold text-stone-900">{it.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{it.productCode} · Qtd: {it.quantity}</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-stone-900 tabular-nums">
                      {formatCurrency(it.unitCost * it.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brindes */}
            {selectedPurchaseDetails.giftItems && selectedPurchaseDetails.giftItems.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-rose-600 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> Brindes Recebidos da Marca
                </h4>
                <div className="space-y-1.5">
                  {selectedPurchaseDetails.giftItems.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-xl text-xs border border-rose-100"
                    >
                      <div className="font-semibold text-stone-900">{g.name} (x{g.quantity})</div>
                      <span className="text-emerald-700 font-bold">Custo: R$ 0,00 (100% Lucro)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs font-bold text-stone-500">Valor Total do Pedido:</span>
              <span className="font-mono text-xl font-bold text-rose-600 tabular-nums">
                {formatCurrency(selectedPurchaseDetails.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
