# API 与示例

<span id="first-motion"></span><span id="full-chain"></span><span id="basic"></span><span id="impedance"></span><span id="force-position"></span><span id="fault"></span>

安装见[准备与自检](setup.md#install)，键盘与程序控制见[运动控制](control.md)。示例使用 Python，C++ 接口同名，详见 `help(t.FollowerGripper)`。

## 打开从夹爪 {#open}

```python
import xense.taccap as t

g = t.FollowerGripper(t.find_follower().mcu_device)        # 只接一只

ep = next(e for e in t.scan_grippers()                     # 多只按左右与主从挑
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

从夹爪序列号以 `s` 结尾，见[序列号](index.md#sn)。扫描会中断其他程序（见[找到设备](setup.md#discover)），只在启动时扫一次。

## 控制器 {#controllers}

| | 阻抗控制（默认） | 力位控制 |
|---|---|---|
| 控制器 | `ImpedanceController` | `ForcePositionController` |
| 配置 | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| 可调 | 一般不调 | `grasp_torque_nm`（夹持力，≤ 1.1N·m） |
| 常用 | `set_target(开度)` | `set_target(开度)`、`release()`、`hold_position()` |

- 开度用 0 到 1 表示：**0 = 闭合，1 = 张开**。
- 两种都有 `start()` / `stop()`（或 `with`）、`snapshot()`、`reset()`。
- 顺序：`g.motor.clear_fault()` → 启动控制器 → `g.motor.enable()` → `set_target()` → 停止控制器。
- 配置一律用 `for_spec(g.motor.get_spec())` 生成，只按需要改夹持力。
- 一只夹爪同时只运行一个控制器。

完整的控制示例见[在程序里控制](control.md#basic)。

## 读取状态 {#state}

| 场景 | 接口 | 内容 |
|---|---|---|
| 控制中 | `c.snapshot().observation` | `position`（开度）、`velocity`、`torque`（正 = 闭合方向）、`motor_temp_c` |
| 控制中 | `c.snapshot().holding` | 力位控制下是否夹住 |
| 未控制 | `g.position()` | 开度 |
| 任何时候 | `g.motor.motor_version()` | 见[电机固件版本](firmware.md#motor-version) |

控制中只用 `snapshot()` 读，另读电机会抢通信。

## 电机底层接口 {#motor-primitives}

`g.motor.submit_*` 等底层接口绕过控制器保护，**请用控制器**。

下列接口改写夹爪或电机配置，**须技术支持指导**：
`set_model()`、`set_startup_limit_torque()`、`switch_protocol()`、`set_can_id()`、`set_private_param()`、
`set_zero()`、`set_gripper_config()`、`set_envelope()`、`set_auto_cal_config()`、`set_motor_fw_version()`。

## 腕部相机 {#camera}

默认关，开法同主夹爪，见[腕部相机与鱼眼矫正](../sdk/index.md#camera)。

## 示例脚本 {#examples}

脚本在 `python/examples/`，从 SDK 源码目录运行（数采仓库 `third_party/taccap-gripper` 或单独安装的 `TacCap-Gripper`）；夹爪用 `left`、`right` 或完整序列号指定，只接一只可省；参数见 `--help`。

!!! warning "运行示例前"
    首次使用请完成[准备与自检](setup.md)，并查看[运动控制](control.md)的安全要求。脚本启动时会扫描设备。请先停止运行中的控制或数采程序。

| 脚本 | 用途 | 影响 |
|---|---|---|
| `follower_status.py` | [自检](setup.md#self-check) | 只读 |
| `gripper_console.py` | 键盘控制；`--rerun` 为[全链路检查](control.md#full-chain)（SDK 0.4.4 起） | **动电机** |
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
