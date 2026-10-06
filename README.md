# 一聊心动 · 爱情卡牌
双击 index.html 打开，默认采用 PPT 独立页面切换。
顶部一个全屏按钮；底部首页、上一页、下一页；方向键翻页。
每个阶段先展示目标说明，再展示 33 张卡牌；桌面每页 3 张，手机每页 1 张。
点击每张卡牌原地翻到背面，再点击返回正面。
包含 99 张正反卡牌和 3 张阶段说明，共 201 张图片。
分享时保留 index.html 与 assets 文件夹在一起。

## 在线访问

https://regan-sun.github.io/ai-love-cards/

## 性能与移动端适配（2026-10 优化）

### 图片加载
原图 201 张 PNG 共 133 MB、平均每张 677 KB，在手机上打开需要等待很久才出图。
现在改为：

- **WebP 双尺寸**：脚本 `tools/build_webp.py` 生成 `assets/webp/thumb/`（宽 360）与
  `assets/webp/large/`（宽 1080，阶段说明图 1400），合计约 **13.8 MB**，比原 PNG 少约 90%。
- **按需加载**：缩略图只有进入视口（`IntersectionObserver`，提前 600px）才开始请求；
  首屏只加载当前卡的正面大图，背面等到用户真的翻牌时再取。
- **相邻预取**：翻到当前卡时用 `<link rel=prefetch>` 预热下一张，翻页几乎无等待。
- **自动回退**：浏览器不支持 WebP 时自动改用原 PNG，已实测回退正常。
- **离线缓存**：`sw.js` 采用「页面网络优先 + 图片缓存优先并后台更新」，
  二次访问直接读本地缓存。改版时把 `sw.js` 里的 `CACHE` 版本号 +1 即可刷新缓存。

模拟 4G（500KB/s、RTT 300ms）实测对比：

| | 改动前 | 改动后 |
|---|---|---|
| 首屏卡牌可见 | 1861 ms / 1115 KB | **877 ms / 215 KB** |
| 翻 10 页累计 | 5030 ms / 5.13 MB | **3032 ms / 0.41 MB** |
| 桌面翻 10 页累计 | 5063 ms / 14.21 MB | **3032 ms / 0.63 MB** |
| 单图平均 | 520 KB | **19–27 KB** |

### 移动端布局
- 修复原样式里 `@media(max-width:800px)` 把翻牌查看器 `.viewer` 整体 `display:none` 的问题——
  这会导致手机上完全看不到卡牌、无法翻牌。
- 底部导航是 `position:fixed`，会遮住内容最后 60px；`main` 高度已扣除这段，
  卡牌不再被导航栏切掉。
- 覆盖横屏、矮屏（SE 等）、超窄屏（≤360px）、平板竖屏/横屏、iPhone 安全区（刘海与底部横条）。
- `100dvh` 在手机地址栏收放时会跳动，`calc((100dvh - Npx)*ratio)` 在矮屏会算出负值，
  关键尺寸均加了 `min()/max()` 下限与 `@supports not (height:100dvh)` 兜底。

### 本地验证
```bash
# 11 种设备遍历检查（横向溢出、卡牌塌陷、是否被导航遮挡、103 页翻页）
node tools/verify.js
# 生成各设备截图到 shots/
node tools/shots.js
# 模拟 4G 的加载耗时与流量
node tools/perf.js
# 验证 WebP 不支持时能否回退 PNG
node tools/fallback.js
```
运行前需 `export NODE_PATH=/Users/sunxuming/.workbuddy/binaries/node/workspace/node_modules`。

图片源改动后（如替换了原 PNG）重新生成 WebP：
```bash
python3 tools/build_webp.py 82
```

## 部署方式
仓库已配置 GitHub Actions 自动部署（`.github/workflows/deploy.yml`）：
推送到 `main` 分支或手动触发，即自动发布到 GitHub Pages，产物即仓库根目录。

本地改动后提交推送：

```bash
git add -A && git commit -m "更新内容" && git push
```

也可在仓库 Actions 页面手动触发「部署到 GitHub Pages」。