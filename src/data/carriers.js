/**
 * 物流商费率数据
 *
 * 数据结构说明：
 *  - 按"货值区间 × 重量区间 × 速度档次"三维矩阵定价
 *  - productLine: ExtraSmall / Budget / Small / Big / PremiumSmall / PremiumBig
 *  - 每条 rate 的计费公式：base + perKg * chargeableWeight（元）
 *  - unavailable: true 表示该档位暂停/不可用
 *
 * 数据来源：v1.0 PRD 第 3 章「物流商报价体系」（义乌 122 仓报价）
 */

// ---------- 货值区间 & 重量区间定义 ----------

export const VALUE_BANDS = {
  LOW: { code: 'LOW', min: 0, max: 1500, label: '≤1500 卢布' },
  MID: { code: 'MID', min: 1501, max: 7000, label: '1501-7000 卢布' },
  HIGH: { code: 'HIGH', min: 7001, max: 250000, label: '7001-250000 卢布' },
};

export const PRODUCT_LINES = {
  ExtraSmall: { label: 'Extra Small 超轻小件', valueBand: 'LOW', weightMax: 0.5 },
  Budget: { label: 'Budget 低客单标准件', valueBand: 'LOW', weightMax: 30 },
  Small: { label: 'Small 轻小件', valueBand: 'MID', weightMax: 2 },
  Big: { label: 'Big 大件', valueBand: 'MID', weightMax: 30 },
  PremiumSmall: { label: 'Premium Small 高客单小件', valueBand: 'HIGH', weightMax: 5 },
  PremiumBig: { label: 'Premium Big 高客单大件', valueBand: 'HIGH', weightMax: 30 },
};

export const DEFAULT_PRODUCT_RULES = {
  ExtraSmall: { minWeightExclusive: 0, maxWeight: 0.5, minValue: 1, maxValue: 1500 },
  Budget: { minWeightExclusive: 0.5, maxWeight: 30, minValue: 1, maxValue: 1500 },
  Small: { minWeightExclusive: 0, maxWeight: 2, minValue: 1501, maxValue: 7000 },
  Big: { minWeightExclusive: 2, maxWeight: 30, minValue: 1501, maxValue: 7000 },
  PremiumSmall: {
    minWeightExclusive: 0,
    maxWeight: 5,
    minValue: 7001,
    maxValue: 250000,
  },
  PremiumBig: {
    minWeightExclusive: 5,
    maxWeight: 30,
    minValue: 7001,
    maxValue: 250000,
  },
};

// ---------- 速度档位定义 ----------

export const SPEEDS = {
  Express: { label: '特快', transitDays: '5-10 天' },
  Standard: { label: '标准', transitDays: '10-15 天' },
  Economy: { label: '经济', transitDays: '13-25 天' },
};

// ---------- OYX / XY / ABT 统一费率结构 ----------
// 三家物流商费率相同，Express 档位均暂停

const OYX_XY_ABT_RATES = {
  ExtraSmall: {
    Express: { unavailable: true },
    Standard: { base: 3.12, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 3.12, perKg: 26, transitDays: '13-18 天' },
  },
  Budget: {
    Express: { unavailable: true },
    Standard: { base: 23.92, perKg: 26, transitDays: '10-15 天' },
    Economy: { base: 23.92, perKg: 17.68, transitDays: '13-18 天' },
  },
  Small: {
    Express: { unavailable: true },
    Standard: { base: 16.64, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 16.64, perKg: 26, transitDays: '13-18 天' },
  },
  Big: {
    Express: { unavailable: true },
    Standard: { base: 37.44, perKg: 26, transitDays: '10-15 天' },
    Economy: { base: 37.44, perKg: 17.68, transitDays: '13-18 天' },
  },
  PremiumSmall: {
    Express: { unavailable: true },
    Standard: { base: 22.88, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 22.88, perKg: 26, transitDays: '13-18 天' },
  },
  PremiumBig: {
    Express: { unavailable: true },
    Standard: { base: 64, perKg: 29.12, transitDays: '10-15 天' },
    Economy: { base: 64.48, perKg: 23.92, transitDays: '13-18 天' },
  },
};

// ---------- CEL 独立费率结构（Express 档位可用） ----------

