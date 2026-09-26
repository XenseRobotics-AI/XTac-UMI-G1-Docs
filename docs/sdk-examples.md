# 示例

SDK 源码的 `python/examples/` 下有一组可以直接运行的脚本。先跑通脚本,再照着写自己的程序。
以下命令在 SDK 源码目录下、`taccap` 环境里运行。

所有脚本都用 `left`、`right` 或完整序列号指定夹爪,只接一只时可以省略。同一侧同时接着主从夹爪时用完整序列号。
**脚本启动时会中断其他正在使用夹爪的程序,数采或控制运行时不要运行示例脚本。**

## 脚本一览 {#scripts}

| 脚本 | 用途 | 是否会动电机或改写夹爪 |
|---|---|---|
| `follower_status.py` | 从夹爪自检 | 只读 |
| `gripper_console.py` | 键盘控制从夹爪 | **会动电机** |
| `impedance_control.py` | 阻抗控制测试;查看 / 写入运动安全包络 | **会动电机**;`--set-envelope` 改写夹爪 |
| `force_position_control.py` | 力位控制夹持测试 | **会动电机** |
| `control_and_read.py` | 控制中读取状态 | **会动电机** |
| `control_ripple.py` | 测量运动平稳度 | **会动电机** |
| `calibrate.py` | 主夹爪行程标定 | 改写夹爪 |
| `leader_normalized_position.py` | 读取主夹爪开度 | 只读 |
| `fisheye_cal.py` | 查看 / 写入鱼眼内参 | `show` 只读,其余改写夹爪 |
| `read_intrinsics.py` | 导出腕部相机内参 | 只读 |
| `wrist_camera.py` | 腕部相机查看器 | 只读 |
| `ota_update.py` | 夹爪固件升级 | **刷写固件** |
| `motor_ota_update.py` | 电机固件升级 | **刷写固件** |

每个脚本都可以用 `--help` 查看参数。

## 从夹爪 {#follower}

```bash
python python/examples/follower_status.py left
python python/examples/gripper_console.py left
python python/examples/impedance_control.py left
python python/examples/force_position_control.py left --grasp-torque 0.6
```

第一次使用前先按 [准备与自检](follower-setup.md) 写好运动安全包络。

## 主夹爪 {#leader}

```bash
python python/examples/calibrate.py right
python python/examples/leader_normalized_position.py right
```

标定流程见 [标定与自检](04-calibration.md)。

## 腕部相机 {#camera}

```bash
python python/examples/wrist_camera.py --list                  # 列出相机及其序列号
python python/examples/wrist_camera.py <相机序列号> --undistort   # 矫正后的画面
```

## 固件 {#firmware}

步骤见 [固件与电机升级](follower-firmware.md),主夹爪升级时把 `slave` 换成 `master`。

## 从旧版本迁移 {#migrate}

照 0.1.x / 0.2.x 写的程序,升级到 0.3.2 时主要有这些变化:

- 从夹爪改用控制器:`ImpedanceController` 或 `ForcePositionController`,配置用 `for_spec()` 生成。
  旧的 `ControlLoop`、`set_position()` 等接口已删除。
- 速度和力矩统一为正值 = 往闭合方向。
- 从夹爪固件需要 1.2.5 或以上。
- 示例脚本改用位置参数 `left` / `right` / 序列号选择夹爪,旧的控制类示例脚本已删除。
- 夹爪对象给出的腕部相机画面默认改为 RGB。

完整变更见 SDK 的 [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.3.2/CHANGELOG.md)。
