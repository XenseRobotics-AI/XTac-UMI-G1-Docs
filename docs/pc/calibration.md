# 标定与自检

本页做两件一次性的事:给主夹爪标零点和行程,再确认 Pico4 Ultra 追踪器链路通了。整条链路是否凑齐,开录前用[预览](recording.md#preview)确认。

## 夹爪标定(零点 + 行程) {#41}

### 什么时候需要标

数据集里的 `gripper.pos` 是归一化开度:`0.0` 完全闭合,来自标定第 1 步锁存的编码器零点;`1.0` 完全张开,来自第 2 步写入的行程上限(命令集 ≥ V2.1)。两个值都写在 MCU flash 里,断电不丢、换主机不用重标,一台标一次就够。只有两种情况要标:

| 情况 | 表现 | 谁发现 |
|---|---|---|
| 从没标过 | 采集程序**拒绝连接**主夹爪,报错里直接带标定命令 | 程序,漏不掉 |
| 标过,但值和实际行程对不上(拆装过编码器、动过机械限位、擦除过固件) | 能连上,但张到机械极限时 `gripper.pos` 顶不到 `1.0`(例如停在 `0.8`) | 只能你在预览里看出来,见[确认标定生效](#413) |

第二种程序不报错——它只知道存过值,不知道准不准。第一种的报错如下,按下面「怎么标」做完再回来:

```text
This leader gripper has no encoder-max calibration, so its jaw travel is unknown
and gripper.pos cannot be computed (...).

Calibrate it once, then re-run:

    python third_party/taccap-gripper/python/examples/calibrate.py <left|right>
```

!!! danger "双夹爪只标一侧,比两侧都不标更糟"
    两侧都没标时刻度至少一致;只标一侧会让 `left_gripper.pos` 和 `right_gripper.pos` 落在不同刻度上,同一个握持动作左右读数不同,而数据里看不出异常。要标就两侧都标。

### 怎么标

按左右指定,两台各跑一次(路径以 xense-taccap-lerobot 工作区为准,SDK 仓库里即 `python/examples/calibrate.py`):

```bash
python third_party/taccap-gripper/python/examples/calibrate.py left
python third_party/taccap-gripper/python/examples/calibrate.py right
```

左右由固件烧录的 SN 判定(`Cmd::GetSn` 读回,不是 CH343 芯片序列号),和采集时 `left_gripper.pos` 同一条规则,所以 `calibrate.py left` 标的一定是 `left` 那台。脚本会打印解析出的固件 SN 和扫到的全部夹爪,写 flash 前可确认没选错;同一侧扫到两台会报错并列出两个 SN,不替你猜。要锁定某台可直接传固件 SN(`calibrate.py TCGU01A28Z0024m`,SN 为示例)。

脚本先验固件版本,不够就原样退出、什么都不改:

```text
✗ encoder-max calibration needs command set >= V2.1 (leader >= 1.2.0); this gripper reports 1.1.0.
  Nothing was changed. Flash it first: ...
```

见到这条先按[固件 OTA 升级](versions.md#ota)刷固件再回来:镜像按角色选,先升 SDK 再刷固件。

版本通过后一条命令走完两步,脚本先打印当前读数(raw 与钳位),再按提示操作:

1. 保持夹爪完全闭合 → 回车。发送 `SetEncoderZero` 锁存零点,随后复读校验残差(容差 ±0.01 rad)。
2. 完全张开(顶到机械极限)→ 回车。采样此时角度写入 `EncoderMaxCal`——直接写 MCU flash,没有二次确认——随后进入 10 Hz 实时读数供目视核对。

!!! warning "先夹到位,再按 Enter"
    固件在收到命令的瞬间锁存当时的原始计数,按 Enter 前夹爪必须已经在目标位置,中途再动就白标了。

输出形如:

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

之前标过的,抬头会多一行 `existing span: … — will be overwritten`。

零点写在固件里,没有 `gripper_closed_rad` 配置,闭合恒为 0:负向漂移被钳到 0(原始值保留在 `raw_position_rad`),raw 负漂超过 -0.1 rad 会限频告警。`position_rad` 仍是原始弧度,归一化只新增 `position` 字段。

### 确认标定生效 {#413}

一看启动日志,标定生效时采集程序连接每侧会打印:

```text
[left]  Jaw normalised by the firmware's encoder-max calibration
```

没这一行就不用往下看:未标定的主夹爪根本连不上,程序会带着标定命令报错退出。

二看 Rerun 曲线。开 `--display_data=true`,标量面板里找 `gripper.pos`:

| 动作 | 期望 |
| --- | --- |
| 完全张开 | 顶到 **1.0** |
| 完全闭合 | 落到 **0.0** |

能连上说明行程上限已生效,这一步查的是值还准不准。

!!! warning "张到底明显够不到 1.0 → 重新标定这一台"
    完全张开只到 `0.8` 上下,说明 flash 里的行程上限已和实际行程对不上,程序不会为此报错。重跑一遍标定即可,命令和第一次完全一样。

### 适用范围

- 手动标定仅 leader(主夹爪)。从夹爪不接受该命令:它自 V1.9 起走固件的上电自动标定(闭合到堵转取零点、张开到堵转取行程上限),采集时其 `gripper.pos` 仍按 `gripper_open_rad` 归一化。主夹爪没有自动标定,而采集用的正是主夹爪,手动标定不能省。
- 需要固件命令集 ≥ V2.1(即 leader ≥ 1.2.0 / follower ≥ 1.1.0,[区别](versions.md#v21));更低版本采集时主夹爪也直接报错退出并提示先做 OTA。刷固件见[固件 OTA 升级](versions.md#ota)。

## Pico4 Ultra 追踪器自检

追踪器不需要标定:安装变换内置,左右侧别由 SN 自动匹配。追踪器与夹爪的绑定在[Pico4 头显与追踪器](../common/pico4.md#pico-tracker-bind)里做完;本页这条命令只读不写,只打印位姿,用来确认链路通了、装配没错。

```bash
python -m lerobot.robots.taccap_gripper.check_tracker
# 指定某个 tracker SN(形如 PC2310MLL3200496G):
python -m lerobot.robots.taccap_gripper.check_tracker <tracker SN>
# 应用该侧内置的 tracker→TCP 安装变换:
python -m lerobot.robots.taccap_gripper.check_tracker --side right
```

以 10 Hz 打印 `raw`(追踪器自身位姿)与 `ee`(经刚性安装变换后的 TCP)。挥动夹爪,`raw xyz` 应平滑变化、SN 与预期一致([读取追踪器 SN](../common/pico4.md#pico-tracker-sn))。

安装变换不需要你测:追踪器到 TCP 的刚性偏移由 `ee_transform.tracker_to_tcp` 内置(取自 CAD 装配实测),左右各自实测,接近镜像但不完全相同(旋转差 0.03°、平移差 1.27 mm)。`--side` 决定套用哪一侧;不带 `--side` 时变换是单位阵,`ee` 完全跟随 `raw`。只有重新加工过安装座之类才需覆盖,设 `--robot.tracker_to_ee_pos` / `--robot.tracker_to_ee_quat`,两者独立,可只钉平移、旋转仍用内置值。

支点检查不需额外硬件:把两指中点抵在一个固定点上,握着手柄尽量多变换姿态摆动。`ee xyz` 应基本不动而 `raw xyz` 大幅摆动,看到的漂移量即该变换的误差。左右都要测;左侧镜像方向错了,表现为 `ee` 摆动幅度约为应有的两倍。

要在 Rerun 单视图里看双夹爪 IMU/编码器和追踪器 6-DoF 位姿,用 SDK 示例 `rerun_dual_with_tracker.py`(需 `xensevr_pc_service_sdk` 与 XenseVR PC Service 运行)。它不走 LeRobot 的 SN 自动匹配,必须显式传 SN;SN 属于具体机台,换机要换成你那台报出的,并逐个摇晃夹爪验证左右:

```bash
python third_party/taccap-gripper/python/examples/rerun_dual_with_tracker.py \
    --left-tracker-sn  <左追踪器SN> \
    --right-tracker-sn <右追踪器SN>
```

四元数半球翻转(符号跳变)在位姿读取内部已有连续性修正,仍看到跳变请报 bug。

下一步 → [数据采集](recording.md)。
