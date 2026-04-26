import type { LogLevel, LogEntry } from './utils';

// 重新导出类型，供其他文件使用
export type { LogLevel, LogEntry };

export type SniperMode = 'browser' | 'api';
export type PlanType = 'lite' | 'pro' | 'max';
export type SniperStatus = 'idle' | 'countdown' | 'running' | 'success' | 'error';

export interface PlanConfig {
  type: PlanType;
  name: string;
  price: string;
  productId: string;
  badge?: string;
}

export interface SniperConfig {
  mode: SniperMode;
  plan: PlanType;
  targetTime: string; // HH:mm format
  targetDate: string; // YYYY-MM-DD format
  autoRetry: boolean;
  maxRetries: number;
  retryInterval: number; // ms
}

export const PLANS: Record<PlanType, PlanConfig> = {
  lite: {
    type: 'lite',
    name: 'Lite',
    price: '¥49/月',
    productId: 'product-005',
  },
  pro: {
    type: 'pro',
    name: 'Pro',
    price: '¥149/月',
    productId: 'product-047',
    badge: '🔥 最受欢迎',
  },
  max: {
    type: 'max',
    name: 'Max',
    price: '¥469/月',
    productId: 'product-047',
    badge: '量大管饱',
  },
};

// 产品ID映射（根据套餐类型和支付周期）
export const PRODUCT_IDS: Record<PlanType, Record<string, string>> = {
  lite: {
    monthly: 'product-lite-monthly',
    quarterly: 'product-lite-quarterly',
    yearly: 'product-lite-yearly',
  },
  pro: {
    monthly: 'product-a6ef45',   // Pro 月付
    quarterly: 'product-1df3e1', // Pro 季付
    yearly: 'product-fc5155',    // Pro 年付
  },
  max: {
    monthly: 'product-max-monthly',
    quarterly: 'product-2fc421', // Max 季付
    yearly: 'product-max-yearly',
  },
};

// 获取默认产品ID（季付）
export const getDefaultProductId = (plan: PlanType): string => {
  return PRODUCT_IDS[plan]?.quarterly || PRODUCT_IDS.pro.quarterly;
};

// 库存检查相关配置
export const STOCK_CHECK_IDS = {
  stockStatus: '1111',      // 库存状态
  proConfig: '1138',        // Pro套餐配置
  liteConfig: '1135',       // Lite套餐配置
  maxConfig: '1139',        // Max套餐配置（推测）
};

export const API_ENDPOINTS = {
  base: 'https://open.bigmodel.cn/api',
  // 产品相关
  productInfo: '/biz/tokenResPack/productIdInfo',
  isLimitBuy: '/biz/product/isLimitBuy',
  createPreOrder: '/biz/product/createPreOrder',
  // 库存检查
  stockQuery: '/biz/operation/query',
  // 支付相关
  payPreview: '/biz/pay/preview',
  batchPreview: '/biz/pay/batch-preview', // 批量预览订单
  createSign: '/biz/pay/create-sign',
  payCheck: '/biz/pay/check',
  payStatus: '/biz/pay/status',
  // 用户相关
  subscriptionList: '/biz/subscription/list',
  tokenMagnitude: '/biz/customer/getTokenMagnitude',
  customerInfo: '/biz/customer/getCustomerInfo',
};

export const AES_KEY = 'zhiPuAi123456789';
