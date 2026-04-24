<script>
export default {
  onLaunch() {
    console.log('Ozon 利润计算器 启动');
  },
  onShow() {},
  onHide() {},
};
</script>

<style lang="scss">
/* 全局样式变量 */
page {
  --primary-color: #1e5fa8;
  --primary-light: #3b7bc4;
  --primary-dark: #144a85;
  --success-color: #22c55e;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --bg-page: #f5f7fa;
  --bg-card: #ffffff;
  --bg-hover: #f9fafb;

  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC',
    'Microsoft YaHei', 'Hiragino Sans GB', Arial, sans-serif;
  font-size: 28rpx;
  line-height: 1.5;
}

view,
text {
  box-sizing: border-box;
}
</style>
