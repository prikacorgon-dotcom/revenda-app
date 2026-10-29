import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  ExternalLink,
  Target,
  Award,
} from 'lucide-react';
import { Brand, PurchaseOrder } from '../types';

interface BrandsManagementProps {
  brands: Brand[];
  purchases: PurchaseOrder[];
  onSaveBrand: (brand: Brand) => void;
  onUpdateBrand: (brand: Brand) => void;
  onDeleteBrand: (id: string) => void;
}

export const BrandsManagement: React.FC<BrandsManagementProps> = ({
  brands,
  purchases,
  onSaveBrand,
  onUpdateBrand,
  onDeleteBrand,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [requiredPoints, setRequiredPoints] = useState<number>(50);
  const [currentCycle, setCurrentCycle] = useState('Ciclo 05/2026');
  const [averageDeliveryDays, setAverageDeliveryDays] = useState<number>(3);
  const [orderDay, setOrderDay] = useState('Segunda-feira');
  const [supervisorContact, setSupervisorContact] = useState('');
  const [notes, setNotes] = useState('');
  const [bgColor, setBgColor] = useState('#FFF0F3');
  const [textColor, setTextColor] = useState('#E11D48');

  const handleOpenNew = () => {
    setEditingBrand(null);
    setName('');
    setRequiredPoints(50);
    setCurrentCycle('');
    setAverageDeliveryDays(3);
    setOrderDay('');
    setSupervisorContact('');
    setNotes('');
    setBgColor('#FFF0F3');
    setTextColor('#E11D48');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setRequiredPoints(brand.requiredPoints);
    setCurrentCycle(brand.currentCycle);
    setAverageDeliveryDays(brand.averageDeliveryDays);
    setOrderDay(brand.orderDay || 'Segunda-feira');
    setSupervisorContact(brand.supervisorContact || '');
    setNotes(brand.notes || '');
    setBgColor(brand.badgeColor.bg);
    setTextColor(brand.badgeColor.text);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const brandData: Brand = {
      id: editingBrand ? editingBrand.id : `brand-${Date.now()}`,
      name: name.trim(),
      requiredPoints,
      currentCycle: currentCycle.trim(),
      averageDeliveryDays,
      orderDay,
      supervisorContact: supervisorContact.trim(),
      badgeColor: {
        bg: bgColor,
        text: textColor,
        border: bgColor,
      },
      notes: notes.trim(),
    };

    if (editingBrand) {
      onUpdateBrand(brandData);
    } else {
      onSaveBrand(brandData);
    }
    setIsModalOpen(false);
  };

  // Pontos acumulados por marca nas compras
  const brandPointsMap = new Map<string, number>();
  const brandOrdersCountMap = new Map<string, number>();

  purchases.forEach((p) => {
    const pts = brandPointsMap.get(p.brandId) || 0;
    brandPointsMap.set(p.brandId, pts + (p.totalPoints || 0));

    const orders = brandOrdersCountMap.get(p.brandId) || 0;
    brandOrdersCountMap.set(p.brandId, orders + 1);
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Empresas Parceiras & Pontuação para Pedidos
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cadastre marcas (Natura, Avon, etc.), defina quanto de pontos precisa para realizar o pedido e acompanhe os ciclos.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Nova Marca Parceira
        </button>
      </div>

      {/* Cards das Marcas ou Estado Vazio */}
      {brands.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
          <Building2 className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">
            Nenhuma empresa parceira cadastrada
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-5">
            Cadastre as marcas que você revende e informe quantos pontos são necessários para realizar o pedido em cada uma delas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleOpenNew}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              + Cadastrar Marca Manualmente
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-stone-100 max-w-lg mx-auto">
            <span className="text-[11px] font-bold text-stone-400 block mb-2 uppercase tracking-wider">
              Ou adicione rapidamente as marcas populares:
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { name: 'Natura', pts: 50, cycle: 'Ciclo Atual' },
                { name: 'Avon', pts: 60, cycle: 'Ciclo Atual' },
                { name: 'O Boticário', pts: 80, cycle: 'Ciclo Atual' },
                { name: 'Mary Kay', pts: 100, cycle: 'Mês Atual' },
                { name: 'Eudora', pts: 50, cycle: 'Ciclo Atual' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    onSaveBrand({
                      id: `brand-${Date.now()}-${Math.random()}`,
                      name: preset.name,
                      requiredPoints: preset.pts,
                      currentCycle: preset.cycle,
                      averageDeliveryDays: 3,
                      badgeColor: {
                        bg: '#FFF0F3',
                        text: '#E11D48',
                        border: '#FCE7F3',
                      },
                      notes: `Pedido mínimo de ${preset.pts} pontos.`,
                    });
                  }}
                  className="px-3 py-1.5 bg-[#FCFAF8] hover:bg-rose-50 border border-stone-200 hover:border-rose-300 rounded-xl text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                >
                  + {preset.name} ({preset.pts} pts)
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {brands.map((brand) => {
            const accumulated = brandPointsMap.get(brand.id) || 0;
            const target = brand.requiredPoints || 50;
            const isTargetMet = accumulated >= target;
            const progress = Math.min(100, Math.round((accumulated / target) * 100));
            const ordersCount = brandOrdersCountMap.get(brand.id) || 0;

            return (
              <div
                key={brand.id}
                className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs border"
                        style={{
                          backgroundColor: brand.badgeColor.bg || '#FFF0F3',
                          color: brand.badgeColor.text || '#E11D48',
                          borderColor: brand.badgeColor.border || '#FCE7F3',
                        }}
                      >
                        {brand.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-stone-900">{brand.name}</h3>
                        <span className="text-[11px] text-stone-500 font-medium block">
                          {brand.currentCycle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(brand)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                        title="Editar marca"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a marca parceira ${brand.name}?`)) {
                            onDeleteBrand(brand.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir marca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bloco de Pontos Necessários */}
                  <div className="bg-[#FCFAF8] rounded-2xl p-4 border border-stone-200/60 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-stone-700 font-bold flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-rose-500" />
                        Meta de Pontos p/ Pedido
                      </span>
                      <span className="font-mono font-bold text-stone-900 tabular-nums">
                        {brand.requiredPoints} pts
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-xs text-stone-500">
                        Acumulados no ciclo:
                      </span>
                      <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                        {accumulated} / {target} pts
                      </span>
                    </div>

                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTargetMet ? 'bg-emerald-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-2 text-[11px] font-medium flex items-center justify-between">
                      <span className={isTargetMet ? 'text-emerald-700 font-bold' : 'text-rose-600 font-semibold'}>
                        {isTargetMet ? '✓ Meta liberada para envio!' : `Faltam ${target - accumulated} pontos`}
                      </span>
                      <span className="text-stone-400">{progress}%</span>
                    </div>
                  </div>

                  {/* Detalhes operacionais */}
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Prazo Médio de Entrega:</span>
                      <span className="font-medium text-stone-900">~{brand.averageDeliveryDays} dias úteis</span>
                    </div>
                    {brand.orderDay && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Dia do Pedido:</span>
                        <span className="font-medium text-stone-900">{brand.orderDay}</span>
                      </div>
                    )}
                    {brand.supervisorContact && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Contato Supervisora:</span>
                        <span className="font-medium text-stone-900">{brand.supervisorContact}</span>
                      </div>
                    )}
                    {brand.notes && (
                      <p className="text-[11px] text-stone-400 pt-1.5 border-t border-stone-100 italic">
                        "{brand.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>{ordersCount} pedidos registrados</span>
                  <span className="text-[11px] font-bold text-rose-600">Ativa</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição da Empresa Parceira */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden p-4 sm:p-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingBrand ? 'Editar Empresa Parceira' : 'Cadastrar Nova Empresa Parceira'}
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
                  Nome da Empresa / Marca * (Ex: Natura, Avon, Mary Kay...)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Natura, Avon, O Boticário..."
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Pontos Necessários para o Pedido *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={requiredPoints}
                    onChange={(e) => setRequiredPoints(parseInt(e.target.value, 10) || 1)}
                    placeholder="Ex: 50"
                    className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:border-rose-400"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Mínimo de pontos exigido pela marca no ciclo.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Ciclo da Revista Atual *
                  </label>
                  <input
                    type="text"
                    value={currentCycle}
                    onChange={(e) => setCurrentCycle(e.target.value)}
                    placeholder="Ex: Ciclo 05/2026"
                    className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Prazo Médio de Entrega (Dias úteis)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={averageDeliveryDays}
                    onChange={(e) => setAverageDeliveryDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 font-mono focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Dia Preferencial do Pedido
                  </label>
                  <input
                    type="text"
                    value={orderDay}
                    onChange={(e) => setOrderDay(e.target.value)}
                    placeholder="Ex: Terça-feira"
                    className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Contato da Supervisora / Setor
                </label>
                <input
                  type="text"
                  value={supervisorContact}
                  onChange={(e) => setSupervisorContact(e.target.value)}
                  placeholder="Ex: Carla - (11) 98123-4567"
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Regras & Observações da Marca
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Frete grátis a partir de 80 pontos, campanhas de incentivo com brindes..."
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 cursor-pointer text-center"
                >
                  Salvar Marca Parceira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
