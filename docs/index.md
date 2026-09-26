---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

# 手持触觉数采,<span class="tc-nowrap">从开箱到数据集</span>

<p class="tc-sub">XTac-UMI G1 配合 Pico4 Ultra 企业版,用 lerobot 同步录下视觉、触觉和手部与头部位姿,直接得到可训练的 <code>LeRobotDataset</code>。</p>

[一页速通](quickstart.md){ .md-button .md-button--primary }
[了解设备](01-overview.md){ .md-button }

</div>

<div class="tc-stage" markdown>

<figure class="tc-tile tc-tile--leader" markdown>
![主夹爪](assets/product/leader-front-open-cutout.webp)
<figcaption markdown>[主夹爪:手持采集](hardware.md)</figcaption>
</figure>

<figure class="tc-tile tc-tile--follower" markdown>
![从夹爪](assets/product/follower-rear-ports.webp)
<figcaption markdown>[从夹爪:装在机器人上](follower-overview.md)</figcaption>
</figure>

</div>

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

    认识拿到的硬件 → 连接硬件、上电 → 装好软件环境与主机/设备配置。这三件是采集前的前提。

    [硬件介绍](hardware.md)、[环境安装](02-environment.md)

-   :material-record-circle-outline: __② 软件使用__

    ---

    标定自检 → `lerobot-teleoperate` 预览确认数据流 → `lerobot-record` 录制。数采的核心操作。

    [标定与自检](04-calibration.md)、[数据采集](05-data-collection.md)

-   :material-database-outline: __③ 数据介绍__

    ---

    `LeRobotDataset` 长什么样、每帧记录了什么、如何校验与上传。

    [数据集与示例](06-dataset.md)

</div>

!!! note "从夹爪与二次开发"
    把从夹爪装到机器人上、用程序控制开合与夹持,见 [从夹爪](follower-overview.md)。
    需要直接调 `xense.taccap` SDK 的,见 [参考 → 附录:SDK 与二次开发](sdk-overview.md)。

## 相关仓库

| 仓库 / 包 | 作用 |
|---|---|
| [`xense-taccap-lerobot`](https://github.com/XenseRobotics-AI/xense-taccap-lerobot) | 数采主仓库(lerobot 0.5.1 定制分支,提供 `taccap_gripper` 设备类型) |
| [`xense.taccap`](https://github.com/XenseRobotics-AI/TacCap-Gripper) | 夹爪 SDK(仓库 `TacCap-Gripper`,子模块 `third_party/taccap-gripper`):IMU、编码器、按键、协议及仅从夹爪具备的电机控制 |
| [`xensevr_pc_service_sdk`](https://github.com/XenseRobotics-AI/XenseVR-PC-Service) | Pico4 Ultra 追踪器 PC 服务(以 `.deb` 安装,**不是子模块**);v0.2.0 起也承载[头显相机](05-data-collection.md#56)画面 |
| [`xensesdk`](https://github.com/XenseRobotics/xensesdk) | 视触觉传感器 SDK,由安装脚本提供([文档站](https://xensedoc.readthedocs.io/en/latest/)) |

!!! note "适用版本"
    本手册对应 `xense.taccap 0.1.9`、`xense-taccap-lerobot` 基于 **lerobot 0.5.1** 定制。
    命令与字段以你本地这一版主仓库附带的设备说明为准。
