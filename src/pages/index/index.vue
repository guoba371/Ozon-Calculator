<template>
  <view class="page">
    <view class="container">
      <!-- 顶部导航卡片 -->
      <view class="nav-bar">
        <view class="brand">
          <text class="brand-icon">📊</text>
          <view class="brand-text">
            <text class="brand-title">Ozon 利润计算器</text>
            <text class="brand-sub">跨境定价 · 物流比价 · 一键出结果</text>
          </view>
        </view>
        <view class="nav-actions">
          <view class="nav-btn" @click="goHistory">
            <text>📁 历史</text>
          </view>
          <view class="nav-btn" @click="goAdmin">
            <text>⚙ 费率</text>
          </view>
        </view>
      </view>

      <view class="layout">
        <!-- 左栏：输入面板 -->
        <view class="col-input">
          <ProductForm :form="form" />
          <SalesForm :form="form" />
          <FeeConfig :form="form" />
          <view class="calc-action-card">
            <view class="calc-action-note">
              <text class="calc-action-title">参数确认后，手动发起一次计算</text>
              <text class="calc-action-sub">会按当前费率重算，并跳转到结果区</text>
            </view>
            <view class="calc-action-btn" @click="onStartCalculate">
              <text>开始计算</text>
            </view>
          </view>
        </view>

        <!-- 右栏：结果展示 -->
        <view id="result-section" class="col-result">
          <CargoAnalysis
            :cargo="result.cargo"
            :actual-weight="Number(form.weight) || 0"
            :selling-c-n-y="result.sellingCNY"
          />

          <LogisticsTable
            :plans="result.plans"
            :selected-key="selectedKey"
            :speed-filter="speedFilter"
            :currency="form.currency"
            @select="onSelectPlan"
            @filter-change="speedFilter = $event"
          />

          <ProfitSummary
            :plan="selectedPlan"
            :selling-c-n-y="result.sellingCNY"
            :currency="form.currency"
            :target-profit-rate="form.targetProfitRate"
          />
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="bottom-bar">
        <view class="bb-btn secondary" @click="onReset">
          <text>🗑 清空</text>
        </view>
        <view class="bb-btn secondary" @click="onSave" v-if="selectedPlan">
          <text>💾 保存</text>
        </view>
        <view class="bb-btn primary" @click="onExport" v-if="selectedPlan">
          <text>📤 导出方案</text>
        </view>
      </view>

      <view class="footer">
        <text>© Ozon 跨境利润计算器 v1.0 · 费率以物流商官方报价为准</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ProductForm from '../../components/ProductForm.vue';
import SalesForm from '../../components/SalesForm.vue';
import FeeConfig from '../../components/FeeConfig.vue';
import CargoAnalysis from '../../components/CargoAnalysis.vue';
import LogisticsTable from '../../components/LogisticsTable.vue';
import ProfitSummary from '../../components/ProfitSummary.vue';
import { useCalculator } from '../../composables/useCalculator.js';
import { appendHistory, generateId } from '../../utils/storage.js';

const { form, result, reset, refreshRates } = useCalculator();

const selectedKey = ref('');
const speedFilter = ref('');

// 默认选中"性价比推荐"或第一个方案
const selectedPlan = computed(() => {
  if (!result.value.plans.length) return null;
  if (!selectedKey.value) {
    const best = result.value.plans.find((p) =>
      p.labels?.includes('best-value')
    );
    return best || result.value.plans[0];
  }
  return (
    result.value.plans.find(
      (p) => p.carrierCode + p.speed === selectedKey.value
    ) || result.value.plans[0]
  );
});

function onSelectPlan(plan) {
  selectedKey.value = plan.carrierCode + plan.speed;
}

function onStartCalculate() {
  refreshRates();
  selectedKey.value = '';
  uni.pageScrollTo({
    selector: '#result-section',
    duration: 300,
  });
}

function onReset() {
  uni.showModal({
    title: '确认清空',
    content: '将清空所有输入，继续吗？',
    success: (res) => {
      if (res.confirm) {
        reset();
        selectedKey.value = '';
        speedFilter.value = '';
      }
    },
  });
}

