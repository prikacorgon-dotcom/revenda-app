import {
  Brand,
  Client,
  CreditCard,
  PurchaseOrder,
  SaleOrder,
  ConsultantProfile,
} from '../types';

// Todas as informações a serem preenchidas pelo usuário iniciam em branco
export const initialBrands: Brand[] = [];

export const initialCreditCards: CreditCard[] = [];

export const initialPurchases: PurchaseOrder[] = [];

export const initialClients: Client[] = [];

export const initialSales: SaleOrder[] = [];

export const initialConsultantProfile: ConsultantProfile = {
  isRegistered: false,
  name: '',
  businessName: '',
  documentCpfCnpj: '',
  whatsapp: '',
  email: '',
  pixKey: '',
  pixKeyType: 'CPF',
  city: '',
  state: '',
  address: '',
  resellerLevel: 'Bronze',
  registeredBrands: [],
  avatarUrl: '',
  joinedDate: '',
  notes: '',
};

// Modelos de marcas populares disponíveis para adição rápida em 1 clique se a consultora desejar
export const popularBrandPresets: Omit<Brand, 'id'>[] = [
  {
    name: 'Natura',
    requiredPoints: 50,
    currentCycle: 'Ciclo Atual',
    orderDay: 'Segunda-feira',
    averageDeliveryDays: 3,
    supervisorContact: '',
    badgeColor: {
      bg: '#FFF0EA',
      text: '#D9531E',
      border: '#F8D1C3',
    },
    notes: 'Pedido mínimo de 50 pontos para frete reduzido ou grátis.',
  },
  {
    name: 'Avon',
    requiredPoints: 60,
    currentCycle: 'Ciclo Atual',
    orderDay: 'Quarta-feira',
    averageDeliveryDays: 4,
    supervisorContact: '',
    badgeColor: {
      bg: '#FDF0F3',
      text: '#C2185B',
      border: '#F8CBD7',
    },
    notes: 'Campanhas de incentivo com brindes a partir de 80 pontos.',
  },
  {
    name: 'O Boticário',
    requiredPoints: 80,
    currentCycle: 'Ciclo Atual',
    orderDay: 'Sexta-feira',
    averageDeliveryDays: 2,
    supervisorContact: '',
    badgeColor: {
      bg: '#F1F7F4',
      text: '#2E7D32',
      border: '#C8E6C9',
    },
    notes: 'Retirada expressa na Central de Revenda sem taxa de transporte.',
  },
  {
    name: 'Mary Kay',
    requiredPoints: 100,
    currentCycle: 'Mês Atual',
    orderDay: 'Dia 25',
    averageDeliveryDays: 5,
    supervisorContact: '',
    badgeColor: {
      bg: '#FFF3F6',
      text: '#E91E63',
      border: '#FCE4EC',
    },
    notes: 'Desconto escalonado conforme pontuação do pedido.',
  },
  {
    name: 'Eudora',
    requiredPoints: 50,
    currentCycle: 'Ciclo Atual',
    orderDay: 'Terça-feira',
    averageDeliveryDays: 3,
    supervisorContact: '',
    badgeColor: {
      bg: '#FAF0F7',
      text: '#8E24AA',
      border: '#E1BEE7',
    },
    notes: 'Linha Siàge com alta rotatividade e boas margens de lucro.',
  },
];
