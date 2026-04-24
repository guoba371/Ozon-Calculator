/**
 * 运费计算 & 物流方案匹配
 *
 * 输入：货物信息（重量/尺寸/货值卢布/目的地）
 * 输出：每家可用物流商 × 每个可用档位的运费与时效
 */

import {
  CUSTOM_CARRIERS,
  DEFAULT_PRODUCT_RULES,
  MATRIX_CARRIERS,
  EPOSTAL_CARRIERS,
  EPARCEL_CARRIERS,
  PRODUCT_LINES,
  SPEEDS,
} from '../data/carriers.js';

/**
 * 根据重量与卢布货值选择对应的"产品线"
 * 规则来源：PRD 3.2/3.3 费率表的交叉区间
 */
export function pickProductLine(chargeableKg, valueRUB, productRules = DEFAULT_PRODUCT_RULES) {
  if (chargeableKg <= 0) return null;
  if (valueRUB <= 0) return null;

  for (const [lineCode, rules] of Object.entries(productRules || {})) {
    if (!rules) continue;
    const minWeightExclusive = Number(rules.minWeightExclusive) || 0;
    const maxWeight = Number(rules.maxWeight);
    const minValue = Number(rules.minValue) || 0;
    const maxValue = Number(rules.maxValue);

    if (
      chargeableKg > minWeightExclusive &&
      chargeableKg <= maxWeight &&
      valueRUB >= minValue &&
      valueRUB <= maxValue
    ) {
      return lineCode;
    }
  }
  return null;
}

/**
 * 计算矩阵型物流商（CEL/OYX/XY/ABT/GUOO 等）的运费
 * 单行费率公式：base + perKg × 计费重
 */
export function calcMatrixCarrierQuotes(carrier, chargeableKg, valueRUB, destination) {
  const quotes = [];
  if (!carrier.region.includes(destination)) return quotes;
  if (chargeableKg > carrier.weightLimitKg) return quotes;

  const lineCode = pickProductLine(chargeableKg, valueRUB, carrier.productRules);
  if (!lineCode) return quotes;
  const rates = carrier.rates?.[lineCode];
  if (!rates) return quotes;

  for (const [speedCode, rate] of Object.entries(rates)) {
    if (!rate || rate.unavailable) continue;
    const shippingCost = rate.base + rate.perKg * chargeableKg;
    const defaultDays = carrier.transitDays?.[speedCode] || SPEEDS[speedCode]?.transitDays || '';
    quotes.push({
      carrierCode: carrier.code,
      carrierName: carrier.name,
      carrierFullName: carrier.fullName,
      productLine: lineCode,
      productLineLabel: PRODUCT_LINES[lineCode].label,
      speed: speedCode,
      speedLabel: SPEEDS[speedCode]?.label || speedCode,
      transitDays: rate.transitDays || defaultDays,
      shippingCost: round2(shippingCost),
      formula: `${rate.base} + ${rate.perKg} × ${chargeableKg.toFixed(2)}kg`,
      estimated: !!carrier.estimated,
      features: carrier.features,
    });
  }
  return quotes;
}

/**
 * E 邮宝线性费率
 */
export function calcEpostalQuotes(carrier, chargeableKg, destination) {
  if (carrier.unavailable) return [];
  if (!carrier.region.includes(destination)) return [];
  if (chargeableKg <= 0 || chargeableKg > carrier.weightLimitKg) return [];
  const cost = carrier.base + carrier.perKg * chargeableKg;
  return [
    {
      carrierCode: carrier.code,
      carrierName: carrier.name,
      carrierFullName: carrier.fullName,
      productLine: 'Linear',
      productLineLabel: '线性费率',
      speed: 'Standard',
      speedLabel: '标准',
      transitDays: carrier.transitDays,
      shippingCost: round2(cost),
      formula: `${carrier.base}/票 + ${carrier.perKg}/kg × ${chargeableKg.toFixed(2)}kg`,
      features: carrier.features,
    },
  ];
}

/**
 * E 包裹阶梯费率：首重 + 续重（按整 500g 向上取整）
 */
export function calcEparcelQuotes(carrier, chargeableKg, destination) {
  if (carrier.unavailable) return [];
  if (!carrier.region.includes(destination)) return [];
  if (chargeableKg <= 0 || chargeableKg > carrier.weightLimitKg) return [];
  const grams = chargeableKg * 1000;
  const firstG = carrier.firstWeightGrams;
  const stepG = carrier.stepWeightGrams;

  let cost;
  if (grams <= firstG) {
    cost = carrier.firstWeightPrice;
  } else {
    const extra = grams - firstG;
    const steps = Math.ceil(extra / stepG);
    cost = carrier.firstWeightPrice + steps * carrier.stepWeightPrice;
  }
  return [
    {
      carrierCode: carrier.code,
      carrierName: carrier.name,
      carrierFullName: carrier.fullName,
      productLine: 'Step',
      productLineLabel: '阶梯计费',
      speed: 'Standard',
      speedLabel: '标准',
      transitDays: carrier.transitDays,
      shippingCost: round2(cost),
      formula: `首重 ${firstG}g=${carrier.firstWeightPrice}元 + 续重 ${carrier.stepWeightPrice}元/${stepG}g`,
      features: carrier.features,
    },
  ];
}

