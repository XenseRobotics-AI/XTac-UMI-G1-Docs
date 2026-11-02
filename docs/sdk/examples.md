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
| `tactile_sensor.py` | 视触觉传感器查看器（SDK 0.4.4 起） | 只读 |
| `rerun_viewer.py` | 夹爪状态、腕部相机、视触觉同屏查看（SDK 0.4.4 起） | 只读 |
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

## 视触觉传感器 {#tactile}

SDK 0.4.4 起附带。视触觉图像由 `xensesdk` 读取，单独安装的 `taccap` 环境里已经带有它。

```bash
python python/examples/tactile_sensor.py --list     # 每个传感器装在哪只夹爪、哪一侧手指
python python/examples/tactile_sensor.py left       # 左夹爪的两个传感器
python python/examples/tactile_sensor.py left --finger right --outputs rectify,difference
```

每只夹爪两个传感器，分别装在左右两根手指上。`left` / `right` 指的是**夹爪**，由同一 USB 集线器上的夹爪决定，
所以查看时夹爪要插着；哪根手指看传感器序列号末位，奇数为左、偶数为右。

窗口里每个传感器一列，依次是校正图像、差分图像、深度和力分布。画面方向和颜色与数采录下来的一致。
**启动时不要碰凝胶**：差分图像和力都以启动那一刻为无接触基准；按 `c` 可以重新取基准（同样先松开）。

## 全链路检查 {#full-chain}

SDK 0.4.4 起附带，用 [Rerun](https://rerun.io) 把一只夹爪的全部数据放在同一条时间轴上：
夹爪状态（开度、速度、力矩、温度、状态位）、腕部相机、两个视触觉传感器（图像、叠加的力分布箭头、合力曲线）。

```bash
python python/examples/rerun_viewer.py left                  # 只看，不动电机
python python/examples/rerun_viewer.py left --save rig.rrd --duration 20   # 存成文件
```

从夹爪要一边开合一边看，用键盘控制台的 `--rerun`，见[运动控制 → 全链路检查](../follower/control.md#full-chain)。

!!! warning "PC 版数采环境只能看图像"
    数采环境不带视触觉推理引擎，力分布和深度会报 `No module named 'onnxruntime'`。
    在数采环境里运行时，`rerun_viewer.py` 和 `gripper_console.py --rerun` 加 `--no-force`，
    `tactile_sensor.py` 加 `--outputs rectify,difference`。单独安装的 `taccap` 环境没有这个限制。

相机与视触觉同时开时，所有相机都要用 MJPEG，见[主机配置](../pc/host-setup.md)；腕部相机正被其他程序占用时加 `--no-wrist`。

## 固件 {#firmware}

从夹爪的步骤见[固件与电机升级](../follower/firmware.md)，主夹爪见[固件 OTA 升级](../pc/versions.md#ota)。

## 从旧版本迁移 {#migrate}

照 0.1.x / 0.2.x 写的程序，升级到 0.4.x 时主要有这些变化：

- 从夹爪改用控制器：`ImpedanceController` 或 `ForcePositionController`，配置用 `for_spec()` 生成。
  旧的 `ControlLoop`、`set_position()` 等接口已删除。
- 速度和力矩统一为正值 = 往闭合方向。
- 从夹爪固件需要 1.2.5 或以上，低于 1.2.11 时会提示升级。
- 示例脚本改用位置参数 `left` / `right` / 序列号选择夹爪，旧的控制类示例脚本已删除。
- 夹爪对象给出的腕部相机画面默认改为 RGB。

从 0.3.x 升级到 0.4.x 时：

- 力位控制改为单一力矩受限控制律，夹住时更稳；`snapshot().holding` 比以前晚约 150ms 变为真，
  依赖它的程序请复核。
- 闭合到 0 时，最终状态可能是 `HOLDING_FORCE` 也可能是 `HOLDING_POSITION`，两者都是正常的。
- 运行中 `set_target(开度, 夹持力)` 的夹持力超过 1.1N·m 时直接报错，不再静默接受。
- 新增 `g.motor.motor_version()` 读电机固件版本（夹爪固件 1.2.14 起不受电机通信模式限制）。

从 0.4.1 升级到 0.4.3 时（接口不变）：

- `ForcePositionController` 跟随连续发送的目标时不再走走停停，代价是跟踪延迟多约 10–15ms。
- 目标仍在移动时被挡住，进入 `HOLDING_FORCE` 比以前晚约 150ms；依赖它判断夹住的程序请复核。
- 附带的从夹爪固件升到 1.2.16，请[升级固件](../follower/firmware.md#mcu-ota)。

从 0.4.3 升级到 0.4.4 时（接口不变）：

- 新增[视触觉](#tactile)与[全链路检查](#full-chain)示例。
- `environment.yml` 新增 `xensesdk` 与 `rerun-sdk`，并把 NumPy 固定为 2.2.4（`xensesdk` 的要求）。
  已有的 `taccap` 环境执行 `mamba env update -f environment.yml --prune`，再重新运行 `uv pip install -e . --no-build-isolation`。
- 日志和报错信息改为英文。按中文报错文本做匹配的脚本需要更新，例如固件低于 1.2.11 的提示现在是 `is below 1.2.11`。
- EL05 电机固件随 SDK 附带，`motor_ota_update.py` 不指定镜像时会按夹爪记录的电机型号自动选择。

完整变更见 SDK 的 [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.4.4/CHANGELOG.md)。
