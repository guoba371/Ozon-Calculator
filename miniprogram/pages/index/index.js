const calculator = require('../../utils/calculator.js')

function buildPlanKey(plan) {
  return [plan.carrier, plan.product, plan.speed].join('|')
}

Page({
  data: {
    input: calculator.getDefaultInput(),
    result: null,
    selectedPlanKey: '',
    destinations: Object.keys(calculator.DESTINATIONS).map((key) => ({
      value: key,
      label: calculator.DESTINATIONS[key].label
    })),
    currencies: Object.keys(calculator.CURRENCIES).map((key) => ({
      value: key,
      label: `${key} / ${calculator.CURRENCIES[key].label}`
    })),
    presets: calculator.COMMISSION_PRESETS.map((item) => ({
      value: item.id,
      label: item.rate == null ? item.name : `${item.name}（${item.rate}%）`
    })),
    analysisCards: [],
    selectedPlan: null,
    destinationLabel: '',
    currencyLabel: '',
    presetLabel: ''
  },

  onLoad() {
    this.applyPresetRate()
    this.calculateAndRender()
  },

  applyPresetRate() {
    const input = { ...this.data.input }
    if (input.commissionPreset !== 'custom') {
      const rate = calculator.getCommissionRateByPreset(input.commissionPreset, input.salesMode)
      if (rate != null) {
        input.commissionRate = rate
      }
    }
    this.setData({ input })
  },

  calculateAndRender() {
    const result = calculator.calculate(this.data.input)
    const plans = result.plans.map((plan) => ({
      ...plan,
      planKey: buildPlanKey(plan),
      shippingCostText: plan.shippingCost.toFixed(2),
      totalCostText: plan.totalCost.toFixed(2),
      profitText: plan.profit.toFixed(2),
      profitRateText: plan.profitRate.toFixed(2),
      targetPricingText: plan.targetPricing
        ? plan.targetPricing.feasible === false
          ? `反推售价失败：${plan.targetPricing.reason}`
          : `目标利润率 ${Number(plan.targetPricing.targetProfitRate || 0).toFixed(2)}% 时，建议售价 ${this.data.input.currency} ${Number(plan.targetPricing.requiredSellingFX || 0).toFixed(2)}`
        : ''
    }))
    const selectedPlan =
      plans.find((plan) => plan.planKey === this.data.selectedPlanKey) || plans[0] || null
    const analysisCards = [
      {
        label: '体积重',
        value: `${result.summary.volumeWeight}kg`,
        note: 'L x W x H / 6000'
      },
      {
        label: '计费重',
        value: `${result.summary.chargeableWeight}kg`,
        note: '取实重与体积重较大值'
      },
      {
        label: '货物类型',
        value: result.summary.cargoType,
        note: result.summary.cargoType === '抛货' ? '体积重主导' : '实重主导'
      },
      {
        label: '重量区间',
        value: result.summary.weightRange.label,
        note: result.summary.weightRange.detail
      }
    ]
    const destinationLabel = calculator.DESTINATIONS[this.data.input.destination].label
    const currencyLabel = `${this.data.input.currency} / ${calculator.CURRENCIES[this.data.input.currency].label}`
    const preset = this.data.presets.find((item) => item.value === this.data.input.commissionPreset)
    const presetLabel = preset ? preset.label : '请选择'

    this.setData({
      result: {
        ...result,
        plans
      },
      selectedPlan,
      analysisCards,
      destinationLabel,
      currencyLabel,
      presetLabel
    })
  },

  handleModeTap(event) {
    const { mode } = event.currentTarget.dataset
    this.setData({
      input: {
        ...this.data.input,
        salesMode: mode
      }
    })
    this.applyPresetRate()
    this.calculateAndRender()
  },

  handleTextInput(event) {
    const { field } = event.currentTarget.dataset
    const value = event.detail.value
    const numericFields = [
      'cost',
      'weight',
      'length',
      'width',
      'height',
      'sellingPriceFX',
      'exchangeRate',
      'goodsValueRUB',
      'shippingShareRate',
      'targetProfitRate',
      'commissionRate',
      'commissionAmount',
      'advertisingValue',
      'operationFee'
    ]
    const parsedValue =
      numericFields.includes(field)
        ? value === ''
          ? null
          : Number(value || 0)
        : value
    this.setData({
      input: {
        ...this.data.input,
        [field]: parsedValue
      }
    })
    this.calculateAndRender()
  },

  handleDestinationChange(event) {
    const index = Number(event.detail.value)
    this.setData({
      input: {
        ...this.data.input,
        destination: this.data.destinations[index].value
      }
    })
    this.calculateAndRender()
  },

  handleCurrencyChange(event) {
    const index = Number(event.detail.value)
    const currency = this.data.currencies[index].value
    this.setData({
      input: {
        ...this.data.input,
        currency,
        exchangeRate: calculator.CURRENCIES[currency].defaultRate
      }
    })
    this.calculateAndRender()
  },

  handlePresetChange(event) {
    const index = Number(event.detail.value)
    this.setData({
      input: {
        ...this.data.input,
        commissionPreset: this.data.presets[index].value
      }
    })
    this.applyPresetRate()
    this.calculateAndRender()
  },

  handleCommissionModeChange(event) {
    const mode = event.currentTarget.dataset.mode
    this.setData({
      input: {
        ...this.data.input,
        commissionInputMode: mode
      }
    })
    this.calculateAndRender()
  },

  handleAdvertisingModeChange(event) {
    const mode = event.currentTarget.dataset.mode
    this.setData({
      input: {
        ...this.data.input,
        advertisingMode: mode
      }
    })
    this.calculateAndRender()
  },

  handlePlanTap(event) {
    const { key } = event.currentTarget.dataset
    this.setData({ selectedPlanKey: key })
    this.calculateAndRender()
  },

  saveRecord() {
    const records = wx.getStorageSync('ozon-mini-history') || []
    const selectedPlan = this.data.selectedPlan
    records.unshift({
      title: this.data.input.productName || '未命名商品',
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      destination: calculator.DESTINATIONS[this.data.input.destination].label,
      plan: selectedPlan ? `${selectedPlan.carrier}/${selectedPlan.speed}` : '暂无方案',
      profit: selectedPlan ? selectedPlan.profit : 0
    })
    wx.setStorageSync('ozon-mini-history', records.slice(0, 10))
    wx.showToast({
      title: '已保存本地记录',
      icon: 'success'
    })
  },

  startCalculate() {
    this.setData({ selectedPlanKey: '' })
    this.calculateAndRender()
    wx.pageScrollTo({
      selector: '#result-section',
      duration: 300
    })
  }
})
