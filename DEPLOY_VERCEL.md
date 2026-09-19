# 部署到 Vercel（私人访问）

本项目：Vite 静态前端（`dist/`）+ `/api/*` Serverless Functions + 可选 Edge 门禁。

## 一、用 Vercel 控制台部署

1. 打开 [vercel.com](https://vercel.com) 并登录，点击 **Add New → Project**。
2. 导入本仓库（保持 **Private**，不要改成 Public）。
3. 框架预设可留空 / Other；`vercel.json` 已指定：
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 点击 **Deploy**。部署完成后访问分配的 `*.vercel.app` 域名。
5. 验证：
   - 页面可打开
   - `GET /api/health` 返回 `{ ok: true, ... }`
   - `GET /api/screener` 返回市值与趋势数据（首次可能需数秒）

## 二、用 Vercel CLI 部署

```bash
npm i -g vercel
cd crypto-opportunity-screener
vercel login          # 按提示登录
vercel                # 预览部署
vercel --prod         # 生产部署
```

首次会引导关联项目；同样请保持仓库私有。

## 三、启用 Vercel Deployment Protection（推荐）

适合「整站只给自己 / 同事」的场景，由平台层拦截，无需改代码。

1. 打开项目 → **Settings → Deployment Protection**。
2. 按需开启：
   - **Vercel Authentication**：仅 Vercel 团队成员可访问；
   - **Password Protection**：设置一个站点密码（Hobby 可能有限制，Pro 更完整）。
3. 保存后，未通过验证的访客无法打开预览/生产地址。

官方说明见 Vercel 文档 “Deployment Protection” / “Password Protection”。

## 四、可选：应用层 `SITE_PASSWORD` 门禁

当环境变量 `SITE_PASSWORD` 有值时，Edge Middleware 会要求访客先到 `/gate.html` 输入密码；通过后写入 HttpOnly Cookie（`site_access`），之后可访问页面与 `/api/screener` 等。

### 在 Vercel 设置

1. 项目 → **Settings → Environment Variables**。
2. 新增：
   - **Name**: `SITE_PASSWORD`
   - **Value**: 你的强密码
   - 勾选 Production / Preview（按需）
3. **Redeploy** 一次使变量生效。

### 行为说明

| 情况 | 行为 |
|------|------|
| 未设置 `SITE_PASSWORD` | 不启用应用门禁（仍可用上一节的 Deployment Protection） |
| 已设置且无 Cookie | 浏览器跳转 `/gate.html`；API 返回 401 |
| 密码正确 | `POST /api/auth` 写 Cookie 并进入首页 |
| 修改密码后 | 旧 Cookie 自动失效（token 与密码绑定） |

本地 `npm run dev` **不受**此门禁影响（Middleware 仅在 Vercel 上运行）。

## 五、注意

- **不要**把 GitHub 仓库设为 Public。
- **不需要** CoinGecko API Key；请勿公开传播链接以免打满免费额度。
- Serverless 内存缓存按实例隔离，冷启动后缓存为空属正常。
- 若 SPA 深链 404，确认 `vercel.json` 的 rewrite 仍在，且 `/api/*` 未被重写到 `index.html`。

## 六、回滚 / 关闭门禁

- 删除或清空 `SITE_PASSWORD` 并重新部署 → 关闭应用门禁。
- 在 Deployment Protection 中关闭密码 / 团队验证 → 关闭平台门禁。
