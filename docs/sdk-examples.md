# 示例

SDK 源码的 `python/examples/` 下有 13 个可以直接运行的脚本。每个脚本只演示一项功能,
也是我们调试硬件时用的工具:先跑通脚本,再照着同样的调用写自己的程序。

以下命令都在 SDK 源码目录下、已激活的 `taccap` 环境里运行,见 [安装与构建](sdk-install.md)。

## 选设备 {#target}

所有脚本都接受同一个位置参数:`left`、`right` 或完整序列号。

```bash
python python/examples/follower_status.py left
python python/examples/follower_status.py TCGU01A24A0001s
python python/examples/follower_status.py          # 只接了一只夹爪时可以省略
```

没有 `--side`、`--sn` 之类的开关。接着两只夹爪又不指定时,脚本拒绝运行,不会替你猜。
`calibrate.py` 和 `motor_ota_update.py` 会写入设备,必须指定。

- `left` / `right` 只按侧别匹配,不看主从。同一侧同时接着主夹爪和从夹爪时,要用完整序列号。
- `wrist_camera.py` 例外:它的参数是**相机**的序列号,而且不能省略;先用 `wrist_camera.py --list` 查。
- 所有脚本启动时都会扫描设备,扫描会停掉其他程序的数据流。**数采或控制程序运行时不要运行示例脚本。**

## 脚本一览 {#scripts}

运行前先看"对设备的影响"一列。

| 脚本 | 用途 | 对设备的影响 |
|---|---|---|
| `follower_status.py` | 从夹爪状态自检:版本、开度、故障、数据流是否在更新 | 只读 |
| `impedance_control.py` | 位置跟随控制器验收;`--show-envelope` / `--set-envelope` 查看、写入运动安全包络 | **驱动电机**;`--set-envelope` 写 flash |
| `force_position_control.py` | 力位控制器验收:走一组开度并夹持 | **驱动电机并施加夹持力** |
| `gripper_console.py` | 键盘控制台,两种控制器都能用 | **驱动电机**;`--set-envelope` 写 flash |
| `control_and_read.py` | 控制过程中怎样读状态 | **驱动电机** |
| `control_ripple.py` | 测量控制平稳度 | **驱动电机** |
| `calibrate.py` | 主夹爪编码器零点与行程上限标定 | 写 flash |
| `fisheye_cal.py` | 查看 / 写入鱼眼内参与行程上限 | `show` 只读;`set-*` 与 `measure-encoder-max` 写 flash |
| `read_intrinsics.py` | 以 JSON 输出腕部相机内参 | 只读 |
| `wrist_camera.py` | 腕部相机查看器,可对比矫正前后 | 只读 |
| `leader_normalized_position.py` | 流式读取主夹爪 `[0,1]` 开度 | 只读 |
| `ota_update.py` | 夹爪固件升级 | **刷写固件** |
| `motor_ota_update.py` | 从夹爪电机固件升级 | **刷写电机固件** |

`_target.py` 与 `_calib_flow.py` 是其他脚本共用的模块,不能单独运行。每个脚本开头的注释写明了它测什么、每个参数的含义,
`--help` 列出全部参数。

## 从夹爪 {#follower}

!!! danger "会驱动真实电机"
    先按 [准备与自检](follower-setup.md) 写好运动安全包络。运行前清空爪子的运动范围,手指远离夹爪。

```bash
python python/examples/follower_status.py left                          # 只读自检
python python/examples/impedance_control.py left --show-envelope        # 只读:查看包络
python python/examples/impedance_control.py left --set-envelope --show-envelope   # 写入包络后退出,不运动
python python/examples/gripper_console.py left                          # 键盘控制,第一次运动用它
python python/examples/gripper_console.py left --mode force-position --grasp-torque 0.8
python python/examples/force_position_control.py left --grasp-torque 1.1   # 夹持验收
python python/examples/impedance_control.py left --targets 1.0,0.5,0.0    # 位置跟随验收
python python/examples/control_and_read.py left                         # 控制中读状态
python python/examples/control_ripple.py left --controller both         # 测平稳度
```

