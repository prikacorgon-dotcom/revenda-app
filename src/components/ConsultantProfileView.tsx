import React, { useState } from 'react';
import {
  UserCheck,
  Building2,
  Sparkles,
  Smartphone,
  Mail,
  Key,
  MapPin,
  Award,
  CheckCircle2,
  RotateCcw,
  Save,
  Check,
  ShieldCheck,
  Trash2,
  Camera,
  LogOut,
  Image as ImageIcon,
} from 'lucide-react';
import { ConsultantProfile } from '../types';
import { formatPhone } from '../utils/formatters';
import { PhotoCaptureModal } from './PhotoCaptureModal';

interface ConsultantProfileViewProps {
  profile: ConsultantProfile;
  onSaveProfile: (profile: ConsultantProfile) => void;
  onClearForRealUsage: () => void;
  onResetToDemo: () => void;
  onLogout?: () => void;
  salesCount: number;
  clientsCount: number;
  purchasesCount: number;
}

const AVAILABLE_BRANDS = [
  'Natura',
  'Avon',
  'O Boticário',
  'Mary Kay',
  'Eudora',
  'Jequiti',
  'Quem Disse Berenice',
  'Hinode',
  'Tupperware',
];

export const ConsultantProfileView: React.FC<ConsultantProfileViewProps> = ({
  profile,
  onSaveProfile,
  onClearForRealUsage,
  onResetToDemo,
  onLogout,
  salesCount,
  clientsCount,
  purchasesCount,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [documentCpfCnpj, setDocumentCpfCnpj] = useState(profile.documentCpfCnpj || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '');
  const [email, setEmail] = useState(profile.email || '');
  const [pixKey, setPixKey] = useState(profile.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState(profile.pixKeyType || 'Email');
  const [city, setCity] = useState(profile.city || '');
  const [state, setState] = useState(profile.state || '');
  const [address, setAddress] = useState(profile.address || '');
  const [resellerLevel, setResellerLevel] = useState(profile.resellerLevel || 'Bronze');
  const [registeredBrands, setRegisteredBrands] = useState<string[]>(
    profile.registeredBrands || []
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [notes, setNotes] = useState(profile.notes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleBrandToggle = (brandName: string) => {
    setRegisteredBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConsultantProfile = {
      ...profile,
      isRegistered: true,
      name: name.trim(),
      businessName: businessName.trim() || `Consultoria ${name.trim()}`,
      documentCpfCnpj: documentCpfCnpj.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      email: email.trim(),
      pixKey: pixKey.trim(),
      pixKeyType,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      address: address.trim(),
      resellerLevel,
      registeredBrands,
      avatarUrl: avatarUrl || profile.avatarUrl,
      notes: notes.trim(),
    };

    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header com Boas-Vindas e Status */}
      <div className="bg-gradient-to-r from-white via-[#FFF5F6] to-[#FFF0F3] border border-[#FAD2DA] rounded-3xl p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-rose-300 shadow-md bg-rose-50 shrink-0">
                <img
                  src={avatarUrl || profile.avatarUrl || '/src/assets/images/consultant_profile_avatar_1793146987839.jpg'}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white p-1.5 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
                title="Tirar foto com câmera ou escolher da galeria"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <span className="absolute -top-1 -left-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                {resellerLevel}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/70 px-2.5 py-0.5 rounded-full">
                  Cadastro Oficial da Consultora
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {profile.city ? `${profile.city} - ${profile.state}` : 'Brasil'}
                </span>
              </div>
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
                {profile.name || 'Minha Conta de Consultora'}
              </h1>
              <p className="text-xs text-stone-600 mt-0.5">
                {profile.businessName || 'Consultoria de Beleza Multimarcas'}
              </p>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 mt-1.5 cursor-pointer mx-auto sm:mx-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Alterar foto (Câmera ou Galeria)</span>
              </button>
            </div>
          </div>

          {/* Botões de Ação do Topo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja sair da sua conta e retornar para a tela de login?')) {
                    onLogout();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Sair / Trocar de conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Conta</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Deseja limpar todos os dados de teste (compras, clientes e vendas de demonstração) para começar a usar o aplicativo do ZERO com suas informações reais?'
                  )
                ) {
                  onClearForRealUsage();
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Apagar dados fictícios e iniciar sistema limpo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Demonstração</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja recarregar os dados de exemplo para demonstração?')) {
                  onResetToDemo();
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recarregar Exemplos</span>
            </button>
          </div>
        </div>

        {/* Resumo de Atividades Reais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-rose-100">
          <div className="bg-white/80 rounded-xl p-3 border border-rose-100 text-center">
            <span className="text-[11px] text-stone-500 block">Clientes Cadastrados</span>
            <span className="font-mono text-lg font-bold text-stone-900">{clientsCount}</span>
          </div>
          <div className="bg-white/80 rounded-xl p-3 border border-rose-100 text-center">
            <span className="text-[11px] text-stone-500 block">Vendas Realizadas</span>
            <span className="font-mono text-lg font-bold text-rose-600">{salesCount}</span>
          </div>
          <div className="bg-white/80 rounded-xl p-3 border border-rose-100 text-center">
            <span className="text-[11px] text-stone-500 block">Pedidos às Marcas</span>
            <span className="font-mono text-lg font-bold text-stone-900">{purchasesCount}</span>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro da Consultora */}
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200/80 rounded-3xl p-6 lg:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Dados do Cadastro da Consultora
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Suas informações são usadas nos recibos, mensagens de WhatsApp e identificação das marcas.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              Cadastro salvo com sucesso!
            </div>
          )}
        </div>

        {/* Seção 1: Identificação */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> 1. Identificação da Consultora
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nome Completo da Consultora *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Juliana Medeiros"
                className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nome da Loja / Espaço de Beleza
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Espaço Juliana Cosméticos"
                className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                CPF ou CNPJ
              </label>
              <input
                type="text"
                value={documentCpfCnpj}
                onChange={(e) => setDocumentCpfCnpj(e.target.value)}
                placeholder="Ex: 000.000.000-00"
                className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp com DDD *
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: (11) 98888-7766"
                className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                E-mail da Consultora *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: juliana.consultoria@gmail.com"
                className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nível de Consultoria
              </label>
              <select
                value={resellerLevel}
                onChange={(e) => setResellerLevel(e.target.value as any)}
                className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              >
                <option value="Bronze">Bronze (Iniciante)</option>
                <option value="Prata">Prata</option>
                <option value="Ouro">Ouro</option>
                <option value="Diamante">Diamante (Líder / Top Vendedora)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seção 2: Chave Pix para Recebimentos Diretos */}
        <div className="bg-[#FFF8F9] border border-rose-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
            <Key className="w-4 h-4" />
            <span>2. Chave Pix para Cobranças Diretas dos Clientes</span>
          </div>
          <p className="text-xs text-stone-600">
            Esta chave Pix é incluída automaticamente na mensagem do WhatsApp quando você clica em "Enviar WhatsApp" para um cliente com parcela a vencer!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tipo da Chave
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as any)}
                className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="Email">E-mail</option>
                <option value="Telefone">Celular</option>
                <option value="Aleatória">Chave Aleatória</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Chave Pix *
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Ex: seuemail@gmail.com ou 11988887766"
                className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-stone-900 font-mono font-semibold focus:outline-none focus:border-rose-400"
                required
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Endereço & Localização */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> 3. Endereço e Cidade de Atendimento
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Endereço Completo (para retirada de produtos)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rua das Orquídeas, 185 - Centro"
                className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="SP"
                  className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 uppercase text-center focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 4: Marcas que a consultora revende */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> 4. Marcas que você Revende
          </h3>
          <p className="text-xs text-stone-500">
            Selecione as empresas parceiras com as quais você trabalha.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {AVAILABLE_BRANDS.map((brandName) => {
              const isSelected = registeredBrands.includes(brandName);
              return (
                <button
                  key={brandName}
                  type="button"
                  onClick={() => handleBrandToggle(brandName)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-[#FAF7F5] text-stone-700 border-stone-200 hover:border-rose-300'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '} {brandName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seção 5: Observações da Consultoria */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Biografia / Mensagem Pessoal aos Clientes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Consultora especializada em cuidados com a pele, maquiagem e perfumaria fina com pronta entrega!"
            className="w-full bg-[#FCFAF8] border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
          />
        </div>

        {/* Botão de Salvar */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            Salvar Meu Cadastro de Consultora
          </button>
        </div>
      </form>

      {/* Modal de Foto da Consultora (Câmera e Galeria) */}
      <PhotoCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoSelected={(dataUrl) => {
          setAvatarUrl(dataUrl);
          // Salva imediatamente no perfil para feedback instantâneo
          onSaveProfile({
            ...profile,
            avatarUrl: dataUrl,
          });
        }}
        title="Foto de Perfil da Consultora"
        subtitle="Tire uma foto sua com a câmera ou selecione da sua galeria"
        currentPhotoUrl={avatarUrl || profile.avatarUrl}
      />
    </div>
  );
};