export function calcCustomCarrierQuotes(
  carrier,
  { chargeableKg, valueRUB, destination, salesMode = 'rFBS', rubToCnyRate = 0.076 }
) {
  if (carrier.unavailable) return [];
  if (!carrier.region.includes(destination)) return [];
  if (chargeableKg <= 0 || chargeableKg > carrier.weightLimitKg) return [];

  switch (carrier.quoteMode) {
    case 'cel-wb':
      return calcCelWbQuotes(carrier, chargeableKg);
    case 'guoo-yandex':
      return calcGuooYandexQuotes(carrier, chargeableKg, valueRUB, rubToCnyRate);
    case 'cel-yandex':
      return calcCelYandexQuotes(carrier, chargeableKg, salesMode, rubToCnyRate);
    default:
      return [];
  }
}

/**
 * 汇总所有物流方案（已过滤不可用）
 */
export function buildCarrierCatalog(rateOverrides = {}) {
  return {
    matrixCarriers: MATRIX_CARRIERS.map((carrier) =>
      mergeMatrixCarrier(carrier, rateOverrides.matrix?.[carrier.code])
    ),
    epostalCarriers: EPOSTAL_CARRIERS.map((carrier) =>
      mergeSimpleCarrier(carrier, rateOverrides.epostal?.[carrier.code])
    ),
    eparcelCarriers: EPARCEL_CARRIERS.map((carrier) =>
      mergeSimpleCarrier(carrier, rateOverrides.eparcel?.[carrier.code])
    ),
    customCarriers: CUSTOM_CARRIERS.map((carrier) =>
      mergeSimpleCarrier(carrier, rateOverrides.custom?.[carrier.code])
    ),
  };
}

export function listAllQuotes({
  chargeableKg,
  valueRUB,
  destination,
  salesMode = 'rFBS',
  rubToCnyRate = 0.076,
  rateOverrides = {},
}) {
  const quotes = [];
  const catalog = buildCarrierCatalog(rateOverrides);
  for (const c of catalog.matrixCarriers) {
    quotes.push(...calcMatrixCarrierQuotes(c, chargeableKg, valueRUB, destination));
  }
  for (const c of catalog.epostalCarriers) {
    quotes.push(...calcEpostalQuotes(c, chargeableKg, destination));
  }
  for (const c of catalog.eparcelCarriers) {
    quotes.push(...calcEparcelQuotes(c, chargeableKg, destination));
  }
  for (const c of catalog.customCarriers) {
    quotes.push(
      ...calcCustomCarrierQuotes(c, {
        chargeableKg,
        valueRUB,
        destination,
        salesMode,
        rubToCnyRate,
      })
    );
  }
  return quotes;
}

function mergeMatrixCarrier(carrier, override = {}) {
  const mergedRates = {};
  const overrideRates = override.rates || {};

  for (const [lineCode, speeds] of Object.entries(carrier.rates || {})) {
    mergedRates[lineCode] = {};
    for (const [speedCode, rate] of Object.entries(speeds || {})) {
      mergedRates[lineCode][speedCode] = {
        ...rate,
        ...(overrideRates[lineCode]?.[speedCode] || {}),
      };
    }
  }

  return {
    ...carrier,
    ...omitRates(override),
    rates: mergedRates,
  };
}

function mergeSimpleCarrier(carrier, override = {}) {
  return {
    ...carrier,
    ...override,
  };
}

