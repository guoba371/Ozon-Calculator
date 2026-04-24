<template>
  <view class="analysis-card">
    <view class="analysis-header">
      <text class="analysis-title">📦 货物分析</text>
      <view :class="['cargo-badge', cargo.type]">
        {{ cargo.type === 'light' ? '抛货' : '重货' }}
      </view>
    </view>

    <view class="metrics">
      <view class="metric">
        <text class="metric-label">体积重</text>
        <text class="metric-value">{{ formatKg(cargo.volumeWeight) }}</text>
      </view>
      <view class="divider"></view>
      <view class="metric">
        <text class="metric-label">实际重</text>
        <text class="metric-value">{{ formatKg(actualWeight) }}</text>
      </view>
      <view class="divider"></view>
      <view class="metric primary">
        <text class="metric-label">计费重</text>
        <text class="metric-value">{{ formatKg(cargo.chargeableWeight) }}</text>
      </view>
    </view>

    <view class="band-row" v-if="cargo.band">
      <text class="band-label">重量区间</text>
      <view class="band-pill">
        {{ cargo.band.label }}
        <text class="band-range">
          ({{ formatRange(cargo.band.min, cargo.band.max) }})
        </text>
      </view>
    </view>

    <view class="band-row" v-else-if="cargo.chargeableWeight > 0">
      <text class="band-warn">⚠ 计费重超出物流商 30kg 上限</text>
    </view>

    <view class="selling-price" v-if="sellingCNY > 0">
      <text class="sp-label">预估售价（人民币）</text>
      <text class="sp-value">¥ {{ money(sellingCNY) }}</text>
    </view>
  </view>
</template>

<script setup>
import { money, kg } from '../utils/format.js';

const props = defineProps({
  cargo: { type: Object, required: true },
  actualWeight: { type: Number, default: 0 },
  sellingCNY: { type: Number, default: 0 },
});

function formatKg(v) {
  if (!v) return '0.000 kg';
  return kg(v, 3);
}

function formatRange(min, max) {
  const fmt = (v) => (v < 1 ? `${v * 1000}g` : `${v}kg`);
  return `${fmt(min)} ~ ${fmt(max)}`;
}
</script>

<style lang="scss" scoped>
.analysis-card {
  background: linear-gradient(135deg, #1e5fa8 0%, #3b7bc4 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  color: #ffffff;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(30, 95, 168, 0.2);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.analysis-title {
  font-size: 30rpx;
  font-weight: 600;
}

.cargo-badge {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10rpx);
  font-weight: 500;

  &.light {
    background: rgba(245, 158, 11, 0.85);
  }
  &.heavy {
    background: rgba(34, 197, 94, 0.85);
  }
}

.metrics {
  display: flex;
  align-items: stretch;
  padding: 20rpx 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx;
}

.metric-label {
  font-size: 22rpx;
  opacity: 0.85;
}

.metric-value {
  font-size: 28rpx;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.metric.primary .metric-value {
  font-size: 32rpx;
  color: #fff2c7;
}

.divider {
  width: 1rpx;
  background: rgba(255, 255, 255, 0.25);
  align-self: stretch;
}

.band-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.band-label {
  font-size: 24rpx;
  opacity: 0.85;
}

.band-pill {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 100rpx;
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.band-range {
  opacity: 0.75;
  font-weight: 400;
  margin-left: 8rpx;
}

.band-warn {
  color: #fecaca;
  font-size: 24rpx;
}

.selling-price {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sp-label {
  font-size: 24rpx;
  opacity: 0.85;
}

.sp-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff2c7;
  font-variant-numeric: tabular-nums;
}
</style>
