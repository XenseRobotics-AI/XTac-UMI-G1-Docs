# RobotConfig 与 SDK

查表用的附录:`RobotConfig` 配置项与 SDK 入口;采集流程见[数据采集](recording.md),报错见[故障排查](troubleshooting.md)。

## `RobotConfig` 常用配置项 {#robotconfig}

| 配置项 | 默认 | 作用 |
|---|---|---|
| `robot.id` | **必填** | 这套设备的工位号,填数字即可(`0` / `1`…),前缀按 `robot.type` 自动补成 `taccap_0` / `bi_taccap_0`;漏填在解析命令行时即报错 → [`--robot.id` 与硬件清单](recording.md#robot-id) |
| `robot.side` | 自动 | `left`/`right`,**单夹爪模式**下两只都接着时必填;只接一只则自动选中 |
| `robot.role` | `leader` | 填 `follower` 绑定从夹爪 |
| `robot.enable_tracker` | `true` | 关闭则只录触觉 + 夹爪 |
| `robot.tracker_serial` | 未设 | 钉住追踪器 SN,绕过侧别规则;逐字使用、不校验,打错 connect 时报找不到 |
| `robot.enable_wrist_camera` | `true` | 关闭腕相机 |
| `robot.wrist_camera_width/_height/_fps` | — | 腕相机分辨率/帧率 |
| `robot.wrist_camera_fourcc` | `MJPG` | 腕相机像素格式;默认 MJPG 是为同 hub 的触觉让出 USB 带宽,`YUYV` 无压缩,带宽够时才用 |
| `robot.wrist_undistort` / `_balance` | `false` / `0.0` | 落盘前矫正腕相机鱼眼及其视野档位,见[鱼眼矫正](recording.md#57) |
| `robot.enable_head_camera` | `false` | 头显相机(第一视角 + 头显位姿),见[头显相机](recording.md#56) |
| `robot.head_camera_eyes` | `both` | `both` = 左右眼各一个键;`left` / `right` 只录一只 |
| `robot.head_camera_width/_height` | `640` / `480` | **每只眼**尺寸,只接受 `640x480` / `1024x768` / `1280x960`,要与头显里的「分辨率」一致 |
| `robot.head_camera_fps` | `30` | 头显相机帧率 |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | 左右眼帧序号不同时,判为同一次曝光的最大时间差 |
| `robot.head_camera_startup_timeout_s` | `5.0` | connect 时等待首帧的秒数 |
| `robot.head_camera_stale_after_s` | `0.2` | 缓存帧超过该时长即视为过期并告警 |
| `robot.enable_tactile` | `true` | 关闭则整条触觉链路都不接入(不发现、不落盘)。**排查用,不是录制模式** |
| `robot.tactile_fps` | `30` | 触觉帧率 |
| `robot.tactile_output_types` | `["rectify"]` | **落盘**的触觉流,**只能填一个**;填多个直接报错 |
| `robot.tactile_display_output_types` | `["difference"]` | **仅供 Rerun 显示**、不落盘的额外触觉流;设为空列表则关闭 |
| `robot.tactile_diff_gain` | `1.0` | `difference` 图的线性增益(只影响显示流);`None` = 用传感器出厂值 |
| `robot.expected_tactiles_per_side` | `2` | 每侧应有几枚触觉;数量对不上直接报错 |
| `robot.enable_gripper` / `robot.enable_imu` | `true` / `false` | 夹爪本体读数 / IMU 通道 |
| `robot.gripper_open_rad` | `1.7` | **仅从夹爪用**。主夹爪一律用自己固件里实测的行程上限,本项对它没有任何作用——没标定的主夹爪会被拒绝连接,而不是退回这个常量。见[夹爪标定](calibration.md#41) |
| `robot.tracker_to_ee_pos` | `None` | 覆盖 tracker→EE 平移;`None` = 用该侧**内置实测值** |
| `robot.tracker_to_ee_quat` | `None` | 覆盖 tracker→EE 旋转(同上,两者可独立覆盖) |
| `robot.tracker_wait_timeout` | `10.0` | 连接设备时等待追踪器数据的秒数 |

上表是常用项,完整字段以主仓库附带的设备说明为准。

上表按单夹爪写;`bi_taccap_gripper` 上 `enable_wrist_camera`、`tracker_serial`、`enable_gripper`、`enable_imu`、`gripper_open_rad`、`tracker_to_ee_pos/_quat` 每侧一个,要带 `left_` / `right_` 前缀(如 `--robot.left_enable_wrist_camera`),其余两侧共用,见[参数](recording.md#params)。

## SDK 与二次开发

`xense.taccap`(`taccap-gripper` SDK)是 XTac-UMI G1 的 C++17 / Python 设备访问层:通过串口协议访问夹爪 MCU,提供 IMU、编码器、按键、LED、传感器错误、标定、OTA,以及仅从夹爪具备的电机控制;另有可选的腕部 UVC `Camera` 类。两个可消费面:`taccap_core` CMake target(`libtaccap_core.so`,供 ROS2 / CMake 工程以 `add_subdirectory()` 集成)和 `xense.taccap` Python 扩展,数采主仓库通过 `third_party/taccap-gripper` 子模块消费后者。数据集录制、时间对齐、分集、lerobot 适配都在上层仓库,不在 SDK 内。安装构建、示例、鱼眼标定与 API 说明见 [TacCap-Gripper 仓库 docs](https://github.com/XenseRobotics-AI/TacCap-Gripper/tree/main/docs)。

术语见[术语表](../common/reference.md#glossary);反馈渠道与相关仓库见[支持与反馈](../common/reference.md#support)。
