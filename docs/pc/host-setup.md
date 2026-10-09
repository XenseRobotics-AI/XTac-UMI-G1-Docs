# 主机配置

夹爪能被列出不等于能被打开。本页做两项一次性配置（串口权限、ModemManager），说明设备如何按序列号分左右，再启动 XenseVR PC Service；头显与追踪器配置见[Pico4 头显与追踪器](../common/pico4.md)。

## 串口权限（dialout） {#31}

夹爪 MCU 枚举为 `/dev/ttyACM*`，属 `dialout` 组。不在该组时 SDK 打不开串口，`scan_grippers()` 报 `role=Unknown`、`firmware_sn` 为空：

```text
RuntimeError: No leader gripper discovered for the left side.
# 底层实为: IoError: SerialBus: open(/dev/serial/by-id/...): Permission denied
```

一次性加入组：

```bash
sudo usermod -aG dialout "$USER"
```

!!! warning "改完组必须重登，否则等于没做"
    当前终端仍是旧权限。注销重登（或执行 `newgrp dialout`），重新插拔夹爪，再验证。

验证：`role` 为 `Leader`/`Follower`，`firmware_sn` 非空：

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side.name, g.role.name, repr(g.firmware_sn))"
```

修好权限后 `firmware_sn` 仍为空：可能是 SN 未烧录、串口读取失败或固件通信异常，不能据此推断固件版本。保存完整报错，换线、换口复测，仍异常联系设备或固件团队。

## 关闭 ModemManager 抢占（udev） {#32}

用 [Docker 交付镜像](install.md#docker)时，`install_customer.sh` 已在主机上装好这条规则。

夹爪 MCU 是 CH343 USB 串口（`1a86:55d2`，CDC-ACM）。每次热插拔，ModemManager（Ubuntu/GNOME 默认的蜂窝调制解调器服务）会用 AT 指令探测新端口并占用几秒，连接失败：

```text
IoError: SerialBus: open(/dev/serial/by-id/usb-1a86_USB_Dual_Serial_..-if02): Device or resource busy
```

- **症状**：第一次启动正常，换口后立即重启就 busy；不是触觉、相机或带宽问题。
- **brltty**：盲文驱动 `brltty` 也会抢占 `1a86`。
- **临时办法**：插好后等约 3 秒再启动。

永久修复（不影响真正的调制解调器）：

```bash
sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
# XTac-UMI G1 MCUs are CH343 USB-serial (1a86:55d2) — keep ModemManager off them
ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger
```

验证：

```bash
udevadm info -q property -n /dev/ttyACM0 | grep ID_MM_DEVICE_IGNORE   # -> ID_MM_DEVICE_IGNORE=1
mmcli -L                                                               # 夹爪不再被列出
```

删除规则文件并重载即可还原；无蜂窝模块的专用主机也可 `sudo systemctl disable --now ModemManager`。

## 设备自动发现与"单左双右" {#33}

所有设备按序列号 + USB 拓扑自动分到 `left`/`right`，不手写序列号。

### 序列号语法

| 设备 | 语法 | 示例 |
|---|---|---|
| 夹爪 Gripper | `TCGU01<batch><line><seq><m\|s>` | `TCGU01A24Z0002m` |
| 触觉 Tactile | `GSPS01<batch><line><seq>` | `GSPS01A25Z0011` |
| 相机 Camera | `XC<batch><line><seq><m\|s>` | `XCA24Z0007m` |

`<seq>` 为 4 位；`m` → leader（主夹爪），`s` → follower（从夹爪）。

### 侧别规则

`<seq>` 最后一位：奇数 → 左，偶数 → 右。适用于夹爪、腕相机，以及同一夹爪上两枚指尖触觉。

- **触觉**：映射到 `{side}_tactile_{left,right}`。共享同一夹爪 USB hub 的两枚 GSPS 归该夹爪，侧别取夹爪固件 SN（`scan_grippers()` 输出里的 side），不是 CH343 的 `mcu_serial`。
- **追踪器**：Pico4 Ultra 企业版追踪器 SN 形如 `PC2310MLL3200496G`，按末尾 `G` 前的数字单左双右，此例 `6` 在右侧。头显上看不到它，见[读取追踪器 SN](../common/pico4.md#pico-tracker-sn)。
- **报错**：不合规序列号、每侧数量不对、两枚指尖触觉同侧、两只夹爪抢同一触觉侧别、触觉 hub 找不到夹爪，都会直接报错并指明 hub/序列号。
- **排查顺序**：先报重复、再报缺失；某侧为空通常是其设备被算到了另一侧，先复核挤了两个的那一侧。

### USB 带宽预算 {#usb-budget}

相机打不开先查带宽。每个 UVC 相机打开期间独占一份等时带宽：一条 USB 2.0 总线 480 Mbit/s，约 384 Mbit/s 给等时传输。双夹爪共六个相机（四路触觉 + 两路腕相机），另有笔记本自带摄像头。

```bash
lsusb -t
```

- **数相机**：每行 `480M` 的 `root_hub` 是一份预算。两条各挂三个宽裕；六个挤一条要实测，各批次申请量不同。
- **USB 3 口**：触觉和腕相机都是 USB 2.0 设备，插蓝色 USB 3 口仍在该控制器的 USB 2.0 总线上；要分开得插另一个主控制器（Thunderbolt / USB4 扩展坞自带一个，普通 hub 不带）。
- **报错**：内核日志出现 `Not enough bandwidth for altsetting N`，完整判定见[故障排查 · USB 带宽不够](troubleshooting.md#usb-bandwidth)。

## Pico4 头显与追踪器

夹爪顶部的 Pico4 Ultra 企业版追踪器提供 6-DoF 位姿，头显运行 XTac-UMI XR，位姿经下面的 [XenseVR PC Service](#35) 送到采集单元。开箱、装 XTac-UMI XR、网络、追踪器绑定、追踪模式与启动对齐见[Pico4 头显与追踪器](../common/pico4.md)。

- **出厂已配置**：从[网络连接](../common/pico4.md#pico-network)开始。
- **每次采集前**：接 USB、短按追踪器电源键到蓝灯亮、[点「连接」](../common/pico4.md#pico-toolkit-ui)、[启动对齐](../common/pico4.md#pico-frame)。

## 启动 XenseVR PC Service {#35}

采集单元从 XenseVR PC Service（RoboticsService）守护进程读位姿。[Docker 交付镜像](install.md#docker)启动时自动拉起它，不用追踪器时可用 `START_XENSEVR_SERVICE=0` 关掉。

```bash
/opt/apps/roboticsservice/runService.sh
```

- **命名**：头显上的 APP 叫 **XTac-UMI XR**，电脑端服务叫 **XenseVR PC Service**。安装包 `XenseVR-PC-Service_<版本>_amd64.deb` 装到 `/opt/apps/roboticsservice/`，Python 包是 `xensevr_pc_service_sdk`。
- **单实例**：重复启动会失败或冲突。
- **数据**：服务提供 Head / 手柄 / 手势 / 全身动捕 / Tracker 多类数据，数采用 Tracker 位姿（带 `sn` 区分追踪器）和头部位姿（配合[头显双目画面](recording.md#56)）。
- **头显画面**：与追踪器共用同一条连接，服务没起来两者都没有；需服务 ≥ v0.2.0（见[版本基线](versions.md#required)），只用追踪器不限版本。
- **演示程序**：服务目录附带 `ConsoleDemo` / `RobotDemoQt`，可确认头显已被发现、追踪数据正常（需与服务相同的运行环境）。

## 上电顺序 {#36}

按[一页速通 · 上电与连接](quickstart.md#power-on)执行；双夹爪插线前先看[USB 带宽预算](#usb-budget)。

下一步 → [标定与自检](calibration.md)
