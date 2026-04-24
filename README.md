# Ozon 利润计算器

基于《Ozon 利润计算器 SaaS PRD v1.0》实现的首版双端演示项目，面向 Ozon 跨境商家，用于商品利润测算与定价辅助。

当前仓库包含两条可用实现：

- `src/`：基于 `uni-app + Vue 3 + Vite` 的主工程，适合继续做正式 Web/H5 与微信小程序双端发布
- `web/` 与 `miniprogram/`：我补充的零依赖静态演示版，适合快速打开预览、对需求和视觉方向做确认

## 已实现

- `uni-app` 双端页面骨架与核心业务模块
- Web 端响应式利润计算页（静态演示版）
- rFBS / FBP 模式切换
- 体积重、计费重、重抛货、重量区间自动判断
- CEL、OYX、XY、ABT、E邮宝、E包裹报价测算
- `GUOO`、`GUOO YANDEX`、`CEL-YANDEX`、`CEL-WB` 按 CEL 费率估算展示并标记提示
- 物流方案排序、最低运费/最快时效/推荐标签
- 实时利润、利润率、总成本汇总
- 本地历史记录、CSV 导出、分享链接
- 本地费率覆盖维护页（仅影响当前设备）
- 微信小程序演示页

## 目录结构

- [src/pages/index/index.vue](/Users/sai/Desktop/Vibe%20Coding项目实践/Ozon%20Calculator/src/pages/index/index.vue) uni-app 首页
- [shared/calculator.js](/Users/sai/Desktop/Vibe%20Coding项目实践/Ozon%20Calculator/shared/calculator.js) 静态版共享计算规则
- [web/index.html](/Users/sai/Desktop/Vibe%20Coding项目实践/Ozon%20Calculator/web/index.html) Web 页面
- [web/app.js](/Users/sai/Desktop/Vibe%20Coding项目实践/Ozon%20Calculator/web/app.js) Web 交互逻辑
- [miniprogram/pages/index/index.js](/Users/sai/Desktop/Vibe%20Coding项目实践/Ozon%20Calculator/miniprogram/pages/index/index.js) 小程序页面逻辑

## 使用方式

### 快速预览

直接打开根目录的 [index.html](/Users/sai/Desktop/Vibe%20Coding项目实践/Ozon%20Calculator/index.html) 或 [web/index.html](/Users/sai/Desktop/Vibe%20Coding项目实践/Ozon%20Calculator/web/index.html)。

### uni-app 主工程

可用命令：

- `npm run dev:h5`
- `npm run dev:mp-weixin`

### 微信小程序

- 正式主工程：优先使用 `uni-app` 输出的小程序构建结果
- 静态演示页：可直接用微信开发者工具打开 `miniprogram` 目录预览

## 当前假设

- FBP 暂按佣金率较 rFBS 低 1% 处理，未纳入仓储/入仓费
- `GUOO`、`GUOO YANDEX`、`CEL-YANDEX`、`CEL-WB` 因缺少独立报价，当前按 CEL 费率估算并在界面提示
- E 包裹按首重 500g、续重每 500g 向上取整估算
