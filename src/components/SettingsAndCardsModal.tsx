import React, { useState } from 'react';
import {
  Settings,
  CreditCard as CreditCardIcon,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Key,
  Smartphone,
  Mail,
  User,
  X,
  Building,
} from 'lucide-react';
import { CreditCard, ConsultantProfile } from '../types';
import { formatCurrency } from '../utils/formatters';
import { storageService } from '../services/storage';

interface SettingsAndCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ConsultantProfile;
  creditCards: CreditCard[];
  onSaveProfile: (profile: ConsultantProfile) => void;
  onSaveCreditCard: (card: CreditCard) => void;
  onDeleteCreditCard: (id: string) => void;
  onReloadAllData: () => void;
}

export const SettingsAndCardsModal: React.FC<SettingsAndCardsModalProps> = ({
  isOpen,
  onClose,
  profile,
  creditCards,
  onSaveProfile,
  onSaveCreditCard,
  onDeleteCreditCard,
  onReloadAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'cards' | 'backup'>('profile');

  // Profile Form
  const [name, setName] = useState(profile.name);
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp);
  const [email, setEmail] = useState(profile.email);
  const [pixKey, setPixKey] = useState(profile.pixKey);
  const [pixKeyType, setPixKeyType] = useState(profile.pixKeyType);

  // New Card Form
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardNickname, setCardNickname] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(5000);
  const [closingDay, setClosingDay] = useState<number>(5);
  const [dueDay, setDueDay] = useState<number>(12);

  // Backup status
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim(),
      businessName: businessName.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      email: email.trim(),
      pixKey: pixKey.trim(),
      pixKeyType,
    });
    alert('Configurações da consultora salvas com sucesso!');
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNickname.trim()) return;

    const newCard: CreditCard = {
      id: `card-${Date.now()}`,
      cardNickname: cardNickname.trim(),
      lastFourDigits: lastFourDigits.slice(-4) || '1234',
      creditLimit,
      availableLimit: creditLimit,
      closingDay,
      dueDay,
    };

    onSaveCreditCard(newCard);
    setIsAddingCard(false);
    setCardNickname('');
    setLastFourDigits('');
  };

  const handleExportBackup = () => {
    storageService.exportAllData();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storageService.importData(content);
      if (success) {
        setImportStatus('Backup restaurado com sucesso!');
        onReloadAllData();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('Tem certeza que deseja restaurar os dados iniciais de demonstração?')) {
      storageService.resetToDemoData();
      onReloadAllData();
      alert('Dados restaurados com sucesso!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col my-auto">
        {/* Topo */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-[#FDFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-xl shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                Configurações da Consultora
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Dados pessoais, chave Pix para clientes, cartões e backups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-2 border-b border-stone-100 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'profile'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Meu Perfil & Pix
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'cards'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Cartões de Crédito ({creditCards.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'backup'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Backup & Dados
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Aba 1: Perfil */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Seu Nome Completo *
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                  <User className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2.5 bg-transparent border-none text-stone-900 focus:outline-none"
                    placeholder="Ex: Maria da Silva"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nome do Seu Negócio de Consultoria
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                  <Building className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Maria Beleza & Perfumes"
                    className="w-full py-2.5 bg-transparent border-none text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Seu WhatsApp *
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                    <Smartphone className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: 11988887766"
                      className="w-full py-2.5 bg-transparent border-none text-stone-900 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Seu E-mail *
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-rose-400 focus-within:bg-white transition-all">
                    <Mail className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="consultora@email.com"
                      className="w-full py-2.5 bg-transparent border-none text-stone-900 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Chave Pix para os clientes */}
              <div className="bg-rose-50/60 border border-rose-200/80 p-3.5 sm:p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-700 font-bold">
                  <Key className="w-4 h-4" />
                  <span>Sua Chave Pix para Recebimentos</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Esta chave Pix é inserida automaticamente nas mensagens de cobrança carinhosas enviadas aos seus clientes pelo WhatsApp!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                      Tipo de Chave
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="Email">E-mail</option>
                      <option value="Telefone">Celular</option>
                      <option value="Aleatória">Aleatória</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                      Chave Pix
                    </label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Ex: seuemail@gmail.com ou 11988887766"
                      className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs font-mono font-medium text-stone-900 focus:outline-none focus:border-rose-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer text-center"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          )}

          {/* Aba 2: Cartões de Crédito */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-stone-900 text-xs">
                  Cartões de Crédito para Compras das Marcas
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(!isAddingCard)}
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAddingCard ? 'Cancelar' : 'Cadastrar Cartão'}
                </button>
              </div>

              {isAddingCard && (
                <form
                  onSubmit={handleAddCardSubmit}
                  className="bg-[#FCFAF8] border border-stone-200 rounded-2xl p-4 space-y-3"
                >
                  <h4 className="font-bold text-stone-900 text-xs">Novo Cartão de Crédito</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                        Apelido do Cartão *
                      </label>
                      <input
                        type="text"
                        value={cardNickname}
                        onChange={(e) => setCardNickname(e.target.value)}
                        placeholder="Ex: Nubank Vendas, Itaú..."
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                        Últimos 4 Dígitos
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={lastFourDigits}
                        onChange={(e) => setLastFourDigits(e.target.value)}
                        placeholder="Ex: 4821"
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                        Limite Total do Cartão (R$) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-mono text-right text-stone-900 focus:outline-none focus:border-rose-400"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                          Dia Fechamento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={closingDay}
                          onChange={(e) => setClosingDay(parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-mono text-center text-stone-900 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                          Dia Vencimento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={dueDay}
                          onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-mono text-center text-stone-900 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer text-center"
                    >
                      Salvar Cartão
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {creditCards.length === 0 ? (
                  <p className="text-center py-6 text-stone-400 text-xs italic">
                    Nenhum cartão cadastrado ainda.
                  </p>
                ) : (
                  creditCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-3 sm:p-3.5 bg-[#FCFAF8] border border-stone-200 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0">
                          <CreditCardIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-stone-900 text-xs truncate">
                            {card.cardNickname}{' '}
                            <span className="font-mono font-normal text-stone-400">
                              (•••• {card.lastFourDigits})
                            </span>
                          </h5>
                          <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                            <span>Limite: <strong className="text-stone-800">{formatCurrency(card.creditLimit)}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>Vence dia {card.dueDay}</span>
                          </div>
                        </div>
                      </div>

                      {creditCards.length > 1 && (
                        <button
                          onClick={() => onDeleteCreditCard(card.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Remover cartão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Aba 3: Backup & Dados */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-[#FCFAF8] border border-stone-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-2">
                  <Download className="w-4 h-4 text-rose-600" />
                  Fazer Backup dos Dados (Exportar JSON)
                </h4>
                <p className="text-[11px] text-stone-600">
                  Baixe um arquivo seguro com todas as suas marcas, compras, vendas, clientes e parcelas salvas no seu dispositivo.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="mt-2 w-full sm:w-auto py-2.5 px-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4 text-rose-500" />
                  Baixar Arquivo de Backup
                </button>
              </div>

              <div className="bg-[#FCFAF8] border border-stone-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-2">
                  <Upload className="w-4 h-4 text-rose-600" />
                  Restaurar Backup (Importar JSON)
                </h4>
                <p className="text-[11px] text-stone-600">
                  Envie um arquivo <code className="bg-stone-100 px-1 py-0.5 rounded text-[10px]">.json</code> gerado anteriormente para restaurar todas as informações.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="text-xs text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-500 file:text-white hover:file:bg-rose-600 file:cursor-pointer cursor-pointer"
                />
                {importStatus && (
                  <div className="text-xs text-emerald-700 font-bold mt-1">
                    {importStatus}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar Dados de Demonstração
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
