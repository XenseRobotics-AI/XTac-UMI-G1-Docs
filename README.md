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
├── mkdocs.yml                # 站点配置(主题/i18n/重定向/链接校验/导航/扩展)
├── requirements.txt          # 构建依赖
├── docs/
│   ├── index.md              # 首页
│   ├── quickstart.md         # 快速开始:上下电、自检、预览、录制、检查、上传
│   ├── device.md             # 认识设备:组成、架构、接口、供电、序列号、参数、安全
│   ├── install.md            # 安装:Mamba 源码 / Docker 镜像两条路径(内容标签页)
│   ├── host-setup.md         # 主机与 Pico4 配置:串口权限、ModemManager、设备发现、头显
│   ├── calibration.md        # 标定与自检
│   ├── recording.md          # 数据采集:原理、预览、录制、每帧内容、分集复位、采集规范
│   ├── dataset.md            # 数据集:格式、落盘命名、校验、回放、上传、磁盘
│   ├── troubleshooting.md    # 故障排查(按症状)
│   ├── maintenance.md        # 维护保养
│   ├── versions.md           # 版本与升级:基线、查版本、仓库更新、固件 OTA
│   ├── reference.md          # 参考与支持:RobotConfig、术语、SDK 入口、支持渠道
│   ├── *.en.md               # 以上每页的英文版
│   └── assets/               # 截图 / 图示(.webp)与样式
└── .github/workflows/deploy.yml   # GitHub Pages 自动发布
```

每个主题只在一页有正文,其他页只放一句话加链接;上电顺序在 `quickstart.md`,
预览与录制在 `recording.md`,上传在 `dataset.md`,标定在 `calibration.md`,
Docker 安装在 `install.md`,固件 OTA 在 `versions.md`。改内容时先找到正文位置,
不要在别的页面再写一份。

按 commit 号记录的历史变更放在
[xense-taccap-lerobot 的 CHANGELOG](https://github.com/XenseRobotics-AI/xense-taccap-lerobot/blob/main/CHANGELOG.md),
SDK 的开发文档放在
[TacCap-Gripper 的 docs/](https://github.com/XenseRobotics-AI/TacCap-Gripper/tree/main/docs),
本站不重复。

## 双语约定

- 中文为默认语言,文件名不带后缀(`install.md`)。
- 英文译版加 `.en` 后缀(`install.en.md`),由
  `mkdocs-static-i18n` 自动挂到 `/en/` 路径。两种语言的页面结构、锚点
  `{#id}`、代码块和链接目标必须一致,只翻译正文。
- 缺失的英文页会**自动回落**到中文版(`fallback_to_default: true`),
  不会导致构建失败——但目前 12 页都有英文版,改中文时请同步改英文。

## 写作约定

- 提示框只用 `warning`(不照做会失败)和 `danger`(损坏硬件、返厂或整批数据作废);
  普通说明写成正文。折叠块 `???` 只用于故障排查的症状条目。
- 标题不带章节号;需要被别处链接的标题加显式锚点 `{#id}`,构建开启了锚点校验,
  链接到不存在的锚点会让 `mkdocs build --strict` 失败。
- 旧页面地址通过 `mkdocs.yml` 里的 `redirects` 跳转到新页面,删除或改名页面时
  记得补一条。
- 图片统一 `.webp`(最长边 ≤ 1400 px),见 `docs/assets/README.md`。

## 素材待补

- 站点 logo 与 favicon → `docs/assets/brand/logo.png` / `docs/assets/brand/favicon.png`

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
