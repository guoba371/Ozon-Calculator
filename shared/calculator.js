(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.OzonCalculator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var DESTINATIONS = {
    RU: { code: "RU", label: "俄罗斯" },
    KZ: { code: "KZ", label: "哈萨克斯坦" },
    BY: { code: "BY", label: "白俄罗斯" }
  };

  var CURRENCIES = {
    RUB: { code: "RUB", label: "卢布", defaultRate: 0.076 },
    USD: { code: "USD", label: "美元", defaultRate: 7.2 },
    EUR: { code: "EUR", label: "欧元", defaultRate: 7.9 }
  };

  var SALES_MODES = {
    rFBS: { code: "rFBS", label: "rFBS 自发货", description: "按类目佣金率收取，卖家自主发货" },
    FBP: { code: "FBP", label: "FBP 合作仓", description: "在参考佣金上默认优惠 1%，暂未计入额外仓储/入仓费" }
  };

  var COMMISSION_PRESETS = [
    { id: "custom", name: "自定义佣金", rate: null },
    { id: "home", name: "家居日用参考", rate: 12 },
    { id: "fashion", name: "服饰配件参考", rate: 18 },
    { id: "kids", name: "母婴玩具参考", rate: 15 },
    { id: "beauty", name: "美妆个护参考", rate: 16 },
    { id: "electronics", name: "3C 数码参考", rate: 10 },
    { id: "high", name: "高佣金参考", rate: 21 }
  ];

  var UNSUPPORTED_CARRIERS = [];

  var DEFAULT_PRODUCT_RULES = {
    extraSmall: { minWeightExclusive: 0, maxWeight: 0.5, minValue: 1, maxValue: 1500 },
    budget: { minWeightExclusive: 0.5, maxWeight: 30, minValue: 1, maxValue: 1500 },
    small: { minWeightExclusive: 0, maxWeight: 2, minValue: 1501, maxValue: 7000 },
    big: { minWeightExclusive: 2, maxWeight: 30, minValue: 1501, maxValue: 7000 },
    premiumSmall: { minWeightExclusive: 0, maxWeight: 5, minValue: 7001, maxValue: 250000 },
    premiumBig: { minWeightExclusive: 5, maxWeight: 30, minValue: 7001, maxValue: 250000 }
  };

  var CIS_PRODUCT_RULES = {
    extraSmall: { minWeightExclusive: 0, maxWeight: 0.5, minValue: 1, maxValue: 1500 },
    budget: { minWeightExclusive: 0.5, maxWeight: 35, minValue: 1, maxValue: 1500 },
    small: { minWeightExclusive: 0, maxWeight: 2, minValue: 1501, maxValue: 7000 },
    big: { minWeightExclusive: 2, maxWeight: 35, minValue: 1501, maxValue: 7000 },
    premiumSmall: { minWeightExclusive: 0, maxWeight: 5, minValue: 7001, maxValue: 18000 },
    premiumBig: { minWeightExclusive: 5, maxWeight: 35, minValue: 7001, maxValue: 18000 }
  };

  var GUOO_CIS_PRODUCT_RULES = {
    extraSmall: { minWeightExclusive: 0, maxWeight: 0.5, minValue: 1, maxValue: 1500 },
    budget: { minWeightExclusive: 0.5, maxWeight: 35, minValue: 1, maxValue: 1500 },
    small: { minWeightExclusive: 0, maxWeight: 2, minValue: 1501, maxValue: 7000 },
    big: { minWeightExclusive: 2, maxWeight: 35, minValue: 1501, maxValue: 7000 },
    premiumSmall: { minWeightExclusive: 0, maxWeight: 5, minValue: 7001, maxValue: 500000 },
    premiumBig: { minWeightExclusive: 5, maxWeight: 35, minValue: 7001, maxValue: 500000 }
  };

  var UNIFIED_MATRIX = {
    extraSmall: {
      line: "Extra Small",
      maxWeight: 0.5,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 3.12, perKg: 36.4 },
        { speed: "Economy", transitDays: "13-18天", baseFee: 3.12, perKg: 26 }
      ]
    },
    budget: {
      line: "Budget",
      maxWeight: 30,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 23.92, perKg: 26 },
        { speed: "Economy", transitDays: "13-18天", baseFee: 23.92, perKg: 17.68 }
      ]
    },
    small: {
      line: "Small",
      maxWeight: 2,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 16.64, perKg: 36.4 },
        { speed: "Economy", transitDays: "13-18天", baseFee: 16.64, perKg: 26 }
      ]
    },
    big: {
      line: "Big",
      maxWeight: 30,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 37.44, perKg: 26 },
        { speed: "Economy", transitDays: "13-18天", baseFee: 37.44, perKg: 17.68 }
      ]
    },
    premiumSmall: {
      line: "Premium Small",
      maxWeight: 5,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 22.88, perKg: 36.4 },
        { speed: "Economy", transitDays: "13-18天", baseFee: 22.88, perKg: 26 }
      ]
    },
    premiumBig: {
      line: "Premium Big",
      maxWeight: 30,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 64, perKg: 29.12 },
        { speed: "Economy", transitDays: "13-18天", baseFee: 64.48, perKg: 23.92 }
      ]
    }
  };

  var CEL_MATRIX = {
    extraSmall: {
      line: "Extra Small",
      maxWeight: 0.5,
      options: [
        { speed: "Express", transitDays: "5-10天", baseFee: 3.12, perKg: 46.8 },
        { speed: "Standard", transitDays: "10-15天", baseFee: 3.12, perKg: 36.4 },
        { speed: "Economy", transitDays: "20-25天", baseFee: 3.12, perKg: 26 }
      ]
    },
    budget: {
      line: "Budget",
      maxWeight: 30,
      options: [
        { speed: "Express", transitDays: "5-10天", baseFee: 23.92, perKg: 34.32 },
        { speed: "Standard", transitDays: "10-15天", baseFee: 23.92, perKg: 26 },
        { speed: "Economy", transitDays: "20-25天", baseFee: 23.92, perKg: 17.68 }
      ]
    },
    small: {
      line: "Small",
      maxWeight: 2,
      options: [
        { speed: "Express", transitDays: "5-10天", baseFee: 16.64, perKg: 46.8 },
        { speed: "Standard", transitDays: "10-15天", baseFee: 16.64, perKg: 36.4 },
        { speed: "Economy", transitDays: "20-25天", baseFee: 16.64, perKg: 26 }
      ]
    },
    big: {
      line: "Big",
      maxWeight: 30,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 37.44, perKg: 26 },
        { speed: "Economy", transitDays: "20-25天", baseFee: 37.44, perKg: 17.68 }
      ]
    },
    premiumSmall: {
      line: "Premium Small",
      maxWeight: 5,
      options: [
        { speed: "Express", transitDays: "5-10天", baseFee: 22.88, perKg: 46.8 },
        { speed: "Standard", transitDays: "10-15天", baseFee: 22.88, perKg: 36.4 },
        { speed: "Economy", transitDays: "20-25天", baseFee: 22.88, perKg: 26 }
      ]
    },
    premiumBig: {
      line: "Premium Big",
      maxWeight: 30,
      options: [
        { speed: "Standard", transitDays: "10-15天", baseFee: 64.48, perKg: 29.12 },
        { speed: "Economy", transitDays: "20-25天", baseFee: 64.48, perKg: 23.92 }
      ]
    }
  };

  var GUOO_MATRIX = {
    extraSmall: {
      line: "Extra Small",
      maxWeight: 0.5,
      options: [
        { speed: "Express", transitDays: "5-10天", baseFee: 3.12, perKg: 46.8 },
        { speed: "Standard", transitDays: "10-15天", baseFee: 3.12, perKg: 36.4 },
        { speed: "Economy", transitDays: "15-20天", baseFee: 3, perKg: 26 }
      ]
    },
    budget: {
      line: "Budget",
      maxWeight: 30,
      options: [
        { speed: "Economy", transitDays: "15-20天", baseFee: 23.92, perKg: 17.68 }
      ]
    },
    small: {
      line: "Small",
      maxWeight: 2,
      options: [
        { speed: "Express", transitDays: "5-10天", baseFee: 16.64, perKg: 46.8 },
        { speed: "Standard", transitDays: "10-15天", baseFee: 16.64, perKg: 36.4 },
        { speed: "Economy", transitDays: "15-20天", baseFee: 16.64, perKg: 26 }
      ]
    },
    big: {
      line: "Big",
      maxWeight: 30,
      options: [
        { speed: "Economy", transitDays: "15-20天", baseFee: 37.44, perKg: 17.68 }
      ]
    },
    premiumSmall: {
      line: "Premium Small",
      maxWeight: 5,
      options: [
        { speed: "Express", transitDays: "5-10天", baseFee: 22.88, perKg: 46.8 },
        { speed: "Economy", transitDays: "15-20天", baseFee: 22.88, perKg: 26 }
      ]
    },
    premiumBig: {
      line: "Premium Big",
      maxWeight: 30,
      options: [
        { speed: "Economy", transitDays: "15-20天", baseFee: 64.48, perKg: 23.92 }
      ]
    }
  };

  var CIS_MATRIX = {
    extraSmall: {
      line: "Extra Small",
      maxWeight: 0.5,
      options: [
        { speed: "Standard", baseFee: 3.12, perKg: 36.4 },
        { speed: "Economy", baseFee: 3.12, perKg: 26 }
      ]
    },
    budget: {
      line: "Budget",
      maxWeight: 35,
      options: [
        { speed: "Standard", baseFee: 23.92, perKg: 26 },
        { speed: "Economy", baseFee: 23.92, perKg: 17.68 }
      ]
    },
    small: {
      line: "Small",
      maxWeight: 2,
      options: [
        { speed: "Standard", baseFee: 16.64, perKg: 36.4 },
        { speed: "Economy", baseFee: 16.64, perKg: 26 }
      ]
    },
    big: {
      line: "Big",
      maxWeight: 35,
      options: [
        { speed: "Standard", baseFee: 37.44, perKg: 26 },
        { speed: "Economy", baseFee: 37.44, perKg: 17.68 }
      ]
    },
    premiumSmall: {
      line: "Premium Small",
      maxWeight: 5,
      options: [
        { speed: "Standard", baseFee: 22.88, perKg: 36.4 },
        { speed: "Economy", baseFee: 22.88, perKg: 26 }
      ]
    },
    premiumBig: {
      line: "Premium Big",
      maxWeight: 35,
      options: [
        { speed: "Standard", baseFee: 64.48, perKg: 29.12 },
        { speed: "Economy", baseFee: 64.48, perKg: 23.92 }
      ]
    }
  };

  var MATRIX_CARRIERS = [
    { name: "CEL", code: "CEL", destinations: ["RU"], matrix: CEL_MATRIX, productRules: DEFAULT_PRODUCT_RULES },
    { name: "OYX", code: "OYX", destinations: ["RU"], matrix: UNIFIED_MATRIX, productRules: DEFAULT_PRODUCT_RULES },
    { name: "XY", code: "XY", destinations: ["RU"], matrix: UNIFIED_MATRIX, productRules: DEFAULT_PRODUCT_RULES },
    { name: "ABT", code: "ABT", destinations: ["RU"], matrix: UNIFIED_MATRIX, productRules: DEFAULT_PRODUCT_RULES },
    { name: "GUOO", code: "GUOO", destinations: ["RU"], matrix: GUOO_MATRIX, productRules: DEFAULT_PRODUCT_RULES },
    {
      name: "OZON CIS",
      code: "CEL-CIS-KZ",
      destinations: ["KZ"],
      matrix: CIS_MATRIX,
      productRules: CIS_PRODUCT_RULES,
      transitBySpeed: { Standard: "15-20天", Economy: "25-30天" }
    },
    {
      name: "OZON CIS",
      code: "CEL-CIS-BY",
      destinations: ["BY"],
      matrix: CIS_MATRIX,
      productRules: CIS_PRODUCT_RULES,
      transitBySpeed: { Standard: "20-25天", Economy: "30-35天" }
    },
    {
      name: "GUOO",
      code: "GUOO-KZ",
      destinations: ["KZ"],
      matrix: UNIFIED_MATRIX,
      productRules: GUOO_CIS_PRODUCT_RULES
    },
    {
      name: "GUOO",
      code: "GUOO-BY",
      destinations: ["BY"],
      matrix: UNIFIED_MATRIX,
      productRules: GUOO_CIS_PRODUCT_RULES
    }
  ];

  var DEFAULT_INPUT = {
    productName: "三合一儿童滑梯",
    cost: 62,
    weight: 4,
    length: 50,
    width: 30,
    height: 20,
    sellingPriceFX: 5284,
    currency: "RUB",
    exchangeRate: 0.076,
    shippingShareRate: 0,
    salesMode: "rFBS",
    commissionPreset: "kids",
    commissionRate: 15,
    commissionInputMode: "rate",
    commissionAmount: 0,
    advertisingMode: "fixed",
    advertisingValue: 0,
    operationFee: 12,
    goodsValueRUB: 3000,
    destination: "RU"
  };

  function round(value, digits) {
    var precision = typeof digits === "number" ? digits : 2;
    if (!isFiniteNumber(value)) {
      return 0;
    }
    return Number(value.toFixed(precision));
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function toNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaultInput() {
    return clone(DEFAULT_INPUT);
  }

  function getCommissionRateByPreset(presetId, salesMode) {
    var preset = COMMISSION_PRESETS.find(function (item) {
      return item.id === presetId;
    });
    if (!preset || preset.rate == null) {
      return null;
    }
    var baseRate = preset.rate;
    if (salesMode === "FBP") {
      return Math.max(baseRate - 1, 0);
    }
    return baseRate;
  }

  function computeVolumeWeight(length, width, height) {
    return round((toNumber(length) * toNumber(width) * toNumber(height)) / 6000, 3);
  }

  function classifyCargo(realWeight, chargeableWeight) {
    return chargeableWeight > realWeight ? "抛货" : "重货";
  }

  function classifyWeightRange(chargeableWeight) {
    if (chargeableWeight <= 0.5) {
      return {
        code: "extraSmall",
        label: "超轻小件",
        detail: "0-500g"
      };
    }
    if (chargeableWeight <= 2) {
      return {
        code: "small",
        label: "轻小件",
        detail: "500g-2kg"
      };
    }
    if (chargeableWeight <= 5) {
      return {
        code: "standard",
        label: "标准件",
        detail: "2-5kg"
      };
    }
    if (chargeableWeight <= 30) {
      return {
        code: "big",
        label: "大件",
        detail: "5-30kg"
      };
    }
    return {
      code: "oversize",
      label: "超范围",
      detail: ">30kg"
    };
  }

  function determineProductLine(goodsValueRUB, chargeableWeight, productRules) {
    var value = toNumber(goodsValueRUB);
    var weight = toNumber(chargeableWeight);
    var rulesMap = productRules || DEFAULT_PRODUCT_RULES;
    if (value <= 0 || weight <= 0) {
      return null;
    }

    for (var key in rulesMap) {
      if (!Object.prototype.hasOwnProperty.call(rulesMap, key)) {
        continue;
      }
      var rules = rulesMap[key];
      if (
        weight > toNumber(rules.minWeightExclusive) &&
        weight <= toNumber(rules.maxWeight) &&
        value >= toNumber(rules.minValue) &&
        value <= toNumber(rules.maxValue)
      ) {
        return key;
      }
    }

    return null;
  }

  function parseTransitDays(text) {
    if (!text) {
      return 999;
    }
    var numbers = String(text).match(/\d+/g);
    if (!numbers || !numbers.length) {
      return 999;
    }
    if (numbers.length === 1) {
      return toNumber(numbers[0], 999);
    }
    return (toNumber(numbers[0], 999) + toNumber(numbers[1], 999)) / 2;
  }

  function computeSellingPriceCNY(input) {
    var price = toNumber(input.sellingPriceFX);
    var rate = toNumber(input.exchangeRate);
    var shareRate = Math.min(Math.max(toNumber(input.shippingShareRate), 0), 100);
    return round(price * rate * (1 - shareRate / 100), 2);
  }

  function computeAdvertisingFee(input, sellingPriceCNY) {
    var mode = input.advertisingMode || "fixed";
    var value = toNumber(input.advertisingValue);
    if (mode === "percent") {
      return round(sellingPriceCNY * value / 100, 2);
    }
    return round(value, 2);
  }

  function computeCommissionFee(input, sellingPriceCNY) {
    var mode = input.commissionInputMode || "rate";
    if (mode === "amount") {
      return round(toNumber(input.commissionAmount), 2);
    }
    return round(sellingPriceCNY * toNumber(input.commissionRate) / 100, 2);
  }

  function buildPlan(option, carrierName, summary) {
    var shippingCost = round(option.shippingCost, 2);
    var totalCost = round(
      summary.cost +
      shippingCost +
      summary.commissionFee +
      summary.advertisingFee +
      summary.operationFee,
      2
    );
    var profit = round(summary.sellingPriceCNY - totalCost, 2);
    var profitRate = summary.sellingPriceCNY > 0
      ? round((profit / summary.sellingPriceCNY) * 100, 2)
      : 0;

    return {
      carrier: carrierName,
      carrierCode: option.carrierCode,
      product: option.product,
      speed: option.speed,
      transitDays: option.transitDays,
      shippingCost: shippingCost,
      totalCost: totalCost,
      profit: profit,
      profitRate: profitRate,
      transitScore: parseTransitDays(option.transitDays),
      isRecommended: false,
      warningMessage: option.warningMessage || "",
      assumptions: option.assumptions || []
    };
  }

  function getRubToCnyRate(input) {
    if ((input.currency || "RUB") === "RUB") {
      return toNumber(input.exchangeRate, 0.076);
    }
    return CURRENCIES.RUB.defaultRate;
  }

  function buildMatrixPlans(carrier, destination, chargeableWeight, goodsValueRUB) {
    if (!carrier || carrier.destinations.indexOf(destination) === -1) {
      return [];
    }

    var productLineKey = determineProductLine(goodsValueRUB, chargeableWeight, carrier.productRules);
    var matrix = carrier.matrix || {};
    if (!productLineKey || !matrix[productLineKey]) {
      return [];
    }

    return matrix[productLineKey].options.map(function (option) {
      return {
        carrierCode: carrier.code,
        product: matrix[productLineKey].line,
        speed: option.speed,
        transitDays: option.transitDays || (carrier.transitBySpeed && carrier.transitBySpeed[option.speed]) || "",
        shippingCost: option.baseFee + option.perKg * chargeableWeight
      };
    });
  }

  function buildEyoubaoPlans(destination, chargeableWeight) {
    if (chargeableWeight <= 0 || chargeableWeight > 5) {
      return [];
    }

    var channels = {
      RU: [
        {
          carrier: "E邮宝",
          carrierCode: "EYOU",
          product: "E邮宝特惠",
          speed: "Standard",
          transitDays: "20-30天",
          baseFee: 13,
          perKg: 32
        }
      ],
      KZ: [
        {
          carrier: "E邮宝",
          carrierCode: "EYOU",
          product: "E邮宝特惠",
          speed: "Standard",
          transitDays: "20-30天",
          baseFee: 1.7,
          perKg: 34
        },
        {
          carrier: "E邮宝",
          carrierCode: "EYOU",
          product: "E邮宝航空",
          speed: "Air",
          transitDays: "15-25天",
          baseFee: 1.7,
          perKg: 46.75
        }
      ],
      BY: [
        {
          carrier: "E邮宝",
          carrierCode: "EYOU",
          product: "白俄罗斯陆运",
          speed: "Ground",
          transitDays: "20-30天",
          baseFee: 18,
          perKg: 35
        }
      ]
    };

    return (channels[destination] || []).map(function (channel) {
      return {
        carrierCode: channel.carrierCode,
        product: channel.product,
        speed: channel.speed,
        transitDays: channel.transitDays,
        shippingCost: channel.baseFee + channel.perKg * chargeableWeight
      };
    });
  }

  function buildEbaoguoPlans(destination, chargeableWeight) {
    if (destination !== "RU" || chargeableWeight <= 0 || chargeableWeight > 31) {
      return [];
    }

    var units = Math.ceil(chargeableWeight / 0.5);
    var shippingCost = 52.5 + Math.max(units - 1, 0) * 15;
    return [
      {
        carrierCode: "EPACKET",
        product: "E包裹特惠",
        speed: "Standard",
        transitDays: "20-30天",
        shippingCost: shippingCost,
        warningMessage: "按每 500g 向上取整计费的假设计算，后续可按实际渠道规则调整。",
        assumptions: ["E包裹续重按 500g 向上取整"]
      }
    ];
  }

  function buildCelWbPlans(destination, chargeableWeight) {
    if (destination !== "RU" || chargeableWeight <= 0 || chargeableWeight > 20) {
      return [];
    }

    var economyBase = chargeableWeight < 0.3 ? 2 : 8;
    var economyPerKg = chargeableWeight < 0.3 ? 58 : 43;
    return [
      {
        carrierCode: "CEL-WB",
        product: "WB 渠道",
        speed: "Wb-Express",
        transitDays: "10天",
        shippingCost: 9 + 48 * chargeableWeight
      },
      {
        carrierCode: "CEL-WB",
        product: "WB 渠道",
        speed: "Wb-Economy",
        transitDays: "20天",
        shippingCost: economyBase + economyPerKg * chargeableWeight
      }
    ];
  }

  function buildGuooYandexPlans(destination, chargeableWeight, goodsValueRUB, rubToCnyRate) {
    if (destination !== "RU" || chargeableWeight <= 0 || chargeableWeight > 30) {
      return [];
    }

    var plans;
    var product;
    if (chargeableWeight <= 0.5 && toNumber(goodsValueRUB) > 0 && toNumber(goodsValueRUB) <= 1500) {
      product = "Yandex Extra Small";
      plans = [
        { speed: "GTA-SUPER EXPRESS Extra Small", baseFee: 99, perKg: 525, transitDays: "空运" },
        { speed: "GTA-EXPRESS Extra Small", baseFee: 81, perKg: 428, transitDays: "陆空联运" },
        { speed: "GTA-SUPER ECONOMY Extra Small", baseFee: 99, perKg: 178, transitDays: "陆运" }
      ];
    } else if (toNumber(goodsValueRUB) >= 1501 && toNumber(goodsValueRUB) <= 500000) {
      product = "Yandex 标准件";
      plans = [
        { speed: "GTA-SUPER EXPRESS", baseFee: 196, perKg: 1058, transitDays: "空运" },
        { speed: "GTA-EXPRESS", baseFee: 183, perKg: 697, transitDays: "陆空联运" },
        { speed: "GTA-SUPER ECONOMY", baseFee: 196, perKg: 415, transitDays: "陆运" }
      ];
    } else {
      return [];
    }

    return plans.map(function (plan) {
      var rubCost = plan.baseFee + plan.perKg * chargeableWeight;
      return {
        carrierCode: "GUOO-Y",
        product: product,
        speed: plan.speed,
        transitDays: plan.transitDays,
        shippingCost: rubCost * rubToCnyRate,
        assumptions: ["GUOO YANDEX 按卢布计费后折算为人民币"]
      };
    });
  }

  function buildCelYandexPlans(destination, chargeableWeight, salesMode, rubToCnyRate) {
    if (destination !== "RU" || chargeableWeight <= 0 || chargeableWeight > 30) {
      return [];
    }

    var isExtraSmall = chargeableWeight <= 0.5;
    var isFbp = salesMode === "FBP";
    var product = isExtraSmall ? "CEL Yandex Extra Small" : "CEL Yandex 标准件";
    var plans = [];

    if (isFbp) {
      plans = isExtraSmall
        ? [{ speed: "Fbp-Express Extra Small", baseFee: 76, perKg: 538, transitDays: "5-10天" }]
        : [{ speed: "Fbp-Express", baseFee: 158, perKg: 703, transitDays: "5-10天" }];
    } else {
      plans = isExtraSmall
        ? [
            { speed: "Express Extra Small", baseFee: 78, perKg: 550, transitDays: "10-15天" },
            { speed: "Economy Extra Small", baseFee: 78, perKg: 287, transitDays: "19-24天" }
          ]
        : [
            { speed: "Express", baseFee: 161, perKg: 715, transitDays: "10-15天" },
            { speed: "Economy", baseFee: 161, perKg: 465, transitDays: "19-24天" }
          ];
    }

    return plans.map(function (plan) {
      var rubCost = plan.baseFee + plan.perKg * chargeableWeight;
      return {
        carrierCode: "CEL-Y",
        product: product,
        speed: plan.speed,
        transitDays: plan.transitDays,
        shippingCost: rubCost * rubToCnyRate,
        assumptions: ["CEL-YANDEX 按卢布计费后折算为人民币"]
      };
    });
  }

  function summarizeInput(rawInput) {
    var input = Object.assign({}, getDefaultInput(), rawInput || {});
    var volumeWeight = computeVolumeWeight(input.length, input.width, input.height);
    var chargeableWeight = round(Math.max(toNumber(input.weight), volumeWeight), 3);
    var weightRange = classifyWeightRange(chargeableWeight);
    var sellingPriceCNY = computeSellingPriceCNY(input);
    var commissionFee = computeCommissionFee(input, sellingPriceCNY);
    var advertisingFee = computeAdvertisingFee(input, sellingPriceCNY);
    var productLineKey = determineProductLine(input.goodsValueRUB, chargeableWeight);

    return {
      input: input,
      volumeWeight: volumeWeight,
      chargeableWeight: chargeableWeight,
      cargoType: classifyCargo(toNumber(input.weight), chargeableWeight),
      weightRange: weightRange,
      productLineKey: productLineKey,
      sellingPriceCNY: sellingPriceCNY,
      commissionFee: commissionFee,
      advertisingFee: advertisingFee,
      operationFee: round(toNumber(input.operationFee), 2),
      cost: round(toNumber(input.cost), 2)
    };
  }

  function rankPlans(plans) {
    var ranked = plans.slice().sort(function (a, b) {
      if (a.shippingCost !== b.shippingCost) {
        return a.shippingCost - b.shippingCost;
      }
      return a.transitScore - b.transitScore;
    });

    if (!ranked.length) {
      return ranked;
    }

    var lowestShipping = ranked.reduce(function (min, plan) {
      return Math.min(min, plan.shippingCost);
    }, Infinity);

    var fastestTransit = ranked.reduce(function (min, plan) {
      return Math.min(min, plan.transitScore);
    }, Infinity);

    ranked[0].isRecommended = true;

    ranked.forEach(function (plan) {
      plan.tags = [];
      if (Math.abs(plan.shippingCost - lowestShipping) < 0.001) {
        plan.tags.push({ type: "success", label: "最低运费" });
      }
      if (Math.abs(plan.transitScore - fastestTransit) < 0.001) {
        plan.tags.push({ type: "primary", label: "最快时效" });
      }
      if (plan.isRecommended) {
        plan.tags.push({ type: "accent", label: "性价比推荐" });
      }
    });

    return ranked;
  }

  function calculate(rawInput) {
    var summary = summarizeInput(rawInput);
    var plans = [];
    var rubToCnyRate = getRubToCnyRate(summary.input);

    MATRIX_CARRIERS.forEach(function (carrier) {
      plans = plans.concat(
        buildMatrixPlans(
          carrier,
          summary.input.destination,
          summary.chargeableWeight,
          summary.input.goodsValueRUB
        ).map(function (option) {
          return buildPlan(option, carrier.name, summary);
        })
      );
    });

    plans = plans
      .concat(
        buildEyoubaoPlans(summary.input.destination, summary.chargeableWeight).map(function (option) {
          return buildPlan(option, "E邮宝", summary);
        })
      )
      .concat(
        buildEbaoguoPlans(summary.input.destination, summary.chargeableWeight).map(function (option) {
          return buildPlan(option, "E包裹", summary);
        })
      )
      .concat(
        buildCelWbPlans(summary.input.destination, summary.chargeableWeight).map(function (option) {
          return buildPlan(option, "CEL-WB", summary);
        })
      )
      .concat(
        buildGuooYandexPlans(
          summary.input.destination,
          summary.chargeableWeight,
          summary.input.goodsValueRUB,
          rubToCnyRate
        ).map(function (option) {
          return buildPlan(option, "GUOO YANDEX", summary);
        })
      )
      .concat(
        buildCelYandexPlans(
          summary.input.destination,
          summary.chargeableWeight,
          summary.input.salesMode,
          rubToCnyRate
        ).map(function (option) {
          return buildPlan(option, "CEL-YANDEX", summary);
        })
      );

    plans = rankPlans(plans);

    return {
      summary: summary,
      plans: plans,
      bestPlan: plans[0] || null,
      meta: {
        unsupportedCarriers: UNSUPPORTED_CARRIERS,
        assumptions: [
          "FBP 当前仅按佣金率较 rFBS 低 1% 处理，未计入入仓费/仓储费。",
          "GUOO YANDEX、CEL-YANDEX 按卢布计费后折算人民币，默认使用卢布汇率。",
          "E包裹按首重 500g + 续重每 500g 向上取整的假设计算。"
        ]
      }
    };
  }

  function serializeShareState(input) {
    return encodeURIComponent(JSON.stringify(input || {}));
  }

  function deserializeShareState(serialized) {
    if (!serialized) {
      return null;
    }
    try {
      return JSON.parse(decodeURIComponent(serialized));
    } catch (error) {
      return null;
    }
  }

  return {
    DESTINATIONS: DESTINATIONS,
    CURRENCIES: CURRENCIES,
    SALES_MODES: SALES_MODES,
    COMMISSION_PRESETS: COMMISSION_PRESETS,
    UNSUPPORTED_CARRIERS: UNSUPPORTED_CARRIERS,
    getDefaultInput: getDefaultInput,
    getCommissionRateByPreset: getCommissionRateByPreset,
    calculate: calculate,
    serializeShareState: serializeShareState,
    deserializeShareState: deserializeShareState,
    helpers: {
      round: round,
      computeVolumeWeight: computeVolumeWeight,
      classifyWeightRange: classifyWeightRange,
      determineProductLine: determineProductLine
    }
  };
});
