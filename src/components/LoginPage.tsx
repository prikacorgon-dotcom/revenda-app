import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Image as ImageIcon,
  User,
  Building,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ShieldCheck,
  Heart,
  Key,
} from 'lucide-react';
import { ConsultantProfile } from '../types';
import { PhotoCaptureModal } from './PhotoCaptureModal';

interface LoginPageProps {
  onLoginSuccess: (profile?: ConsultantProfile) => void;
  currentProfile: ConsultantProfile;
  initialEmail?: string;
}

const POPULAR_BRANDS = [
  'Natura',
  'Avon',
  'O Boticário',
  'Mary Kay',
  'Eudora',
  'Jequiti',
  'Quem Disse Berenice',
  'Tupperware',
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  currentProfile,
  initialEmail = '',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState(initialEmail || currentProfile.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form States
  const [name, setName] = useState(currentProfile.name || '');
  const [businessName, setBusinessName] = useState(currentProfile.businessName || '');
  const [whatsapp, setWhatsapp] = useState(currentProfile.whatsapp || '');
  const [email, setEmail] = useState(currentProfile.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pixKey, setPixKey] = useState(currentProfile.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState<ConsultantProfile['pixKeyType']>(
    currentProfile.pixKeyType || 'CPF'
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    currentProfile.registeredBrands?.length
      ? currentProfile.registeredBrands
      : ['Natura', 'Avon', 'O Boticário']
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(currentProfile.avatarUrl || '');

  // Photo Capture Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Manipulador de login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Por favor, informe seu e-mail ou WhatsApp cadastrado.');
      return;
    }

    // Acesso permitido
    onLoginSuccess();
  };

  // Acesso rápido como consultora atual
  const handleQuickAccess = () => {
    onLoginSuccess();
  };

  // Manipulador de cadastro
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!name.trim()) {
      alert('Por favor, informe o seu nome completo.');
      return;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      alert('As senhas não coincidem. Verifique a digitação.');
      return;
    }

    const newProfile: ConsultantProfile = {
      ...currentProfile,
      isRegistered: true,
      name: name.trim(),
      businessName: businessName.trim() || `Consultoria ${name.trim()}`,
      whatsapp: whatsapp.replace(/\D/g, ''),
      email: email.trim(),
      pixKey: pixKey.trim(),
      pixKeyType,
      registeredBrands: selectedBrands,
      avatarUrl: avatarUrl || currentProfile.avatarUrl,
      joinedDate: currentProfile.joinedDate || new Date().toISOString(),
    };

    onLoginSuccess(newProfile);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col justify-center py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 font-sans selection:bg-rose-200 selection:text-rose-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Marca & Ícone */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white shadow-md shadow-rose-200 mb-3">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900">
          BellaGestão
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xs mx-auto">
          Gestão completa de consultoria multimarcas: pedidos, vendas, clientes e lucros reais.
        </p>

        {/* Abas Entrar / Criar Conta */}
        <div className="mt-6 p-1 bg-stone-100/90 rounded-2xl flex max-w-xs mx-auto border border-stone-200/70">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-rose-600 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Cadastrar Consultora
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xl shadow-stone-200/40">
          {/* TAB 1: ENTRAR */}
          {activeTab === 'login' && (
            <div className="space-y-5">
              {/* Card de Boas-Vindas Rápido se já houver consultora cadastrada */}
              {currentProfile.name && (
                <div className="p-3.5 bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-rose-300 bg-white shrink-0">
                      <img
                        src={currentProfile.avatarUrl || '/src/assets/images/consultant_profile_avatar_1793146987839.jpg'}
                        alt={currentProfile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                        Conta Salva
                      </span>
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {currentProfile.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate">
                        {currentProfile.businessName || 'Consultora de Beleza'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickAccess}
                    className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-rose-200 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0"
                  >
                    <span>Entrar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    E-mail ou WhatsApp *
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                    <Mail className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="consultora@email.com ou WhatsApp"
                      className="w-full py-2.5 bg-transparent border-none text-stone-900 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Senha de Acesso
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                    <Lock className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha secreta"
                      className="w-full py-2.5 bg-transparent border-none text-stone-900 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span>Manter conectada</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Para redefinir ou acessar sem senha, use a entrada direta com sua conta ou preencha o cadastro!')}
                    className="text-rose-600 hover:underline font-medium text-[11px] cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Acessar o BellaGestão</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-3 border-t border-stone-100 text-center">
                <button
                  type="button"
                  onClick={handleQuickAccess}
                  className="text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                >
                  Entrar direto sem senha no aplicativo →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CADASTRAR CONSULTORA */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Seletor de Foto com Câmera e Galeria */}
              <div className="flex flex-col items-center justify-center pb-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-rose-300 bg-rose-50 shadow-inner flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Foto da Consultora"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-rose-300" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="absolute -bottom-2 -right-2 p-2 bg-gradient-to-tr from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
                    title="Adicionar ou alterar foto"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Botões diretos para Câmera e Galeria */}
                <div className="flex items-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tirar Foto / Galeria</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-[11px] text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Seu Nome Completo *
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                  <User className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Amanda Silva"
                    className="w-full py-2.5 bg-transparent border-none text-stone-900 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nome do Seu Negócio de Consultoria
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                  <Building className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Amanda Beleza & Perfumes"
                    className="w-full py-2.5 bg-transparent border-none text-stone-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Seu WhatsApp *
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                    <Smartphone className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="11988887766"
                      className="w-full py-2.5 bg-transparent border-none text-stone-900 text-xs focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Seu E-mail *
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                    <Mail className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="consultora@email.com"
                      className="w-full py-2.5 bg-transparent border-none text-stone-900 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Chave Pix para Recebimentos */}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                  <Key className="w-3.5 h-3.5" />
                  <span>Sua Chave Pix para Recebimentos de Clientes</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full bg-white border border-rose-200 rounded-xl p-2 text-xs text-stone-900 focus:outline-none"
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="Email">E-mail</option>
                      <option value="Telefone">Celular</option>
                      <option value="Aleatória">Aleatória</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Sua chave Pix"
                      className="w-full bg-white border border-rose-200 rounded-xl p-2 text-xs font-mono text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Marcas que revende */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Marcas que você Revende
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_BRANDS.map((brand) => {
                    const isSelected = selectedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleBrand(brand)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500 border-rose-500 text-white font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {brand}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Criar Conta & Acessar Sistema</span>
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-4 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          <span>Seus dados ficam salvos com segurança no seu dispositivo</span>
        </div>
      </div>

      {/* Modal de Foto da Consultora (Câmera e Galeria) */}
      <PhotoCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoSelected={(dataUrl) => {
          setAvatarUrl(dataUrl);
        }}
        title="Foto de Perfil da Consultora"
        subtitle="Tire uma foto sua com a câmera ou escolha uma imagem da galeria"
        currentPhotoUrl={avatarUrl}
      />
    </div>
  );
};
