import React, { useState, useEffect } from 'react';
import {
  Brand,
  Client,
  CreditCard,
  PurchaseOrder,
  SaleOrder,
  ConsultantProfile,
} from './types';
import { storageService } from './services/storage';
import { getDueStatus } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { PurchasesManagement } from './components/PurchasesManagement';
import { BrandsManagement } from './components/BrandsManagement';
import { ClientsManagement } from './components/ClientsManagement';
import { SalesManagement } from './components/SalesManagement';
import { DueRemindersView } from './components/DueRemindersView';
import { ConsultantProfileView } from './components/ConsultantProfileView';
import { SettingsAndCardsModal } from './components/SettingsAndCardsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'vendas' | 'compras' | 'marcas' | 'clientes' | 'avisos' | 'perfil'
  >('dashboard');

  // Application Data States
  const [brands, setBrands] = useState<Brand[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [profile, setProfile] = useState<ConsultantProfile>(storageService.getProfile());

  // Modal States
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [preSelectedClient, setPreSelectedClient] = useState<Client | null>(null);

  // Carrega dados iniciais do LocalStorage
  const loadAllData = () => {
    setBrands(storageService.getBrands());
    setCreditCards(storageService.getCreditCards());
    setPurchases(storageService.getPurchases());
    setClients(storageService.getClients());
    setSales(storageService.getSales());
    setProfile(storageService.getProfile());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers para Marcas
  const handleSaveBrand = (newBrand: Brand) => {
    const updated = [...brands, newBrand];
    setBrands(updated);
    storageService.saveBrands(updated);
  };

  const handleUpdateBrand = (updatedBrand: Brand) => {
    const updated = brands.map((b) => (b.id === updatedBrand.id ? updatedBrand : b));
    setBrands(updated);
    storageService.saveBrands(updated);
  };

  const handleDeleteBrand = (id: string) => {
    const updated = brands.filter((b) => b.id !== id);
    setBrands(updated);
    storageService.saveBrands(updated);
  };

  // Handlers para Compras
  const handleSavePurchase = (newPurchase: PurchaseOrder) => {
    const updated = [newPurchase, ...purchases];
    setPurchases(updated);
    storageService.savePurchases(updated);
  };

  const handleUpdatePurchase = (updatedPurchase: PurchaseOrder) => {
    const updated = purchases.map((p) => (p.id === updatedPurchase.id ? updatedPurchase : p));
    setPurchases(updated);
    storageService.savePurchases(updated);
  };

  const handleDeletePurchase = (id: string) => {
    const updated = purchases.filter((p) => p.id !== id);
    setPurchases(updated);
    storageService.savePurchases(updated);
  };

  // Handlers para Clientes
  const handleSaveClient = (newClient: Client) => {
    const updated = [newClient, ...clients];
    setClients(updated);
    storageService.saveClients(updated);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    setClients(updated);
    storageService.saveClients(updated);
  };

  const handleDeleteClient = (id: string) => {
    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    storageService.saveClients(updated);
  };

  const handleStartSaleForClient = (client: Client) => {
    setPreSelectedClient(client);
    setIsNewSaleModalOpen(true);
    setActiveTab('vendas');
  };

  // Handlers para Vendas
  const handleSaveSale = (newSale: SaleOrder) => {
    const updated = [newSale, ...sales];
    setSales(updated);
    storageService.saveSales(updated);
  };

  const handleUpdateSale = (updatedSale: SaleOrder) => {
    const updated = sales.map((s) => (s.id === updatedSale.id ? updatedSale : s));
    setSales(updated);
    storageService.saveSales(updated);
  };

  const handleDeleteSale = (id: string) => {
    const updated = sales.filter((s) => s.id !== id);
    setSales(updated);
    storageService.saveSales(updated);
  };

  // Handlers de Perfil e Limpeza para Uso Real
  const handleSaveProfile = (newProfile: ConsultantProfile) => {
    setProfile(newProfile);
    storageService.saveProfile(newProfile);
  };

  const handleClearForRealUsage = () => {
    storageService.clearForRealUsage(profile);
    loadAllData();
  };

  const handleResetToDemo = () => {
    storageService.resetToDemoData();
    loadAllData();
  };

  const handleSaveCreditCard = (newCard: CreditCard) => {
    const updated = [...creditCards, newCard];
    setCreditCards(updated);
    storageService.saveCreditCards(updated);
  };

  const handleDeleteCreditCard = (id: string) => {
    const updated = creditCards.filter((c) => c.id !== id);
    setCreditCards(updated);
    storageService.saveCreditCards(updated);
  };

  // Contagem de avisos de vencimento urgentes (para o badge do Navbar)
  const dueAlertsCount = React.useMemo(() => {
    let count = 0;
    // Parcelas de clientes
    sales.forEach((s) => {
      s.installments.forEach((inst) => {
        if (!inst.isPaid) {
          const status = getDueStatus(inst.dueDate).status;
          if (status === 'overdue' || status === 'today') {
            count++;
          }
        }
      });
    });
    // Boletos das marcas
    purchases.forEach((p) => {
      if (p.paymentMethod === 'boleto_parcelado' && p.paymentDetails.installments) {
        p.paymentDetails.installments.forEach((inst) => {
          if (!inst.isPaid) {
            const status = getDueStatus(inst.dueDate).status;
            if (status === 'overdue' || status === 'today') count++;
          }
        });
      } else if (p.paymentMethod === 'boleto_a_vista' && p.status !== 'pago' && p.paymentDetails.boletoDueDate) {
        const status = getDueStatus(p.paymentDetails.boletoDueDate).status;
        if (status === 'overdue' || status === 'today') count++;
      }
    });
    return count;
  }, [sales, purchases]);

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-stone-900 flex flex-col font-sans">
      {/* Top Bar seguindo o Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewSaleClick={() => {
          setPreSelectedClient(null);
          setIsNewSaleModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        dueAlertsCount={dueAlertsCount}
        profile={profile}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            brands={brands}
            purchases={purchases}
            sales={sales}
            profile={profile}
            onNavigate={setActiveTab}
            onNewSaleClick={() => {
              setPreSelectedClient(null);
              setIsNewSaleModalOpen(true);
            }}
            onNewPurchaseClick={() => setIsNewPurchaseModalOpen(true)}
          />
        )}

        {activeTab === 'vendas' && (
          <SalesManagement
            sales={sales}
            clients={clients}
            purchases={purchases}
            profile={profile}
            onSaveSale={handleSaveSale}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
            isOpenNewModal={isNewSaleModalOpen}
            onCloseNewModal={() => {
              setIsNewSaleModalOpen(false);
              setPreSelectedClient(null);
            }}
            onOpenNewModal={() => {
              setPreSelectedClient(null);
              setIsNewSaleModalOpen(true);
            }}
            preSelectedClient={preSelectedClient}
          />
        )}

        {activeTab === 'compras' && (
          <PurchasesManagement
            purchases={purchases}
            brands={brands}
            creditCards={creditCards}
            profile={profile}
            onSavePurchase={handleSavePurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
            isOpenNewModal={isNewPurchaseModalOpen}
            onCloseNewModal={() => setIsNewPurchaseModalOpen(false)}
            onOpenNewModal={() => setIsNewPurchaseModalOpen(true)}
          />
        )}

        {activeTab === 'marcas' && (
          <BrandsManagement
            brands={brands}
            purchases={purchases}
            onSaveBrand={handleSaveBrand}
            onUpdateBrand={handleUpdateBrand}
            onDeleteBrand={handleDeleteBrand}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientsManagement
            clients={clients}
            sales={sales}
            profile={profile}
            onSaveClient={handleSaveClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onStartSaleForClient={handleStartSaleForClient}
          />
        )}

        {activeTab === 'avisos' && (
          <DueRemindersView
            sales={sales}
            purchases={purchases}
            clients={clients}
            profile={profile}
            onUpdateSale={handleUpdateSale}
            onUpdatePurchase={handleUpdatePurchase}
          />
        )}

        {activeTab === 'perfil' && (
          <ConsultantProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onClearForRealUsage={handleClearForRealUsage}
            onResetToDemo={handleResetToDemo}
            salesCount={sales.length}
            clientsCount={clients.length}
            purchasesCount={purchases.length}
          />
        )}
      </main>

      {/* Modal de Configurações, Cartões e Backup */}
      <SettingsAndCardsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        profile={profile}
        creditCards={creditCards}
        onSaveProfile={handleSaveProfile}
        onSaveCreditCard={handleSaveCreditCard}
        onDeleteCreditCard={handleDeleteCreditCard}
        onReloadAllData={loadAllData}
      />

      {/* Footer simples e elegante */}
      <footer className="border-t border-stone-200/80 py-6 px-4 text-center text-xs text-stone-500 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-900">BellaGestão</span>
            <span aria-hidden="true">·</span>
            <span>Gestão Profissional de Consultoria de Beleza</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('perfil')}
              className="text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Meu Cadastro de Consultora
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cartões & Backup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
