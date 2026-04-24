(function () {
  var calculator = window.OzonCalculator

  var STORAGE_KEYS = {
    draft: 'ozon-calculator-draft-v1',
    history: 'ozon-calculator-history-v1'
  }

  var state = {
    input: calculator.getDefaultInput(),
    result: null,
    selectedPlanKey: ''
  }

  var form = document.getElementById('calculator-form')
  var assumptionList = document.getElementById('assumption-list')
  var analysisCards = document.getElementById('analysis-cards')
  var summaryMetrics = document.getElementById('summary-metrics')
  var plansBody = document.getElementById('plans-body')
  var historyList = document.getElementById('history-list')
  var planCount = document.getElementById('plan-count')
  var salesModeToggle = document.getElementById('sales-mode-toggle')
  var costRing = document.getElementById('cost-ring')
  var destinationSelect = document.getElementById('destination-select')
  var currencySelect = document.getElementById('currency-select')
  var commissionPresetSelect = document.getElementById('commission-preset')
  var commissionInputModeSelect = document.getElementById('commission-input-mode')
  var saveButton = document.getElementById('save-btn')
  var shareButton = document.getElementById('share-btn')
  var exportButton = document.getElementById('export-btn')
  var clearButton = document.getElementById('clear-btn')
  var calculateButton = document.getElementById('calculate-btn')
  var historyTemplate = document.getElementById('history-item-template')

  function formatMoney(value) {
    return '¥' + Number(value || 0).toFixed(2)
  }

  function formatPercent(value) {
    return Number(value || 0).toFixed(2) + '%'
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function buildPlanKey(plan) {
    return [plan.carrier, plan.product, plan.speed].join('|')
  }

  function loadDraft() {
    var shared = calculator.deserializeShareState(window.location.hash.replace(/^#/, ''))
    if (shared) {
      return Object.assign({}, calculator.getDefaultInput(), shared)
    }

    try {
      var stored = localStorage.getItem(STORAGE_KEYS.draft)
      if (!stored) {
        return calculator.getDefaultInput()
      }
      return Object.assign({}, calculator.getDefaultInput(), JSON.parse(stored))
    } catch (error) {
      return calculator.getDefaultInput()
    }
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(state.input))
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]')
    } catch (error) {
      return []
    }
  }

  function saveHistory(entries) {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(entries.slice(0, 18)))
  }

  function populateSelect(select, items, labelKey, valueKey) {
    select.innerHTML = items
      .map(function (item) {
        return '<option value="' + item[valueKey] + '">' + escapeHtml(item[labelKey]) + '</option>'
      })
      .join('')
  }

  function renderSalesModes() {
    salesModeToggle.innerHTML = Object.keys(calculator.SALES_MODES)
      .map(function (key) {
        var mode = calculator.SALES_MODES[key]
        var activeClass = state.input.salesMode === mode.code ? ' active' : ''
        return (
          '<button class="mode-btn' +
          activeClass +
          '" type="button" data-mode="' +
          mode.code +
          '">' +
          '<strong>' +
          escapeHtml(mode.label) +
          '</strong>' +
          '<span>' +
          escapeHtml(mode.description) +
          '</span>' +
          '</button>'
        )
      })
      .join('')
  }

  function applyPresetRate() {
    if (state.input.commissionPreset === 'custom') {
      return
    }
    var rate = calculator.getCommissionRateByPreset(state.input.commissionPreset, state.input.salesMode)
    if (rate != null) {
      state.input.commissionRate = rate
    }
  }

  function applyInputToForm() {
    Array.prototype.forEach.call(form.elements, function (element) {
      if (!element.name || !(element.name in state.input)) {
        return
      }
      element.value = state.input[element.name]
    })
    updateConditionalFields()
    renderSalesModes()
  }

  function readInputFromForm() {
    var data = {}
    Array.prototype.forEach.call(form.elements, function (element) {
      if (!element.name) {
        return
      }
      data[element.name] = element.value
    })

    var nextInput = Object.assign({}, state.input, data)
    ;['cost', 'weight', 'length', 'width', 'height', 'sellingPriceFX', 'exchangeRate', 'shippingShareRate', 'commissionRate', 'commissionAmount', 'advertisingValue', 'operationFee', 'goodsValueRUB'].forEach(function (key) {
      nextInput[key] = Number(nextInput[key] || 0)
    })
    state.input = nextInput
  }

  function updateConditionalFields() {
    var rateField = document.querySelector('[data-role="commission-rate"]')
    var amountField = document.querySelector('[data-role="commission-amount"]')
    var isAmount = state.input.commissionInputMode === 'amount'
    rateField.style.display = isAmount ? 'none' : ''
    amountField.style.display = isAmount ? '' : 'none'
  }

  function calculateAndRender() {
    state.result = calculator.calculate(state.input)
    saveDraft()
    renderAssumptions()
    renderAnalysis()
    renderPlans()
    renderSummary()
    renderHistory()
  }

  function renderAssumptions() {
    assumptionList.innerHTML = state.result.meta.assumptions
      .map(function (item) {
        return '<li>' + escapeHtml(item) + '</li>'
      })
      .join('')
  }

  function renderAnalysis() {
    var summary = state.result.summary
    var items = [
      { label: '体积重', value: summary.volumeWeight + 'kg', note: 'L x W x H / 6000' },
      { label: '计费重', value: summary.chargeableWeight + 'kg', note: '物流商取实重与体积重较大值' },
      { label: '货物类型', value: summary.cargoType, note: summary.cargoType === '抛货' ? '体积重主导' : '实重主导' },
      { label: '重量区间', value: summary.weightRange.label, note: summary.weightRange.detail },
      { label: '售价折算', value: formatMoney(summary.sellingPriceCNY), note: state.input.currency + ' -> CNY' },
      { label: '物流产品线', value: summary.productLineKey ? state.result.plans[0] ? state.result.plans[0].product : '已匹配' : '未匹配', note: summary.productLineKey ? '按货值与计费重自动判断' : '货值或重量超出当前规则' }
    ]

    analysisCards.innerHTML = items
      .map(function (item) {
        return (
          '<article class="analysis-tile">' +
          '<span class="label">' +
          escapeHtml(item.label) +
          '</span>' +
          '<strong>' +
          escapeHtml(item.value) +
          '</strong>' +
          '<small>' +
          escapeHtml(item.note) +
          '</small>' +
          '</article>'
        )
      })
      .join('')
  }

  function getSelectedPlan() {
    if (!state.result.plans.length) {
      return null
    }
    var selected = state.result.plans.find(function (plan) {
      return buildPlanKey(plan) === state.selectedPlanKey
    })
    return selected || state.result.bestPlan
  }

  function renderSummary() {
    var summary = state.result.summary
    var plan = getSelectedPlan()

    if (!plan) {
      summaryMetrics.innerHTML =
        '<div class="empty-state">当前参数下没有可用物流方案。请检查目的地、货值区间或商品重量是否超出已录入报价范围。</div>'
      costRing.style.background = 'conic-gradient(#dee8f3 0deg 360deg)'
      return
    }

    var parts = [
      { name: '货本', value: summary.cost, color: '#1e5fa8' },
      { name: '物流费', value: plan.shippingCost, color: '#7fc8ff' },
      { name: '平台佣金', value: summary.commissionFee, color: '#8cd7a7' },
      { name: '广告费', value: summary.advertisingFee, color: '#f6b565' },
      { name: '操作费', value: summary.operationFee, color: '#dee8f3' }
    ]
    var total = parts.reduce(function (sum, part) {
      return sum + part.value
    }, 0) || 1
    var angle = 0
    var gradient = parts
      .map(function (part) {
        var start = angle
        angle += (part.value / total) * 360
        return part.color + ' ' + start + 'deg ' + angle + 'deg'
      })
      .join(', ')
    costRing.style.background = 'conic-gradient(' + gradient + ')'

    var metrics = [
      { name: '选中方案', value: plan.carrier + ' / ' + plan.speed },
      { name: '产品线', value: plan.product },
      { name: '物流费', value: formatMoney(plan.shippingCost) },
      { name: '总成本', value: formatMoney(plan.totalCost) },
      { name: '利润', value: formatMoney(plan.profit), tone: plan.profit >= 0 ? 'value-positive' : 'value-negative' },
      { name: '利润率', value: formatPercent(plan.profitRate), tone: plan.profitRate >= 0 ? 'value-positive' : 'value-negative' },
      { name: '广告费', value: formatMoney(summary.advertisingFee) },
      { name: '平台佣金', value: formatMoney(summary.commissionFee) }
    ]

    summaryMetrics.innerHTML = metrics
      .map(function (metric) {
        return (
          '<div class="metric-card">' +
          '<span class="name">' +
          escapeHtml(metric.name) +
          '</span>' +
          '<span class="value ' +
          escapeHtml(metric.tone || '') +
          '">' +
          escapeHtml(metric.value) +
          '</span>' +
          '</div>'
        )
      })
      .join('')
  }

  function renderPlans() {
    planCount.textContent =
      state.result.plans.length + ' 个方案 | 未录入：' + state.result.meta.unsupportedCarriers.join(' / ')

    if (!state.result.plans.length) {
      plansBody.innerHTML =
        '<tr><td colspan="7"><div class="empty-state">没有匹配到有效报价，请调整货值、重量或目的地。</div></td></tr>'
      return
    }

    plansBody.innerHTML = state.result.plans
      .map(function (plan) {
        var activeClass = buildPlanKey(plan) === buildPlanKey(getSelectedPlan()) ? 'active' : ''
        var tags = plan.tags
          .map(function (tag) {
            return '<span class="tag ' + escapeHtml(tag.type) + '">' + escapeHtml(tag.label) + '</span>'
          })
          .join('')
        var warning = plan.warningMessage
          ? '<span class="warning-copy">' + escapeHtml(plan.warningMessage) + '</span>'
          : ''

        return (
          '<tr class="' +
          activeClass +
          '" data-plan-key="' +
          escapeHtml(buildPlanKey(plan)) +
          '">' +
          '<td><div class="table-main"><strong>' +
          escapeHtml(plan.carrier) +
          '</strong><div class="tag-row">' +
          tags +
          '</div>' +
          warning +
          '</div></td>' +
          '<td>' +
          escapeHtml(plan.product) +
          '</td>' +
          '<td>' +
          escapeHtml(plan.speed + ' / ' + plan.transitDays) +
          '</td>' +
          '<td>' +
          escapeHtml(formatMoney(plan.shippingCost)) +
          '</td>' +
          '<td>' +
          escapeHtml(formatMoney(plan.totalCost)) +
          '</td>' +
          '<td class="' +
          (plan.profit >= 0 ? 'value-positive' : 'value-negative') +
          '">' +
          escapeHtml(formatMoney(plan.profit)) +
          '</td>' +
          '<td class="' +
          (plan.profitRate >= 0 ? 'value-positive' : 'value-negative') +
          '">' +
          escapeHtml(formatPercent(plan.profitRate)) +
          '</td>' +
          '</tr>'
        )
      })
      .join('')
  }

  function renderHistory() {
    var entries = loadHistory()

    if (!entries.length) {
      historyList.innerHTML =
        '<div class="empty-state">还没有保存记录。你可以先调一组参数，点击“保存记录”，后续可一键恢复继续比价。</div>'
      return
    }

    historyList.innerHTML = ''
    entries.forEach(function (entry) {
      var node = historyTemplate.content.firstElementChild.cloneNode(true)
      node.dataset.historyId = entry.id
      node.querySelector('.history-title').textContent = entry.title
      node.querySelector('.history-meta').textContent =
        entry.timestampLabel + ' | ' + entry.destinationLabel + ' | ' + entry.bestPlanLabel
      historyList.appendChild(node)
    })
  }

  function handleFormChange(event) {
    var name = event.target.name
    if (!name) {
      return
    }

    if (name === 'currency') {
      state.input.currency = event.target.value
      state.input.exchangeRate = calculator.CURRENCIES[event.target.value].defaultRate
      applyInputToForm()
    } else if (name === 'salesMode') {
      state.input.salesMode = event.target.value
    } else {
      readInputFromForm()
    }

    if (name === 'commissionPreset' || name === 'salesMode') {
      readInputFromForm()
      applyPresetRate()
      applyInputToForm()
    }

    if (name === 'commissionInputMode') {
      readInputFromForm()
      updateConditionalFields()
    }

    readInputFromForm()
    calculateAndRender()
  }

  function handleModeClick(event) {
    var button = event.target.closest('[data-mode]')
    if (!button) {
      return
    }
    state.input.salesMode = button.dataset.mode
    applyPresetRate()
    applyInputToForm()
    calculateAndRender()
  }

  function handlePlanClick(event) {
    var row = event.target.closest('[data-plan-key]')
    if (!row) {
      return
    }
    state.selectedPlanKey = row.dataset.planKey
    renderPlans()
    renderSummary()
  }

  function handleHistoryClick(event) {
    var item = event.target.closest('[data-history-id]')
    if (!item) {
      return
    }
    var entries = loadHistory()
    var selected = entries.find(function (entry) {
      return entry.id === item.dataset.historyId
    })
    if (!selected) {
      return
    }
    state.input = Object.assign({}, calculator.getDefaultInput(), selected.input)
    state.selectedPlanKey = selected.selectedPlanKey || ''
    applyPresetRate()
    applyInputToForm()
    calculateAndRender()
  }

  function handleSave() {
    var bestPlan = getSelectedPlan()
    var entries = loadHistory()
    var entry = {
      id: 'calc-' + Date.now(),
      title: state.input.productName || '未命名商品',
      timestampLabel: new Date().toLocaleString('zh-CN', { hour12: false }),
      destinationLabel: calculator.DESTINATIONS[state.input.destination].label,
      bestPlanLabel: bestPlan ? bestPlan.carrier + ' / ' + bestPlan.speed + ' / ' + formatMoney(bestPlan.profit) : '暂无方案',
      selectedPlanKey: state.selectedPlanKey,
      input: state.input
    }
    entries.unshift(entry)
    saveHistory(entries)
    renderHistory()
    window.alert('已保存到本地历史记录。')
  }

  function handleShare() {
    var shareValue = calculator.serializeShareState(state.input)
    var url = window.location.href.split('#')[0] + '#' + shareValue
    navigator.clipboard.writeText(url).then(
      function () {
        window.alert('分享链接已复制。')
      },
      function () {
        window.prompt('复制下面的分享链接', url)
      }
    )
  }

  function buildCsvRowsFromCurrent() {
    var header = ['商品名称', '销售模式', '市场', '物流商', '产品线', '速度', '时效', '运费', '总成本', '利润', '利润率']
    var rows = state.result.plans.map(function (plan) {
      return [
        state.input.productName || '',
        state.input.salesMode,
        calculator.DESTINATIONS[state.input.destination].label,
        plan.carrier,
        plan.product,
        plan.speed,
        plan.transitDays,
        plan.shippingCost,
        plan.totalCost,
        plan.profit,
        plan.profitRate + '%'
      ]
    })
    return [header].concat(rows)
  }

  function buildCsvRowsFromHistory(entries) {
    var header = ['时间', '商品名称', '市场', '售价货币', '售价', '汇率', '佣金率', '目标物流', '目标方案', '货本', '利润参考']
    var rows = entries.map(function (entry) {
      return [
        entry.timestampLabel,
        entry.title,
        entry.destinationLabel,
        entry.input.currency,
        entry.input.sellingPriceFX,
        entry.input.exchangeRate,
        entry.input.commissionRate,
        entry.bestPlanLabel.split(' / ')[0] || '',
        entry.bestPlanLabel,
        entry.input.cost,
        entry.bestPlanLabel
      ]
    })
    return [header].concat(rows)
  }

  function downloadCsv(rows, filename) {
    var csv = rows
      .map(function (row) {
        return row
          .map(function (cell) {
            return '"' + String(cell).replace(/"/g, '""') + '"'
          })
          .join(',')
      })
      .join('\n')
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    var link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExport() {
    var entries = loadHistory()
    var rows = entries.length ? buildCsvRowsFromHistory(entries) : buildCsvRowsFromCurrent()
    downloadCsv(rows, 'ozon-profit-calculator-' + Date.now() + '.csv')
  }

  function handleClear() {
    state.input = calculator.getDefaultInput()
    state.selectedPlanKey = ''
    localStorage.removeItem(STORAGE_KEYS.draft)
    window.history.replaceState(null, '', window.location.pathname)
    applyInputToForm()
    calculateAndRender()
  }

  function handleCalculate() {
    readInputFromForm()
    state.selectedPlanKey = ''
    calculateAndRender()
    var resultSection = document.getElementById('result-section')
    if (resultSection && typeof resultSection.scrollIntoView === 'function') {
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function bindEvents() {
    form.addEventListener('input', handleFormChange)
    form.addEventListener('change', handleFormChange)
    salesModeToggle.addEventListener('click', handleModeClick)
    plansBody.addEventListener('click', handlePlanClick)
    historyList.addEventListener('click', handleHistoryClick)
    saveButton.addEventListener('click', handleSave)
    shareButton.addEventListener('click', handleShare)
    exportButton.addEventListener('click', handleExport)
    clearButton.addEventListener('click', handleClear)
    calculateButton.addEventListener('click', handleCalculate)
  }

  function initOptions() {
    populateSelect(
      destinationSelect,
      Object.keys(calculator.DESTINATIONS).map(function (key) {
        return { value: key, label: calculator.DESTINATIONS[key].label }
      }),
      'label',
      'value'
    )

    populateSelect(
      currencySelect,
      Object.keys(calculator.CURRENCIES).map(function (key) {
        return { value: key, label: key + ' / ' + calculator.CURRENCIES[key].label }
      }),
      'label',
      'value'
    )

    populateSelect(
      commissionPresetSelect,
      calculator.COMMISSION_PRESETS.map(function (item) {
        return {
          value: item.id,
          label: item.rate == null ? item.name : item.name + '（' + item.rate + '%）'
        }
      }),
      'label',
      'value'
    )
  }

  function init() {
    initOptions()
    state.input = loadDraft()
    applyPresetRate()
    applyInputToForm()
    bindEvents()
    calculateAndRender()
  }

  init()
})()
