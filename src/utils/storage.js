/**
 * 存储适配层
 *  - 优先使用 uni.getStorageSync / setStorageSync（小程序/H5 都支持）
 *  - 回退到 localStorage（纯浏览器环境）
 */

const HISTORY_KEY = 'ozon-calc-history';
const RATES_KEY = 'ozon-calc-rates-override';
const FORM_KEY = 'ozon-calc-form-draft';

const storage = (() => {
  try {
    if (typeof uni !== 'undefined' && uni.setStorageSync) {
      return {
        get(k) {
          return uni.getStorageSync(k);
        },
        set(k, v) {
          uni.setStorageSync(k, v);
        },
        remove(k) {
          uni.removeStorageSync(k);
        },
      };
    }
  } catch (e) {
    /* ignore */
  }
  return {
    get(k) {
      try {
        const raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : '';
      } catch {
        return '';
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
    remove(k) {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    },
  };
})();

// ---------- 历史记录 ----------

export function loadHistory() {
  const v = storage.get(HISTORY_KEY);
  if (!v) return [];
  return Array.isArray(v) ? v : [];
}

export function saveHistory(list) {
  storage.set(HISTORY_KEY, list.slice(0, 50)); // 最多保留 50 条
}

export function appendHistory(record) {
  const list = loadHistory();
  list.unshift(record);
  saveHistory(list);
}

export function removeHistory(id) {
  const list = loadHistory().filter((r) => r.id !== id);
  saveHistory(list);
}

export function clearHistory() {
  storage.remove(HISTORY_KEY);
}

// ---------- 费率覆盖（管理员后台） ----------

export function loadRateOverrides() {
  return storage.get(RATES_KEY) || {};
}

export function saveRateOverrides(obj) {
  storage.set(RATES_KEY, obj || {});
}

// ---------- 表单草稿 ----------

export function loadFormDraft() {
  return storage.get(FORM_KEY) || null;
}

export function saveFormDraft(form) {
  storage.set(FORM_KEY, form);
}

// ---------- 工具 ----------

export function generateId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}
