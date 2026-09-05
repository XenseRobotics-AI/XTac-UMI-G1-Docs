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

## 发布

推送到 `main` 分支后,GitHub Actions 自动 `mkdocs build --strict` 并发布到
GitHub Pages。首次需在仓库 **Settings → Pages → Source** 选择
**GitHub Actions**。
