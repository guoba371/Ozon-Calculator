<template>
  <view class="page">
    <view class="container">
      <view class="header-note">
        <text class="note-icon">ℹ️</text>
        <view class="note-body">
          <text class="note-text">
            这里维护的是“当前设备本地费率覆盖”，保存后首页会立即按新费率重算。
          </text>
          <text class="note-sub">
            默认费率文件不会被改动；如需回到内置费率，可点击“恢复默认”。
          </text>
        </view>
      </view>

      <view class="toolbar">
        <text class="toolbar-text">
          {{ hasOverrides ? '已启用本地覆盖费率' : '当前使用内置默认费率' }}
        </text>
        <view class="toolbar-actions">
          <view class="tb-btn ghost" @click="onResetOverrides">恢复默认</view>
          <view class="tb-btn" @click="onSave">保存配置</view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">矩阵型物流商</text>

        <view v-for="carrier in matrixCarriers" :key="carrier.code" class="carrier-card">
          <view class="carrier-head">
            <view>
              <text class="carrier-name">{{ carrier.fullName }}</text>
              <text v-if="carrier.estimated" class="carrier-tag">按 CEL 估算</text>
            </view>
            <text class="carrier-limit">≤{{ carrier.weightLimitKg }}kg</text>
          </view>

          <view
            v-for="(line, lineCode) in carrier.rates"
            :key="lineCode"
            class="line-block"
          >
            <text class="line-title">{{ lineLabel(lineCode) }}</text>

            <view
              v-for="(rate, speedCode) in line"
              :key="speedCode"
              class="rate-item"
            >
              <view class="rate-row">
                <text class="speed-title">{{ speedCode }}</text>
                <view class="switch-wrap">
                  <text class="switch-label">{{ rate.unavailable ? '停用' : '启用' }}</text>
                  <switch
                    :checked="!rate.unavailable"
                    color="#1E5FA8"
                    @change="onMatrixAvailabilityChange(carrier.code, lineCode, speedCode, $event)"
                  />
                </view>
              </view>

              <view class="field-grid">
                <view class="field">
                  <text class="field-label">基础费</text>
                  <input
                    class="field-input"
                    type="digit"
                    :value="rate.base"
                    @input="onMatrixNumberInput(carrier.code, lineCode, speedCode, 'base', $event)"
                  />
                </view>
                <view class="field">
                  <text class="field-label">续重单价</text>
                  <input
                    class="field-input"
                    type="digit"
                    :value="rate.perKg"
                    @input="onMatrixNumberInput(carrier.code, lineCode, speedCode, 'perKg', $event)"
                  />
                </view>
                <view class="field span-2">
                  <text class="field-label">时效</text>
                  <input
                    class="field-input"
                    type="text"
                    :value="rate.transitDays"
                    @input="onMatrixTextInput(carrier.code, lineCode, speedCode, 'transitDays', $event)"
                  />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">E 邮宝</text>

        <view v-for="carrier in epostalCarriers" :key="carrier.code" class="simple-card">
          <view class="carrier-head">
            <text class="carrier-name">{{ carrier.fullName }}</text>
            <text class="carrier-limit">≤{{ carrier.weightLimitKg }}kg</text>
          </view>

          <view class="field-grid">
            <view class="field">
              <text class="field-label">基础费</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.base"
                @input="onSimpleNumberInput('epostal', carrier.code, 'base', $event)"
              />
            </view>
            <view class="field">
              <text class="field-label">每公斤</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.perKg"
                @input="onSimpleNumberInput('epostal', carrier.code, 'perKg', $event)"
              />
            </view>
            <view class="field">
              <text class="field-label">重量上限</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.weightLimitKg"
                @input="onSimpleNumberInput('epostal', carrier.code, 'weightLimitKg', $event)"
              />
            </view>
            <view class="field">
              <text class="field-label">可带电</text>
              <switch
                :checked="!!carrier.allowBattery"
                color="#1E5FA8"
                @change="onSimpleBooleanChange('epostal', carrier.code, 'allowBattery', $event)"
              />
            </view>
            <view class="field span-2">
              <text class="field-label">时效</text>
              <input
                class="field-input"
                type="text"
                :value="carrier.transitDays"
                @input="onSimpleTextInput('epostal', carrier.code, 'transitDays', $event)"
              />
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">E 包裹</text>

        <view v-for="carrier in eparcelCarriers" :key="carrier.code" class="simple-card">
          <view class="carrier-head">
            <text class="carrier-name">{{ carrier.fullName }}</text>
            <text class="carrier-limit">≤{{ carrier.weightLimitKg }}kg</text>
          </view>

          <view class="field-grid">
            <view class="field">
              <text class="field-label">首重克数</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.firstWeightGrams"
                @input="onSimpleNumberInput('eparcel', carrier.code, 'firstWeightGrams', $event)"
              />
            </view>
            <view class="field">
              <text class="field-label">首重价格</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.firstWeightPrice"
                @input="onSimpleNumberInput('eparcel', carrier.code, 'firstWeightPrice', $event)"
              />
            </view>
            <view class="field">
              <text class="field-label">续重克数</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.stepWeightGrams"
                @input="onSimpleNumberInput('eparcel', carrier.code, 'stepWeightGrams', $event)"
              />
            </view>
            <view class="field">
              <text class="field-label">续重价格</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.stepWeightPrice"
                @input="onSimpleNumberInput('eparcel', carrier.code, 'stepWeightPrice', $event)"
              />
            </view>
            <view class="field">
              <text class="field-label">重量上限</text>
              <input
                class="field-input"
                type="digit"
                :value="carrier.weightLimitKg"
                @input="onSimpleNumberInput('eparcel', carrier.code, 'weightLimitKg', $event)"
              />
            </view>
            <view class="field span-2">
              <text class="field-label">时效</text>
              <input
                class="field-input"
                type="text"
                :value="carrier.transitDays"
                @input="onSimpleTextInput('eparcel', carrier.code, 'transitDays', $event)"
              />
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { PRODUCT_LINES } from '../../data/carriers.js';
import { buildCarrierCatalog } from '../../utils/shipping.js';
import {
  loadRateOverrides,
  saveRateOverrides,
} from '../../utils/storage.js';

