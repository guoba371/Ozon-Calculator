<template>
  <view class="page">
    <view class="container">
      <view class="toolbar">
        <text class="title">计算历史 · {{ list.length }} 条</text>
        <view class="toolbar-actions">
          <view class="tb-btn" @click="onExportAll" v-if="list.length">
            导出 CSV
          </view>
          <view class="tb-btn danger" @click="onClearAll" v-if="list.length">
            清空
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无历史记录</text>
        <view class="empty-btn" @click="goBack">返回计算</view>
      </view>

      <view class="list">
        <view v-for="r in list" :key="r.id" class="record">
          <view class="rec-header">
            <view class="rec-title">
              <text class="rec-name">{{ r.productName }}</text>
              <text class="rec-time">{{ formatDateTime(r.createdAt) }}</text>
            </view>
            <view class="rec-del" @click.stop="onRemove(r.id)">删除</view>
          </view>

          <view class="rec-meta">
            <text class="rec-tag">{{ r.plan.carrierName }} · {{ r.plan.speedLabel }}</text>
            <text class="rec-tag">{{ r.plan.transitDays }}</text>
            <text class="rec-tag">{{ r.form.salesMode }}</text>
          </view>
          <view v-if="r.form?.productLink" class="rec-link">
            {{ r.form.productLink }}
          </view>

          <view class="rec-numbers">
            <view class="rn-item">
              <text class="rn-label">售价</text>
              <text class="rn-val">¥{{ money(r.sellingCNY) }}</text>
            </view>
            <view class="rn-item">
              <text class="rn-label">运费</text>
              <text class="rn-val">¥{{ money(r.plan.shippingCost) }}</text>
            </view>
            <view class="rn-item">
              <text class="rn-label">利润</text>
              <text :class="['rn-val', profitCls(r.plan.profit)]">
                ¥{{ money(r.plan.profit) }}
              </text>
            </view>
            <view class="rn-item">
              <text class="rn-label">利润率</text>
              <text :class="['rn-val', profitCls(r.plan.profit)]">
                {{ percent(r.plan.profitRate) }}
              </text>
            </view>
          </view>

          <view class="expense-list">
            <view
              v-for="item in expenseItems(r)"
              :key="item.key"
              class="expense-row"
            >
              <text class="expense-name">{{ item.label }}</text>
              <text class="expense-value">¥{{ money(item.value) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  loadHistory,
  removeHistory,
  clearHistory,
} from '../../utils/storage.js';
import { money, percent, formatDateTime } from '../../utils/format.js';

const list = ref([]);

function refresh() {
  list.value = loadHistory();
}

onMounted(refresh);

function profitCls(v) {
  return v >= 0 ? 'positive' : 'negative';
}

function expenseItems(record) {
  if (record?.plan?.expenseItems?.length) return record.plan.expenseItems;
  const b = record?.plan?.breakdown || {};
  return [
    { key: 'cost', label: '货本', value: b.cost || record?.form?.cost || 0 },
    { key: 'shipping', label: '物流费', value: b.shipping || record?.plan?.shippingCost || 0 },
    { key: 'commission', label: '平台佣金', value: b.commission || 0 },
  ];
}

function onRemove(id) {
  uni.showModal({
    title: '删除此记录？',
    success: (res) => {
      if (res.confirm) {
        removeHistory(id);
        refresh();
      }
    },
  });
}

function onClearAll() {
  uni.showModal({
    title: '清空全部历史？',
    content: '此操作不可恢复',
    success: (res) => {
      if (res.confirm) {
        clearHistory();
        refresh();
      }
    },
  });
}

function onExportAll() {
  const header = [
    '时间',
    '商品',
    '商品链接',
    '售价(元)',
    '物流商',
    '速度',
    '时效',
    '运费',
    '总成本',
    '利润',
    '利润率%',
    '支出明细',
  ];
  const rows = list.value.map((r) => [
    formatDateTime(r.createdAt),
    r.productName,
    r.form?.productLink || '',
    r.sellingCNY,
    r.plan.carrierName,
    r.plan.speedLabel,
    r.plan.transitDays,
    r.plan.shippingCost,
    r.plan.totalCost,
    r.plan.profit,
    r.plan.profitRate,
    expenseItems(r).map((item) => `${item.label}:${money(item.value)}`).join('；'),
  ]);
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  // #ifdef H5
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ozon-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  uni.showToast({ title: '已导出 CSV', icon: 'success' });
  return;
  // #endif

  // 小程序端：复制到剪贴板
  uni.setClipboardData({
    data: csv,
    success: () => uni.showToast({ title: 'CSV 已复制', icon: 'none' }),
  });
}

function goBack() {
  uni.navigateBack({ delta: 1 });
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24rpx;
}

.container {
  max-width: 960rpx;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.toolbar-actions {
  display: flex;
  gap: 12rpx;
}

.tb-btn {
  padding: 12rpx 22rpx;
  font-size: 24rpx;
  border-radius: 10rpx;
  background: #1e5fa8;
  color: #fff;

  &.danger {
    background: #ef4444;
  }
  &:active {
    opacity: 0.85;
  }
}

.empty {
  text-align: center;
  padding: 120rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
  opacity: 0.4;
}

.empty-text {
  font-size: 26rpx;
  color: #9ca3af;
}

.empty-btn {
  margin-top: 24rpx;
  padding: 16rpx 40rpx;
  background: #1e5fa8;
  color: #fff;
  border-radius: 100rpx;
  font-size: 26rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14rpx;
}

.rec-title {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.rec-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.rec-time {
  font-size: 22rpx;
  color: #9ca3af;
}

.rec-del {
  min-width: 76rpx;
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  font-size: 22rpx;
  font-weight: 600;

  &:active {
    opacity: 0.85;
  }
}

.rec-meta {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
  margin-bottom: 14rpx;
}

.rec-link {
  font-size: 22rpx;
  color: #1e5fa8;
  word-break: break-all;
  margin-bottom: 14rpx;
}

.rec-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  background: #eef4fb;
  color: #1e5fa8;
}

.rec-numbers {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10rpx;
  padding: 14rpx;
  background: #f9fafb;
  border-radius: 12rpx;
}

.expense-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx 16rpx;
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx dashed #e5e7eb;
}

.expense-row {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
  font-size: 22rpx;
  color: #4b5563;
}

.expense-value {
  color: #1f2937;
  font-variant-numeric: tabular-nums;
}

.rn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.rn-label {
  font-size: 20rpx;
  color: #9ca3af;
}

.rn-val {
  font-size: 24rpx;
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
</style>