const CEL_RATES = {
  ExtraSmall: {
    Express: { base: 3.12, perKg: 46.8, transitDays: '5-10 天' },
    Standard: { base: 3.12, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 3.12, perKg: 26, transitDays: '20-25 天' },
  },
  Budget: {
    Express: { base: 23.92, perKg: 34.32, transitDays: '5-10 天' },
    Standard: { base: 23.92, perKg: 26, transitDays: '10-15 天' },
    Economy: { base: 23.92, perKg: 17.68, transitDays: '20-25 天' },
  },
  Small: {
    Express: { base: 16.64, perKg: 46.8, transitDays: '5-10 天' },
    Standard: { base: 16.64, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 16.64, perKg: 26, transitDays: '20-25 天' },
  },
  Big: {
    Express: { unavailable: true },
    Standard: { base: 37.44, perKg: 26, transitDays: '10-15 天' },
    Economy: { base: 37.44, perKg: 17.68, transitDays: '20-25 天' },
  },
  PremiumSmall: {
    Express: { base: 22.88, perKg: 46.8, transitDays: '5-10 天' },
    Standard: { base: 22.88, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 22.88, perKg: 26, transitDays: '20-25 天' },
  },
  PremiumBig: {
    Express: { unavailable: true },
    Standard: { base: 64.48, perKg: 29.12, transitDays: '10-15 天' },
    Economy: { base: 64.48, perKg: 23.92, transitDays: '20-25 天' },
  },
};

const GUOO_RATES = {
  ExtraSmall: {
    Express: { base: 3.12, perKg: 46.8, transitDays: '5-10 天' },
    Standard: { base: 3.12, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 3, perKg: 26, transitDays: '15-20 天' },
  },
  Budget: {
    Express: { unavailable: true },
    Standard: { unavailable: true },
    Economy: { base: 23.92, perKg: 17.68, transitDays: '15-20 天' },
  },
  Small: {
    Express: { base: 16.64, perKg: 46.8, transitDays: '5-10 天' },
    Standard: { base: 16.64, perKg: 36.4, transitDays: '10-15 天' },
    Economy: { base: 16.64, perKg: 26, transitDays: '15-20 天' },
  },
  Big: {
    Express: { unavailable: true },
    Standard: { unavailable: true },
    Economy: { base: 37.44, perKg: 17.68, transitDays: '15-20 天' },
  },
  PremiumSmall: {
    Express: { base: 22.88, perKg: 46.8, transitDays: '5-10 天' },
    Standard: { unavailable: true },
    Economy: { base: 22.88, perKg: 26, transitDays: '15-20 天' },
  },
  PremiumBig: {
    Express: { unavailable: true },
    Standard: { unavailable: true },
    Economy: { base: 64.48, perKg: 23.92, transitDays: '15-20 天' },
  },
};

const CIS_PRODUCT_RULES = {
  ...DEFAULT_PRODUCT_RULES,
  Budget: { minWeightExclusive: 0.5, maxWeight: 35, minValue: 1, maxValue: 1500 },
  Big: { minWeightExclusive: 2, maxWeight: 35, minValue: 1501, maxValue: 7000 },
  PremiumSmall: {
    minWeightExclusive: 0,
    maxWeight: 5,
    minValue: 7001,
    maxValue: 18000,
  },
  PremiumBig: {
    minWeightExclusive: 5,
    maxWeight: 35,
    minValue: 7001,
    maxValue: 18000,
  },
};

const CIS_RATES = {
  ExtraSmall: {
    Express: { unavailable: true },
    Standard: { base: 3.12, perKg: 36.4, transitDays: '' },
    Economy: { base: 3.12, perKg: 26, transitDays: '' },
  },
  Budget: {
    Express: { unavailable: true },
    Standard: { base: 23.92, perKg: 26, transitDays: '' },
    Economy: { base: 23.92, perKg: 17.68, transitDays: '' },
  },
  Small: {
    Express: { unavailable: true },
    Standard: { base: 16.64, perKg: 36.4, transitDays: '' },
    Economy: { base: 16.64, perKg: 26, transitDays: '' },
  },
  Big: {
    Express: { unavailable: true },
    Standard: { base: 37.44, perKg: 26, transitDays: '' },
    Economy: { base: 37.44, perKg: 17.68, transitDays: '' },
  },
  PremiumSmall: {
    Express: { unavailable: true },
    Standard: { base: 22.88, perKg: 36.4, transitDays: '' },
    Economy: { base: 22.88, perKg: 26, transitDays: '' },
  },
  PremiumBig: {
    Express: { unavailable: true },
    Standard: { base: 64.48, perKg: 29.12, transitDays: '' },
    Economy: { base: 64.48, perKg: 23.92, transitDays: '' },
  },
};

