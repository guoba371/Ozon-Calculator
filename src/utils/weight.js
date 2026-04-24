/**
 * 重量与货型判断工具
 *
 * 核心规则（PRD 2.1 / 2.2）：
 *  - 体积重 = L × W × H / 6000 （cm / kg）
 *  - 计费重 = max(实重, 体积重)
 *  - 若体积重 > 实重 => 抛货，否则重货
 *  - 重量区间：Extra Small / Small / Standard / Big
 */

export const WEIGHT_BANDS = {
  ExtraSmall: { code: 'ExtraSmall', label: '超轻小件', min: 0, max: 0.5 },
  Small: { code: 'Small', label: '轻小件', min: 0.5, max: 2 },
  Standard: { code: 'Standard', label: '标准件', min: 2, max: 5 },
  Big: { code: 'Big', label: '大件', min: 5, max: 30 },
};

/**
 * 计算体积重 (kg)
 */
export function calcVolumeWeight(length, width, height) {
  const l = Number(length) || 0;
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  if (l <= 0 || w <= 0 || h <= 0) return 0;
  return (l * w * h) / 6000;
}

/**
 * 计算计费重 (kg)
 */
export function calcChargeableWeight(actualKg, volumeKg) {
  const a = Number(actualKg) || 0;
  const v = Number(volumeKg) || 0;
  return Math.max(a, v);
}

/**
 * 判断重货 / 抛货
 */
export function cargoType(actualKg, volumeKg) {
  if (volumeKg > actualKg && volumeKg > 0) return 'light'; // 抛货
  return 'heavy';
}

/**
 * 依据计费重划分 4 档重量区间
 */
export function weightBand(chargeableKg) {
  if (chargeableKg <= 0) return null;
  if (chargeableKg <= 0.5) return WEIGHT_BANDS.ExtraSmall;
  if (chargeableKg <= 2) return WEIGHT_BANDS.Small;
  if (chargeableKg <= 5) return WEIGHT_BANDS.Standard;
  if (chargeableKg <= 30) return WEIGHT_BANDS.Big;
  return null; // 超重
}

/**
 * 一次性分析货物
 */
export function analyzeCargo(length, width, height, actualWeight) {
  const volumeWeight = calcVolumeWeight(length, width, height);
  const chargeableWeight = calcChargeableWeight(actualWeight, volumeWeight);
  return {
    volumeWeight,
    chargeableWeight,
    type: cargoType(actualWeight, volumeWeight),
    band: weightBand(chargeableWeight),
  };
}
