import React from 'react';
import {
  TrendingUp,
  CreditCard as CreditCardIcon,
  Wallet,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  MessageCircle,
  Plus,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  Brand,
  PurchaseOrder,
  SaleOrder,
  ConsultantProfile,
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  getDueStatus,
  buildClientWhatsAppMessage,
  generateWhatsAppUrl,
} from '../utils/formatters';

interface DashboardOverviewProps {
  brands: Brand[];
  purchases: PurchaseOrder[];
  sales: SaleOrder[];
  profile: ConsultantProfile;
  onNavigate: (tab: 'dashboard' | 'vendas' | 'compras' | 'marcas' | 'clientes' | 'avisos' | 'perfil') => void;
  onNewSaleClick: () => void;
  onNewPurchaseClick: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  brands,
  purchases,
  sales,
  profile,
  onNavigate,
  onNewSaleClick,
  onNewPurchaseClick,
}) => {
  // Cálculos financeiros consolidados
  const totalGrossSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalSalesCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
  const totalSalesProfit = sales.reduce((acc, s) => acc + s.totalProfit, 0);

  // Despesas adicionais de compras (Fretes e Passagens)
  const totalShipping = purchases.reduce((acc, p) => acc + (p.shippingExpense || 0), 0);
  const totalTravel = purchases.reduce((acc, p) => acc + (p.travelExpense || 0), 0);
  const totalExtraExpenses = totalShipping + totalTravel;

  // Lucro líquido real (descontando fretes e passagens das compras)
  const netRealProfit = totalSalesProfit - totalExtraExpenses;
  const netMarginPercent = totalGrossSales > 0 ? (netRealProfit / totalGrossSales) * 100 : 0;

  // Contas a receber de clientes (parcelas ainda não pagas)
  let totalReceivable = 0;
  let overdueReceivable = 0;
  const urgentCustomerInstallments: Array<{
    clientName: string;
    whatsapp: string;
    email: string;
    amount: number;
    dueDate: string;
    daysDiff: number;
    status: 'overdue' | 'today' | 'upcoming' | 'future';
    label: string;
    saleId: string;
    installmentNumber: number;
    totalInstallments: number;
  }> = [];

  sales.forEach((s) => {
    s.installments.forEach((inst) => {
      if (!inst.isPaid) {
        totalReceivable += inst.amount;
        const dueInfo = getDueStatus(inst.dueDate);
        if (dueInfo.status === 'overdue') {
          overdueReceivable += inst.amount;
          urgentCustomerInstallments.push({
            clientName: s.clientName,
            whatsapp: s.clientWhatsapp,
            email: s.clientEmail,
            amount: inst.amount,
            dueDate: inst.dueDate,
            daysDiff: dueInfo.daysDiff,
            status: dueInfo.status,
            label: dueInfo.label,
            saleId: s.id,
            installmentNumber: inst.installmentNumber,
            totalInstallments: s.installmentsCount,
          });
        } else if (dueInfo.status === 'today' || dueInfo.status === 'upcoming') {
          urgentCustomerInstallments.push({
            clientName: s.clientName,
            whatsapp: s.clientWhatsapp,
            email: s.clientEmail,
            amount: inst.amount,
            dueDate: inst.dueDate,
            daysDiff: dueInfo.daysDiff,
            status: dueInfo.status,
            label: dueInfo.label,
            saleId: s.id,
            installmentNumber: inst.installmentNumber,
            totalInstallments: s.installmentsCount,
          });
        }
      }
    });
  });

  // Contas a pagar para marcas (boletos/parcelas da consultora)
  let totalPayableToBrands = 0;
  purchases.forEach((p) => {
    if (p.paymentMethod === 'boleto_parcelado' && p.paymentDetails.installments) {
      p.paymentDetails.installments.forEach((inst) => {
        if (!inst.isPaid) totalPayableToBrands += inst.amount;
      });
    } else if (p.paymentMethod === 'boleto_a_vista' && p.status !== 'pago') {
      totalPayableToBrands += p.paymentDetails.boletoAmount || p.totalAmount;
    }
  });

  // Pontuação acumulada por marca
  const brandPointsMap = new Map<string, number>();
  purchases.forEach((p) => {
    const current = brandPointsMap.get(p.brandId) || 0;
    brandPointsMap.set(p.brandId, current + (p.totalPoints || 0));
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Boas-Vindas da Consultora */}
      <div className="bg-white border border-stone-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-rose-200 bg-rose-50 shrink-0">
              <img
                src={profile.avatarUrl || '/src/assets/images/consultant_profile_avatar_1793146987839.jpg'}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full truncate">
                  Nível {profile.resellerLevel || 'Iniciante'}
                </span>
                <span className="text-xs text-stone-300 font-medium">·</span>
                <span className="text-xs text-stone-500 font-medium truncate">
                  {profile.businessName || 'Consultoria de Beleza'}
                </span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight truncate">
                Olá, {profile.name || 'Consultora'}!
              </h1>
              <p className="text-xs text-stone-500 mt-0.5 hidden sm:block">
                Controle em tempo real de pedidos às marcas parceiras, vendas com margem real e cobranças no WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onNavigate('perfil')}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <UserCheck className="w-4 h-4 text-rose-500" />
              <span>Meu Cadastro</span>
            </button>
            <button
              onClick={onNewPurchaseClick}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-stone-800 bg-[#FFF2EB] hover:bg-[#FFE5D8] border border-[#FAD0BD] rounded-xl transition-all cursor-pointer whitespace-nowrap text-center justify-center"
            >
              + Pedido à Marca
            </button>
            <button
              onClick={onNewSaleClick}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 transition-all cursor-pointer whitespace-nowrap text-center justify-center"
            >
              + Nova Venda
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Vencimentos Urgentes */}
      {urgentCustomerInstallments.length > 0 && (
        <div className="bg-[#FFF5F6] border border-rose-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Aviso de Vencimentos de Clientes ({urgentCustomerInstallments.length} parcelas requerem atenção)
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Existem clientes com parcelas vencidas ou com vencimento para hoje. Clique no botão para disparar a mensagem educada pelo WhatsApp com sua chave Pix!
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('avisos')}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              Ver todos os avisos <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentCustomerInstallments.slice(0, 3).map((item, idx) => {
              const msg = buildClientWhatsAppMessage({
                clientName: item.clientName,
                consultantName: profile.name,
                installmentNumber: item.installmentNumber,
                totalInstallments: item.totalInstallments,
                amount: item.amount,
                dueDate: item.dueDate,
                pixKey: profile.pixKey,
                pixKeyType: profile.pixKeyType,
              });
              const waUrl = generateWhatsAppUrl(item.whatsapp, msg);

              return (
                <div
                  key={idx}
                  className="bg-white border border-rose-200/90 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {item.clientName}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          item.status === 'overdue'
                            ? 'text-red-600'
                            : item.status === 'today'
                            ? 'text-amber-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                      <span>Parcela {item.installmentNumber}/{item.totalInstallments}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-bold text-stone-900 tabular-nums">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-2 px-3 bg-[#25D366] hover:bg-[#20be5c] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Enviar WhatsApp Direto
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Métricas Principais em Estilo Limpo & Arejado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold">Faturamento Bruto</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(totalGrossSales)}
          </div>
          <div className="text-xs text-stone-400 mt-2 flex items-center gap-1.5">
            <span>{sales.length} vendas registradas</span>
          </div>
        </div>

        {/* Card 2: Lucro Líquido Real */}
        <div className="bg-gradient-to-br from-white via-[#FFF8F9] to-[#FFF0F3] border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-800 mb-2">
            <span className="font-bold">Lucro Líquido Real</span>
            <span className="p-1.5 bg-rose-500 text-white rounded-lg shadow-xs">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-rose-600 tabular-nums">
            {formatCurrency(netRealProfit)}
          </div>
          <div className="text-xs text-rose-700 mt-2 flex items-center gap-1.5">
            <span className="font-bold">{netMarginPercent.toFixed(1)}%</span>
            <span>de margem real</span>
            {totalExtraExpenses > 0 && (
              <span className="text-[11px] text-stone-400">
                (-{formatCurrency(totalExtraExpenses)} frete/passagem)
              </span>
            )}
          </div>
        </div>

        {/* Card 3: A Receber de Clientes */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold">A Receber de Clientes</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCardIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(totalReceivable)}
          </div>
          <div className="text-xs mt-2 flex items-center gap-1.5">
            {overdueReceivable > 0 ? (
              <span className="text-red-600 font-bold">
                {formatCurrency(overdueReceivable)} em atraso
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">Em dia sem atrasos</span>
            )}
          </div>
        </div>

        {/* Card 4: Boletos a Pagar */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold">Boletos a Pagar (Marcas)</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(totalPayableToBrands)}
          </div>
          <div className="text-xs text-stone-400 mt-2">
            <span>{purchases.filter((p) => p.status !== 'pago').length} compras com parcelas abertas</span>
          </div>
        </div>
      </div>

      {/* Metas de Pontuação por Marca Parceira */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Metas de Pontuação por Marca Parceira
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Pontos mínimos exigidos por cada marca no ciclo vs acumulados nos pedidos.
            </p>
          </div>
          <button
            onClick={() => onNavigate('marcas')}
            className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            Gerenciar marcas & pontos <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => {
            const accumulatedPoints = brandPointsMap.get(brand.id) || 0;
            const targetPoints = brand.requiredPoints || 50;
            const progress = Math.min(100, Math.round((accumulatedPoints / targetPoints) * 100));
            const isMet = accumulatedPoints >= targetPoints;

            return (
              <div
                key={brand.id}
                className="bg-[#FCFAF8] border border-stone-200/80 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: brand.badgeColor.bg,
                        color: brand.badgeColor.text,
                      }}
                    >
                      {brand.name}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {brand.currentCycle}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-xl font-bold text-stone-900 tabular-nums">
                        {accumulatedPoints}
                      </span>
                      <span className="text-xs text-stone-500 ml-1">/ {targetPoints} pts</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isMet ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {progress}%
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMet ? 'bg-emerald-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs">
                  <span className={isMet ? 'text-emerald-700 font-bold' : 'text-stone-500'}>
                    {isMet ? 'Pedido liberado 🎉' : `Faltam ${targetPoints - accumulatedPoints} pts`}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Entrega ~{brand.averageDeliveryDays} dias
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid com Últimas Vendas e Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco: Últimas Vendas */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-bold text-stone-900">
              Últimas Vendas
            </h3>
            <button
              onClick={() => onNavigate('vendas')}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Ver todas ({sales.length})
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {sales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate">
                    {sale.clientName}
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                    <span>{formatDateBR(sale.saleDate)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{sale.items.length} produto(s)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                    {formatCurrency(sale.totalAmount)}
                  </div>
                  <div className="text-xs text-emerald-700 font-bold tabular-nums">
                    +{formatCurrency(sale.totalProfit)} lucro
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onNewSaleClick}
            className="w-full mt-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Nova Venda
          </button>
        </div>

        {/* Bloco: Últimas Compras de Reabastecimento */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-bold text-stone-900">
              Últimas Compras das Marcas
            </h3>
            <button
              onClick={() => onNavigate('compras')}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Ver todas ({purchases.length})
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {purchases.slice(0, 4).map((purchase) => (
              <div key={purchase.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate flex items-center gap-2">
                    <span>{purchase.brandName}</span>
                    <span className="text-[11px] font-normal text-stone-500">
                      ({purchase.cycle})
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                    <span>{formatDateBR(purchase.purchaseDate)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {purchase.channel === 'loja_fisica'
                        ? 'Loja Física'
                        : purchase.channel === 'loja_online'
                        ? 'Loja Online'
                        : 'Site'}
                    </span>
                    {purchase.giftItems && purchase.giftItems.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-rose-600 font-bold">
                          +{purchase.giftItems.length} Brinde(s)
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                    {formatCurrency(purchase.totalAmount)}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {purchase.totalPoints} pontos
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onNewPurchaseClick}
            className="w-full mt-4 py-2.5 text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Pedido à Marca
          </button>
        </div>
      </div>
    </div>
  );
};
