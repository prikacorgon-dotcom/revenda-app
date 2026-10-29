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
    <div className="fixed inset-0 z-50 bg-[#2D2327]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#EFE5DF] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Topo */}
        <div className="p-5 border-b border-[#F0E4DC] flex items-center justify-between bg-[#FFFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E07A5F] text-white rounded-lg">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#342428]">
                Configurações da Consultora
              </h3>
              <p className="text-xs text-[#7A6167]">
                Dados da consultora, chave Pix para clientes, cartões e backups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C7379] hover:text-[#342428] p-1.5 rounded-lg hover:bg-[#F5ECE8] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#F0E4DC] text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#E07A5F] text-[#C85A3D]'
                : 'border-transparent text-[#7A6167]'
            }`}
          >
            Meu Perfil & Pix
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cards'
                ? 'border-[#E07A5F] text-[#C85A3D]'
                : 'border-transparent text-[#7A6167]'
            }`}
          >
            Cartões de Crédito ({creditCards.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#E07A5F] text-[#C85A3D]'
                : 'border-transparent text-[#7A6167]'
            }`}
          >
            Backup & Dados
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Aba 1: Perfil */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#4A373C] mb-1">
                  Seu Nome Completo *
                </label>
                <div className="flex items-center bg-[#FAF5F2] border border-[#E8DAD3] rounded-lg px-2.5">
                  <User className="w-4 h-4 text-[#8C7379] mr-2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 bg-transparent border-none text-[#342428] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A373C] mb-1">
                  Nome do Seu Negócio de Consultoria
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#FAF5F2] border border-[#E8DAD3] rounded-lg p-2.5 text-[#342428]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A373C] mb-1">
                    Seu WhatsApp *
                  </label>
                  <div className="flex items-center bg-[#FAF5F2] border border-[#E8DAD3] rounded-lg px-2.5">
                    <Smartphone className="w-4 h-4 text-[#8C7379] mr-2" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: 11988887766"
                      className="w-full py-2 bg-transparent border-none text-[#342428] focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#4A373C] mb-1">
                    Seu E-mail *
                  </label>
                  <div className="flex items-center bg-[#FAF5F2] border border-[#E8DAD3] rounded-lg px-2.5">
                    <Mail className="w-4 h-4 text-[#8C7379] mr-2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-2 bg-transparent border-none text-[#342428] focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Chave Pix para os clientes */}
              <div className="bg-[#FFF4EE] border border-[#F5DACD] p-3.5 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-[#C85A3D] font-bold">
                  <Key className="w-4 h-4" />
                  <span>Sua Chave Pix para Recebimentos</span>
                </div>
                <p className="text-[11px] text-[#7A6167]">
                  Esta chave Pix é inserida automaticamente nas mensagens de cobrança carinhosas enviadas aos seus clientes pelo WhatsApp!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#7A6167] mb-1">
                      Tipo de Chave
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full bg-white border border-[#E2D2CA] rounded p-2 text-xs"
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="Email">E-mail</option>
                      <option value="Telefone">Celular</option>
                      <option value="Aleatória">Aleatória</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-[#7A6167] mb-1">
                      Chave Pix
                    </label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Ex: seuemail@gmail.com ou 11988887766"
                      className="w-full bg-white border border-[#E2D2CA] rounded p-2 text-xs font-mono font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E07A5F] hover:bg-[#D46B4E] text-white font-semibold rounded-xl cursor-pointer"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          )}

          {/* Aba 2: Cartões de Crédito */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#342428]">
                  Cartões de Crédito para Compras das Marcas
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(!isAddingCard)}
                  className="text-xs font-semibold text-[#C85A3D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAddingCard ? 'Cancelar' : 'Cadastrar Cartão'}
                </button>
              </div>

              {isAddingCard && (
                <form
                  onSubmit={handleAddCardSubmit}
                  className="bg-[#FAF7F5] border border-[#EFE5DF] rounded-xl p-4 space-y-3"
                >
                  <h4 className="font-bold text-[#342428] text-xs">Novo Cartão de Crédito</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#7A6167] mb-1">
                        Apelido do Cartão *
                      </label>
                      <input
                        type="text"
                        value={cardNickname}
                        onChange={(e) => setCardNickname(e.target.value)}
                        placeholder="Ex: Nubank Vendas, Itaú Black..."
                        className="w-full bg-white border border-[#E2D2CA] rounded p-2 text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#7A6167] mb-1">
                        Últimos 4 Dígitos
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={lastFourDigits}
                        onChange={(e) => setLastFourDigits(e.target.value)}
                        placeholder="Ex: 4821"
                        className="w-full bg-white border border-[#E2D2CA] rounded p-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#7A6167] mb-1">
                        Limite Total do Cartão (R$) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#E2D2CA] rounded p-2 text-xs font-mono text-right"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#7A6167] mb-1">
                          Dia Fechamento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={closingDay}
                          onChange={(e) => setClosingDay(parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-white border border-[#E2D2CA] rounded p-2 text-xs font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#7A6167] mb-1">
                          Dia Vencimento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={dueDay}
                          onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-white border border-[#E2D2CA] rounded p-2 text-xs font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#E07A5F] hover:bg-[#D46B4E] text-white font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Salvar Cartão
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {creditCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 bg-[#FCF9F7] border border-[#EDE0D8] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FAF0EC] rounded-lg text-[#C85A3D]">
                        <CreditCardIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-[#342428] text-xs">
                          {card.cardNickname}{' '}
                          <span className="font-mono font-normal text-[#8C7379]">
                            (•••• {card.lastFourDigits})
                          </span>
                        </h5>
                        <div className="text-[11px] text-[#7A6167] flex items-center gap-2 mt-0.5">
                          <span>Limite: <strong>{formatCurrency(card.creditLimit)}</strong></span>
                          <span>·</span>
                          <span>Vence dia {card.dueDay}</span>
                        </div>
                      </div>
                    </div>

                    {creditCards.length > 1 && (
                      <button
                        onClick={() => onDeleteCreditCard(card.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                        title="Remover cartão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aba 3: Backup & Dados */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-[#FAF7F5] border border-[#EFE5DF] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#342428] text-xs flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#C85A3D]" />
                  Fazer Backup dos Dados (Exportar JSON)
                </h4>
                <p className="text-[11px] text-[#7A6167]">
                  Baixe um arquivo seguro com todas as suas marcas, compras, vendas, clientes e parcelas salvas no seu computador.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="mt-2 py-2 px-4 bg-white border border-[#E2D2CA] hover:bg-[#FDF9F7] text-[#342428] font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo de Backup
                </button>
              </div>

              <div className="bg-[#FAF7F5] border border-[#EFE5DF] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#342428] text-xs flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#C85A3D]" />
                  Restaurar Backup (Importar JSON)
                </h4>
                <p className="text-[11px] text-[#7A6167]">
                  Envie um arquivo `.json` gerado anteriormente para restaurar todas as informações.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="text-xs text-[#7A6167] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E07A5F] file:text-white hover:file:bg-[#D46B4E]"
                />
                {importStatus && (
                  <div className="text-xs text-emerald-700 font-bold mt-1">
                    {importStatus}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#F0E4DC] flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
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
