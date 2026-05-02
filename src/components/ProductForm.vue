<template>
  <view class="card">
    <view class="card-header">
      <text class="card-title">① 商品信息</text>
      <text class="card-hint">货本、尺寸、实重</text>
    </view>

    <view class="form-row">
      <text class="label">商品名称</text>
      <input
        class="input"
        type="text"
        v-model="form.productName"
        placeholder="选填，如：三合一儿童滑梯"
      />
    </view>

    <view class="form-row">
      <text class="label">商品链接</text>
      <input
        class="input"
        type="text"
        v-model="form.productLink"
        placeholder="选填，可粘贴 Ozon 或采购链接"
      />
    </view>

    <view class="form-row">
      <text class="label">货本 <text class="required">*</text></text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.cost"
          @input="form.cost = toNum($event)"
          placeholder="采购+包材，如 62"
        />
        <text class="suffix">元</text>
      </view>
    </view>

    <view class="form-row">
      <text class="label">实际重量 <text class="required">*</text></text>
      <view class="input-suffix">
        <input
          class="input"
          type="digit"
          :value="form.weight"
          @input="form.weight = toNum($event)"
          placeholder="如 4.0"
        />
        <text class="suffix">kg</text>
      </view>
    </view>

    <view class="form-row">
      <text class="label">包裹尺寸 <text class="required">*</text></text>
      <view class="size-group">
        <input
          class="input size-input"
          type="digit"
          :value="form.length"
          @input="form.length = toNum($event)"
          placeholder="长"
        />
        <text class="size-x">×</text>
        <input
          class="input size-input"
          type="digit"
          :value="form.width"
          @input="form.width = toNum($event)"
          placeholder="宽"
        />
        <text class="size-x">×</text>
        <input
          class="input size-input"
          type="digit"
          :value="form.height"
          @input="form.height = toNum($event)"
          placeholder="高"
        />
        <text class="suffix">cm</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  form: { type: Object, required: true },
});

function toNum(e) {
  const v = e.detail ? e.detail.value : e.target?.value;
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
</script>

<style lang="scss" scoped>
@import '../styles/form.scss';
</style>