const KZ_GUOO_BY_PRODUCT_RULES = {
  ...DEFAULT_PRODUCT_RULES,
  Budget: { minWeightExclusive: 0.5, maxWeight: 35, minValue: 1, maxValue: 1500 },
  Big: { minWeightExclusive: 2, maxWeight: 35, minValue: 1501, maxValue: 7000 },
  PremiumSmall: {
    minWeightExclusive: 0,
    maxWeight: 5,
    minValue: 7001,
    maxValue: 500000,
  },
  PremiumBig: {
    minWeightExclusive: 5,
    maxWeight: 35,
    minValue: 7001,
    maxValue: 500000,
  },
};

// ---------- 物流商清单（矩阵型：CEL / OYX / XY / ABT / GUOO / OZON CIS / GUOO KZ/BY） ----------

export const MATRIX_CARRIERS = [
  {
    code: 'CEL',
    name: 'CEL',
    fullName: 'CEL 跨境',
    region: ['RU'],
    weightLimitKg: 30,
    features: ['Ozon 官方合作', '五速可选', '支持改派/退回'],
    rates: CEL_RATES,
  },
  {
    code: 'OYX',
    name: 'OYX',
    fullName: 'OYX 欧亚兴',
    region: ['RU'],
    weightLimitKg: 30,
    features: ['三速可选', '支持高货值保险赔付'],
    rates: OYX_XY_ABT_RATES,
  },
  {
    code: 'XY',
    name: 'XY',
    fullName: 'XY 兴远',
    region: ['RU'],
    weightLimitKg: 30,
    features: ['三速可选（特快/标准/经济）'],
    rates: OYX_XY_ABT_RATES,
  },
  {
    code: 'ABT',
    name: 'ABT',
    fullName: 'ABT 阿尔巴特',
    region: ['RU'],
    weightLimitKg: 30,
    features: ['三速可选', '价格结构与 OYX/XY 相同'],
    rates: OYX_XY_ABT_RATES,
  },
  {
    code: 'GUOO',
    name: 'GUOO',
    fullName: 'GUOO 俄罗斯',
    region: ['RU'],
    weightLimitKg: 30,
    features: ['Ozon 官方合作', '俄罗斯本土干线', '含真实 GUOO 时效规则'],
    rates: GUOO_RATES,
  },
  {
    code: 'CEL-CIS-KZ',
    name: 'OZON CIS',
    fullName: 'OZON CIS 独联体国家（哈萨克斯坦）',
    region: ['KZ'],
    weightLimitKg: 35,
    transitDays: { Standard: '15-20 天', Economy: '25-30 天' },
    productRules: CIS_PRODUCT_RULES,
    features: ['CEL 承运', 'Ozon CIS 官方指定', '高货值上限按表内 18000 卢布'],
    rates: CIS_RATES,
  },
  {
    code: 'CEL-CIS-BY',
    name: 'OZON CIS',
    fullName: 'OZON CIS 独联体国家（白俄罗斯）',
    region: ['BY'],
    weightLimitKg: 35,
    transitDays: { Standard: '20-25 天', Economy: '30-35 天' },
    productRules: CIS_PRODUCT_RULES,
    features: ['CEL 承运', 'Ozon CIS 官方指定', '高货值上限按表内 18000 卢布'],
    rates: CIS_RATES,
  },
  {
    code: 'GUOO-KZ',
    name: 'GUOO',
    fullName: 'GUOO 哈萨克斯坦',
    region: ['KZ'],
    weightLimitKg: 35,
    productRules: KZ_GUOO_BY_PRODUCT_RULES,
    features: ['Ozon 官方指定', '哈萨克斯坦专线', 'Premium 货值上限 500000 卢布'],
    rates: OYX_XY_ABT_RATES,
  },
  {
    code: 'GUOO-BY',
    name: 'GUOO',
    fullName: 'GUOO 白俄罗斯',
    region: ['BY'],
    weightLimitKg: 35,
    productRules: KZ_GUOO_BY_PRODUCT_RULES,
    features: ['Ozon 官方指定', '白俄专线', 'Premium 货值上限 500000 卢布'],
    rates: OYX_XY_ABT_RATES,
  },
];

