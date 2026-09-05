# SDK 概览

`xense.taccap`(`taccap-gripper` SDK)是 XTac-UMI G1 的 **C++17 / Python 设备访问层**,
统一命名空间 `xense::taccap::` / `xense.taccap`。数采主仓库通过
`third_party/taccap-gripper` 子模块消费它,不重复实现底层通信。

!!! info "版本基线"
    本附录按 `taccap-gripper 0.1.9` 源码核对(与[版本与支持](versions.md)里的已验证基线一致)。
    SDK 升级后应同步复核接口、构建选项与示例命令。

!!! note "能力边界"
    - SDK 通过串口协议访问夹爪 MCU,提供 IMU、编码器、按键、LED、传感器错误、标定、OTA,
      以及仅从夹爪具备的电机控制。
    - SDK 也提供独立、可选的腕部 UVC `Camera` 类;`LeaderGripper.open()` / `FollowerGripper.open()` 默认不打开相机,只有显式设置 `open_cameras=true` 并提供设备路径时聚合对象才会持有它。
    - `xense-taccap-lerobot` 的正式数采路径不使用该 SDK `Camera`,而是直接使用 LeRobot `OpenCVCamera`;视触觉图像由 `XenseTactileCamera` + `xensesdk` 采集。

## 分层架构

```mermaid
flowchart TB
    U["用户代码 / 上层适配器"] --> AGG["LeaderGripper / FollowerGripper<br/>MCU 聚合对象"]
    AGG --> COMP["MCU 组件<br/>IMU · Encoder · Key · Led · SensorErrors<br/>Calibration · OTA · Motor(仅从夹爪)"]
    COMP --> TX["异步 Transport<br/>后台读线程 · ACK 匹配 · DATA 订阅"]
    TX --> PROTO["协议与串口总线<br/>pack/parse · CRC16 · 字节填充 · 3 Mbps"]
    PROTO --> SERIAL["/dev/ttyACM* / CH343"]
    SERIAL --> MCU["夹爪 MCU"]

    U -->|可独立构造| CAM["可选腕部 Camera<br/>OpenCV VideoCapture"]
    AGG -->|open_cameras=true 时持有| CAM
    CAM --> VIDEO["/dev/video* / V4L2 UVC"]
```

