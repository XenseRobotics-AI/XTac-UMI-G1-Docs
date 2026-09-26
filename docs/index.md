---
hide:
  - navigation
  - toc
---

<div class="tc-hero" markdown>

<div class="tc-hero__text" markdown>

# 手持触觉数采<br>从开箱到数据集

<p class="tc-sub">同步录下视觉、触觉、手部与头部位姿<br>直接生成可训练的 <code>LeRobotDataset</code></p>

<p class="tc-note">XTac-UMI&nbsp;G1 夹爪配合 Pico4&nbsp;Ultra&nbsp;企业版头显与追踪器<br>基于 lerobot 采集</p>

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
<figcaption markdown>[从夹爪:同构末端执行器](follower-overview.md)</figcaption>
</figure>

</div>

</div>

## 采集全流程

<div class="tc-flow" markdown>

<div class="tc-flow__group" markdown>

### 一次性准备

<p class="tc-flow__lead">每台电脑、每台设备做一次</p>

1. **[安装环境](02-environment.md)**<br>
   `setup_env.sh`(Mamba)或 Docker 镜像
2. **[配置主机](03-host-hardware.md#31)**<br>
   串口权限,关闭 ModemManager 抢占
3. **[配置 Pico4 Ultra 企业版](03-host-hardware.md#34)**<br>
   开发者模式、安装 XR 应用、绑定追踪器
4. **[标定主夹爪](04-calibration.md#41)**<br>
   零点与行程上限,每只一次,不标定无法连接

</div>

<div class="tc-flow__group" markdown>

### 每次采集

<p class="tc-flow__lead">每次开始采集都按这个顺序</p>

1. **[上电与连接](03-host-hardware.md#36)**<br>
   插夹爪、开追踪器,头显走有线并关电脑 WiFi
2. **[启动服务与 XR 应用](03-host-hardware.md#35)**<br>
   先启 PC Service,再面朝机器人打开 XR 应用
3. **[预览](05-data-collection.md#preview)**<br>
   `lerobot-teleoperate`,在 Rerun 里确认数据流
4. **[录制](05-data-collection.md#52)**<br>
   `lerobot-record`,录制期间不要重启 XR 应用
5. **[检查与上传](06-dataset.md#62)**<br>
   `lerobot-check-dataset` 校验,按需上传 Hub

</div>

</div>

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
