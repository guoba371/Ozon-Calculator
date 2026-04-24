/**
 * Ozon 平台佣金数据
 *
 * 佣金规则：
 *  - rFBS（自发货）：按品类 5%~24%
 *  - FBP（合作仓）：较 rFBS 低约 1%
 *  - 售价分档（≤1500 / 1501-5000 / >5000 卢布）时佣金率略有差异
 *
 * 数据为 Ozon 官方 2024-2025 常见参考值，用户可在界面手动覆盖。
 * 官方文档：https://docs.ozon.ru/global/zh-hans/commissions/ozon-fees/commissions/
 */

// 按商品品类提供 rFBS 参考佣金率（%）
// FBP 模式在 rFBS 基础上减 1%
export const CATEGORIES = [
  { code: 'electronics', label: '数码/电子产品', rFBS: 10 },
  { code: 'appliances', label: '家用电器', rFBS: 12 },
  { code: 'home', label: '家居家装', rFBS: 15 },
  { code: 'kitchen', label: '厨房/餐具', rFBS: 15 },
  { code: 'garden', label: '园艺/户外', rFBS: 15 },
  { code: 'furniture', label: '家具', rFBS: 15 },
  { code: 'apparel', label: '服装', rFBS: 17 },
  { code: 'shoes', label: '鞋类', rFBS: 17 },
  { code: 'accessories', label: '饰品/箱包', rFBS: 18 },
  { code: 'kids', label: '母婴用品', rFBS: 15 },
  { code: 'toys', label: '玩具', rFBS: 15 },
  { code: 'sports', label: '运动户外', rFBS: 14 },
  { code: 'beauty', label: '美容美妆', rFBS: 18 },
  { code: 'health', label: '健康护理', rFBS: 15 },
  { code: 'auto', label: '汽车用品', rFBS: 12 },
  { code: 'pet', label: '宠物用品', rFBS: 14 },
  { code: 'stationery', label: '文具办公', rFBS: 14 },
  { code: 'books', label: '图书', rFBS: 5 },
  { code: 'jewelry', label: '珠宝首饰', rFBS: 21 },
  { code: 'food', label: '食品', rFBS: 15 },
  { code: 'other', label: '其他（默认）', rFBS: 15 },
];

// 销售模式
export const SALES_MODES = [
  {
    code: 'rFBS',
    label: 'rFBS 自发货',
    description: '商家自有仓库发货，全程自控，佣金 5%~24%',
    adjustment: 0, // 在品类参考率上的调整
  },
  {
    code: 'FBP',
    label: 'FBP 合作伙伴仓',
    description: '存于中国境内 Ozon 合作仓，佣金优惠 1%',
    adjustment: -1,
  },
];

// 目的地
export const DESTINATIONS = [
  { code: 'RU', label: '俄罗斯', currency: 'RUB' },
  { code: 'KZ', label: '哈萨克斯坦', currency: 'KZT' },
  { code: 'BY', label: '白俄罗斯', currency: 'BYN' },
];

// 货币
export const CURRENCIES = [
  { code: 'RUB', label: '卢布 RUB', refRate: 0.076 },
  { code: 'USD', label: '美元 USD', refRate: 7.2 },
  { code: 'EUR', label: '欧元 EUR', refRate: 7.85 },
];

/**
 * 根据品类与销售模式获取参考佣金率
 */
export function getReferenceCommissionRate(categoryCode, salesMode) {
  const category = CATEGORIES.find((c) => c.code === categoryCode) || CATEGORIES[CATEGORIES.length - 1];
  const mode = SALES_MODES.find((m) => m.code === salesMode) || SALES_MODES[0];
  return Math.max(0, category.rFBS + mode.adjustment);
}

export default {
  CATEGORIES,
  SALES_MODES,
  DESTINATIONS,
  CURRENCIES,
  getReferenceCommissionRate,
};
