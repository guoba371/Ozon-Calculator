// 核心计算逻辑冒烟测试
// 运行：node tests/smoke.mjs
import { calcAll } from '../src/utils/profit.js';
import { nextTick } from 'vue';
import { useCalculator } from '../src/composables/useCalculator.js';

function assert(cond, msg) {
  if (!cond) {
    console.error('✗ FAIL:', msg);
    process.exit(1);
  }
  console.log('✓', msg);
}

// 测试 1：PRD 第 7 章示例（三合一儿童滑梯）
const sample = {
  productName: '三合一儿童滑梯',
  cost: 62,
  weight: 4.0,
  length: 50,
  width: 30,
  height: 20,
  sellingPriceFX: 3000,
  currency: 'RUB',
  exchangeRate: 0.076,
  salesMode: 'rFBS',
  category: 'kids',
  commissionMode: 'rate',
  commissionRate: 15,
  commissionAmount: null,
  advertisingFee: 0,
  operationFee: 12,
  freightShareRate: 0,
  goodsValueRUB: 3000,
  destination: 'RU',
};

async function main() {
  const r = calcAll(sample);

  // 体积重 = 50*30*20/6000 = 5 kg
  assert(Math.abs(r.cargo.volumeWeight - 5) < 0.001, '体积重 = 5kg');
  assert(r.cargo.chargeableWeight === 5, '计费重取 5kg（max 4 vs 5）');
  assert(r.cargo.type === 'light', '货型 = 抛货（体积重 > 实重）');
  assert(r.cargo.band?.code === 'Standard', '重量区间 = 标准件（2~5kg）');

  // 售价 = 3000 * 0.076 = 228 元
  assert(Math.abs(r.sellingCNY - 228) < 0.01, `售价 ¥${r.sellingCNY} ≈ 228`);

  // 应有多个物流方案
  assert(r.plans.length > 0, `生成 ${r.plans.length} 个物流方案`);

  // 货值 3000 卢布 + 5kg → Premium Small 不成立（>7000）；应为 Big（1501-7000, 2-30kg）
  const celPlan = r.plans.find((p) => p.carrierCode === 'CEL' && p.speed === 'Standard');
  assert(celPlan, 'CEL Standard 档位存在');
  assert(celPlan.productLine === 'Big', `CEL 方案产品线 = Big，实际 ${celPlan.productLine}`);
  // CEL Big Standard: 37.44 + 26/kg * 5 = 167.44
  assert(
    Math.abs(celPlan.shippingCost - 167.44) < 0.01,
    `CEL Big Standard 运费 = ¥167.44，实际 ${celPlan.shippingCost}`
  );

  // 应有标签
  const hasLowest = r.plans.some((p) => p.labels?.includes('lowest-cost'));
  assert(hasLowest, '有"最低运费"标签');

  // 测试 2：E 包裹阶梯计费 3kg = 52.5 + 5段 × 15 = 127.5
  const sample2 = { ...sample, weight: 3, length: 10, width: 10, height: 10 };
  const r2 = calcAll(sample2);
  const epc = r2.plans.find((p) => p.carrierCode === 'EPC-RU');
  if (epc) {
    assert(Math.abs(epc.shippingCost - 127.5) < 0.01, `E 包裹 3kg = 127.5 元，实际 ${epc.shippingCost}`);
  }

  // 测试 3：Extra Small 场景（500g 以内 + 低货值）
  const sample3 = {
    ...sample,
    weight: 0.3,
    length: 10,
    width: 10,
    height: 10, // 体积重 = 0.167 kg
    goodsValueRUB: 1000,
  };
  const r3 = calcAll(sample3);
  assert(r3.cargo.chargeableWeight === 0.3, '计费重 = 0.3kg（实重更大）');
  assert(r3.cargo.band?.code === 'ExtraSmall', '重量区间 = 超轻小件');
  const cel3 = r3.plans.find((p) => p.carrierCode === 'CEL' && p.speed === 'Economy');
  // CEL Extra Small Economy: 3.12 + 26 * 0.3 = 10.92
  assert(
    cel3 && Math.abs(cel3.shippingCost - 10.92) < 0.01,
    `CEL Extra Small Economy = 10.92，实际 ${cel3?.shippingCost}`
  );

  // 测试 4：FBP 模式佣金比 rFBS 低 1%
  const sample4 = { ...sample, salesMode: 'FBP', commissionRate: 14 };
  const r4 = calcAll(sample4);
  assert(r4.fixed.commission < r.fixed.commission, 'FBP 佣金 < rFBS 佣金');

  // 测试 5：货值为空时不应误入低货值矩阵渠道
  const r5 = calcAll({ ...sample, goodsValueRUB: null });
  const matrixPlan = r5.plans.find((p) => p.carrierCode === 'CEL');
  assert(!matrixPlan, '货值为空时不生成矩阵渠道报价');

  // 测试 6：费率覆盖应生效
  const r6 = calcAll(sample, {
    rateOverrides: {
      matrix: {
        CEL: {
          rates: {
            Big: {
              Standard: { base: 100, perKg: 1 },
            },
          },
        },
      },
    },
  });
  const celOverride = r6.plans.find(
    (p) => p.carrierCode === 'CEL' && p.speed === 'Standard'
  );
  assert(
    celOverride && Math.abs(celOverride.shippingCost - 105) < 0.01,
    `CEL 覆盖费率生效，实际 ${celOverride?.shippingCost}`
  );

  // 测试 7：RUB 货值应持续自动同步，手动锁定后不再覆盖
  const calc = useCalculator();
  calc.form.sellingPriceFX = 1000;
  await nextTick();
  assert(calc.form.goodsValueRUB === 1000, 'RUB 货值首次随售价同步');

  calc.form.sellingPriceFX = 1200;
  await nextTick();
  assert(calc.form.goodsValueRUB === 1200, 'RUB 货值随售价持续同步');

  calc.form.goodsValueRUB = 1500;
  calc.form.goodsValueCustomized = true;
  calc.form.sellingPriceFX = 1800;
  await nextTick();
  assert(calc.form.goodsValueRUB === 1500, '手动锁定后货值不再被自动覆盖');

  // 测试 8：手动佣金率不应被品类/模式切换覆盖
  calc.form.commissionMode = 'rate';
  calc.form.commissionRate = 23;
  calc.form.commissionRateCustomized = true;
  calc.form.category = 'electronics';
  calc.form.salesMode = 'FBP';
  await nextTick();
  assert(calc.form.commissionRate === 23, '手动佣金率在切换品类/模式后保持不变');

  // 测试 9：GUOO 俄罗斯应使用表内真实费率，而不是 CEL 占位
  const guooRu = r.plans.find((p) => p.carrierCode === 'GUOO' && p.speed === 'Economy');
  assert(guooRu, 'GUOO Economy 档位存在');
  assert(Math.abs(guooRu.shippingCost - 125.84) < 0.01, `GUOO Big Economy = ¥125.84，实际 ${guooRu?.shippingCost}`);

  // 测试 10：哈萨克斯坦应包含 OZON CIS 与 GUOO 专线
  const kzSample = {
    ...sample,
    destination: 'KZ',
    weight: 1,
    length: 10,
    width: 10,
    height: 10,
    goodsValueRUB: 3000,
  };
  const kzResult = calcAll(kzSample);
  const cisKz = kzResult.plans.find(
    (p) => p.carrierCode === 'CEL-CIS-KZ' && p.speed === 'Standard'
  );
  assert(cisKz, '哈萨克斯坦 OZON CIS Standard 存在');
  assert(Math.abs(cisKz.shippingCost - 53.04) < 0.01, `KZ CIS Small Standard = ¥53.04，实际 ${cisKz?.shippingCost}`);
  const guooKz = kzResult.plans.find(
    (p) => p.carrierCode === 'GUOO-KZ' && p.speed === 'Standard'
  );
  assert(guooKz, '哈萨克斯坦 GUOO Standard 存在');
  assert(Math.abs(guooKz.shippingCost - 53.04) < 0.01, `KZ GUOO Small Standard = ¥53.04，实际 ${guooKz?.shippingCost}`);

  // 测试 11：CEL-WB 应按 0.3kg 分段计费
  const wbLight = calcAll({
    ...sample,
    weight: 0.2,
    length: 10,
    width: 10,
    height: 10,
    goodsValueRUB: 1000,
  });
  const wbLightPlan = wbLight.plans.find(
    (p) => p.carrierCode === 'CEL-WB' && p.speed === 'Economy'
  );
  assert(wbLightPlan, 'CEL-WB Economy 轻件档存在');
  assert(Math.abs(wbLightPlan.shippingCost - 13.6) < 0.01, `CEL-WB <0.3kg = ¥13.6，实际 ${wbLightPlan?.shippingCost}`);

  const wbHeavy = calcAll({
    ...sample,
    weight: 0.4,
    length: 10,
    width: 10,
    height: 10,
    goodsValueRUB: 1000,
  });
  const wbHeavyPlan = wbHeavy.plans.find(
    (p) => p.carrierCode === 'CEL-WB' && p.speed === 'Economy'
  );
  assert(wbHeavyPlan, 'CEL-WB Economy 重件档存在');
  assert(Math.abs(wbHeavyPlan.shippingCost - 25.2) < 0.01, `CEL-WB >=0.3kg = ¥25.2，实际 ${wbHeavyPlan?.shippingCost}`);

  // 测试 12：GUOO Yandex 应按卢布计费后折算人民币
  const yandexGuoo = calcAll({
    ...sample,
    weight: 0.3,
    length: 10,
    width: 10,
    height: 10,
    goodsValueRUB: 1000,
  });
  const guooYPlan = yandexGuoo.plans.find(
    (p) => p.carrierCode === 'GUOO-Y' && p.speed === 'ExpressExtraSmall'
  );
  assert(guooYPlan, 'GUOO Yandex Extra Small 存在');
  assert(Math.abs(guooYPlan.shippingCost - 15.91) < 0.01, `GUOO Yandex 折算后 = ¥15.91，实际 ${guooYPlan?.shippingCost}`);

  // 测试 13：CEL Yandex 应按销售模式切换 rFBS / FBP 费率
  const celYRfps = calcAll({
    ...sample,
    weight: 1,
    length: 10,
    width: 10,
    height: 10,
    goodsValueRUB: 3000,
    salesMode: 'rFBS',
  });
  const celYrFbsPlan = celYRfps.plans.find(
    (p) => p.carrierCode === 'CEL-Y' && p.speed === 'Express'
  );
  assert(celYrFbsPlan, 'CEL Yandex rFBS Express 存在');
  assert(Math.abs(celYrFbsPlan.shippingCost - 66.58) < 0.01, `CEL Yandex rFBS = ¥66.58，实际 ${celYrFbsPlan?.shippingCost}`);

  const celYFbp = calcAll({
    ...sample,
    weight: 1,
    length: 10,
    width: 10,
    height: 10,
    goodsValueRUB: 3000,
    salesMode: 'FBP',
  });
  const celYFbpPlan = celYFbp.plans.find(
    (p) => p.carrierCode === 'CEL-Y' && p.speed === 'FbpExpress'
  );
  assert(celYFbpPlan, 'CEL Yandex FBP Express 存在');
  assert(Math.abs(celYFbpPlan.shippingCost - 65.44) < 0.01, `CEL Yandex FBP = ¥65.44，实际 ${celYFbpPlan?.shippingCost}`);

  // 测试 14：设置目标利润率后，应能反推所需售价
  const targetResult = calcAll({
    ...sample,
    targetProfitRate: 20,
  });
  const targetPlan = targetResult.plans.find(
    (p) => p.carrierCode === 'CEL' && p.speed === 'Standard'
  );
  assert(targetPlan?.targetPricing?.feasible, '目标利润率反推售价可用');
  assert(
    Math.abs(targetPlan.targetPricing.requiredSellingCNY - 371.45) < 0.01,
    `目标利润率 20% 时所需净售价 ≈ ¥371.45，实际 ${targetPlan?.targetPricing?.requiredSellingCNY}`
  );
  assert(
    Math.abs(targetPlan.targetPricing.requiredSellingFX - 4887.45) < 0.02,
    `目标利润率 20% 时所需卢布售价 ≈ 4887.45，实际 ${targetPlan?.targetPricing?.requiredSellingFX}`
  );

  console.log('\n🎉 所有冒烟测试通过');
  console.log(`  - 计费重：${r.cargo.chargeableWeight}kg`);
  console.log(`  - 售价：¥${r.sellingCNY}`);
  console.log(`  - 生成方案数：${r.plans.length}`);
  const top = r.plans[0];
  console.log(`  - 最便宜方案：${top.carrierName} · ${top.speedLabel} · 运费¥${top.shippingCost} · 利润¥${top.profit}`);
}

await main();
