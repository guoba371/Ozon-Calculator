<template>
  <view class="card">
    <view class="card-header">
      <text class="card-title">② 销售信息</text>
      <text class="card-hint">售价、汇率、目的地</text>
    </view>

    <view class="form-row">
      <text class="label">外币售价 <text class="required">*</text></text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.sellingPriceFX"
          @input="form.sellingPriceFX = toNum($event)"
          placeholder="如 3000"
        />
        <picker
          class="picker"
          :range="currencyLabels"
          :value="currencyIndex"
          @change="onCurrencyChange"
        >
          <view class="picker-value">
            {{ form.currency }}
            <text class="picker-arrow">▾</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="form-row">
      <text class="label">汇率 <text class="required">*</text></text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.exchangeRate"
          @input="form.exchangeRate = toNum($event)"
          :placeholder="`1 ${form.currency} = ? 元`"
        />
        <text class="suffix">CNY</text>
      </view>
    </view>

    <view class="form-row">
      <text class="label">
        目标利润率
        <text class="label-hint">用于反推建议售价</text>
      </text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.targetProfitRate"
          @input="form.targetProfitRate = toNum($event)"
          placeholder="如 20"
        />
        <text class="suffix">%</text>
      </view>
    </view>

    <view v-if="form.targetProfitRate !== null" class="form-hint">
      已开启目标利润率反推，系统会为每个物流方案计算所需售价。
    </view>

    <view class="form-row">
      <text class="label">目的地</text>
      <view class="segmented">
        <view
          v-for="d in destinations"
          :key="d.code"
          :class="['seg-item', { active: form.destination === d.code }]"
          @click="form.destination = d.code"
        >
          {{ d.label }}
        </view>
      </view>
    </view>

    <view class="form-row">
      <text class="label">
        货值（卢布）
        <text class="label-hint">用于物流档位匹配</text>
      </text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.goodsValueRUB"
          @input="onGoodsValueInput"
          placeholder="如 3000"
        />
        <text class="suffix">RUB</text>
      </view>
    </view>

    <view
      v-if="form.currency === 'RUB'"
      class="form-hint action-row"
    >
      <text>
        {{
          form.goodsValueCustomized
            ? '当前货值已手动锁定'
            : '当前货值随卢布售价自动同步'
        }}
      </text>
      <text
        v-if="form.goodsValueCustomized"
        class="hint-action"
        @click="useSellingPriceAsGoodsValue"
      >
        恢复自动同步
      </text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { CURRENCIES, DESTINATIONS } from '../data/commissions.js';

const props = defineProps({
  form: { type: Object, required: true },
});

const destinations = DESTINATIONS;
const currencyLabels = CURRENCIES.map((c) => c.label);
const currencyIndex = computed(() =>
  Math.max(
    0,
    CURRENCIES.findIndex((c) => c.code === props.form.currency)
  )
);

function onCurrencyChange(e) {
  const idx = Number(e.detail.value);
  props.form.currency = CURRENCIES[idx].code;
}

function onGoodsValueInput(e) {
  const value = toNum(e);
  props.form.goodsValueRUB = value;
  props.form.goodsValueCustomized = value !== null;
}

function useSellingPriceAsGoodsValue() {
  props.form.goodsValueCustomized = false;
  props.form.goodsValueRUB = props.form.sellingPriceFX || null;
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
