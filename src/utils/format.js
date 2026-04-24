/**
 * 格式化工具
 */

export function money(v, fraction = 2) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
}

export function percent(v, fraction = 2) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toFixed(fraction) + '%';
}

export function kg(v, fraction = 3) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toFixed(fraction) + ' kg';
}

export function profitClass(v) {
  if (!isFinite(v)) return '';
  return v >= 0 ? 'positive' : 'negative';
}

export function formatDateTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
