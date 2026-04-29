import type { LogLevel, LogEntry } from './utils';

// 重新导出类型，供其他文件使用
export type { LogLevel, LogEntry };

export type SniperMode = 'browser' | 'api';
export type PlanType = 'lite' | 'pro' | 'max';
export type PaymentCycle = 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'alipay' | 'wechat' | 'balance';
export type SniperStatus = 'idle' | 'countdown' | 'running' | 'captcha_pending' | 'success' | 'error';

export interface PlanConfig {
  type: PlanType;
  name: string;
  monthlyPrice: number; // 月价（元）
  badge?: string;
}

// 根据支付周期计算实际价格
export const calculatePrice = (plan: PlanType, cycle: PaymentCycle): number => {
  const monthlyPrice = PLAN_PRICES[plan];
  switch (cycle) {
    case 'monthly':
      return monthlyPrice;
    case 'quarterly':
      return monthlyPrice * 3 * 0.9; // 季度总价9折
    case 'yearly':
      return monthlyPrice * 12 * 0.8; // 年度总价8折
  }
};

// 格式化价格显示
export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(1)}`;
};

// 各套餐月价
export const PLAN_PRICES: Record<PlanType, number> = {
  lite: 49,
  pro: 149,
  max: 469,
};

export interface SniperConfig {
  mode: SniperMode;
  plan: PlanType;
  targetTime: string; // HH:mm format
  targetDate: string; // YYYY-MM-DD format
  autoRetry: boolean;
  maxRetries: number;
  retryInterval: number; // ms
}

// API 服务地址配置
// 生产环境通过 VITE_API_BASE_URL 环境变量配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100';

export const PLANS: Record<PlanType, PlanConfig> = {
  lite: {
    type: 'lite',
    name: 'Lite',
    monthlyPrice: 49,
  },
  pro: {
    type: 'pro',
    name: 'Pro',
    monthlyPrice: 149,
    badge: '🔥 最受欢迎',
  },
  max: {
    type: 'max',
    name: 'Max',
    monthlyPrice: 469,
    badge: '量大管饱',
  },
};

// 支付周期配置
export const PAYMENT_CYCLES: Record<PaymentCycle, { name: string; discount: string }> = {
  monthly: { name: '连续包月', discount: '' },
  quarterly: { name: '连续包季', discount: '9折' },
  yearly: { name: '连续包年', discount: '8折' },
};

// 支付方式配置
export const PAYMENT_METHODS: Record<PaymentMethod, { name: string; code: string; icon: string }> = {
  alipay: { name: '支付宝', code: 'ALI', icon: '💰' },
  wechat: { name: '微信支付', code: 'WE_CHAT', icon: '📱' },
  balance: { name: '账户余额', code: 'BALANCE', icon: '🏦' },
};

// 默认支付方式
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'alipay';

// 产品ID映射（根据套餐类型和支付周期）
// 通过登录智谱官网后从 sessionStorage 获取
// 来源: LOCAL_CODING_PACKAGE_DATA_CACHE

export const PRODUCT_IDS: Record<PlanType, Record<string, string>> = {
  lite: {
    monthly: 'product-02434c',    // Lite 月付 ¥49
    quarterly: 'product-b8ea38',  // Lite 季付 ¥132.3
    yearly: 'product-70a804',      // Lite 年付 ¥470.4
  },
  pro: {
    monthly: 'product-1df3e1',    // Pro 月付 ¥149
    quarterly: 'product-fef82f',   // Pro 季付 ¥402.3
    yearly: 'product-5643e6',     // Pro 年付 ¥1430.4
  },
  max: {
    monthly: 'product-2fc421',    // Max 月付 ¥469
    quarterly: 'product-5d3a03',  // Max 季付 ¥1266.3
    yearly: 'product-d46f8b',     // Max 年付 ¥4502.4
  },
};

// 获取产品ID
export const getProductId = (plan: PlanType, cycle: PaymentCycle): string => {
  return PRODUCT_IDS[plan]?.[cycle] || PRODUCT_IDS.pro.quarterly;
};

// 默认支付周期
export const DEFAULT_CYCLE: PaymentCycle = 'quarterly';
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