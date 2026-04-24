import { reactive, computed, watch, ref } from 'vue';
import { calcAll } from '../utils/profit.js';
import { CURRENCIES, getReferenceCommissionRate } from '../data/commissions.js';
import {
  loadFormDraft,
  saveFormDraft,
  loadRateOverrides,
} from '../utils/storage.js';

export function createDefaultForm() {
  return {
    productName: '',
    cost: null,
    weight: null,
    length: null,
    width: null,
    height: null,

    sellingPriceFX: null,
    currency: 'RUB',
    exchangeRate: 0.076,
    destination: 'RU',
    goodsValueRUB: null,
    goodsValueCustomized: false,

    salesMode: 'rFBS',
    category: 'other',
    commissionMode: 'rate', // rate | amount
    commissionRate: 15,
    commissionRateCustomized: false,
    commissionAmount: null,

    advertisingFee: 0,
    operationFee: 12,
    freightShareRate: 0,
  };
}

export function useCalculator() {
  const form = reactive(createDefaultForm());
  const rateVersion = ref(0);

  // 尝试从缓存恢复
  const draft = loadFormDraft();
  if (draft && typeof draft === 'object') {
    Object.assign(form, draft);
  }

  // 售价币种变化时自动带入参考汇率
  watch(
    () => form.currency,
    (cur) => {
      const c = CURRENCIES.find((x) => x.code === cur);
      if (c) form.exchangeRate = c.refRate;
    }
  );

  // 销售模式/品类变化时更新参考佣金率（仅当用户未自定义）
  watch(
    () => [
      form.salesMode,
      form.category,
      form.commissionMode,
      form.commissionRateCustomized,
    ],
    () => {
      if (form.commissionMode === 'rate' && !form.commissionRateCustomized) {
        form.commissionRate = getReferenceCommissionRate(
          form.category,
          form.salesMode
        );
      }
    }
  );

  // 售价币种为卢布时，自动同步货值
  watch(
    () => [form.sellingPriceFX, form.currency, form.goodsValueCustomized],
    ([price, cur, customized]) => {
      if (cur === 'RUB' && !customized) {
        form.goodsValueRUB = price || null;
      }
    }
  );

  // 持久化草稿
  watch(
    form,
    (v) => {
      saveFormDraft(JSON.parse(JSON.stringify(v)));
    },
    { deep: true }
  );

  const result = computed(() => {
    rateVersion.value;
    return calcAll(form, {
      rateOverrides: loadRateOverrides(),
    });
  });

  function reset() {
    Object.assign(form, createDefaultForm());
  }

  function refreshRates() {
    rateVersion.value += 1;
  }

  return { form, result, reset, refreshRates };
}
