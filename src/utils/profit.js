/**
 * 利润计算核心
 *
 * 当前口径：
 *   成本（元）   = 货本 + 操作费 + 物流费
 *   销售额（元） = 外币售价 × 汇率
 *   利润（元）   = 销售额 − 佣金 − 成本
 *   利润率      = 利润 ÷ 成本 × 100%
 *
 * 反推售价：
 *   按比例佣金：售价 = (成本 + 目标利润) ÷ 汇率 ÷ (1 - 佣金率)
 *   固定佣金：售价 = (成本 + 目标利润 + 固定佣金) ÷ 汇率
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

  // 销售额（人民币）
  const sellingCNY =
    (Number(input.sellingPriceFX) || 0) * (Number(input.exchangeRate) || 0);

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
      fixed.operation;
    const profit = sellingCNY - fixed.commission - totalCost;
    const profitRate = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const targetPricing = calcTargetPricing({
      shippingCost: q.shippingCost,
      input,
      fixed,
    });
    return {
      ...q,
      breakdown: {
        cost: fixed.cost,
        shipping: q.shippingCost,
        commission: fixed.commission,
        operation: fixed.operation,
      },
      totalCost: round2(totalCost),
      profit: round2(profit),
      profitRate: round2(profitRate),
      targetPricing,
      warnings: generateWarnings(q, input),
    };
  });

  // 排序 & 贴标签
  plans.sort((a, b) => a.shippingCost - b.shippingCost);
  tagPlans(plans);

  return {
    cargo,
    sellingCNY: round2(sellingCNY),
    fixed,
    plans,
  };
}

export function calcAutoGoodsValueRUB(input) {
  const cost = Number(input?.cost) || 0;
  const rubToCnyRate = getRubToCnyRate(input || {});
  if (cost <= 0 || rubToCnyRate <= 0) {
    return null;
  }
  return round2(cost / rubToCnyRate);
}

export function applyTargetPricingToInput(input, plan) {
  const targetPricing = plan?.targetPricing;
  if (!targetPricing || targetPricing.feasible === false) {
    return false;
  }

  const nextPrice = round2(Number(targetPricing.requiredSellingFX) || 0);
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
    return false;
  }

  if (Math.abs((Number(input.sellingPriceFX) || 0) - nextPrice) < 0.01) {
    return false;
  }

  input.sellingPriceFX = nextPrice;
  return true;
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

function calcTargetPricing({ shippingCost, input, fixed }) {
  const targetRateRaw = input.targetProfitRate;
  if (targetRateRaw === null || targetRateRaw === undefined || targetRateRaw === '') {
    return null;
  }

  const targetRate = (Number(targetRateRaw) || 0) / 100;
  const exchangeRate = Number(input.exchangeRate) || 0;
  const fixedBase =
    (fixed.cost || 0) +
    (shippingCost || 0) +
    (fixed.operation || 0);
  const targetProfit = fixedBase * targetRate;

  if (exchangeRate <= 0) {
    return { feasible: false, reason: '汇率需大于 0' };
  }

  let requiredSellingCNY = 0;
  let requiredCommission = 0;

  if (input.commissionMode === 'amount') {
    requiredCommission = Number(input.commissionAmount) || 0;
    requiredSellingCNY = fixedBase + targetProfit + requiredCommission;
  } else {
    const commissionRate = (Number(input.commissionRate) || 0) / 100;
    const denominator = 1 - commissionRate;
    if (denominator <= 0) {
      return { feasible: false, reason: '佣金率需小于 100%' };
    }
    requiredSellingCNY = (fixedBase + targetProfit) / denominator;
    requiredCommission = requiredSellingCNY * commissionRate;
  }

  const requiredSellingFX = requiredSellingCNY / exchangeRate;

  return {
    feasible: Number.isFinite(requiredSellingFX) && Number.isFinite(requiredSellingCNY),
    targetProfitRate: round2(targetRate * 100),
    requiredSellingCNY: round2(requiredSellingCNY),
    targetProfit: round2(targetProfit),
    requiredSellingFX: round2(requiredSellingFX),
    requiredCommission: round2(requiredCommission),
  };
}
