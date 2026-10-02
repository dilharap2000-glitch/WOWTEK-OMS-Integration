import { 
  ProductItem, 
  BarcodeLabel, 
  Order, 
  Supplier, 
  WarrantyClaim, 
  Expense, 
  SMSConfig 
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'wowtek_products',
  BARCODES: 'wowtek_barcodes',
  ORDERS: 'wowtek_orders',
  SUPPLIERS: 'wowtek_suppliers',
  WARRANTIES: 'wowtek_warranties',
  EXPENSES: 'wowtek_expenses',
  SMS_CONFIG: 'wowtek_sms_config',
};

export const loadStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error loading ${key} from localStorage`, err);
    return defaultValue;
  }
};

export const saveStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
};

export const initialSMSConfig: SMSConfig = {
  provider: 'SMSlenz',
  senderId: 'WOWTEK',
  apiKey: '',
  userId: '',
  endpointUrl: 'https://api.smslenz.lk/v1/send',
  httpMethod: 'POST',
  enabled: false,
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount).replace('LKR', 'Rs.');
};

export const generateId = (prefix: string = 'wt'): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};