| 层 / 组件 | 职责 |
|---|---|
| **聚合对象** | `LeaderGripper` / `FollowerGripper` 管理 MCU Transport 与组件生命周期;`open()` 只适用于当前恰好连接一只夹爪的场景,多设备时应先扫描端点再显式构造 |
| **MCU 组件** | `IMU` / `Encoder` 使用 `read_once()` 同步读取、`on_data(cb)` 订阅流数据;`Led`(V1.9)、`SensorErrors`(V1.6)、`OtaSession`(V1.3)两侧都有;`Motor` **仅从夹爪** |
| **`Calibration`** | V2.0/V2.1,两侧都有。鱼眼相机标定 `read_fisheye()` / `write_fisheye()` 双侧可用;**行程上限** `read_encoder_max_rad()` / `write_encoder_max_rad()` **仅主夹爪**,从夹爪 NACK。未标定的记录**通常**返回空 `optional` / Python `None`,但不总是——见下面的 [鱼眼标定读不到时会怎样](#fisheye-fallback) |
| **归一化位置** | 两侧都有。从夹爪来自 `GripperConfig`;主夹爪自 0.1.7 起由行程上限标定得到——`EncoderSample.position` 给出 `[0,1]` 开度,需 `LeaderGripper::Config::normalize_position`(或用 `encoder_max_rad` 由主机侧指定,用于 V2.1 以前的固件) |
| **Camera** | 独立 OpenCV/V4L2 采集路径,使用 `read()` 或 `start(callback)` / `stop()`,不经过串口 Transport |
| **Transport** | 后台串口读线程、ACK 匹配(seq→promise)、按命令分发 DATA |
| **协议 / 总线** | 帧打包解析、CRC16、字节填充、`SerialBus`(termios @ 3 Mbps) |

## 两个可消费面

| 产物 | 用途 |
|---|---|
| `taccap_core` CMake target / `libtaccap_core.so` | 通过源码 `add_subdirectory()` 集成进 ROS2 或其他 CMake 工程 |
| `xense.taccap`(Python 扩展) | 数采脚本、Jupyter、上层产品(本手册主用) |

二者由**同一套顶层 CMake** 构建。当前 C++ 面没有独立的 install/export package,应通过源码子目录消费;Python 面由本地源码构建 wheel / editable install。详见 [安装与构建](sdk-install.md)。

## 线程模型

- 回调在**生产者线程**(读线程 / 采集线程)触发。
- Python 回调重新获取 GIL;回调内异常经 `discard_as_unraisable` 上报,不会拖垮生产者。
- `LeaderGripper` 与 `FollowerGripper` 不可拷贝/移动;C++ `open()` 返回 `unique_ptr`,析构时执行尽力而为的 `stop_streaming()`。

## 鱼眼标定读不到时会怎样 {#fisheye-fallback}

**未标定的夹爪不会让矫正失败,而是回退到 SDK 内置的一组参考内参并告警。**每台
TC-GU-01 用的是同一颗镜头、同一块 640×480 传感器,所以共享参数比完全不矫正近得多。

策略集中在 `Calibration::resolve_fisheye()`(Python:`cal.resolve_fisheye()`,返回
**三元组** `(calibration, is_reference, reason)`)。**优先用它,而不是 `read_fisheye()`**
——除非你确实要知道 flash 里存的原始内容。三种拿不到自身标定的情形都会回退:

| 情形 | 怎么识别 |
|---|---|
| 这颗镜头从未标定过 | `read_fisheye()` 返回 `None`(`CalNotSet`) |
| **固件回了一条全零的记录** | `is_usable_fisheye_cal()` 为假 —— 见下 |
| 固件早于命令集 V2.0 | `0x2B` 抛 `ProtocolError`(`InvalidCmd`) |

!!! danger "第二种情形:别用 `is None` 判断有没有标定"
    未标定的单元**不一定回 NACK**。实测固件 **1.1.1 与 1.2.2** 都会回一条
    **存在但 8 个字段全为 0** 的记录:

    ```text
    read_fisheye() -> CameraFisheyeCal   # 不是 None!
      fx, fy = 0.0  0.0
      cx, cy = 0.0  0.0
    ```

    它能过 `if params is None` 这道判断,然后拿 `fx = fy = 0` 去建重映射表——
    每个像素都被映射到源图之外,**"矫正"后是一张纯黑图,而且不抛任何异常**。
    正确的判断是 `is_usable_fisheye_cal()`(`fx`/`fy` 有限且大于 0),
    或者干脆交给 `resolve_fisheye()`。

!!! warning "参考内参只是近似,不能替代逐台标定"
    镜头相对传感器的装配位置逐台不同,**主点尤其会漂**。实测一台主爪:它的真实光轴
    与 SDK 参考值相差 **37.7 像素**。所以任何在矫正图上按像素测量的用途
    (视觉伺服、手眼标定、尺寸估计)都应当先给这台存一份自己的标定:

    ```bash
    python third_party/taccap-gripper/python/examples/fisheye_cal.py set-fisheye
    ```

    只是拿来看画面则不必——回退路径的观感已经足够好。

!!! note "光轴不一定在画幅中心,这是装配问题不是标定问题"
    矫正后画面**偏心、甚至略微倾斜,而标定完全正确**,是可能发生的:传感器未必装在
    镜头光心上,而去畸变是绕**主点**展开的,不是绕画幅中心。

    实测一台:640 宽的画面上 `cx = 359.1`,光轴比画幅中心右偏 **39 像素**。这个数字
    有独立佐证——两个夹爪相对光轴机械对称,**爪尖中点落在 x = 360.1**,与标定的 `cx`
    仅差约 1 像素。

    原始鱼眼看不出来:桶形畸变把周边压缩了,39 像素被藏住;矫正把周边展开,同样的
    偏移就显眼了。**矫正是把它显现出来,不是造成它。**

    所以看到画面偏心时,**不要去"修正" `cx`**——实测把它改回 320 反而让爪尖偏得更远
    并引入倾斜。要判断是不是这种情况,用上面那个爪尖对称性的办法,不需要标定板。

## 不属于本 SDK 的部分

数据集录制、时间对齐、分集、ROS2 节点、lerobot Robot 适配、上层遥操/回放,都在**各自的
上层仓库**实现(如本手册对应的 `xense-taccap-lerobot`)。保持 SDK 精简,便于各消费方按需取用。
