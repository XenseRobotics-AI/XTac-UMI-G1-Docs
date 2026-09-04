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
├── mkdocs.yml                # 站点配置(主题/顶栏标签/i18n/重定向/链接校验/导航)
├── requirements.txt          # 构建依赖
├── overrides/home.html       # 首页模板:通栏首屏,文字取自 index.md 的 hero_* 字段
├── docs/
│   ├── index.md              # 首页(产品介绍)
│   ├── product/              # 「产品」标签:给评估者看
│   │   ├── editions.md       #   产品线与配置对比(背包版 / PC 版)
│   │   ├── g1.md             #   认识 XTac-UMI G1
│   │   ├── backpack.md       #   认识数采背包
│   │   ├── specs.md          #   技术参数
│   │   └── safety.md         #   安全与合规
│   ├── backpack/             # 「背包版」标签:数采背包 + XTac-UMI Collector 控制台
│   │   ├── index.md          #   形态概览与快速开始
│   │   ├── unbox-connect.md  #   开箱、接线与供电
│   │   ├── network.md        #   网络与控制台入口
│   │   ├── monitor-record.md #   实时监控与录制
│   │   ├── projects-export.md#   项目、导出与发布
│   │   ├── playback.md       #   回放
│   │   ├── system.md         #   系统设置
│   │   ├── update.md         #   升级与 OTA
│   │   ├── troubleshooting.md#   故障排查
│   │   └── versions.md       #   版本
│   ├── pc/                   # 「PC 版」标签:x86 工作站 + xense-taccap-lerobot
│   │   ├── index.md          #   形态概览与快速开始
│   │   ├── install.md        #   安装:Mamba 源码 / Docker 镜像(内容标签页)
│   │   ├── host-setup.md     #   主机配置:串口权限、ModemManager、设备发现、PC Service
│   │   ├── calibration.md    #   标定与自检
│   │   ├── recording.md      #   数据采集
│   │   ├── dataset.md        #   数据集
│   │   ├── troubleshooting.md#   故障排查
│   │   ├── versions.md       #   版本与升级:基线、查版本、仓库更新、固件 OTA
│   │   └── reference.md      #   RobotConfig 与 SDK
│   ├── common/               # 「通用」标签:两种形态共用
│   │   ├── pico4.md          #   Pico4 头显与追踪器(形态差异用内容标签页)
│   │   ├── gripper.md        #   夹爪按键、指示灯与序列号
│   │   ├── coordinates.md    #   坐标系
│   │   ├── maintenance.md    #   维护保养
│   │   └── reference.md      #   术语表与支持
│   ├── **/*.en.md            # 每页的英文版
│   └── assets/               # product/ 渲染图与接口照片,backpack/ 控制台截图,brand/ logo
└── .github/workflows/deploy.yml   # GitHub Pages 自动发布
```

两种形态各有完整的操作主线,共用的内容只在「通用」写一份,形态差异用联动的内容标签页
`=== "背包版"` / `=== "PC 版"`(背包版在前,标签名全站一致)。每个主题只在一页有正文,
其他页只放一句话加链接;按键与灯语在 `common/gripper.md`,Pico4 配置在 `common/pico4.md`,
背包版的录制在 `backpack/monitor-record.md`,PC 版的录制在 `pc/recording.md`,
固件 OTA 在 `pc/versions.md`,背包升级在 `backpack/update.md`。改内容时先找到正文位置,
不要在别的页面再写一份。

背包版内容按 XTac-UMI Collector **0.3.9** 核对;版本号出现处写 0.3.9,并注明以设备系统页
显示为准。云 OTA 服务端、多机纳管(matrix)、诊断收集在软件里仍是设计稿,文档不承诺。

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