const overrides = ref(clone(loadRateOverrides() || {}));

const catalog = computed(() => buildCarrierCatalog(overrides.value));
const matrixCarriers = computed(() => catalog.value.matrixCarriers);
const epostalCarriers = computed(() => catalog.value.epostalCarriers);
const eparcelCarriers = computed(() => catalog.value.eparcelCarriers);
const hasOverrides = computed(() => Object.keys(overrides.value || {}).length > 0);

function lineLabel(code) {
  return PRODUCT_LINES[code]?.label || code;
}

function onSave() {
  saveRateOverrides(overrides.value);
  uni.showToast({ title: '费率配置已保存', icon: 'success' });
}

function onResetOverrides() {
  uni.showModal({
    title: '恢复默认费率？',
    content: '将清空当前设备上的本地覆盖配置',
    success: (res) => {
      if (!res.confirm) return;
      overrides.value = {};
      saveRateOverrides({});
      uni.showToast({ title: '已恢复默认费率', icon: 'success' });
    },
  });
}

function onMatrixNumberInput(carrierCode, lineCode, speedCode, field, event) {
  updateOverride(
    ['matrix', carrierCode, 'rates', lineCode, speedCode, field],
    toNumberOrNull(event)
  );
}

function onMatrixTextInput(carrierCode, lineCode, speedCode, field, event) {
  updateOverride(
    ['matrix', carrierCode, 'rates', lineCode, speedCode, field],
    toTextOrNull(event)
  );
}

function onMatrixAvailabilityChange(carrierCode, lineCode, speedCode, event) {
  updateOverride(
    ['matrix', carrierCode, 'rates', lineCode, speedCode, 'unavailable'],
    !event.detail.value
  );
}

function onSimpleNumberInput(section, carrierCode, field, event) {
  updateOverride([section, carrierCode, field], toNumberOrNull(event));
}

function onSimpleTextInput(section, carrierCode, field, event) {
  updateOverride([section, carrierCode, field], toTextOrNull(event));
}

function onSimpleBooleanChange(section, carrierCode, field, event) {
  updateOverride([section, carrierCode, field], !!event.detail.value);
}

function updateOverride(path, value) {
  const next = clone(overrides.value || {});
  let current = next;

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = path[path.length - 1];
  if (value === null) {
    delete current[lastKey];
  } else {
    current[lastKey] = value;
  }

  overrides.value = cleanupObject(next);
}

function cleanupObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    const cleaned = cleanupObject(child);
    if (cleaned === null || cleaned === undefined) continue;
    if (typeof cleaned === 'object' && !Array.isArray(cleaned)) {
      if (!Object.keys(cleaned).length) continue;
    }
    next[key] = cleaned;
  }
  return next;
}

function toNumberOrNull(event) {
  const raw = getInputValue(event);
  if (raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function toTextOrNull(event) {
  const raw = getInputValue(event).trim();
  return raw ? raw : null;
}

function getInputValue(event) {
  return event.detail ? event.detail.value : event.target?.value || '';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24rpx;
}

.container {
  max-width: 1100rpx;
  margin: 0 auto;
}

.header-note {
  display: flex;
  gap: 14rpx;
  padding: 20rpx;
  background: #e8f1fb;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.note-icon {
  font-size: 28rpx;
}

.note-body {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
}

.note-text {
  font-size: 24rpx;
  color: #144a85;
  line-height: 1.6;
}

.note-sub {
  font-size: 22rpx;
  color: #5b6b82;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;
  flex-wrap: wrap;
}

.toolbar-text {
  font-size: 24rpx;
  color: #4b5563;
}

.toolbar-actions {
  display: flex;
  gap: 12rpx;
}

.tb-btn {
  padding: 14rpx 24rpx;
  background: #1e5fa8;
  color: #fff;
  border-radius: 12rpx;
  font-size: 24rpx;

  &.ghost {
    background: #fff;
    color: #1e5fa8;
    border: 1rpx solid #bfd3ea;
  }
}

.section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e5fa8;
  margin-bottom: 16rpx;
  display: block;
}

.carrier-card,
.simple-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.carrier-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f2f5;
}

.carrier-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.carrier-tag {
  margin-left: 10rpx;
  font-size: 20rpx;
  color: #92400e;
  background: #fef3c7;
  padding: 3rpx 10rpx;
  border-radius: 6rpx;
}

.carrier-limit {
  font-size: 22rpx;
  color: #6b7280;
}

.line-block {
  border: 1rpx solid #eef2f7;
  border-radius: 14rpx;
  padding: 16rpx;
  margin-bottom: 14rpx;
  background: #fafcff;
}

.line-title {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.rate-item {
  border-top: 1rpx dashed #e5e7eb;
  padding-top: 14rpx;
  margin-top: 14rpx;
}

.rate-item:first-child {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

.rate-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.speed-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #1e5fa8;
}

.switch-wrap {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.switch-label {
  font-size: 22rpx;
  color: #6b7280;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.field.span-2 {
  grid-column: span 2;
}

.field-label {
  font-size: 22rpx;
  color: #6b7280;
}

.field-input {
  height: 76rpx;
  border-radius: 12rpx;
  border: 1rpx solid #dbe4ee;
  background: #fff;
  padding: 0 20rpx;
  font-size: 24rpx;
  color: #1f2937;
}
</style>
