<template>
  <view class="card">
    <view class="card-header">
      <text class="card-title">③ 佣金 & 其他费用</text>
      <text class="card-hint">rFBS/FBP、广告、操作</text>
    </view>

    <!-- 销售模式切换 -->
    <view class="form-row">
      <text class="label">销售模式</text>
      <view class="segmented">
        <view
          v-for="m in salesModes"
          :key="m.code"
          :class="['seg-item', { active: form.salesMode === m.code }]"
          @click="form.salesMode = m.code"
        >
          {{ m.label }}
        </view>
      </view>
    </view>
    <view class="form-hint">
      {{ currentModeDesc }}
    </view>

    <!-- 品类选择 -->
    <view class="form-row">
      <text class="label">品类</text>
      <picker
        class="picker full"
        :range="categoryLabels"
        :value="categoryIndex"
        @change="onCategoryChange"
      >
        <view class="picker-value full">
          {{ currentCategoryLabel }}
          <text class="picker-arrow">▾</text>
        </view>
      </picker>
    </view>

    <!-- 佣金输入方式切换 -->
    <view class="form-row">
      <text class="label">佣金方式</text>
      <view class="segmented">
        <view
          :class="['seg-item', { active: form.commissionMode === 'rate' }]"
          @click="form.commissionMode = 'rate'"
        >
          按比例
        </view>
        <view
          :class="['seg-item', { active: form.commissionMode === 'amount' }]"
          @click="form.commissionMode = 'amount'"
        >
          固定金额
        </view>
      </view>
    </view>

    <view v-if="form.commissionMode === 'rate'" class="form-row">
      <text class="label">佣金率</text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.commissionRate"
          @input="onCommissionRateInput"
          placeholder="如 15"
        />
        <text class="suffix">%</text>
      </view>
    </view>

    <view v-if="form.commissionMode === 'rate'" class="form-hint action-row">
      <text>
        {{ form.commissionRateCustomized ? '当前为手动佣金率' : '当前使用品类参考佣金率' }}
      </text>
      <text
        v-if="form.commissionRateCustomized"
        class="hint-action"
        @click="useReferenceCommission"
      >
        恢复参考值
      </text>
    </view>

    <view v-else class="form-row">
      <text class="label">佣金金额</text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.commissionAmount"
          @input="form.commissionAmount = toNum($event)"
          placeholder="直接输入元"
        />
        <text class="suffix">元</text>
      </view>
    </view>

    <!-- 广告费 -->
    <view class="form-row">
      <text class="label">广告费</text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.advertisingFee"
          @input="form.advertisingFee = toNum($event)"
          placeholder="0"
        />
        <text class="suffix">元</text>
      </view>
    </view>
    <view class="form-hint">
      当前新版利润公式暂不计入广告费，仅保留字段备用。
    </view>

    <!-- 操作费 -->
    <view class="form-row">
      <text class="label">操作费</text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.operationFee"
          @input="form.operationFee = toNum($event)"
          placeholder="默认 12"
        />
        <text class="suffix">元</text>
      </view>
    </view>
    <view class="form-hint">
      当前新版利润公式暂不计入操作费，仅保留字段备用。
    </view>

    <!-- 运费分摊率（高级选项） -->
    <view class="form-row">
      <text class="label">
        运费分摊率
        <text class="label-hint">Ozon 预扣物流费用占比</text>
      </text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.freightShareRate"
          @input="form.freightShareRate = toNum($event)"
          placeholder="0 ~ 0.3"
        />
        <text class="suffix">× 售价</text>
      </view>
    </view>
    <view class="form-hint">
      当前新版利润公式暂不计入运费分摊，仅保留字段备用。
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import {
  CATEGORIES,
  SALES_MODES,
  getReferenceCommissionRate,
} from '../data/commissions.js';

const props = defineProps({
  form: { type: Object, required: true },
});

const salesModes = SALES_MODES;
const categoryLabels = CATEGORIES.map((c) => c.label);

const categoryIndex = computed(() =>
  Math.max(
    0,
    CATEGORIES.findIndex((c) => c.code === props.form.category)
  )
);

const currentCategoryLabel = computed(
  () =>
    CATEGORIES.find((c) => c.code === props.form.category)?.label ||
    '选择品类'
);

const currentModeDesc = computed(() => {
  const m = SALES_MODES.find((x) => x.code === props.form.salesMode);
  return m ? m.description : '';
});

function onCategoryChange(e) {
  const idx = Number(e.detail.value);
  props.form.category = CATEGORIES[idx].code;
}

function onCommissionRateInput(e) {
  props.form.commissionRate = toNum(e);
  props.form.commissionRateCustomized = true;
}

function useReferenceCommission() {
  props.form.commissionRate = getReferenceCommissionRate(
    props.form.category,
    props.form.salesMode
  );
  props.form.commissionRateCustomized = false;
}

function toNum(e) {
  const v = e.detail ? e.detail.value : e.target?.value;
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
</script>

<style lang="scss" scoped>
@import '../styles/form.scss';

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.hint-action {
  color: #1e5fa8;
  font-weight: 600;
}
</style>
