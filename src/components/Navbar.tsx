import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Users,
  Building2,
  BellRing,
  PackageCheck,
  Plus,
  UserCheck,
  Settings,
  LogOut,
} from 'lucide-react';
import { ConsultantProfile } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'vendas' | 'compras' | 'marcas' | 'clientes' | 'avisos' | 'perfil';
  setActiveTab: (tab: 'dashboard' | 'vendas' | 'compras' | 'marcas' | 'clientes' | 'avisos' | 'perfil') => void;
  onNewSaleClick: () => void;
  onOpenSettings: () => void;
  onLogout?: () => void;
  dueAlertsCount: number;
  profile: ConsultantProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewSaleClick,
  onOpenSettings,
  onLogout,
  dueAlertsCount,
  profile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark (Clean luxury beauty typography) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 flex items-center justify-center text-white shadow-sm shadow-rose-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900 block leading-none">
              BellaGestão
            </span>
            <span className="text-[10px] font-semibold text-rose-500 tracking-wider uppercase">
              Consultoria Multimarcas
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-semibold text-stone-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-rose-600 font-bold border-b-2 border-rose-500'
                : 'hover:text-stone-900'
            }`}
          >
            Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('vendas')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'vendas'
                ? 'text-rose-600 font-bold border-b-2 border-rose-500'
                : 'hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Vendas
          </button>

          <button
            onClick={() => setActiveTab('compras')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compras'
                ? 'text-rose-600 font-bold border-b-2 border-rose-500'
                : 'hover:text-stone-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Compras & Marcas
          </button>

          <button
            onClick={() => setActiveTab('marcas')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'marcas'
                ? 'text-rose-600 font-bold border-b-2 border-rose-500'
                : 'hover:text-stone-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Pontos & Metas
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clientes'
                ? 'text-rose-600 font-bold border-b-2 border-rose-500'
                : 'hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Clientes
          </button>

          <button
            onClick={() => setActiveTab('avisos')}
            className={`relative whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'avisos'
                ? 'text-rose-600 font-bold border-b-2 border-rose-500'
                : 'hover:text-stone-900'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            Avisos de Vencimento
            {dueAlertsCount > 0 && (
              <span className="ml-1 text-[10px] font-mono font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                {dueAlertsCount}
              </span>
            )}
          </button>

          {/* NOVO: Link Direto para o Cadastro da Consultora */}
          <button
            onClick={() => setActiveTab('perfil')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'perfil'
                ? 'text-rose-600 font-bold border-b-2 border-rose-500'
                : 'hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-rose-500" />
            Meu Cadastro
          </button>
        </nav>

        {/* Zone 3: Perfil da Consultora & Botão Nova Venda */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('perfil')}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all cursor-pointer"
            title="Acessar meu cadastro de consultora"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-rose-100 border border-rose-200 shrink-0">
              <img
                src={profile.avatarUrl || '/src/assets/images/consultant_profile_avatar_1793146987839.jpg'}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left leading-tight hidden lg:block">
              <span className="text-xs font-bold text-stone-800 block truncate max-w-[120px]">
                {profile.name.split(' ')[0] || 'Consultora'}
              </span>
              <span className="text-[10px] text-rose-600 font-semibold">
                Nível {profile.resellerLevel || 'Ouro'}
              </span>
            </div>
          </button>

          <button
            onClick={onOpenSettings}
            title="Cartões e Backups"
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onLogout && (
            <button
              onClick={() => {
                if (confirm('Deseja sair e voltar para a página de login?')) {
                  onLogout();
                }
              }}
              title="Sair / Trocar de Conta"
              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onNewSaleClick}
            className="px-3 sm:px-4 py-2 text-xs font-bold tracking-wide text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-xs shadow-rose-200 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova Venda</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar (Scroll horizontal rápido no topo) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 border-t border-stone-100 mt-2 text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap shrink-0 font-semibold transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('vendas')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap shrink-0 font-semibold transition-colors ${
            activeTab === 'vendas'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
          }`}
        >
          Vendas
        </button>
        <button
          onClick={() => setActiveTab('compras')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap shrink-0 font-semibold transition-colors ${
            activeTab === 'compras'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
          }`}
        >
          Compras
        </button>
        <button
          onClick={() => setActiveTab('marcas')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap shrink-0 font-semibold transition-colors ${
            activeTab === 'marcas'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
          }`}
        >
          Pontos
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap shrink-0 font-semibold transition-colors ${
            activeTab === 'clientes'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
          }`}
        >
          Clientes
        </button>
        <button
          onClick={() => setActiveTab('avisos')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap shrink-0 font-semibold flex items-center gap-1 transition-colors ${
            activeTab === 'avisos'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
          }`}
        >
          Avisos
          {dueAlertsCount > 0 && (
            <span className="bg-rose-200 text-rose-800 text-[10px] font-bold px-1 rounded-full">
              {dueAlertsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap shrink-0 font-semibold transition-colors ${
            activeTab === 'perfil'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
          }`}
        >
          Meu Cadastro
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Barra Fixa Inferior Nativa para Smartphones) */}
      <nav
        aria-label="Navegação inferior mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 py-1.5 px-2 flex items-center justify-around shadow-lg"
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[52px] cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-rose-600 font-bold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Início</span>
        </button>

        <button
          onClick={() => setActiveTab('vendas')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[52px] cursor-pointer ${
            activeTab === 'vendas'
              ? 'text-rose-600 font-bold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Vendas</span>
        </button>

        <button
          onClick={() => setActiveTab('compras')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[52px] cursor-pointer ${
            activeTab === 'compras'
              ? 'text-rose-600 font-bold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <PackageCheck className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Compras</span>
        </button>

        <button
          onClick={() => setActiveTab('clientes')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[52px] cursor-pointer ${
            activeTab === 'clientes'
              ? 'text-rose-600 font-bold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setActiveTab('avisos')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[52px] cursor-pointer ${
            activeTab === 'avisos'
              ? 'text-rose-600 font-bold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <BellRing className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Avisos</span>
          {dueAlertsCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[52px] cursor-pointer ${
            activeTab === 'perfil'
              ? 'text-rose-600 font-bold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Perfil</span>
        </button>
      </nav>
    </header>
  );
};
