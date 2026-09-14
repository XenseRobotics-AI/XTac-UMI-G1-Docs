---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<span class="tc-eyebrow">XTac-UMI · 手持式多模态数据采集系统</span>

# 让机器人数据集拥有触觉

<p class="tc-sub">双夹爪视触觉、腕部鱼眼、头显第一视角与 6DoF 位姿同步记录。一次手持示教,直接得到可训练的数据集。</p>

[选择配置](product/editions.md){ .md-button .md-button--primary }
[看看数据长什么样](pc/dataset.md#61){ .md-button }

![XTac-UMI G1 产品外观](assets/product/xtac-umi-g1-hero.webp){ .tc-hero-img }

</div>

<div class="xu-stats" markdown>

**3 路 / 爪** 1 鱼眼 + 2 视触觉

**6DoF** 头显与双追踪器位姿

**30 Hz** 多源同步记录

**MCAP · LeRobot v3** 原始与训练格式

</div>

## 两种配置,一套夹爪

选一个开始。两边的硬件、标定和数据定义相同,差别只在计算放在哪、你用什么操作。

<div class="grid cards xu-cards" markdown>

-   ![XTac-UMI 数采背包正面接口](assets/product/backpack-ports-front.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--backpack">背包版</span>

    **XTac-UMI 数采背包**{ .xu-card__title }

    ---

    - 背包即主机,平板即控制台,不需要 PC
    - 夹爪按键开录,灯语反馈,单人可操作
    - MCAP 原始记录,一键发布 LeRobot 到 ModelScope

    适合:规模化数采工厂与采集团队;软件闭源交付,支持轻量二次开发
    { .xu-card__fit }

    [快速开始](backpack/index.md){ .md-button .md-button--primary }
    [了解背包](product/backpack.md){ .md-button }
    { .xu-card__actions }

-   ![XTac-UMI G1 视触觉夹爪](assets/product/g1-render-hero.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--pc">PC 版</span>

    **XTac-UMI G1 开发套件**{ .xu-card__title }

    ---

    - 接入你自己的 x86 工作站,完全走 LeRobot 框架
    - `lerobot-record` 直接产出 LeRobotDataset
    - 基于 lerobot 开源生态,完全开放二次开发

    适合:研究与算法团队、自建训练管线
    { .xu-card__fit }

    [快速开始](pc/index.md){ .md-button .md-button--primary }
    [对比两种配置](product/editions.md){ .md-button }
    { .xu-card__actions }

</div>

<div class="xu-spot" markdown>

![控制台监控页:六路相机、两侧视触觉与头显位姿同屏](assets/backpack/monitor-live.webp)

<div class="xu-spot__text" markdown>

## 录之前先看见

控制台里同时显示六路相机、两侧视触觉与头显位姿,夹爪开合度实时归一化。录制状态、磁盘余量、追踪器丢失都在同一屏上,平板和手机都能看。

</div>

</div>

## 相关仓库

| 仓库 / 包 | 作用 |
|---|---|
| [`xense-taccap-lerobot`](https://github.com/XenseRobotics-AI/xense-taccap-lerobot) | 数采主仓库(lerobot 0.5.1 定制分支,提供 `taccap_gripper` 设备类型) |
| [`xense.taccap`](https://github.com/XenseRobotics-AI/TacCap-Gripper) | 夹爪 SDK(仓库 `TacCap-Gripper`,子模块 `third_party/taccap-gripper`):IMU、编码器、按键、协议及仅从夹爪具备的电机控制 |
| [`xensevr_pc_service_sdk`](https://github.com/XenseRobotics-AI/XenseVR-PC-Service) | Pico4 Ultra 追踪器 PC 服务(以 `.deb` 安装,**不是子模块**);v0.2.0 起也承载[头显相机](pc/recording.md#56)画面 |
| [`xensesdk`](https://github.com/XenseRobotics/xensesdk) | 视触觉传感器 SDK,由安装脚本提供([文档站](https://xensedoc.readthedocs.io/en/latest/)) |

PC 版内容对应 `xense.taccap 0.1.9` 与基于 lerobot 0.5.1 定制的 `xense-taccap-lerobot`;命令与字段以你本地主仓库附带的设备说明为准,升级见[版本与升级](pc/versions.md#required)。
