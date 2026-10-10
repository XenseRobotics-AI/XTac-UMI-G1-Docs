# 标定与自检

本页做两件一次性的事：标定主夹爪零点和行程，确认 Pico4 Ultra 追踪器链路通。开录前用[预览](recording.md#preview)确认整条链路。

## 夹爪标定（零点 + 行程） {#41}

### 什么时候需要标

`gripper.pos` 是归一化开度：`0.0` 完全闭合，取自标定第 1 步锁存的编码器零点；`1.0` 完全张开，取自第 2 步写入的行程上限（命令集 ≥ V2.1）。两个值存在 MCU flash，断电、换主机都不用重标。两种情况要标：

| 情况 | 表现 | 谁发现 |
|---|---|---|
| 从没标过 | 采集程序**拒绝连接**主夹爪，报错里直接带标定命令 | 程序，漏不掉 |
| 标过，但值和实际行程对不上（拆装过编码器、动过机械限位、擦除过固件） | 能连上，但张到机械极限时 `gripper.pos` 顶不到 `1.0` | 只能你在预览里看出来，见[确认标定生效](#413) |

第一种的报错：

```text
This leader gripper has no encoder-max calibration, so its jaw travel is unknown
and gripper.pos cannot be computed (...).

Calibrate it once, then re-run:

    python third_party/taccap-gripper/python/examples/calibrate.py <left|right>
```

!!! danger "双夹爪只标一侧，比两侧都不标更糟"
    只标一侧会让 `left_gripper.pos` 和 `right_gripper.pos` 刻度不同，同一握持左右读数不同，数据里看不出异常。要标就两侧都标。

### 怎么标

两台各跑一次（路径相对 xense-taccap-lerobot 工作区，SDK 仓库里为 `python/examples/calibrate.py`）：

```bash
python third_party/taccap-gripper/python/examples/calibrate.py left
python third_party/taccap-gripper/python/examples/calibrate.py right
```

- **侧别**：由固件 SN 判定（`Cmd::GetSn` 读回，不是 CH343 芯片序列号），与采集时规则相同，`calibrate.py left` 标的一定是 `left` 那台。
- **核对**：脚本打印解析出的固件 SN 和扫到的全部夹爪；同一侧扫到两台会报错并列出两个 SN。
- **指定某台**：直接传固件 SN（`calibrate.py TCGU01A28Z0024m`，SN 为示例）。

固件版本不够时脚本退出，不做任何修改：

```text
✗ encoder-max calibration needs command set >= V2.1 (leader >= 1.2.0); this gripper reports 1.1.0.
  Nothing was changed. Flash it first: ...
```

先按[固件 OTA 升级](versions.md#ota)刷固件：镜像按角色选，先升 SDK 再刷固件。

版本通过后，脚本打印当前读数（raw 与钳位），按提示走两步：

1. 完全闭合 → 回车。发送 `SetEncoderZero` 锁存零点，再复读校验残差（容差 ±0.01rad）。
2. 完全张开到机械极限 → 回车。角度直接写入 MCU flash 的 `EncoderMaxCal`，无二次确认；随后显示 10Hz 实时读数供核对。

!!! warning "先夹到位，再按 Enter"
    固件在收到命令瞬间锁存原始计数，之后再动就白标了。

输出形如：

```text
================================================================
  TacCap leader-gripper encoder calibration
================================================================
  requested    : left  (resolved by side)
  firmware SN  : TCGU01A28Z0031m
  side         : Left
  mcu serial   : 5C96089694
  mcu device   : /dev/serial/by-id/usb-1a86_USB_Dual_Serial_5C96089694-if02
  visible      : TCGU01A28Z0032m (Right), TCGU01A28Z0031m (Left)

Step 1/2: hold the gripper FULLY CLOSED.
  → press [Enter] when held closed:
  post-latch reading: raw=+0.0058 rad (+0.33°)   cooked=+0.0058
  ✓ zero latched OK (|raw post-zero| ≤ 0.010 rad)

Step 2/2: open the gripper to its MECHANICAL LIMIT.
  → press [Enter] when fully open:
  fully-open reading: +1.1486 rad  (+65.81°)
  ✓ stored: max_rad = 1.1486 rad (65.81°)
```

标过的抬头多一行 `existing span: … — will be overwritten`。

- **闭合恒为 0**：没有 `gripper_closed_rad` 配置；负漂移钳到 0（原始值在 `raw_position_rad`），超过 -0.1rad 限频告警。
- **字段**：`position_rad` 仍是原始弧度，归一化只新增 `position` 字段。

### 确认标定生效 {#413}

一看启动日志，每侧连接时打印：

```text
[left]  Jaw normalised by the firmware's encoder-max calibration
```

没这一行就不用往下看：未标定的主夹爪连不上，程序会带着标定命令报错退出。

二看 Rerun 曲线。开 `--display_data=true`，在标量面板找 `gripper.pos`：

| 动作 | 期望 |
| --- | --- |
| 完全张开 | 顶到 **1.0** |
| 完全闭合 | 落到 **0.0** |

!!! warning "张到底明显够不到 1.0 → 重新标定这一台"
    完全张开只到 `0.8` 上下，说明 flash 里的行程上限已和实际行程对不上，程序不报错。用同一条命令重标即可。

### 适用范围

- **仅主夹爪**：主夹爪没有自动标定，不能省。从夹爪不接受该命令，自 V1.9 起上电自动标定（闭合到堵转取零点、张开到堵转取行程上限），`gripper.pos` 按 `gripper_open_rad` 归一化。
- **固件**：命令集 ≥ V2.1（即 leader ≥ 1.2.0 / follower ≥ 1.1.0，[区别](versions.md#v21)）；更低版本采集时主夹爪报错退出并提示 OTA，见[固件 OTA 升级](versions.md#ota)。

## Pico4 Ultra 追踪器自检

追踪器不需要标定，侧别由 SN 自动匹配；绑定见[Pico4 头显与追踪器](../common/pico4.md#pico-tracker-bind)。下面命令只读不写，打印位姿以确认链路和装配。

```bash
python -m lerobot.robots.taccap_gripper.check_tracker
# 指定某个 tracker SN(形如 PC2310MLL3200496G):
python -m lerobot.robots.taccap_gripper.check_tracker <tracker SN>
# 应用该侧内置的 tracker→TCP 安装变换:
python -m lerobot.robots.taccap_gripper.check_tracker --side right
```

以 10Hz 打印 `raw`（追踪器自身位姿）与 `ee`（经安装变换后的 TCP）。挥动夹爪，`raw xyz` 应平滑变化、SN 与预期一致（[读取追踪器 SN](../common/pico4.md#pico-tracker-sn)）。

- **安装变换**：追踪器到 TCP 的刚性偏移已内置（取自 CAD 装配实测），左右各自实测，接近镜像但不完全相同（旋转差 0.03°、平移差 1.27mm）。
- **`--side`**：选套用哪一侧；不带时变换是单位阵，`ee` 跟随 `raw`。
- **覆盖**：重新加工过安装座时设 `--robot.tracker_to_ee_pos` / `--robot.tracker_to_ee_quat`，两者独立，可只钉平移。
- **支点检查**：两指中点抵住固定点，握柄多姿态摆动；`ee xyz` 应基本不动而 `raw xyz` 大幅摆动，漂移量即变换误差。左右都测；左侧镜像方向错时 `ee` 摆幅约为应有的两倍。
- **Rerun**：[开录前预览](recording.md#preview)时加 `--display_data=true`，同时看夹爪数据和追踪器位姿。
- **四元数跳变**：半球翻转已有连续性修正，仍看到跳变请报 bug。

下一步 → [数据采集](recording.md)。
