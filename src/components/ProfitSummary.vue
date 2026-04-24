<template>
  <view class="card summary-card" v-if="plan">
    <view class="card-header">
      <text class="card-title">💰 利润汇总</text>
      <text class="card-hint">
        {{ plan.carrierName }} · {{ plan.speedLabel }}
      </text>
    </view>

    <!-- 总利润大号展示 -->
    <view class="profit-display">
      <text class="pd-label">本单利润</text>
      <text :class="['pd-value', profitCls(plan.profit)]">
        ¥ {{ money(plan.profit) }}
      </text>
      <text :class="['pd-rate', profitCls(plan.profit)]">
        利润率 {{ percent(plan.profitRate) }}
      </text>
    </view>

    <!-- 成本拆解条形图 -->
    <view class="breakdown">
      <text class="bd-title">成本构成</text>
      <view class="bar-chart">
        <view
          class="bar-seg cost"
          :style="{ flexGrow: plan.breakdown.cost }"
        >
          <text v-if="showLabel(plan.breakdown.cost)" class="bar-lbl">货本</text>
        </view>
        <view
          class="bar-seg shipping"
          :style="{ flexGrow: plan.breakdown.shipping }"
        >
          <text v-if="showLabel(plan.breakdown.shipping)" class="bar-lbl">物流</text>
        </view>
        <view
          class="bar-seg commission"
          :style="{ flexGrow: plan.breakdown.commission }"
        >
          <text v-if="showLabel(plan.breakdown.commission)" class="bar-lbl">佣金</text>
        </view>
        <view
          class="bar-seg ads"
          :style="{ flexGrow: Math.max(plan.breakdown.advertising, 0.01) }"
        >
          <text v-if="showLabel(plan.breakdown.advertising)" class="bar-lbl">广告</text>
        </view>
        <view
          class="bar-seg ops"
          :style="{ flexGrow: plan.breakdown.operation }"
        >
          <text v-if="showLabel(plan.breakdown.operation)" class="bar-lbl">操作</text>
        </view>
      </view>

      <view class="bd-list">
        <view class="bd-row">
          <view class="bd-dot cost"></view>
          <text class="bd-name">货本</text>
          <text class="bd-num">¥{{ money(plan.breakdown.cost) }}</text>
        </view>
        <view class="bd-row">
          <view class="bd-dot shipping"></view>
          <text class="bd-name">物流费</text>
          <text class="bd-num">¥{{ money(plan.breakdown.shipping) }}</text>
        </view>
        <view class="bd-row">
          <view class="bd-dot commission"></view>
          <text class="bd-name">平台佣金</text>
          <text class="bd-num">¥{{ money(plan.breakdown.commission) }}</text>
        </view>
        <view class="bd-row">
          <view class="bd-dot ads"></view>
          <text class="bd-name">广告费</text>
          <text class="bd-num">¥{{ money(plan.breakdown.advertising) }}</text>
        </view>
        <view class="bd-row">
          <view class="bd-dot ops"></view>
          <text class="bd-name">操作费</text>
          <text class="bd-num">¥{{ money(plan.breakdown.operation) }}</text>
        </view>

        <view class="bd-row total">
          <text class="bd-name">总成本</text>
          <text class="bd-num">¥{{ money(plan.totalCost) }}</text>
        </view>
        <view class="bd-row">
          <text class="bd-name">销售收入</text>
          <text class="bd-num">¥{{ money(sellingCNY) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { money, percent } from '../utils/format.js';

defineProps({
  plan: { type: Object, default: null },
  sellingCNY: { type: Number, default: 0 },
});

function profitCls(v) {
  return v >= 0 ? 'positive' : 'negative';
}

function showLabel(v) {
  return v && v > 5;
}
</script>

<style lang="scss" scoped>
@import '../styles/form.scss';

.summary-card {
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
}

.profit-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
  gap: 8rpx;
  border-bottom: 1rpx dashed #e5e7eb;
  margin-bottom: 24rpx;
}

.pd-label {
  font-size: 24rpx;
  color: #6b7280;
}

.pd-value {
  font-size: 56rpx;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  &.positive {
    color: #22c55e;
  }
  &.negative {
    color: #ef4444;
  }
}

.pd-rate {
  font-size: 26rpx;
  font-weight: 600;
  &.positive {
    color: #22c55e;
  }
  &.negative {
    color: #ef4444;
  }
}

.breakdown {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.bd-title {
  font-size: 26rpx;
  color: #4b5563;
  font-weight: 600;
}

.bar-chart {
  display: flex;
  height: 48rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: #f3f4f6;
}

.bar-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  transition: all 0.3s;

  &.cost {
    background: #1e5fa8;
  }
  &.shipping {
    background: #3b7bc4;
  }
  &.commission {
    background: #f59e0b;
  }
  &.ads {
    background: #a78bfa;
  }
  &.ops {
    background: #6b7280;
  }
}

.bar-lbl {
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 500;
  white-space: nowrap;
}

.bd-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding-top: 8rpx;
}

.bd-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  font-size: 26rpx;

  &.total {
    border-top: 1rpx dashed #e5e7eb;
    padding-top: 12rpx;
    margin-top: 6rpx;
    font-weight: 700;
    color: #1f2937;
  }
}

.bd-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;

  &.cost {
    background: #1e5fa8;
  }
  &.shipping {
    background: #3b7bc4;
  }
  &.commission {
    background: #f59e0b;
  }
  &.ads {
    background: #a78bfa;
  }
  &.ops {
    background: #6b7280;
  }
}

.bd-name {
  flex: 1;
  color: #4b5563;
}

.bd-num {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: #1f2937;
}
</style>