function omitRates(override = {}) {
  const { rates, ...rest } = override;
  return rest;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calcCelWbQuotes(carrier, chargeableKg) {
  const quotes = [];
  quotes.push({
    carrierCode: carrier.code,
    carrierName: carrier.name,
    carrierFullName: carrier.fullName,
    productLine: 'WB',
    productLineLabel: 'WB 渠道',
    speed: 'Express',
    speedLabel: 'Wb-Express',
    transitDays: '10 天',
    shippingCost: round2(9 + 48 * chargeableKg),
    formula: `9/票 + 48/kg × ${chargeableKg.toFixed(2)}kg`,
    features: carrier.features,
  });

  const economyBase = chargeableKg < 0.3 ? 2 : 8;
  const economyPerKg = chargeableKg < 0.3 ? 58 : 43;
  quotes.push({
    carrierCode: carrier.code,
    carrierName: carrier.name,
    carrierFullName: carrier.fullName,
    productLine: 'WB',
    productLineLabel: 'WB 渠道',
    speed: 'Economy',
    speedLabel: 'Wb-Economy',
    transitDays: '20 天',
    shippingCost: round2(economyBase + economyPerKg * chargeableKg),
    formula: `${economyBase}/票 + ${economyPerKg}/kg × ${chargeableKg.toFixed(2)}kg`,
    features: carrier.features,
  });

  return quotes;
}

function calcGuooYandexQuotes(carrier, chargeableKg, valueRUB, rubToCnyRate) {
  const useExtraSmall = chargeableKg <= 0.5 && valueRUB > 0 && valueRUB <= 1500;
  const useStandard = chargeableKg <= 30 && valueRUB >= 1501 && valueRUB <= 500000;
  if (!useExtraSmall && !useStandard) return [];

  const plans = useExtraSmall
    ? [
        {
          speed: 'SuperExpressExtraSmall',
          speedLabel: 'GTA-SUPER EXPRESS Extra Small',
          transitDays: '空运',
          base: 99,
          perKg: 525,
          productLine: 'ExtraSmall',
        },
        {
          speed: 'ExpressExtraSmall',
          speedLabel: 'GTA-EXPRESS Extra Small',
          transitDays: '陆空联运',
          base: 81,
          perKg: 428,
          productLine: 'ExtraSmall',
        },
        {
          speed: 'SuperEconomyExtraSmall',
          speedLabel: 'GTA-SUPER ECONOMY Extra Small',
          transitDays: '陆运',
          base: 99,
          perKg: 178,
          productLine: 'ExtraSmall',
        },
      ]
    : [
        {
          speed: 'SuperExpress',
          speedLabel: 'GTA-SUPER EXPRESS',
          transitDays: '空运',
          base: 196,
          perKg: 1058,
          productLine: 'Standard',
        },
        {
          speed: 'Express',
          speedLabel: 'GTA-EXPRESS',
          transitDays: '陆空联运',
          base: 183,
          perKg: 697,
          productLine: 'Standard',
        },
        {
          speed: 'SuperEconomy',
          speedLabel: 'GTA-SUPER ECONOMY',
          transitDays: '陆运',
          base: 196,
          perKg: 415,
          productLine: 'Standard',
        },
      ];

  return plans.map((plan) =>
    buildRubQuote(carrier, {
      productLine: plan.productLine,
      productLineLabel: useExtraSmall ? 'Yandex Extra Small' : 'Yandex 标准件',
      speed: plan.speed,
      speedLabel: plan.speedLabel,
      transitDays: plan.transitDays,
      chargeableKg,
      rubBase: plan.base,
      rubPerKg: plan.perKg,
      rubToCnyRate,
    })
  );
}

function calcCelYandexQuotes(carrier, chargeableKg, salesMode, rubToCnyRate) {
  const isExtraSmall = chargeableKg <= 0.5;
  const isFbp = salesMode === 'FBP';
  const plans = isFbp
    ? isExtraSmall
      ? [
          {
            speed: 'FbpExpressExtraSmall',
            speedLabel: 'Fbp-Express Extra Small',
            transitDays: '5-10 天',
            base: 76,
            perKg: 538,
          },
        ]
      : [
          {
            speed: 'FbpExpress',
            speedLabel: 'Fbp-Express',
            transitDays: '5-10 天',
            base: 158,
            perKg: 703,
          },
        ]
    : isExtraSmall
      ? [
          {
            speed: 'ExpressExtraSmall',
            speedLabel: 'Express Extra Small',
            transitDays: '10-15 天',
            base: 78,
            perKg: 550,
          },
          {
            speed: 'EconomyExtraSmall',
            speedLabel: 'Economy Extra Small',
            transitDays: '19-24 天',
            base: 78,
            perKg: 287,
          },
        ]
      : [
          {
            speed: 'Express',
            speedLabel: 'Express',
            transitDays: '10-15 天',
            base: 161,
            perKg: 715,
          },
          {
            speed: 'Economy',
            speedLabel: 'Economy',
            transitDays: '19-24 天',
            base: 161,
            perKg: 465,
          },
        ];

  return plans.map((plan) =>
    buildRubQuote(carrier, {
      productLine: isExtraSmall ? 'ExtraSmall' : 'Standard',
      productLineLabel: isExtraSmall ? 'CEL Yandex Extra Small' : 'CEL Yandex 标准件',
      speed: plan.speed,
      speedLabel: plan.speedLabel,
      transitDays: plan.transitDays,
      chargeableKg,
      rubBase: plan.base,
      rubPerKg: plan.perKg,
      rubToCnyRate,
    })
  );
}

function buildRubQuote(
  carrier,
  {
    productLine,
    productLineLabel,
    speed,
    speedLabel,
    transitDays,
    chargeableKg,
    rubBase,
    rubPerKg,
    rubToCnyRate,
  }
) {
  const shippingCostRub = rubBase + rubPerKg * chargeableKg;
  return {
    carrierCode: carrier.code,
    carrierName: carrier.name,
    carrierFullName: carrier.fullName,
    productLine,
    productLineLabel,
    speed,
    speedLabel,
    transitDays,
    shippingCurrency: 'RUB',
    shippingCostOriginal: round2(shippingCostRub),
    shippingCost: round2(shippingCostRub * rubToCnyRate),
    formula: `(${rubBase} RUB/票 + ${rubPerKg} RUB/kg × ${chargeableKg.toFixed(2)}kg) × ${rubToCnyRate}`,
    features: carrier.features,
  };
}
