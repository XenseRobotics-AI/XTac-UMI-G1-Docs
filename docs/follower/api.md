# 运动控制与 API

开始前先做完[安装与自检](index.md#install)，**尤其是[运动自检](index.md#motion-check)**。示例为 Python，C++ 接口同名，详见 `help(t.FollowerGripper)`。

!!! danger "会驱动真实电机"
    运行前清空爪子的运动范围，手指远离夹爪，确认可以随时断开 24V。机器人上的从夹爪先在机器人静止时测试。

## 用键盘控制 {#first-motion}

```bash
python python/examples/gripper_console.py left
```

| 按键 | 作用 |
|---|---|
| `j` / `k` | 张开 / 闭合一步 |
| `o` / `c` | 全开 / 全合 |
| `h` | 停在当前位置 |
| `d` / `e` | 松开电机 / 恢复控制 |
| `f` | 清除故障 |
| `q` 或 `Esc` | 退出 |

默认是阻抗控制；要以指定的力夹东西，加 `--mode force-position --grasp-torque 0.6`（夹持力，单位 N·m，不超过 1.1）。

### 全链路检查 {#full-chain}

SDK 0.4.4 起，控制台加 `--rerun`，按键开合的同时在 [Rerun](https://rerun.io) 里实时显示这只从夹爪的全部数据：

```bash
python python/examples/gripper_console.py left --mode force-position --rerun
```

| 曲线 / 画面 | 看什么 |
|---|---|
| 开度与目标开度 | 空载时开度跟上目标；夹住物体时停在目标之前 |
| 实测力矩与命令力矩 | 夹住时上升到设定的夹持力 |
| 控制器状态 | 文本记录，夹住时为 `HOLDING_FORCE`，故障为 `FAULT` |
| 腕部相机 | 帧率稳定在 30Hz |
| 视触觉图像、标记点位移、合力 | 夹住物体时有响应，松开后回落 |

投入使用或开始采集前，建议夹一个物体把这几项都看一遍。相机与查看器在电机使能前打开，**启动时不要碰凝胶**。
其余参数（`--no-wrist`、`--save` 等）与 `rerun_viewer.py` 相同，见 [SDK 示例 → 全链路检查](../sdk/index.md#full-chain)。

## 两种控制器 {#controllers}

| | 阻抗控制（默认） | 力位控制 |
|---|---|---|
| 适合 | 跟随一个开度：遥操作、跟随主夹爪、执行策略 | 以设定的力夹住物体 |
| 被物体挡住时 | 以 1.1N·m 顶住 | 以设定的夹持力顶住，并报告已夹住 |
| 控制器 | `ImpedanceController` | `ForcePositionController` |
| 配置 | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| 可调 | 一般不调 | `grasp_torque_nm`（夹持力，≤ 1.1N·m） |
| 常用 | `set_target(开度)` | `set_target(开度)`、`release()`、`hold_position()` |

- 开度用 0 到 1 表示：**0 = 闭合，1 = 张开**。
- 两种都有 `start()` / `stop()`（或 `with`）、`snapshot()`、`reset()`。
- 顺序：`g.motor.clear_fault()` → 启动控制器 → `g.motor.enable()` → `set_target()` → 停止控制器。
- 配置一律用 `for_spec(g.motor.get_spec())` 生成，只按需要改夹持力。
- 一只夹爪同时只运行一个控制器。

## 在程序里控制 {#basic}

### 打开从夹爪 {#open}

```python
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)        # 只接一只

ep = next(e for e in t.scan_grippers()                     # 多只按左右与主从挑
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

从夹爪序列号以 `s` 结尾，见[序列号](index.md#sn)。扫描会中断其他程序（见[找到设备](index.md#discover)），只在启动时扫一次。

### 阻抗控制 {#impedance}

```python
import time
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)
cfg = t.ImpedanceConfig.for_spec(g.motor.get_spec())

g.motor.clear_fault()
with t.ImpedanceController(g, cfg) as c:   # 退出 with 时自动停止并松开电机
    g.motor.enable()
    c.set_target(0.0)                       # 闭合
    time.sleep(2)
    print("开度", c.snapshot().observation.position)
    c.set_target(1.0)                       # 张开
    time.sleep(2)
```

遥操作或执行策略时，在控制循环里每个周期调用一次 `c.set_target(开度)` 即可，不需要等待。

### 力位控制 {#force-position}

换一个配置和控制器，其余相同：

```python
cfg = t.ForcePositionConfig.for_spec(g.motor.get_spec())
cfg.grasp_torque_nm = 0.6                   # 夹持力,不超过 1.1 N·m

g.motor.clear_fault()
with t.ForcePositionController(g, cfg) as c:
    g.motor.enable()
    c.set_target(0.0)                       # 闭合夹取
    time.sleep(2)
    print("夹住了" if c.snapshot().holding else "没有夹到东西")
    c.release()                             # 松开
    time.sleep(2)
```

跟随连续目标时，力位控制比目标晚约一个发送周期（50Hz 下约 20ms），换来平顺的运动。

!!! danger "停止控制或断链时夹爪会松开"
    控制器停止（退出 `with`、程序结束）、控制台按 `d` / `q`，或 USB 断开，夹爪会松开，**夹持物会掉落**。
    机器人夹持物体时，先将物体放到安全位置再停止控制。

!!! warning "长时间夹持会降低夹持力"
    电机发热后固件自动降低输出。实测 1.1N·m 持续夹 10 分钟，电机升到约 70°C；0.6N·m 稳定在约 49°C。
    需持续夹持数十分钟时，将夹持力降至约 0.6N·m。

## 读取状态 {#state}

| 场景 | 接口 | 内容 |
|---|---|---|
| 控制中 | `c.snapshot().observation` | `position`（开度）、`velocity`、`torque`（正 = 闭合方向）、`motor_temp_c` |
| 控制中 | `c.snapshot().holding` | 力位控制下是否夹住 |
| 未控制 | `g.position()` | 开度 |
| 任何时候 | `g.motor.motor_version()` | 见[电机固件版本](firmware.md#motor-version) |

控制中只用 `snapshot()` 读，另读电机会抢通信。

## 故障与恢复 {#fault}

控制器检测到异常会停下并卸力，`c.snapshot().state` 变为 `FAULT`，原因在 `c.snapshot().fault_reason`。
排除原因后依次调用 `g.motor.clear_fault()` 和 `c.reset()` 即可继续；不能恢复时断电重启夹爪。
常见原因见[故障排查](troubleshooting.md#fault)。

## 电机底层接口 {#motor-primitives}

`g.motor.submit_*` 等底层接口绕过控制器保护，**请用控制器**。

下列接口改写夹爪或电机配置，**须技术支持指导**：
`set_model()`、`set_startup_limit_torque()`、`switch_protocol()`、`set_can_id()`、`set_private_param()`、
`set_zero()`、`set_gripper_config()`、`set_envelope()`、`set_auto_cal_config()`、`set_motor_fw_version()`。

## 腕部相机 {#camera}

默认关，开法同主夹爪，见[腕部相机与鱼眼矫正](../sdk/index.md#camera)。

## 示例脚本 {#examples}

脚本在 `python/examples/`，从 SDK 源码目录运行（数采仓库 `third_party/taccap-gripper` 或单独安装的 `TacCap-Gripper`）；夹爪用 `left`、`right` 或完整序列号指定，只接一只可省；参数见 `--help`。脚本启动时会扫描设备，控制或数采运行时不要运行。

| 脚本 | 用途 | 影响 |
|---|---|---|
| `follower_status.py` | [自检](index.md#self-check) | 只读 |
| `gripper_console.py` | 键盘控制；`--rerun` 为[全链路检查](#full-chain)（SDK 0.4.4 起） | **动电机** |
| `impedance_control.py` | 阻抗测试；查看 / 写运动安全包络 | **动电机**；`--set-envelope` 改写夹爪 |
| `force_position_control.py` | 力位夹持测试，如 `--grasp-torque 0.6` | **动电机** |
| `control_and_read.py` | 边控制边读状态 | **动电机** |
| `control_ripple.py` | 测运动平稳度 | **动电机** |
| `ota_update.py` | [夹爪固件升级](firmware.md#mcu-ota) | **刷固件** |
| `motor_ota_update.py` | [电机固件升级](firmware.md#motor-ota) | **刷固件** |

```bash
python python/examples/impedance_control.py left
python python/examples/force_position_control.py left --grasp-torque 0.6
python python/examples/control_and_read.py left
```
