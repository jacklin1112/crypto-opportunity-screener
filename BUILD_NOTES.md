# BUILD_NOTES

构建与联调记录（Asia/Shanghai）

## 环境

- Node v20.19.2 / npm 9.2.0
- 栈：Vite 8 + React 19 + TypeScript + Tailwind CSS v4
- CoinGecko 免费公开 API（无 API Key）

## 命令结果

| 命令 | 结果 |
|------|------|
| `npm install` | 成功 |
| `npm run build` | 成功（`tsc -b && vite build`） |
| `npm run preview` | 已在 `127.0.0.1:4173` 验证 |

## API 联调（真实数据）

- `GET /api/screener` → HTTP 200，`count: 150`，含 `price_change_percentage_7d_in_currency` 等字段
- 首次上游拉取约 2–3s（队列间隔 ~2.5s：markets×1 + trending×1）
- 缓存命中约 ~5ms；内存 TTL ~60s
- `GET /api/health` → `{ ok: true, cache: ... }`

示例（验证时）：BTC 出现在榜首，ZEC 在 Top 150 内；trendingIds ≈ 15。

## API 注意事项 / 怪癖

1. **免费档限流（429）**：短时间多次请求会 429。代理对上游串行排队，失败时短缓存并提示稍后重试。
2. **少请求策略**：`/api/screener` 使用单次 `per_page=150` + `/search/trending`，避免 page1+page2 双请求。
3. **CORS**：浏览器只打本地 `/api/*`，由 Vite 中间件转发（`dev` 与 `preview` 均挂载）。
4. **涨跌字段名**：markets 在带 `price_change_percentage=24h,7d,30d` 时返回 `price_change_percentage_*_in_currency`。
5. **分类催化剂**：为控额度，分类以本地静态线索表为主；趋势榜为实时公开线索。

## 本地运行

```bash
cd /workspace/crypto-opportunity-screener
npm install
npm run dev          # http://127.0.0.1:5173
# 或
npm run build && npm run preview   # http://127.0.0.1:4173
```

私人研究用途，勿公开滥用免费 API。