// ---------- E 邮宝（线性费率，不区分货值） ----------

export const EPOSTAL_CARRIERS = [
  {
    code: 'EPB-RU',
    name: 'E邮宝',
    fullName: '中邮 E 邮宝特惠（俄罗斯）',
    region: ['RU'],
    weightLimitKg: 5,
    transitDays: '20-30 天',
    allowBattery: true,
    base: 13,
    perKg: 32,
    features: ['适合 5kg 以内敏感货', '可带电'],
  },
  {
    code: 'EPB-KZ',
    name: 'E邮宝',
    fullName: '中邮 E 邮宝特惠（哈萨克斯坦）',
    region: ['KZ'],
    weightLimitKg: 5,
    transitDays: '20-30 天',
    allowBattery: true,
    base: 1.7,
    perKg: 34,
    features: ['5kg 内敏感货'],
  },
  {
    code: 'EPB-KZ-AIR',
    name: 'E邮宝航空',
    fullName: 'E 邮宝航空（哈萨克斯坦）',
    region: ['KZ'],
    weightLimitKg: 5,
    transitDays: '15-25 天',
    allowBattery: false,
    base: 1.7,
    perKg: 46.75,
    features: ['航空时效更快'],
  },
  {
    code: 'EPB-BY',
    name: 'E邮宝',
    fullName: '白俄罗斯陆运',
    region: ['BY'],
    weightLimitKg: 5,
    transitDays: '20-30 天',
    allowBattery: true,
    base: 18,
    perKg: 35,
    features: ['白俄罗斯陆运'],
  },
];

// ---------- E 包裹（阶梯式计费：首重 500g + 续重 500g） ----------

export const EPARCEL_CARRIERS = [
  {
    code: 'EPC-RU',
    name: 'E包裹',
    fullName: '中邮 E 包裹特惠',
    region: ['RU'],
    weightLimitKg: 31,
    transitDays: '20-30 天',
    allowBattery: true,
    firstWeightGrams: 500,
    firstWeightPrice: 52.5,
    stepWeightGrams: 500,
    stepWeightPrice: 15,
    features: ['首重 500g 起', '适合中大件', '可带电'],
  },
];

export const CUSTOM_CARRIERS = [
  {
    code: 'GUOO-Y',
    name: 'GUOO-Y',
    fullName: 'GUOO YANDEX',
    region: ['RU'],
    quoteMode: 'guoo-yandex',
    currency: 'RUB',
    weightLimitKg: 30,
    features: ['Yandex 官方指定', '按卢布计费后折算人民币'],
  },
  {
    code: 'CEL-Y',
    name: 'CEL-Y',
    fullName: 'CEL-YANDEX',
    region: ['RU'],
    quoteMode: 'cel-yandex',
    currency: 'RUB',
    weightLimitKg: 30,
    features: ['Yandex 官方指定', '按销售模式区分 rFBS / FBP'],
  },
  {
    code: 'CEL-WB',
    name: 'CEL-WB',
    fullName: 'CEL-WB',
    region: ['RU'],
    quoteMode: 'cel-wb',
    weightLimitKg: 20,
    features: ['WB 渠道', '含 Wb-Express / Wb-Economy 实际费率'],
  },
];

// ---------- 全部物流商（供 UI 展示与遍历） ----------

export const ALL_CARRIERS = [
  ...MATRIX_CARRIERS,
  ...EPOSTAL_CARRIERS,
  ...EPARCEL_CARRIERS,
];

export default {
  VALUE_BANDS,
  PRODUCT_LINES,
  SPEEDS,
  MATRIX_CARRIERS,
  EPOSTAL_CARRIERS,
  EPARCEL_CARRIERS,
  ALL_CARRIERS,
};
