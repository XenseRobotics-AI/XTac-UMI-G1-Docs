# 夹爪连接与序列号

两种配置夹爪相同，仅「线接到哪、识别怎么核」分「背包版 / PC 版」标签页写。

- 背包版按键、指示灯与语音见[夹爪按键、指示灯与语音](../backpack/gripper.md)。
- 产品定位与组成见[认识 XTac-UMI G1](../product/g1.md)，规格见[技术参数](../product/specs.md#specs)。

## 主夹爪连接与使用 {#install}

=== "左主夹爪"

    ![左主夹爪示意图](../assets/hardware/master-left.webp){ width="360" }

=== "右主夹爪"

    ![右主夹爪示意图](../assets/hardware/master-right.webp){ width="360" }

主夹爪供电与通信都走 USB Type-C。

### 连接前检查

- 备齐左 / 右主夹爪、两根 USB 锁紧线、数采终端（数采背包或数采主机，主机见[采集主机配置要求](../pc/install.md#host-spec)）。
- 未用 9V/12V 快充适配器直连主夹爪。
- Type-C 锁紧端完好、接口内无异物。
- 视触觉传感器表面无污渍、划伤、松动、异物。

### 连接步骤

![主夹爪连接关系简图](../assets/hardware/master-connection.webp){ width="560" }

1. 取出 USB Type-C 通讯线。
2. 接主夹爪本体 Type-C 口，**旋紧锁紧螺钉**。
3. 另一端接数采终端：背包版左爪接 `UMI-L`、右爪接 `UMI-R`；PC 版接数采主机 Type-C 或 Type-A 口。

![主夹爪连接](../assets/hardware/master-connect.webp){ width="480" }

### 上电与识别

=== "背包版"

    - 指示灯绿色常亮（待机）。
    - 控制台顶栏右上角「路相机」在线数等于总数，夹爪侧共 6 路（2 路腕相机 + 4 路视触觉）。
    - 「实时监控」页有左右鱼眼与四路触觉画面。
    - 离线相机在 系统 → 设备信息 页标「（离线）」。

=== "PC 版"

    用 `lsusb` 核对 UVC 设备数：双夹爪 6 个（2 个腕部相机 + 4 个视触觉传感器），单臂 3 个。

    ```bash
    lsusb
    ```

    ![双夹爪接好后的 lsusb 输出](../assets/hardware/lsusb.webp){ width="720" }

    每个红框是一只主夹爪：

    | 框内字样 | 是什么 | 每只主爪 |
    |---|---|---|
    | `Xense Robotics ... GSPS01…` | 视触觉传感器 | 2 个 |
    | `Sunplus ... XCA…` | 腕部鱼眼相机 | 1 个 |

    - **分左右**：看序列号末位（单左双右，见[序列号与左右识别](#sn)），图中 `…0069`/`…0071` 是左，`…0070`/`…0072` 是右。
    - **数量不对**：查线缆锁紧与 USB 口接触，仍不对见[硬件异常](../pc/troubleshooting.md#hardware)。

主夹爪须先做开合标定才有归一化开度：

- **背包版**：控制台 系统 → 夹爪配置 页（闭合写零点 → 全开写最大行程）。
- **PC 版**：见[夹爪标定](../pc/calibration.md#41)，未标定会被拒连，双夹爪两侧都要标。
- 固件、SDK 与仓库版本须配套，见[必须升级到最新版本](../pc/versions.md#required)。

## 从夹爪安装与连接 {#follower-install}

![从夹爪示意图](../assets/hardware/follower-gripper.webp){ width="360" }

从夹爪装在机器人末端，不分左右；注意法兰方向、走线与运动空间。

### 安装前检查

- 机器人已停机、处于安全姿态。
- 法兰尺寸、螺钉规格、安装方向、末端负载符合项目要求。
- 24V 适配器、Type-C 通信线与锁紧结构完好。
- 走线避开关节 / 夹爪运动区 / 障碍物。

### 法兰安装

=== "法兰安装"

    ![从夹爪法兰安装](../assets/hardware/follower-flange-1.webp){ width="420" }

=== "法兰尺寸"

    ![从夹爪法兰安装尺寸](../assets/hardware/follower-flange-2.webp){ width="420" }

### 电源与通信连接

![从夹爪连接关系简图](../assets/hardware/follower-connection.webp){ width="560" }

1. 取出 USB Type-C 通讯线、24V 电源适配器。
2. 接本体端 24V 电源适配器。
3. Type-C 锁紧线带螺钉端接本体，**旋紧锁紧螺钉**。
4. 另一端接数采终端，在软件里确认通信正常。

![从夹爪连接](../assets/hardware/follower-connect.webp){ width="480" }

!!! warning "线缆与安装检查"
    - 从夹爪固定牢靠、24V 连接可靠、Type-C 已锁紧并留足余量。
    - 线缆不会在运动中被拉扯 / 弯折 / 缠绕。
    - 首次运行先低速测试，确认无干涉。

## 供电与连接要求 {#power}

| 项目 | 主夹爪 | 从夹爪 |
|---|---|---|
| 供电 | USB Type-C 总线供电，DC 5V/500mA，无需单独电源 | 24V 电源适配器（勿用规格不匹配或带故障的电源），Type-C 只做通信 |
| 线缆 | 配套锁紧线：夹爪端 Type-C，另一端 Type-C 或 Type-A | Type-C 通信线 + 24V 电源线 |
| 接线锁紧顺序 | 先接夹爪端并旋紧锁紧螺钉，再接数采终端 | 先接 24V 电源，再接 Type-C 并旋紧锁紧螺钉 |
| 拔线顺序 | 先拔数采终端端，再松螺钉拔夹爪端 | 先拔数采终端端，再断 24V，最后松螺钉拔夹爪端 Type-C |
| 静电 | 上下电、拆装传感器时防静电 | 同左 |

- 拔线前先停采集 / 录制 / 机器人运动 / 回放。
- 整套系统上下电：背包版见[接线与拔线顺序](../backpack/unbox-connect.md#order)，PC 版见[上电与下电顺序](../pc/quickstart.md#power-on)。
- 异常重启或无法识别时立即停止，见[硬件异常](../pc/troubleshooting.md#hardware)。

## 序列号与左右识别 {#sn}

序列号流水号末位**单数 = 左，双数 = 右**。

- 适用于夹爪、视触觉传感器、腕相机与 Pico 追踪器。
- **PC 版**：采集软件自动分侧（见[设备发现规则](../pc/host-setup.md#33)），手动核对跑 `lsusb` 看末位。
- **背包版**：控制台 系统 → 设备信息 页有各夹爪的左右徽章与 SN。

## 安全须知 {#safety}

供电、禁止快充直连、插拔、静电与传感器表面要求见[安全与合规](../product/safety.md)。

- 传感器清洁、存放与拆装见[维护保养](maintenance.md)。
- 从夹爪运动前先按[从夹爪 → 准备与自检](../follower/setup.md)自检。
- 识别正常后按[背包版快速开始](../backpack/index.md)或 [PC 版一页速通](../pc/quickstart.md)跑通。