function onSave() {
  const record = {
    id: generateId(),
    createdAt: Date.now(),
    productName: form.productName || '未命名商品',
    form: JSON.parse(JSON.stringify(form)),
    cargo: JSON.parse(JSON.stringify(result.value.cargo)),
    sellingCNY: result.value.sellingCNY,
    plan: JSON.parse(JSON.stringify(selectedPlan.value)),
  };
  appendHistory(record);
  uni.showToast({ title: '已保存到历史', icon: 'success' });
}

function onExport() {
  const p = selectedPlan.value;
  if (!p) return;
  const text = [
    `【Ozon 利润计算 · ${form.productName || '未命名'}】`,
    `售价：¥${result.value.sellingCNY.toFixed(2)}`,
    `物流方案：${p.carrierName} · ${p.speedLabel}（${p.transitDays}）`,
    `运费：¥${p.shippingCost.toFixed(2)}`,
    `总成本：¥${p.totalCost.toFixed(2)}`,
    `利润：¥${p.profit.toFixed(2)}  利润率：${p.profitRate.toFixed(2)}%`,
  ].join('\n');

  // #ifdef H5
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
      })
      .catch(() => {
        fallbackCopy(text);
      });
    return;
  }
  // #endif

  fallbackCopy(text);
}

function fallbackCopy(text) {
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'none' }),
    fail: () => uni.showToast({ title: '复制失败，请重试', icon: 'none' }),
  });
}

function goHistory() {
  uni.navigateTo({ url: '/pages/history/history' });
}

function goAdmin() {
  uni.navigateTo({ url: '/pages/admin/admin' });
}

// 输入变化时重置筛选
watch(
  () => [form.weight, form.goodsValueRUB, form.destination],
  () => {
    if (speedFilter.value) speedFilter.value = '';
  }
);

onShow(() => {
  refreshRates();
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 140rpx;
}

.container {
  max-width: 1280rpx;
  margin: 0 auto;
  padding: 24rpx 24rpx 40rpx;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  background: linear-gradient(135deg, #1e5fa8 0%, #144a85 100%);
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  color: #ffffff;
  box-shadow: 0 6rpx 20rpx rgba(30, 95, 168, 0.25);
}

.brand {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.brand-icon {
  font-size: 56rpx;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.brand-title {
  font-size: 34rpx;
  font-weight: 700;
}

.brand-sub {
  font-size: 22rpx;
  opacity: 0.85;
}

.nav-actions {
  display: flex;
  gap: 12rpx;
}

.nav-btn {
  padding: 12rpx 20rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 12rpx;
  font-size: 24rpx;
  backdrop-filter: blur(10rpx);

  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24rpx;
}

.calc-action-card {
  padding: 28rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #eef5ff 0%, #ffffff 100%);
  border: 1rpx solid rgba(30, 95, 168, 0.14);
  box-shadow: 0 10rpx 24rpx rgba(30, 95, 168, 0.06);
}

.calc-action-note {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.calc-action-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #17324f;
}

.calc-action-sub {
  font-size: 22rpx;
  color: #6b7f95;
}

.calc-action-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx 0;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #1e5fa8 0%, #3b7bc4 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(30, 95, 168, 0.26);

  &:active {
    transform: scale(0.98);
  }
}

/* PC 端双栏 */
/* #ifdef H5 */
@media (min-width: 900px) {
  .layout {
    grid-template-columns: 480rpx 1fr;
  }
}
@media (min-width: 1200px) {
  .layout {
    grid-template-columns: 560rpx 1fr;
  }
}
/* #endif */

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #e5e7eb;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
  z-index: 100;
}

.bb-btn {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.15s;

  &.primary {
    background: linear-gradient(135deg, #1e5fa8 0%, #3b7bc4 100%);
    color: #ffffff;
    box-shadow: 0 4rpx 12rpx rgba(30, 95, 168, 0.3);
    flex: 2;
  }

  &.secondary {
    background: #f3f4f6;
    color: #4b5563;
  }

  &:active {
    transform: scale(0.97);
  }
}

.footer {
  margin-top: 40rpx;
  text-align: center;
  font-size: 22rpx;
  color: #9ca3af;
}
</style>
