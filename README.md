# 一聊心动 · 爱情卡牌
双击 index.html 打开，默认采用PPT独立页面切换。
顶部一个全屏按钮；底部首页、上一页、下一页；方向键翻页。
每个阶段先展示目标说明，再展示33张卡牌；桌面每页3张，手机每页1张。
点击每张卡牌原地翻到背面，再点击返回正面。
包含99张正反卡牌和3张阶段说明，共201张图片。
分享时保留 index.html 与 assets 文件夹在一起。

## 在线访问

https://regan-sun.github.io/ai-love-cards/

## 部署方式

仓库已配置 GitHub Actions 自动部署（`.github/workflows/deploy.yml`）：
推送到 `main` 分支或手动触发，即自动发布到 GitHub Pages，产物即仓库根目录。

本地改动后提交推送：

```bash
git add -A && git commit -m "更新内容" && git push
```

也可在仓库 Actions 页面手动触发「部署到 GitHub Pages」。
