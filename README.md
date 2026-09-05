# XTac-UMI G1 数采快速使用手册(文档站)

基于 [mkdocs-material](https://squidfunk.github.io/mkdocs-material/) 的
**XTac-UMI G1 手持触觉数采夹爪** lerobot 数据采集快速上手文档。中英双语,
发布到 GitHub Pages。

## 本地预览

```bash
# 1. 创建虚拟环境(任选 venv / conda)
python3 -m venv .venv && source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 本地热更新预览(默认 http://127.0.0.1:8000)
mkdocs serve

# 4. 严格构建(CI 用同一条命令,可提前发现死链/告警)
mkdocs build --strict
```

## 目录结构

```
.
├── mkdocs.yml                # 站点配置(主题/i18n/导航/扩展)
├── requirements.txt          # 构建依赖
├── docs/
│   ├── index.md              # 首页(中文默认)
│   ├── index.en.md           # 首页(English)
│   ├── 01-overview.md        # 1 概述
│   ├── 02-environment.md     # 2 环境部署
│   ├── 03-host-hardware.md   # 3 主机与硬件配置
│   ├── 04-calibration.md     # 4 标定与自检
│   ├── 05-data-collection.md # 5 数据采集
│   ├── 06-dataset.md         # 6 数据集与示例
│   ├── 07-faq-reference.md   # 7 常见问题与参考
│   └── assets/               # logo / favicon / 截图 / 图示
└── .github/workflows/deploy.yml   # GitHub Pages 自动发布
```

## 双语约定

- 中文为默认语言,文件名不带后缀(`01-overview.md`)。
- 英文译版加 `.en` 后缀(`01-overview.en.md`),由
  `mkdocs-static-i18n` 自动挂到 `/en/` 路径。
- 缺失的英文页会**自动回落**到中文版(`fallback_to_default: true`),
  不会导致构建失败——可以逐页翻译。

## 素材待补

- Pico4 Ultra 企业版 APP 使用截图 / 数采启动流程截图 → `docs/assets/`
- 站点 logo 与 favicon → `docs/assets/logo.png` / `docs/assets/favicon.png`

## 开发流程

**在 `dev` 上开发,确认后给 `main` 提 PR。** 不要直接往 `main` 推,也不要跳过预览站。

| 分支 | 角色 | 地址 |
|---|---|---|
| `dev` | 集成分支,日常改动都进这里,自动发布预览站 | <https://xenserobotics-ai.github.io/XTac-UMI-G1-Docs/dev/> |
| `main` | 生产,只接受来自 `dev` 的 PR | <https://xenserobotics-ai.github.io/XTac-UMI-G1-Docs/> |
| `gh-pages` | 构建产物,由 CI 维护 | — |

### 一次改动的完整步骤

```bash
# 1. 从 dev 开工作分支(小改动也可以直接在 dev 上做)
git switch dev && git pull
git switch -c docs/改点什么

# 2. 改完先在本地看
mkdocs serve                       # http://127.0.0.1:8000/XTac-UMI-G1-Docs/
mkdocs build --strict              # 必须零告警,CI 用的是同一条命令

# 3. 合进 dev(或提 PR 到 dev)
git switch dev && git merge --no-ff docs/改点什么
git push origin dev
```

推送 `dev` 后 CI 自动构建并发布到预览站,一两分钟生效。把预览链接发给同事,在平板、
手机上实际试用。

```bash
# 4. 确认没问题,再给 main 提 PR
gh pr create --base main --head dev --title "docs: ..." --body "..."
```

PR 合并后 `main` 自动发布到生产站。**合并 PR 是唯一会改变线上内容的操作**,合之前
先确认预览站上看过。

### 几条约定

- **`mkdocs build --strict` 必须过。** 配置里开了链接与锚点校验,断链、指向不存在的
  锚点、导航外的页面都会让构建失败。
- **改内容只改正文所在的那一页**,其他页放一句话加链接;哪个主题的正文在哪一页见
  上面的「目录结构」。
- **中英文同步**:`x.md` 与 `x.en.md` 的页面结构、锚点 `{#id}`、代码块和链接目标要
  一致,只翻译正文。
- **删除或改名页面时**在 `mkdocs.yml` 的 `redirects` 里补一条跳转,否则外部链接失效。
- **`gh-pages` 是构建产物**,不要手工编辑,也不要从它上面开分支。

### 发布机制

站点从 `gh-pages` 分支发布(Settings → Pages → Source 设为 `gh-pages` / `/`),
`main` 发到分支根目录,`dev` 发到 `dev/` 子目录。CI 用 git + rsync 自己写这个分支,
删除范围是精确控制的:发布 `main` 时排除 `/dev/`,发布 `dev` 时只动 `dev/`,两边不会
互相覆盖。

预览站构建前会改写 `mkdocs.yml`:`site_url` 与英文旧地址跳转的绝对地址统一加 `/dev/`
前缀,站名加「(预览)」后缀。所以预览站自成一体,点站内链接不会被甩回生产站看到旧内容。

也可以在 Actions 里手动运行 **Deploy docs**,用 `target` 选 `dev` 或 `root` 发布任意分支。

### 回退

生产站发错了就 revert 那个合并提交,`main` 会自动重新发布回上一版:

```bash
git switch main && git pull
git revert -m 1 <合并提交的 sha>     # 走 PR 合并,不要直接推 main
```

注意 revert 之后不能靠重新合并同一个分支来恢复(git 认为已经合并过、不会重放),
要把 revert 再 revert 回来,或者从 `dev` 重新提一个 PR。
