# 示例

SDK 源码的 `python/examples/` 下有一组可以直接运行的脚本。先跑通脚本，再照着写自己的程序。
以下命令在 SDK 源码目录下运行：使用数采环境时是数采仓库的 `third_party/taccap-gripper`，
单独安装时是 `TacCap-Gripper`。

所有脚本都用 `left`、`right` 或完整序列号指定夹爪，只接一只时可以省略。同一侧同时接着主从夹爪时用完整序列号。
**脚本启动时会中断其他正在使用夹爪的程序，数采或控制运行时不要运行示例脚本。**

## 脚本一览 {#scripts}

| 脚本 | 用途 | 是否会动电机或改写夹爪 |
|---|---|---|
| `calibrate.py` | 主夹爪行程标定 | 改写夹爪 |
| `leader_normalized_position.py` | 读取主夹爪开度 | 只读 |
| `fisheye_cal.py` | 查看 / 写入鱼眼内参 | `show` 只读，其余改写夹爪 |
| `read_intrinsics.py` | 导出腕部相机内参 | 只读 |
| `wrist_camera.py` | 腕部相机查看器 | 只读 |
| `ota_update.py` | 夹爪固件升级 | **刷写固件** |
| `motor_ota_update.py` | 电机固件升级 | **刷写固件** |

每个脚本都可以用 `--help` 查看参数。从夹爪的脚本（自检、键盘控制、阻抗与力位控制等）见 [从夹爪 → 示例脚本](../follower/api.md#examples)。

## 从夹爪 {#follower}

见 [从夹爪 → 示例脚本](../follower/api.md#examples)。

## 主夹爪 {#leader}

```bash
python python/examples/calibrate.py right
python python/examples/leader_normalized_position.py right
```

标定流程见 [标定与自检](../pc/calibration.md)。

## 腕部相机 {#camera}

```bash
python python/examples/wrist_camera.py --list                  # 列出相机及其序列号
python python/examples/wrist_camera.py <相机序列号> --undistort   # 矫正后的画面
```

## 固件 {#firmware}

从夹爪的步骤见[固件与电机升级](../follower/firmware.md)，主夹爪见[固件 OTA 升级](../pc/versions.md#ota)。

## 从旧版本迁移 {#migrate}

照 0.1.x / 0.2.x 写的程序，升级到 0.4.1 时主要有这些变化：

- 从夹爪改用控制器：`ImpedanceController` 或 `ForcePositionController`，配置用 `for_spec()` 生成。
  旧的 `ControlLoop`、`set_position()` 等接口已删除。
- 速度和力矩统一为正值 = 往闭合方向。
- 从夹爪固件需要 1.2.5 或以上，低于 1.2.11 时会提示升级。
- 示例脚本改用位置参数 `left` / `right` / 序列号选择夹爪，旧的控制类示例脚本已删除。
- 夹爪对象给出的腕部相机画面默认改为 RGB。

从 0.3.x 升级到 0.4.x 时：

- 力位控制改为单一的力矩受限控制律，夹住时更稳；`snapshot().holding` 会比以前晚约 150ms 变为真，
  依赖它的程序请重新验证。
- 闭合到 0 时，最终状态可能是 `HOLDING_FORCE` 也可能是 `HOLDING_POSITION`，两者都是正常的。
- 运行中 `set_target(开度, 夹持力)` 的夹持力超过 1.1N·m 时直接报错，不再静默接受。
- 新增 `g.motor.motor_version()` 读电机固件版本（夹爪固件 1.2.14 起不受电机通信模式限制）。

完整变更见 SDK 的 [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.4.1/CHANGELOG.md)。
