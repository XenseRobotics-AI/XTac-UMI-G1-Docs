---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<span class="tc-eyebrow">XenseRobotics · XTac-UMI G1</span>

# 手持触觉数采,从开箱到数据集

<p class="tc-sub">XTac-UMI G1 手持触觉数采夹爪 × Pico4 Ultra 企业版头显与追踪器<br>基于 lerobot 同步采集视觉 · 触觉 · 第一视角双目 · 手部与头部位姿,直出可训练的标准 <code>LeRobotDataset</code></p>

[快速开始 :material-arrow-right-bold:](quickstart.md){ .md-button .md-button--primary }
[安装](install.md){ .md-button }
[认识设备](device.md){ .md-button }

![XTac-UMI G1 产品外观](assets/product/xtac-umi-g1-hero.webp){ .tc-hero-img }

</div>

## 5 分钟看懂全流程

```mermaid
flowchart LR
    A[环境部署<br/>setup_env.sh] --> B[主机/硬件配置<br/>串口权限·设备发现]
    B --> C[标定与自检<br/>编码器零点·tracker]
    C --> P[预览实时数据<br/>lerobot-teleoperate]
    P --> D[数据采集<br/>lerobot-record]
    D --> E[数据集<br/>校验·回放·上传Hub]
```

## 三步走

本手册是 **xense-taccap-lerobot 数采快速使用文档**,主线三块:**准备就绪 → 采集数据 → 认识数据**。

<div class="grid cards" markdown>

-   :material-check-decagram-outline: __① 准备工作(前提)__

    ---

    认识硬件 → 连线上电 → 装好环境与主机/设备配置,这三件是采集前提。

    [:octicons-arrow-right-24: 认识设备](device.md) · [安装](install.md) · [主机与 Pico4 配置](host-setup.md)

-   :material-record-circle-outline: __② 软件使用__

    ---

    标定自检 → `lerobot-teleoperate` 预览数据流 → `lerobot-record` 录制,数采的核心操作。

    [:octicons-arrow-right-24: 标定与自检](calibration.md) · [数据采集](recording.md)

-   :material-database-outline: __③ 数据介绍__

    ---

    `LeRobotDataset` 长什么样、每帧记录了什么、如何校验与上传。

    [:octicons-arrow-right-24: 数据集](dataset.md)

</div>

二次开发直接调 `xense.taccap` SDK 的,见[参考](reference.md)。

## 相关仓库

| 仓库 / 包 | 作用 |
|---|---|
| [`xense-taccap-lerobot`](https://github.com/XenseRobotics-AI/xense-taccap-lerobot) | 数采主仓库(lerobot 0.5.1 定制分支,提供 `taccap_gripper` 设备类型) |
| [`xense.taccap`](https://github.com/XenseRobotics-AI/TacCap-Gripper) | 夹爪 SDK(仓库 `TacCap-Gripper`,子模块 `third_party/taccap-gripper`):IMU、编码器、按键、协议及仅从夹爪具备的电机控制 |
| [`xensevr_pc_service_sdk`](https://github.com/XenseRobotics-AI/XenseVR-PC-Service) | Pico4 Ultra 追踪器 PC 服务(以 `.deb` 安装,**不是子模块**);v0.2.0 起也承载[头显相机](recording.md#56)画面 |
| [`xensesdk`](https://github.com/XenseRobotics/xensesdk) | 视触觉传感器 SDK,由安装脚本提供([文档站](https://xensedoc.readthedocs.io/en/latest/)) |

本手册对应 `xense.taccap 0.1.9` 与基于 lerobot 0.5.1 定制的 `xense-taccap-lerobot`;命令与字段以你本地主仓库附带的设备说明为准,升级见[版本与升级](versions.md#required)。
