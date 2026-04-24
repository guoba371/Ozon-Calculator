/**
 * 利润计算核心
 *
 * 公式（PRD 2.4）：
 *   售价（元）  = 外币售价 × 汇率 × (1 - 运费分摊率)
 *   利润（元）  = 售价 − 货本 − 物流费 − 佣金 − 广告费 − 操作费
 *   利润率     = 利润 ÷ 售价 × 100%
 *
 * 注意：当前版本「运费分摊率」默认为 0，由用户按需手动配置。
 */

import { analyzeCargo } from './weight.js';
import { CURRENCIES } from '../data/commissions.js';
import { listAllQuotes } from './shipping.js';

/**
 * 构造一次性的计算上下文
 * input 字段见 src/composables/useForm.js
 */
export function calcAll(input, options = {}) {
  const cargo = analyzeCargo(
    input.length,
    input.width,
    input.height,
    input.weight
  );

  // 售价（人民币）
  const freightShareRate = Number(input.freightShareRate) || 0;
  const rawSellingCNY =
    (Number(input.sellingPriceFX) || 0) * (Number(input.exchangeRate) || 0);
  const sellingCNY = rawSellingCNY * (1 - freightShareRate);

  // 佣金：支持百分比或固定金额，用户二选一
  let commissionCNY;
  if (input.commissionMode === 'amount') {
    commissionCNY = Number(input.commissionAmount) || 0;
  } else {
    const rate = Number(input.commissionRate) || 0;
    commissionCNY = (sellingCNY * rate) / 100;
  }

  const fixed = {
    cost: Number(input.cost) || 0,
    commission: round2(commissionCNY),
    advertising: Number(input.advertisingFee) || 0,
    operation: Number(input.operationFee) || 0,
  };

  // 枚举全部物流方案
  const quotes = listAllQuotes({
    chargeableKg: cargo.chargeableWeight,
    valueRUB: Number(input.goodsValueRUB) || 0,
    destination: input.destination || 'RU',
    salesMode: input.salesMode || 'rFBS',
    rubToCnyRate: getRubToCnyRate(input),
    rateOverrides: options.rateOverrides || {},
  });

  const plans = quotes.map((q) => {
    const totalCost =
      fixed.cost +
      q.shippingCost +
      fixed.commission +
      fixed.advertising +
      fixed.operation;
    const profit = sellingCNY - totalCost;
    const profitRate = sellingCNY > 0 ? (profit / sellingCNY) * 100 : 0;
    return {
      ...q,
      breakdown: {
        cost: fixed.cost,
        shipping: q.shippingCost,
        commission: fixed.commission,
        advertising: fixed.advertising,
        operation: fixed.operation,
      },
      totalCost: round2(totalCost),
      profit: round2(profit),
      profitRate: round2(profitRate),
      warnings: generateWarnings(q, input),
    };
  });

  // 排序 & 贴标签
  plans.sort((a, b) => a.shippingCost - b.shippingCost);
  tagPlans(plans);

  return {
    cargo,
    sellingCNY: round2(sellingCNY),
    rawSellingCNY: round2(rawSellingCNY),
    fixed,
    plans,
  };
}

/**
 * 给排名最优的方案贴标签
 */
function tagPlans(plans) {
  if (!plans.length) return;
  plans[0].labels = ['lowest-cost']; // 绿：最低运费
  // 最快时效：取 transitDays 字符串中的"起"值
  const byFastest = [...plans].sort(
    (a, b) => firstDay(a.transitDays) - firstDay(b.transitDays)
  );
  const fastest = byFastest[0];
  fastest.labels = fastest.labels
    ? [...fastest.labels, 'fastest']
    : ['fastest'];
  // 性价比：利润率最高
  const byProfit = [...plans].sort((a, b) => b.profitRate - a.profitRate);
  const best = byProfit[0];
  best.labels = best.labels ? [...best.labels, 'best-value'] : ['best-value'];
}

function firstDay(transitDays) {
  const m = (transitDays || '').match(/(\d+)/);
  return m ? Number(m[1]) : 999;
}

function generateWarnings(quote, input) {
  const warnings = [];
  if (quote.estimated) {
    warnings.push({
      level: 'info',
      message: '该渠道报价暂按 CEL 费率估算，以官方报价为准',
    });
  }
  if (quote.shippingCurrency === 'RUB' && input.currency !== 'RUB') {
    warnings.push({
      level: 'info',
      message: '该渠道先按卢布计费，再按默认卢布汇率折算为人民币',
    });
  }
  // 货值超过 25 万卢布（Premium 上限）
  if (Number(input.goodsValueRUB) > 250000) {
    warnings.push({
      level: 'warn',
      message: '货值超过 25 万卢布，请确认是否在物流商赔付上限内',
    });
  }
  return warnings;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function getRubToCnyRate(input) {
  if (input.currency === 'RUB') {
    return Number(input.exchangeRate) || 0.076;
  }
  return CURRENCIES.find((c) => c.code === 'RUB')?.refRate || 0.076;
}
