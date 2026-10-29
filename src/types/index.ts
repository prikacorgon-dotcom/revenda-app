export type Brand = {
  id: string;
  name: string; // ex: Natura, Avon, O Boticário, Mary Kay, Eudora
  requiredPoints: number; // quanto de pontos precisa para realizar o pedido
  currentCycle: string; // ex: Ciclo 05/2026
  orderDay?: string; // dia de fechamento do pedido
  averageDeliveryDays: number; // prazo de entrega em dias
  supervisorContact?: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  notes?: string;
};

export type CreditCard = {
  id: string;
  cardNickname: string; // ex: Nubank Consultoria, Itaú Black
  lastFourDigits: string; // ex: 4829
  creditLimit: number;
  availableLimit?: number;
  closingDay: number; // dia de fechamento da fatura
  dueDay: number; // dia de vencimento da fatura
};

export type PurchaseItem = {
  id: string;
  brandId: string;
  brandName: string;
  productCode: string; // código do produto na revista
  name: string;
  imageUrl: string;
  quantity: number;
  unitCost: number;
  suggestedSalePrice: number;
  points: number; // pontos do produto no pedido
  isGift?: boolean; // produto brinde dado pela marca (custo zero!)
};

export type PurchaseInstallment = {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  isPaid: boolean;
  paidDate?: string;
};

export type PurchaseOrder = {
  id: string;
  brandId: string;
  brandName: string;
  cycle: string;
  purchaseDate: string; // YYYY-MM-DD
  channel: 'site' | 'loja_fisica' | 'loja_online';
  travelExpense: number; // passagem se loja física
  shippingExpense: number; // frete se loja online ou site
  items: PurchaseItem[];
  giftItems: PurchaseItem[]; // produtos brindes da marca
  itemsSubtotal: number;
  interestAmount: number; // juros caso haja
  differenceAmount: number; // cálculo da diferença caso haja no boleto
  totalAmount: number; // total com frete, passagem, juros e diferença
  totalPoints: number;
  paymentMethod: 'boleto_a_vista' | 'boleto_parcelado' | 'pix_a_vista' | 'cartao_credito';
  paymentDetails: {
    boletoDueDate?: string;
    boletoAmount?: number;
    differenceAmount?: number;
    // boleto parcelado
    installmentsCount?: number;
    installmentAmount?: number;
    firstDueDate?: string;
    intervalDays?: number;
    installments?: PurchaseInstallment[];
    // pix a vista
    pixPaymentDate?: string;
    pixAmount?: number;
    // cartao de credito
    cardId?: string;
    cardNumber?: string;
    cardNickname?: string;
    cardLimit?: number;
    cardDueDate?: string;
    cardInstallmentsCount?: number;
    cardInstallmentAmount?: number;
  };
  status: 'pendente' | 'parcialmente_pago' | 'pago';
  notes?: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  whatsapp: string; // formato brasileiro ex: 11987654321
  address: string;
  howWeMet: string; // Local que conheço: vizinha, trabalho, academia, igreja, indicação
  createdAt: string;
  notes?: string;
};

export type SaleItem = {
  id: string;
  productId: string; // id do produto no estoque de compras
  productCode: string;
  name: string;
  brandName: string;
  imageUrl?: string;
  quantity: number;
  unitCost: number; // custo unitário original
  salePrice: number; // valor de venda aplicado
  unitProfit: number; // ganho unitário = salePrice - unitCost
  totalProfit: number; // unitProfit * quantity
  isFromGift: boolean; // se era brinde, custo = 0, lucro = 100%
};

export type SaleInstallment = {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  isPaid: boolean;
  paidDate?: string;
};

export type SaleOrder = {
  id: string;
  clientId: string;
  clientName: string;
  clientWhatsapp: string;
  clientEmail: string;
  saleDate: string; // YYYY-MM-DD
  items: SaleItem[];
  subtotal: number;
  discountAmount: number; // desconto concedido
  totalAmount: number; // subtotal - desconto
  totalCost: number; // soma dos custos
  totalProfit: number; // totalAmount - totalCost
  paymentMethod: 'dinheiro_a_vista' | 'pix_a_vista' | 'cartao_debito' | 'cartao_credito' | 'carne_parcelado';
  installmentsCount: number;
  installmentAmount: number;
  firstDueDate: string;
  intervalDays: number; // ex: 15, 30 dias
  installments: SaleInstallment[];
  status: 'pendente' | 'parcialmente_pago' | 'pago' | 'atrasado';
  notes?: string;
};

export type ConsultantProfile = {
  isRegistered: boolean;
  name: string;
  businessName: string;
  documentCpfCnpj: string;
  whatsapp: string;
  email: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória';
  city: string;
  state: string;
  address: string;
  resellerLevel: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';
  registeredBrands: string[];
  avatarUrl?: string;
  joinedDate?: string;
  notes?: string;
};
