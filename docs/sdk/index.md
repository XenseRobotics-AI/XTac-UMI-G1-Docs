# SDK 与二次开发

`xense.taccap`（仓库 [TacCap-Gripper](https://github.com/XenseRobotics-AI/TacCap-Gripper)）是 XTac UMI G1 夹爪的开发包，提供 Python 与 C++ 两种接口，用于自己编写程序读取主夹爪、控制从夹爪。本页按 SDK 0.4.6 编写。

## 能做什么 {#scope}

| | 主夹爪 | 从夹爪 |
|---|---|---|
| 读开合 | 编码器，0..1 开度 | 电机位置，0..1 开度 |
| 其他数据 | IMU、按键 | 电机速度、力矩、温度 |
| 控制 | — | 阻抗控制（默认）、力位控制 |
| 共有 | LED、腕部相机、鱼眼内参、固件升级 | 同左；另有电机固件升级与版本查看 |

视触觉图像由 `xensesdk` 采集，不在本 SDK 里；SDK 0.4.4 起附带用 `xensesdk` 查看视触觉的[示例](#tactile)。遥操作、抓取策略、数据录制属于上层应用。从夹爪的控制器、状态读取与示例脚本见[从夹爪 → API 与示例](../follower/api.md)。

## 使用须知 {#notes}

- 电脑不直接控制电机，所有命令都经夹爪主控板转发，主控板上的保护（运动安全包络）任何程序都绕不过去。
- 一只夹爪同时只由一个程序、一个控制器使用。
- 日志写在 `~/.taccaplogs/`（可用环境变量 `TACCAP_LOG_DIR` 修改），每次运行一个文件。反馈问题时附上对应的日志。

!!! danger "扫描会中断其他程序"
    `scan_grippers()` 和所有示例脚本启动时都会停掉其他程序正在使用的夹爪数据流，正在夹持的从夹爪会卸力。数采或控制运行时不要扫描、不要运行示例脚本；在自己的程序里只在启动时扫描一次。

## 安装 {#python}

**推荐直接用数采环境**：按[安装](../pc/install.md)装好数采仓库 `xense-taccap-lerobot` v0.1.6 后就已经带有 SDK 0.4.6（子模块 `third_party/taccap-gripper`），源码和示例脚本都在这个目录下。验证：

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.4.6`。版本不对时拉子模块并重跑 `./setup_env.sh --install`，见[仓库与子模块更新](../pc/versions.md#repo-update)。

### 单独安装（背包版或不用数采仓库） {#standalone}

背包版客户，或不使用数采仓库的电脑，按[从夹爪 · 安装 SDK 与主机配置](../follower/index.md#install)从零安装：Miniforge → `v4l-utils` → 下载 SDK → 创建 mamba 环境 → 编译安装 → 主机配置。主夹爪与从夹爪用的是同一套步骤。

### 硬件自检 {#self-check}

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"
```

每只夹爪一行，主夹爪为 `Role.Leader`（序列号以 `m` 结尾），从夹爪为 `Role.Follower`（以 `s` 结尾）。从夹爪接着看[准备与自检](../follower/index.md#self-check)；串口权限等问题见[主机配置](../pc/host-setup.md#first-use)。

### 集成到 C++ / ROS 2 工程 {#cpp}

把 SDK 源码作为 CMake 子目录引入，链接 `taccap_core`：

```cmake
set(TACCAP_BUILD_PYTHON   OFF CACHE BOOL "" FORCE)
set(TACCAP_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
add_subdirectory(path/to/TacCap-Gripper taccap-gripper-build)
target_link_libraries(my_target PRIVATE taccap_core)
```

编译使用上面单独安装时创建的 `taccap` 环境，其中已含全部编译依赖。C++ 接口与 Python 同名，位于 `xense::taccap` 命名空间。ROS 2 里的夹爪模型（URDF / Xacro）见 [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description)。

## API 要点 {#api}

示例为 Python；完整说明可用 `help()` 查看，例如 `help(t.FollowerGripper)`。

```python
import xense.taccap as t
```

### 设备发现 {#discovery}

```python
for e in t.scan_grippers():
    print(e.side, e.role, e.firmware_sn, e.mcu_device)
```

多只夹爪时，按左右和主从一起挑出要用的那只，再用它的 `mcu_device` 打开：

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

只接一只时也可以用 `t.find_follower()` / `t.find_leader()`。

### 主夹爪：读取 {#leader}

```python
g = t.LeaderGripper(ep.mcu_device, normalize_position=True)   # ep 按上面的方法挑出主夹爪
g.encoder.on_data(lambda s: print(s.position))   # 0 = 闭合,1 = 张开
g.imu.on_data(lambda s: print(s))
g.start_streaming(imu_hz=100, encoder_hz=100)
# ...
g.stop_streaming()
```

`normalize_position=True` 需要主夹爪已完成行程标定，见[夹爪标定](../pc/calibration.md#41)。

### 从夹爪：控制 {#follower}

见[从夹爪 → API 与示例](../follower/api.md)。

<span id="motor-primitives"></span>
电机底层接口不经过控制器的保护，不要直接调用，见[电机底层接口](../follower/api.md#motor-primitives)。

### 腕部相机与鱼眼矫正 {#camera}

夹爪对象默认不打开腕部相机。需要时：

```python
g = t.FollowerGripper(ep.mcu_device, wrist_video="/dev/v4l/by-id/<相机>-video-index0",
                      open_cameras=True, undistort_wrist=True)
g.wrist_camera.start(lambda f: print(f.frame_index))
```

画面默认是 RGB。只想看画面可以直接用示例 `wrist_camera.py`。

<span id="fisheye-fallback"></span>
鱼眼内参存在每只夹爪里。没有标定过的夹爪，SDK 自动改用一组内置的参考内参并打印告警，矫正不会失败。读取内参时用：

```python
cal, is_reference, reason = g.calibration.resolve_fisheye()
```

`is_reference` 为真表示用的是参考内参，只适合看画面。需要在矫正图上按像素测量时，给这台夹爪写入它自己的标定：`python python/examples/fisheye_cal.py set-fisheye right --from-npz cam.npz`（从夹爪加 `--follower`）。矫正后画面偏心是正常的，不要去改内参里的 `cx`。详见[鱼眼标定读不到时会怎样](../pc/recording.md#fisheye-fallback)。

## 示例脚本 {#scripts}

脚本在 SDK 源码的 `python/examples/` 下，以下命令在 SDK 源码目录运行：使用数采环境时是数采仓库的 `third_party/taccap-gripper`，单独安装时是 `TacCap-Gripper`。

所有脚本都用 `left`、`right` 或完整序列号指定夹爪，只接一只时可以省略；同一侧同时接着主从夹爪时用完整序列号。每个脚本都可以用 `--help` 查看参数。

| 脚本 | 用途 | 是否会动电机或改写夹爪 |
|---|---|---|
| `calibrate.py` | 主夹爪行程标定，流程见[夹爪标定](../pc/calibration.md#41) | 改写夹爪 |
| `leader_normalized_position.py` | 读取主夹爪开度 | 只读 |
| `fisheye_cal.py` | 查看 / 写入鱼眼内参 | `show` 只读，其余改写夹爪 |
| `read_intrinsics.py` | 导出腕部相机内参 | 只读 |
| `wrist_camera.py` | 腕部相机查看器 | 只读 |
| `tactile_sensor.py` | 视触觉传感器查看器（SDK 0.4.4 起） | 只读 |
| `rerun_viewer.py` | 夹爪状态、腕部相机、视触觉同屏查看（SDK 0.4.4 起） | 只读 |
| `ota_update.py` | 夹爪固件升级 | **刷写固件** |
| `motor_ota_update.py` | 电机固件升级 | **刷写固件** |

```bash
python python/examples/calibrate.py right
python python/examples/leader_normalized_position.py right
python python/examples/wrist_camera.py --list                  # 列出相机及其序列号
python python/examples/wrist_camera.py <相机序列号> --undistort   # 矫正后的画面
```

从夹爪的脚本（自检、键盘控制、阻抗与力位控制等）见[从夹爪 → 示例脚本](../follower/api.md#examples)。

<span id="firmware"></span>
固件升级：主夹爪见[固件 OTA 升级](../pc/versions.md#ota)，从夹爪见[固件与电机升级](../follower/firmware.md)。

### 视触觉传感器 {#tactile}

SDK 0.4.4 起附带。视触觉图像由 `xensesdk` 读取，单独安装的 `taccap` 环境里已经带有它。

```bash
python python/examples/tactile_sensor.py --list     # 每个传感器装在哪只夹爪、哪一侧手指
python python/examples/tactile_sensor.py left       # 左夹爪的两个传感器
python python/examples/tactile_sensor.py left --finger right --outputs rectify,difference
```

- `left` / `right` 指的是**夹爪**，由同一 USB 集线器上的夹爪决定，所以查看时夹爪要插着；哪根手指看传感器序列号末位，奇数为左、偶数为右。
- 窗口里每个传感器一列，依次是校正图像、标记点位移（marker flow）、差分图像和深度，方向和颜色与数采录下来的一致。
- **启动时不要碰凝胶**：差分图像和力都以启动那一刻为无接触基准；按 `c` 可以重新取基准（同样先松开）。

### 全链路检查 {#full-chain}

SDK 0.4.4 起附带，用 [Rerun](https://rerun.io) 把一只夹爪的全部数据放在同一条时间轴上：夹爪状态（开度、速度、力矩、温度、状态位）、腕部相机、两个视触觉传感器（图像、叠加的标记点位移箭头、合力曲线）。

```bash
python python/examples/rerun_viewer.py left                  # 只看，不动电机
python python/examples/rerun_viewer.py left --save rig.rrd --duration 20   # 存成文件
```

- 图像上的绿色箭头是标记点位移：从每个标记点的初始位置指向当前位置，与 `xensesdk` 自带的 `drawMarkerMove` 画法一致，**1:1 不放大**，箭头长度就是实际位移的像素数。没有接触时只剩一个个绿点。
- 从夹爪要一边开合一边看，用键盘控制台的 `--rerun`，见[从夹爪 → 全链路检查](../follower/api.md#full-chain)。
- 相机与视触觉同时开时，所有相机都要用 MJPEG，见 [USB 带宽预算](../pc/host-setup.md#usb-budget)；腕部相机正被其他程序占用时加 `--no-wrist`。

!!! warning "PC 版数采环境只能看图像"
    数采环境不带视触觉推理引擎，标记点位移、合力和深度会报 `No module named 'onnxruntime'`。在数采环境里运行时，`rerun_viewer.py` 和 `gripper_console.py --rerun` 加 `--no-force`，`tactile_sensor.py` 加 `--outputs rectify,difference`。单独安装的 `taccap` 环境没有这个限制。

## 从旧版本迁移 {#migrate}

完整变更见 SDK 的 [CHANGELOG](https://github.com/XenseRobotics-AI/TacCap-Gripper/blob/v0.4.6/CHANGELOG.md)。

**0.1.x / 0.2.x → 0.4.x**

- 从夹爪改用控制器：`ImpedanceController` 或 `ForcePositionController`，配置用 `for_spec()` 生成。旧的 `ControlLoop`、`set_position()` 等接口已删除。
- 速度和力矩统一为正值 = 往闭合方向。
- 从夹爪固件需要 1.2.5 或以上，低于 1.2.11 时会提示升级。
- 示例脚本改用位置参数 `left` / `right` / 序列号选择夹爪，旧的控制类示例脚本已删除。
- 夹爪对象给出的腕部相机画面默认改为 RGB。

**0.3.x → 0.4.x**

- 力位控制改为单一力矩受限控制律，夹住时更稳；`snapshot().holding` 比以前晚约 150ms 变为真，依赖它的程序请复核。
- 闭合到 0 时，最终状态可能是 `HOLDING_FORCE` 也可能是 `HOLDING_POSITION`，两者都是正常的。
- 运行中 `set_target(开度, 夹持力)` 的夹持力超过 1.1N·m 时直接报错，不再静默接受。
- 新增 `g.motor.motor_version()` 读电机固件版本（夹爪固件 1.2.14 起不受电机通信模式限制）。

**0.4.1 → 0.4.3**（接口不变）

- `ForcePositionController` 跟随连续发送的目标时不再走走停停，代价是跟踪延迟多约 10–15ms。
- 目标仍在移动时被挡住，进入 `HOLDING_FORCE` 比以前晚约 150ms；依赖它判断夹住的程序请复核。
- 附带的从夹爪固件升到 1.2.16，请[升级固件](../follower/firmware.md#mcu-ota)。

**0.4.3 → 0.4.4**（接口不变）

- 新增[视触觉](#tactile)与[全链路检查](#full-chain)示例。
- `environment.yml` 新增 `xensesdk` 与 `rerun-sdk`，并把 NumPy 固定为 2.2.4（`xensesdk` 的要求）。已有的 `taccap` 环境执行 `mamba env update -f environment.yml --prune`，再重新运行 `uv pip install -e . --no-build-isolation`。
- 日志和报错信息改为英文。按中文报错文本做匹配的脚本需要更新，例如固件低于 1.2.11 的提示现在是 `is below 1.2.11`。
- EL05 电机固件随 SDK 附带，`motor_ota_update.py` 不指定镜像时会按夹爪记录的电机型号自动选择。

**0.4.4 → 0.4.5**（原有接口不变）

- 附带固件升到主夹爪 1.2.7 / 从夹爪 1.2.17，请[升级固件](../follower/firmware.md#mcu-ota)。新固件的 IMU / 编码器设备时间戳改为 1 MHz 时基，SDK 0.4.5 已处理；自己解析设备时间戳的程序要同步改。
- 新增主从夹爪分时交换 `start_exchange()`：主机与夹爪轮流收发，避免收发重叠丢帧；需要 1.2.7 / 1.2.17 固件，主夹爪在旧固件上会回退到普通推送。
- 从夹爪可以输出 IMU。
- 设备扫描期间释放 GIL，不再卡住同一进程里的其他线程。

**0.4.5 → 0.4.6**（接口不变）

- 从夹爪固件 1.2.17 在收发重叠时重发的那份完全相同的数据帧被丢弃，不再让控制器多走一步、按键多报一次。丢弃次数可从 `g.transport.stats.duplicate_data_dropped` 读到；分时交换模式不受影响。
