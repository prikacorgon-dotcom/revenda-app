import {
  Brand,
  Client,
  CreditCard,
  PurchaseOrder,
  SaleOrder,
  ConsultantProfile,
} from '../types';
import {
  initialBrands,
  initialCreditCards,
  initialPurchases,
  initialClients,
  initialSales,
  initialConsultantProfile,
} from '../data/initialData';

const STORAGE_KEYS = {
  BRANDS: 'bellagestao_brands_v2',
  CREDIT_CARDS: 'bellagestao_cards_v2',
  PURCHASES: 'bellagestao_purchases_v2',
  CLIENTS: 'bellagestao_clients_v2',
  SALES: 'bellagestao_sales_v2',
  PROFILE: 'bellagestao_profile_v2',
};

// Limpa chaves legadas se existirem
try {
  ['bellagestao_brands_v1', 'bellagestao_cards_v1', 'bellagestao_purchases_v1', 'bellagestao_clients_v1', 'bellagestao_sales_v1', 'bellagestao_profile_v1'].forEach((k) => localStorage.removeItem(k));
} catch {
  // ignora se ambiente restrito
}

export const storageService = {
  getBrands(): Brand[] {
    const data = localStorage.getItem(STORAGE_KEYS.BRANDS);
    if (!data) {
      this.saveBrands(initialBrands);
      return initialBrands;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialBrands;
    }
  },

  saveBrands(brands: Brand[]): void {
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brands));
  },

  getCreditCards(): CreditCard[] {
    const data = localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS);
    if (!data) {
      this.saveCreditCards(initialCreditCards);
      return initialCreditCards;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialCreditCards;
    }
  },

  saveCreditCards(cards: CreditCard[]): void {
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, JSON.stringify(cards));
  },

  getPurchases(): PurchaseOrder[] {
    const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!data) {
      this.savePurchases(initialPurchases);
      return initialPurchases;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialPurchases;
    }
  },

  savePurchases(purchases: PurchaseOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  },

  getClients(): Client[] {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!data) {
      this.saveClients(initialClients);
      return initialClients;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialClients;
    }
  },

  saveClients(clients: Client[]): void {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  getSales(): SaleOrder[] {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!data) {
      this.saveSales(initialSales);
      return initialSales;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialSales;
    }
  },

  saveSales(sales: SaleOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  },

  getProfile(): ConsultantProfile {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!data) {
      this.saveProfile(initialConsultantProfile);
      return initialConsultantProfile;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialConsultantProfile;
    }
  },

  saveProfile(profile: ConsultantProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  /**
   * Coleta todos os produtos já comprados e brindes em um catálogo unificado para facilitar venda
   */
  getAllStockProducts(purchases: PurchaseOrder[]) {
    const productMap = new Map<string, {
      id: string;
      productCode: string;
      name: string;
      brandName: string;
      brandId: string;
      imageUrl: string;
      unitCost: number;
      suggestedSalePrice: number;
      totalPurchasedQty: number;
      isGift: boolean;
    }>();

    purchases.forEach((po) => {
      // Itens normais
      po.items.forEach((item) => {
        const key = `${item.brandName}-${item.productCode}`.toLowerCase();
        if (productMap.has(key)) {
          const existing = productMap.get(key)!;
          existing.totalPurchasedQty += item.quantity;
          // atualiza preço de custo para o mais recente se alterado
          existing.unitCost = item.unitCost;
        } else {
          productMap.set(key, {
            id: item.id,
            productCode: item.productCode,
            name: item.name,
            brandName: item.brandName,
            brandId: item.brandId,
            imageUrl: item.imageUrl,
            unitCost: item.unitCost,
            suggestedSalePrice: item.suggestedSalePrice,
            totalPurchasedQty: item.quantity,
            isGift: false,
          });
        }
      });

      // Brindes recebidos da marca
      if (po.giftItems) {
        po.giftItems.forEach((gift) => {
          const key = `brinde-${gift.brandName}-${gift.productCode}`.toLowerCase();
          if (productMap.has(key)) {
            const existing = productMap.get(key)!;
            existing.totalPurchasedQty += gift.quantity;
          } else {
            productMap.set(key, {
              id: gift.id,
              productCode: gift.productCode,
              name: gift.name,
              brandName: gift.brandName,
              brandId: gift.brandId,
              imageUrl: gift.imageUrl,
              unitCost: 0,
              suggestedSalePrice: gift.suggestedSalePrice,
              totalPurchasedQty: gift.quantity,
              isGift: true,
            });
          }
        });
      }
    });

    return Array.from(productMap.values());
  },

  /**
   * Exporta todo o banco de dados em arquivo JSON para backup
   */
  exportAllData() {
    const data = {
      brands: this.getBrands(),
      creditCards: this.getCreditCards(),
      purchases: this.getPurchases(),
      clients: this.getClients(),
      sales: this.getSales(),
      profile: this.getProfile(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bellagestao_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Restaura dados do JSON
   */
  importData(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.brands) this.saveBrands(parsed.brands);
      if (parsed.creditCards) this.saveCreditCards(parsed.creditCards);
      if (parsed.purchases) this.savePurchases(parsed.purchases);
      if (parsed.clients) this.saveClients(parsed.clients);
      if (parsed.sales) this.saveSales(parsed.sales);
      if (parsed.profile) this.saveProfile(parsed.profile);
      return true;
    } catch (e) {
      console.error('Erro ao importar dados:', e);
      return false;
    }
  },

  resetToDemoData() {
    this.saveBrands(initialBrands);
    this.saveCreditCards(initialCreditCards);
    this.savePurchases(initialPurchases);
    this.saveClients(initialClients);
    this.saveSales(initialSales);
    this.saveProfile(initialConsultantProfile);
  },

  clearForRealUsage(customProfile?: ConsultantProfile) {
    // Mantém as marcas parceiras de referência prontas para uso real
    this.saveBrands(initialBrands);
    this.saveCreditCards([]);
    this.savePurchases([]);
    this.saveClients([]);
    this.saveSales([]);
    if (customProfile) {
      this.saveProfile(customProfile);
    }
  },
};
