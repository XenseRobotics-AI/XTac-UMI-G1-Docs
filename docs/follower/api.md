# API 与示例

从夹爪用到的 SDK 接口与示例脚本。示例为 Python；C++ 接口同名，完整说明可用 `help(t.FollowerGripper)` 查看。安装见[准备与自检](setup.md#install)，怎样让夹爪动起来见[运动控制](control.md)。

```python
import xense.taccap as t
```

## 打开从夹爪 {#open}

只接一只从夹爪时：

```python
g = t.FollowerGripper(t.find_follower().mcu_device)
```

接着多只夹爪时，按左右和主从挑出要用的那只：

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

从夹爪的序列号以 `s` 结尾，见[序列号](index.md#sn)。

!!! danger "扫描会中断其他程序"
    扫描会停掉其他程序正在使用的夹爪数据流，正在夹持的从夹爪会卸力。在自己的程序里只在启动时扫描一次。

## 控制器 {#controllers}

| | 阻抗控制（默认） | 力位控制 |
|---|---|---|
| 控制器 | `ImpedanceController` | `ForcePositionController` |
| 配置 | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| 可调参数 | 一般不调 | `grasp_torque_nm`（夹持力，≤ 1.1 N·m） |
| 常用调用 | `set_target(开度)` | `set_target(开度)`、`release()`、`hold_position()` |
| 是否夹住 | — | `snapshot().holding` |

两种控制器都有 `start()` / `stop()`（或用 `with`）、`snapshot()`、`reset()`。调用顺序：

`g.motor.clear_fault()` → 启动控制器 → `g.motor.enable()` → `set_target()` → 停止控制器

完整写法见[在程序里控制](control.md#basic)。

## 读取状态 {#state}

| 场景 | 接口 | 内容 |
|---|---|---|
| 控制中 | `c.snapshot().observation` | `position`（开度）、`velocity`、`torque`（正值 = 往闭合方向）、`motor_temp_c` |
| 控制中 | `c.snapshot().holding` | 力位控制下是否夹住 |
| 不控制时 | `g.position()` | 开度 |
| 任何时候 | `g.motor.motor_version()` | 电机固件版本，见[电机固件版本](firmware.md#motor-version) |

控制运行时读状态一律用 `snapshot()`，不要另外去读电机状态，否则会和控制命令抢同一条通信。

## 电机底层接口 {#motor-primitives}

`g.motor.submit_*` 等底层接口直接向电机下发命令，不经过控制器的保护。**请使用控制器**，不要调用它们。

以下接口会修改夹爪或电机里保存的配置，**只在技术支持指导下使用**：
`set_model()`、`set_startup_limit_torque()`、`switch_protocol()`、`set_can_id()`、`set_private_param()`、
`set_zero()`、`set_gripper_config()`、`set_envelope()`、`set_auto_cal_config()`、`set_motor_fw_version()`。

## 腕部相机 {#camera}

从夹爪也带腕部相机，默认不打开。打开方式与主夹爪相同，见 SDK 附录的[腕部相机与鱼眼矫正](../sdk/api.md#camera)。

## 示例脚本 {#examples}

脚本在 SDK 源码的 `python/examples/` 下，在 SDK 源码目录运行：使用数采环境时是数采仓库的 `third_party/taccap-gripper`，单独安装时是 `TacCap-Gripper`。用 `left`、`right` 或完整序列号指定夹爪，只接一只时可以省略；每个脚本都可以用 `--help` 查看参数。

| 脚本 | 用途 | 是否会动电机或改写夹爪 |
|---|---|---|
| `follower_status.py` | 自检 | 只读 |
| `gripper_console.py` | 键盘控制 | **会动电机** |
| `impedance_control.py` | 阻抗控制测试；查看 / 写入运动安全包络 | **会动电机**；`--set-envelope` 改写夹爪 |
| `force_position_control.py` | 力位控制夹持测试 | **会动电机** |
| `control_and_read.py` | 边控制边读取状态 | **会动电机** |
| `control_ripple.py` | 测量运动平稳度 | **会动电机** |
| `ota_update.py` | 夹爪固件升级 | **刷写固件** |
| `motor_ota_update.py` | 电机固件升级 | **刷写固件** |

```bash
python python/examples/follower_status.py left
python python/examples/gripper_console.py left
python python/examples/impedance_control.py left
python python/examples/force_position_control.py left --grasp-torque 0.6
python python/examples/control_and_read.py left
```

!!! warning "运行示例前"
    第一次使用先按[准备与自检](setup.md)做完自检。脚本启动时会中断其他正在使用夹爪的程序，控制或数采运行时不要运行示例脚本。固件升级的步骤见[固件与电机升级](firmware.md)。
