# 推送到私有仓库说明

目标仓库（保持 **private**）：  
https://github.com/jacklin1112/crypto-opportunity-screener

本机当前 **未登录 GitHub**（`gh auth status` 无会话，无 `GH_TOKEN`/`GITHUB_TOKEN`，无 SSH），因此自动 `git push` 无法完成。请在本机按下列步骤推送。

## 1. 本地已就绪

项目路径：`/workspace/crypto-opportunity-screener`  
若已执行过 `git init` 与首次 commit，可跳到第 3 步。

```bash
cd /workspace/crypto-opportunity-screener
git status
```

## 2. 登录 GitHub（任选其一）

```bash
# 推荐：GitHub CLI
gh auth login
# 按提示选择 GitHub.com → HTTPS 或 SSH → 登录

# 或设置 token（不要把 token 写进仓库文件）
export GH_TOKEN=ghp_xxxxxxxx   # 需 repo 权限
```

确保远程仓库已创建且为 **Private**。若尚未创建：

```bash
gh repo create jacklin1112/crypto-opportunity-screener --private --source=. --remote=origin --push
```

## 3. 关联远程并推送 main

若仓库已存在、只需推送：

```bash
cd /workspace/crypto-opportunity-screener
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/jacklin1112/crypto-opportunity-screener.git
git branch -M main
git push -u origin main
```

SSH 方式：

```bash
git remote add origin git@github.com:jacklin1112/crypto-opportunity-screener.git
git push -u origin main
```

## 4. 推送后自检

```bash
gh repo view jacklin1112/crypto-opportunity-screener --json isPrivate,url
# isPrivate 应为 true
```

**请勿**将仓库设为 Public，也勿提交 `.env` 或 API Key（本项目不需要付费 Key）。
