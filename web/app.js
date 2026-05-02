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
  var planContextMenu = document.getElementById('plan-context-menu')
  var contextSavePlanButton = document.getElementById('context-save-plan')
  var toast = document.getElementById('toast')
  var toastTimer = null

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

  function findPlanByKey(planKey) {
    if (!state.result || !state.result.plans) {
      return null
    }
    return state.result.plans.find(function (plan) {
      return buildPlanKey(plan) === planKey
    }) || null
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

  function savePlanToHistory(plan) {
    var selectedPlan = plan || getSelectedPlan()
    var entries = loadHistory()
    var entry = {
      id: 'calc-' + Date.now(),
      title: state.input.productName || '未命名商品',
      timestampLabel: new Date().toLocaleString('zh-CN', { hour12: false }),
      destinationLabel: calculator.DESTINATIONS[state.input.destination].label,
      bestPlanLabel: selectedPlan ? selectedPlan.carrier + ' / ' + selectedPlan.speed + ' / ' + formatMoney(selectedPlan.profit) : '暂无方案',
      selectedPlanKey: selectedPlan ? buildPlanKey(selectedPlan) : state.selectedPlanKey,
      input: Object.assign({}, state.input),
      plan: selectedPlan
    }
    entries.unshift(entry)
    saveHistory(entries)
    renderHistory()
    return entry
  }

  function showToast(message) {
    if (!toast) {
      return
    }
    window.clearTimeout(toastTimer)
    toast.textContent = message
    toast.classList.add('show')
    toast.setAttribute('aria-hidden', 'false')
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('show')
      toast.setAttribute('aria-hidden', 'true')
    }, 3200)
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

  function isTargetProfitEnabled() {
    return state.input.targetProfitRate !== null && state.input.targetProfitRate !== undefined && state.input.targetProfitRate !== ''
  }

  function syncAutoGoodsValue() {
    if (state.input.goodsValueCustomized) {
      return false
    }
    var nextValue = calculator.computeAutoGoodsValueRUB(state.input)
    if (nextValue == null) {
      if (state.input.goodsValueRUB == null || state.input.goodsValueRUB === 0) {
        return false
      }
      state.input.goodsValueRUB = null
      return true
    }
    if (Math.abs(Number(state.input.goodsValueRUB || 0) - nextValue) < 0.01) {
      return false
    }
    state.input.goodsValueRUB = nextValue
    return true
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
    ;[
      'cost',
      'weight',
      'length',
      'width',
      'height',
      'sellingPriceFX',
      'exchangeRate',
      'shippingShareRate',
      'commissionRate',
      'commissionAmount',
      'advertisingValue',
      'operationFee',
      'labelFeeCNY',
      'celLastMileRUB',
      'returnRate',
      'withdrawalFeeRate',
      'goodsValueRUB'
    ].forEach(function (key) {
      nextInput[key] = Number(nextInput[key] || 0)
    })
    nextInput.targetProfitRate =
      nextInput.targetProfitRate === '' || nextInput.targetProfitRate == null
        ? null
        : Number(nextInput.targetProfitRate)
    state.input = nextInput
  }

  function updateConditionalFields() {
    var rateField = document.querySelector('[data-role="commission-rate"]')
    var amountField = document.querySelector('[data-role="commission-amount"]')
    var isAmount = state.input.commissionInputMode === 'amount'
    rateField.style.display = isAmount ? 'none' : ''
    amountField.style.display = isAmount ? '' : 'none'
    var sellingPriceInput = form.elements.namedItem('sellingPriceFX')
    if (sellingPriceInput) {
      sellingPriceInput.disabled = isTargetProfitEnabled()
    }
    updateFieldFeedback()
  }

  function setFieldMessage(element, message) {
    if (!element || !element.parentElement) {
      return
    }
    var messageNode = element.parentElement.querySelector('.field-message')
    if (!messageNode) {
      messageNode = document.createElement('small')
      messageNode.className = 'field-message'
      element.parentElement.appendChild(messageNode)
    }
    messageNode.textContent = message || ''
    element.parentElement.classList.toggle('has-message', Boolean(message))
  }

  function updateFieldFeedback() {
    if (!form || !form.elements) {
      return
    }
    var sellingPriceInput = form.elements.namedItem('sellingPriceFX')
    var exchangeRateInput = form.elements.namedItem('exchangeRate')
    var targetProfitInput = form.elements.namedItem('targetProfitRate')
    setFieldMessage(
      sellingPriceInput,
      isTargetProfitEnabled() ? '已由目标利润率自动反推，清空目标利润率后可手动编辑。' : ''
    )
    setFieldMessage(exchangeRateInput, Number(exchangeRateInput && exchangeRateInput.value) <= 0 ? '汇率需大于 0。' : '')
    setFieldMessage(targetProfitInput, Number(targetProfitInput && targetProfitInput.value) < 0 ? '目标利润率不能为负数。' : '')
  }

  function syncTargetSellingPrice() {
    if (!isTargetProfitEnabled() || !state.result || !state.result.plans.length) {
      return false
    }
    if (!state.selectedPlanKey) {
      var initialPlan = getSelectedPlan()
      if (initialPlan) {
        state.selectedPlanKey = buildPlanKey(initialPlan)
      }
    }
    var plan = getSelectedPlan()
    if (!plan) {
      return false
    }
    return calculator.applyTargetPricingToInput(state.input, plan)
  }

  function calculateAndRender() {
    var inputChanged = syncAutoGoodsValue()
    state.result = calculator.calculate(state.input)
    if (syncTargetSellingPrice()) {
      inputChanged = true
      syncAutoGoodsValue()
      state.result = calculator.calculate(state.input)
    }
    if (inputChanged) {
      applyInputToForm()
    }
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

    var parts = (plan.expenseItems || []).filter(function (item) {
      return Number(item.value) > 0
    })
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
      { name: '总成本', value: formatMoney(plan.totalCost) },
      { name: '利润', value: formatMoney(plan.profit), tone: plan.profit >= 0 ? 'value-positive' : 'value-negative' },
      { name: '利润率', value: formatPercent(plan.profitRate), tone: plan.profitRate >= 0 ? 'value-positive' : 'value-negative' }
    ]
    ;(plan.expenseItems || []).forEach(function (item) {
      metrics.push({ name: item.label, value: formatMoney(item.value) })
    })

    if (plan.targetPricing) {
      metrics.push(
        plan.targetPricing.feasible === false
          ? { name: '反推售价', value: plan.targetPricing.reason, tone: 'value-negative' }
          : {
              name: '目标售价',
              value: state.input.currency + ' ' + Number(plan.targetPricing.requiredSellingFX || 0).toFixed(2)
            }
      )
    }

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
        '<tr><td colspan="8"><div class="empty-state">没有匹配到有效报价，请调整货值、重量或目的地。</div></td></tr>'
      return
    }

    plansBody.innerHTML = state.result.plans
      .map(function (plan) {
        var planKey = buildPlanKey(plan)
        var isActive = planKey === buildPlanKey(getSelectedPlan())
        var activeClass = isActive ? 'active' : ''
        var tags = plan.tags
          .map(function (tag) {
            return '<span class="tag ' + escapeHtml(tag.type) + '">' + escapeHtml(tag.label) + '</span>'
          })
          .join('')
        var warning = plan.warningMessage
          ? '<span class="warning-copy">' + escapeHtml(plan.warningMessage) + '</span>'
          : ''
        var targetPricing = plan.targetPricing
          ? (
            plan.targetPricing.feasible === false
              ? '<span class="warning-copy">' + escapeHtml('反推售价失败：' + plan.targetPricing.reason) + '</span>'
              : '<span class="warning-copy">' + escapeHtml('目标利润率 ' + formatPercent(plan.targetPricing.targetProfitRate) + ' 时，建议售价 ' + state.input.currency + ' ' + Number(plan.targetPricing.requiredSellingFX || 0).toFixed(2) + '（约 ¥' + Number(plan.targetPricing.requiredSellingCNY || 0).toFixed(2) + '）') + '</span>'
          )
          : ''

        return (
          '<tr class="' +
          activeClass +
          '" data-plan-key="' +
          escapeHtml(planKey) +
          '" aria-selected="' +
          (isActive ? 'true' : 'false') +
          '">' +
          '<td data-label="物流商"><div class="table-main"><strong>' +
          escapeHtml(plan.carrier) +
          '</strong><div class="tag-row">' +
          tags +
          '</div>' +
          warning +
          targetPricing +
          '</div></td>' +
          '<td data-label="产品线">' +
          escapeHtml(plan.product) +
          '</td>' +
          '<td data-label="时效">' +
          escapeHtml(plan.speed + ' / ' + plan.transitDays) +
          '</td>' +
          '<td data-label="运费">' +
          escapeHtml(formatMoney(plan.shippingCost)) +
          '</td>' +
          '<td data-label="总成本">' +
          escapeHtml(formatMoney(plan.totalCost)) +
          '</td>' +
          '<td data-label="利润" class="' +
          (plan.profit >= 0 ? 'value-positive' : 'value-negative') +
          '">' +
          escapeHtml(formatMoney(plan.profit)) +
          '</td>' +
          '<td data-label="利润率" class="' +
          (plan.profitRate >= 0 ? 'value-positive' : 'value-negative') +
          '">' +
          escapeHtml(formatPercent(plan.profitRate)) +
          '</td>' +
          '<td data-label="操作" class="row-action-cell"><button class="row-save-btn" type="button" data-save-plan-key="' +
          escapeHtml(planKey) +
          '">保存</button></td>' +
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
      var restoreButton = node.querySelector('.history-restore')
      restoreButton.dataset.historyId = entry.id
      node.querySelector('.history-delete').dataset.historyDeleteId = entry.id
      node.querySelector('.history-title').textContent = entry.title
      node.querySelector('.history-meta').textContent =
        entry.timestampLabel +
        ' | ' +
        entry.destinationLabel +
        ' | ' +
        entry.bestPlanLabel +
        (entry.input && entry.input.productLink ? ' | ' + entry.input.productLink : '')
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

    if (name === 'goodsValueRUB') {
      state.input.goodsValueCustomized = event.target.value !== ''
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
    var saveButton = event.target.closest('[data-save-plan-key]')
    if (saveButton) {
      event.stopPropagation()
      saveVisiblePlan(saveButton.dataset.savePlanKey)
      return
    }

    var row = event.target.closest('[data-plan-key]')
    if (!row) {
      return
    }
    hidePlanContextMenu()
    state.selectedPlanKey = row.dataset.planKey
    if (isTargetProfitEnabled()) {
      calculateAndRender()
      return
    }
    renderPlans()
    renderSummary()
  }

  function saveVisiblePlan(planKey) {
    var plan = findPlanByKey(planKey)
    if (!plan) {
      return
    }
    state.selectedPlanKey = planKey
    savePlanToHistory(plan)
    renderPlans()
    renderSummary()
    showToast('已保存该物流方案到本地历史记录。')
  }

  function positionPlanContextMenu(x, y) {
    planContextMenu.style.left = '0px'
    planContextMenu.style.top = '0px'
    planContextMenu.classList.add('open')
    planContextMenu.setAttribute('aria-hidden', 'false')

    var menuRect = planContextMenu.getBoundingClientRect()
    var nextLeft = Math.min(x, window.innerWidth - menuRect.width - 12)
    var nextTop = Math.min(y, window.innerHeight - menuRect.height - 12)
    planContextMenu.style.left = Math.max(12, nextLeft) + 'px'
    planContextMenu.style.top = Math.max(12, nextTop) + 'px'
  }

  function hidePlanContextMenu() {
    if (!planContextMenu) {
      return
    }
    planContextMenu.classList.remove('open')
    planContextMenu.setAttribute('aria-hidden', 'true')
    delete planContextMenu.dataset.planKey
  }

  function handlePlanContextMenu(event) {
    var row = event.target.closest('[data-plan-key]')
    if (!row) {
      hidePlanContextMenu()
      return
    }
    event.preventDefault()
    state.selectedPlanKey = row.dataset.planKey
    renderPlans()
    renderSummary()
    planContextMenu.dataset.planKey = row.dataset.planKey
    positionPlanContextMenu(event.clientX, event.clientY)
  }

  function handleContextSavePlan() {
    var planKey = planContextMenu.dataset.planKey
    var plan = findPlanByKey(planKey)
    if (!plan) {
      hidePlanContextMenu()
      return
    }
    state.selectedPlanKey = planKey
    saveVisiblePlan(planKey)
    hidePlanContextMenu()
  }

  function handleHistoryClick(event) {
    var deleteButton = event.target.closest('[data-history-delete-id]')
    if (deleteButton) {
      var deleteId = deleteButton.dataset.historyDeleteId
      if (!window.confirm('确定删除这条保存记录吗？')) {
        return
      }
      saveHistory(loadHistory().filter(function (entry) {
        return entry.id !== deleteId
      }))
      renderHistory()
      return
    }

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
    savePlanToHistory(getSelectedPlan())
    showToast('已保存到本地历史记录。')
  }

  function handleShare() {
    var shareValue = calculator.serializeShareState(state.input)
    var url = window.location.href.split('#')[0] + '#' + shareValue
    navigator.clipboard.writeText(url).then(
      function () {
        showToast('分享链接已复制。')
      },
      function () {
        window.prompt('复制下面的分享链接', url)
      }
    )
  }

  function buildCsvRowsFromCurrent() {
    var header = ['商品名称', '商品链接', '销售模式', '市场', '物流商', '产品线', '速度', '时效', '运费', '总成本', '利润', '利润率', '支出明细']
    var rows = state.result.plans.map(function (plan) {
      return [
        state.input.productName || '',
        state.input.productLink || '',
        state.input.salesMode,
        calculator.DESTINATIONS[state.input.destination].label,
        plan.carrier,
        plan.product,
        plan.speed,
        plan.transitDays,
        plan.shippingCost,
        plan.totalCost,
        plan.profit,
        plan.profitRate + '%',
        (plan.expenseItems || []).map(function (item) {
          return item.label + ':' + formatMoney(item.value)
        }).join('；')
      ]
    })
    return [header].concat(rows)
  }

  function buildCsvRowsFromHistory(entries) {
    var header = ['时间', '商品名称', '商品链接', '市场', '售价货币', '售价', '汇率', '佣金率', '目标物流', '目标方案', '货本', '利润参考', '支出明细']
    var rows = entries.map(function (entry) {
      var plan = entry.plan || {}
      var input = entry.input || {}
      return [
        entry.timestampLabel,
        entry.title,
        input.productLink || '',
        entry.destinationLabel,
        input.currency,
        input.sellingPriceFX,
        input.exchangeRate,
        input.commissionRate,
        entry.bestPlanLabel.split(' / ')[0] || '',
        entry.bestPlanLabel,
        input.cost,
        entry.bestPlanLabel,
        (plan.expenseItems || []).map(function (item) {
          return item.label + ':' + formatMoney(item.value)
        }).join('；')
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
    if (!isTargetProfitEnabled()) {
      state.selectedPlanKey = ''
    }
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
    plansBody.addEventListener('contextmenu', handlePlanContextMenu)
    historyList.addEventListener('click', handleHistoryClick)
    saveButton.addEventListener('click', handleSave)
    shareButton.addEventListener('click', handleShare)
    exportButton.addEventListener('click', handleExport)
    clearButton.addEventListener('click', handleClear)
    calculateButton.addEventListener('click', handleCalculate)
    contextSavePlanButton.addEventListener('click', handleContextSavePlan)
    document.addEventListener('click', function (event) {
      if (!event.target.closest('#plan-context-menu')) {
        hidePlanContextMenu()
      }
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        hidePlanContextMenu()
      }
    })
    window.addEventListener('scroll', hidePlanContextMenu, true)
    window.addEventListener('resize', hidePlanContextMenu)
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
