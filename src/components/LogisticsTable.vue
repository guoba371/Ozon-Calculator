<template>
  <view class="card">
    <view class="card-header">
      <text class="card-title">🚚 物流方案比价</text>
      <text class="card-hint">{{ plans.length }} 个可用方案</text>
    </view>

    <view v-if="!plans.length" class="empty">
      <text class="empty-icon">📭</text>
      <text class="empty-text">请先输入重量、尺寸；矩阵渠道还需货值（卢布）</text>
    </view>

    <!-- 速度档筛选 -->
    <view v-if="plans.length" class="speed-filter">
      <view
        :class="['sf-item', { active: !speedFilter }]"
        @click="$emit('filterChange', '')"
      >
        全部
      </view>
      <view
        v-for="s in speeds"
        :key="s"
        :class="['sf-item', { active: speedFilter === s }]"
        @click="$emit('filterChange', s)"
      >
        {{ speedLabel(s) }}
      </view>
    </view>

    <view class="plan-list">
      <view
        v-for="p in displayPlans"
        :key="p.carrierCode + p.speed"
        :class="[
          'plan-row',
          { selected: selectedKey === p.carrierCode + p.speed },
        ]"
        @click="$emit('select', p)"
      >
        <view class="plan-header">
          <view class="plan-carrier">
            <text class="carrier-name">{{ p.carrierName }}</text>
            <text class="carrier-speed">{{ p.speedLabel }}</text>
            <text v-if="p.estimated" class="estimated">估算</text>
          </view>
          <view class="plan-labels">
            <view v-if="p.labels?.includes('lowest-cost')" class="label-tag low">
              最低运费
            </view>
            <view v-if="p.labels?.includes('fastest')" class="label-tag fast">
              最快时效
            </view>
            <view v-if="p.labels?.includes('best-value')" class="label-tag val">
              性价比推荐
            </view>
          </view>
        </view>

        <view class="plan-meta">
          <text class="plan-line">{{ p.productLineLabel }}</text>
          <text class="plan-days">· {{ p.transitDays }}</text>
        </view>

        <view class="plan-numbers">
          <view class="num-item">
            <text class="num-label">运费</text>
            <text class="num-value">¥{{ money(p.shippingCost) }}</text>
          </view>
          <view class="num-item">
            <text class="num-label">总成本</text>
            <text class="num-value">¥{{ money(p.totalCost) }}</text>
          </view>
          <view class="num-item">
            <text class="num-label">利润</text>
            <text :class="['num-value', profitCls(p.profit)]">
              ¥{{ money(p.profit) }}
            </text>
          </view>
          <view class="num-item">
            <text class="num-label">利润率</text>
            <text :class="['num-value', profitCls(p.profit)]">
              {{ percent(p.profitRate) }}
            </text>
          </view>
        </view>

        <view
          v-if="p.targetPricing"
          :class="['target-pricing', { invalid: p.targetPricing.feasible === false }]"
        >
          <text v-if="p.targetPricing.feasible !== false">
            目标利润率 {{ percent(p.targetPricing.targetProfitRate) }} 时，建议售价
            {{ currency }} {{ money(p.targetPricing.requiredSellingFX) }}
            （约 ¥{{ money(p.targetPricing.requiredRawSellingCNY) }}）
          </text>
          <text v-else>
            无法反推售价：{{ p.targetPricing.reason }}
          </text>
        </view>

        <view v-if="p.warnings?.length" class="warn-list">
          <view
            v-for="(w, i) in p.warnings"
            :key="i"
            :class="['warn-item', w.level]"
          >
            {{ w.message }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { money, percent } from '../utils/format.js';
import { SPEEDS } from '../data/carriers.js';

const props = defineProps({
  plans: { type: Array, default: () => [] },
  selectedKey: { type: String, default: '' },
  speedFilter: { type: String, default: '' },
  currency: { type: String, default: 'RUB' },
});
defineEmits(['select', 'filterChange']);

const speeds = ['Express', 'Standard', 'Economy'];

const displayPlans = computed(() => {
  if (!props.speedFilter) return props.plans;
  return props.plans.filter((p) => p.speed === props.speedFilter);
});

function speedLabel(code) {
  return SPEEDS[code]?.label || code;
}

function profitCls(v) {
  return v >= 0 ? 'positive' : 'negative';
}
</script>

<style lang="scss" scoped>
@import '../styles/form.scss';

.empty {
  padding: 60rpx 20rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}
.empty-icon {
  font-size: 60rpx;
  opacity: 0.4;
}
.empty-text {
  font-size: 26rpx;
  color: #9ca3af;
}

.speed-filter {
  display: flex;
  gap: 12rpx;
  overflow-x: auto;
  padding: 4rpx;
  margin-bottom: 16rpx;
}
.sf-item {
  flex-shrink: 0;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 100rpx;
  background: #f3f4f6;
  color: #6b7280;

  &.active {
    background: #1e5fa8;
    color: #fff;
  }
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.plan-row {
  border: 2rpx solid #eef2f7;
  border-radius: 16rpx;
  padding: 20rpx;
  background: #fafbfc;
  transition: all 0.15s;
  cursor: pointer;

  &.selected {
    border-color: #1e5fa8;
    background: #f0f7ff;
    box-shadow: 0 4rpx 16rpx rgba(30, 95, 168, 0.1);
  }
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
  flex-wrap: wrap;
}

.plan-carrier {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.carrier-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.carrier-speed {
  font-size: 22rpx;
  color: #1e5fa8;
  background: #e0ecfa;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.estimated {
  font-size: 20rpx;
  color: #92400e;
  background: #fef3c7;
  padding: 3rpx 10rpx;
  border-radius: 6rpx;
}

.plan-labels {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.label-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  color: #fff;
  font-weight: 500;

  &.low {
    background: #22c55e;
  }
  &.fast {
    background: #3b82f6;
  }
  &.val {
    background: #f59e0b;
  }
}

.plan-meta {
  font-size: 22rpx;
  color: #6b7280;
  margin-bottom: 16rpx;
}

.plan-days {
  margin-left: 4rpx;
}

.plan-numbers {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10rpx;
  padding: 16rpx;
  background: #fff;
  border-radius: 12rpx;
}

.num-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.num-label {
  font-size: 20rpx;
  color: #9ca3af;
}

.num-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
  font-variant-numeric: tabular-nums;

  &.positive {
    color: #22c55e;
  }
  &.negative {
    color: #ef4444;
  }
}

.target-pricing {
  margin-top: 12rpx;
  padding: 12rpx 16rpx;
  border-radius: 10rpx;
  background: #eef6ff;
  color: #1e5fa8;
  font-size: 22rpx;
  line-height: 1.6;

  &.invalid {
    background: #fff7ed;
    color: #b45309;
  }
}

.warn-list {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.warn-item {
  font-size: 22rpx;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;

  &.info {
    background: #dbeafe;
    color: #1e40af;
  }
  &.warn {
    background: #fef3c7;
    color: #92400e;
  }
}
</style>