`--set-envelope` 不加 `--show-envelope` 时,写完包络会接着驱动电机。键盘控制台的按键见 [运动控制](follower-control.md#first-motion)。

## 主夹爪 {#leader}

```bash
python python/examples/calibrate.py right                # 编码器零点 + 行程上限,每只主夹爪一次
python python/examples/leader_normalized_position.py right
python python/examples/fisheye_cal.py show right         # 查看两份标定记录
```

`calibrate.py` 的完整流程见 [标定与自检](04-calibration.md)。

## 腕部相机 {#camera}

```bash
python python/examples/wrist_camera.py --list                  # 列出相机及其序列号
python python/examples/wrist_camera.py <相机序列号> --undistort   # 矫正后的画面
python python/examples/wrist_camera.py <相机序列号> --compare     # 矫正前后并排对比
python python/examples/read_intrinsics.py right --out cal.json # 导出内参;从夹爪加 --follower
```

## 固件 {#firmware}

```bash
python python/examples/ota_update.py --get-status right   # 只读:固件 OTA 状态
python python/examples/ota_update.py slave left           # 从夹爪固件;主夹爪用 master
python python/examples/ota_update.py --all                # 所有连着的夹爪,各按角色选镜像
python python/examples/motor_ota_update.py rs00-0.0.3.32.bin left   # 从夹爪电机固件
```

刷写前后的完整步骤,尤其是**刷完必须断电重启**,见 [固件与电机升级](follower-firmware.md)。
主夹爪的固件升级流程与从夹爪相同,只是镜像选 `master`。

## C++ 示例 {#cpp}

按 [仅构建 C++](sdk-install.md#cpp) 构建后,可执行文件在 `build/cpp/examples/`:

| 程序 | 用途 |
|---|---|
| `leader_demo` | 主夹爪 IMU 与编码器数据流,5 秒速率报告;不接受选择参数,只能接一只夹爪 |
| `follower_status` | 从夹爪状态读取 |
| `follower_impedance` | 位置跟随控制器 |
| `follower_force_position` | 力位控制器 |

```bash
./build/cpp/examples/follower_status left
```

!!! warning "C++ 从夹爪控制示例还没跟上 0.3.2 的流程"
    `follower_impedance` 与 `follower_force_position` 用的是裸配置(EL05 的数值),也没有使能电机,所以电机不会动;
    在 RS00 上 `follower_force_position` 还会在 `start()` 报错,`follower_impedance` 能启动但按 EL05 的数值运行。自己写 C++ 程序时按 Python 的流程:
    配置用 `ForcePositionConfig::for_spec(motor.get_spec())` 生成,`start()` 之后调用 `motor().enable()`,见 [运动控制](follower-control.md#basic)。

## 从旧版本迁移 {#migrate}

照 0.1.x 或 0.2.x 写的代码和文档,在 0.3.2 上会碰到下面这些变化:

| 旧写法 / 旧行为 | 0.3.2 |
|---|---|
| Python 里的 `Motor.set_position / set_velocity / set_torque / set_impedance`、`FollowerGripper.set_position` | 已删除,通过控制器的 `set_target()` 控制;这些只在 C++ 里保留 |
| `ControlLoop` | 已删除,改用 `ImpedanceController` 或 `ForcePositionController` |
| `FollowerGripper.start_streaming(imu_hz, encoder_hz, motor_hz)` | 只剩 `motor_hz`;填 0 报错 |
| 裸构造 `ForcePositionConfig()` / `ImpedanceConfig()` | 改用 `for_spec(g.motor.get_spec())`;超过电机额定时 `start()` 报错 |
| 力位控制的接触状态、`contact_count` | 改为 `snapshot().holding` 与 `arrived` |
| `ImpedanceState.STALLED`、`snapshot().stalled` | 已删除;被挡住时状态仍为 `TRACKING`,命令力矩饱和在持续堵转额定 |
| `observation.velocity` / `torque` 的符号随电机方向 | 统一为正 = 往闭合方向 |
| 包络参数 `--peak` / `--cont` 等 | 已删除;数值由 SDK 按电机规格生成,用 `--set-envelope` |
| 示例脚本的 `--side` | 改为位置参数 `left` / `right` / 序列号 |
| 腕部相机帧默认 BGR | 夹爪对象给出的帧默认 RGB;单独的 `Camera` 仍为 BGR |
| `Camera.read(timeout_ms=...)` | 只有 `read()`,带参数调用报 `TypeError` |
| 从夹爪固件 ≥ 1.1.6 即可 | ≥ 1.2.5,否则拒绝打开 |
| 镜像文件名 `tc-gu-01-slave.bin` | 带版本号,如 `tc-gu-01-slave-1.2.9.bin`;`ota_update.py` 按角色自动选择 |
| 示例 `motor_mit_control.py`、`gripper_force_grasp_test.py`、`gripper_control_test.py`、`rerun_dual_with_tracker.py`、`v4l2_probe.py` / `v4l2_sweep.py` | 已删除;控制类用 `gripper_console.py` 与两个验收脚本,相机用 `wrist_camera.py` |
| `stop()` 后电机保持使能 | 控制器 `stop()` 会卸力并失能电机 |

逐版本的完整变更见 SDK 仓库的 [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.3.2/CHANGELOG.md)。
