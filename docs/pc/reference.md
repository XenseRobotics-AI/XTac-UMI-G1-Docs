# RobotConfig 配置项

流程见[数据采集](recording.md)，报错见[故障排查](troubleshooting.md)。

## `RobotConfig` 常用配置项 {#robotconfig}

| 配置项 | 默认 | 作用 |
|---|---|---|
| `robot.id` | **必填** | 工位号（`0` / `1`…），漏填时解析命令行即报错；按 `robot.type` 补前缀成 `taccap_0` / `bi_taccap_0` / `xtac_umi_g1_0` → [`--robot.id` 与硬件清单](recording.md#robot-id) |
| `robot.side` | 自动 | `left`/`right`；**单夹爪模式**两只都接着时必填 |
| `robot.role` | `leader` | `follower` 绑定从夹爪；固件须 ≥ 1.2.5（低于 1.2.11 提示升级），见[固件 OTA](versions.md#ota) |
| `robot.enable_tracker` | `true` | 关闭则只录触觉 + 夹爪 |
| `robot.tracker_serial` | 未设 | 钉住追踪器 SN，绕过侧别规则、不校验，打错 connect 报找不到 |
| `robot.enable_wrist_camera` | `true` | 关闭腕相机 |
| `robot.wrist_camera_width/_height/_fps` | — | 腕相机分辨率/帧率 |
| `robot.wrist_camera_fourcc` | `MJPG` | MJPG 给触觉省 USB 带宽；`YUYV` 无压缩，带宽够才用 |
| `robot.wrist_undistort` / `_balance` | `false` / `0.0` | 腕相机鱼眼矫正及视野档位，见[鱼眼矫正](recording.md#57) |
| `robot.enable_head_camera` | `false` | **仅单夹爪**：录头显第一视角 + 位姿；双夹爪用 `--robot.type=xtac_umi_g1`，见[头显相机](recording.md#56) |
| `robot.head_camera_eyes` | `both` | `both` 每眼一键；`left` / `right` 只录一只 |
| `robot.head_camera_width/_height` | `640` / `480` | **每只眼**尺寸，只接受 `640x480` / `1024x768` / `1280x960`，须与头显输出一致 |
| `robot.head_camera_fps` | `30` | 头显帧率 |
| `robot.head_camera_pair_max_skew_ms` | `20.0` | 左右眼算同一次曝光的最大时差 |
| `robot.head_camera_startup_timeout_s` | `5.0` | connect 等首帧的秒数 |
| `robot.head_camera_stale_after_s` | `0.2` | 缓存帧超时即告警 |
| `robot.enable_tactile` | `true` | 关闭则不发现、不落盘触觉，**仅排查用** |
| `robot.tactile_fps` | `30` | 触觉帧率 |
| `robot.tactile_output_types` | `["rectify"]` | **落盘**的触觉流，**只能填一个**，多填报错 |
| `robot.tactile_display_output_types` | `["rectify"]` | Rerun 显示流，**默认同落盘**（空列表等价）；`["difference"]` 加一路仅显示流 |
| `robot.tactile_diff_gain` | `1.0` | `difference` 图线性增益，**默认不起作用**；`None` 用出厂值 |
| `robot.expected_tactiles_per_side` | `2` | 每侧触觉枚数，不符即报错 |
| `robot.enable_gripper` / `robot.enable_imu` | `true` / `false` | 夹爪本体读数 / IMU 通道 |
| `robot.gripper_stream_hz` | `100` | 主夹爪编码器（含 IMU）推流频率；`0` 为每帧轮询；失败则回退并告警 |
| `robot.gripper_open_rad` | `1.7` | **仅从夹爪用**；主夹爪用固件实测行程上限，未标定拒绝连接，见[夹爪标定](calibration.md#41) |
| `robot.tracker_to_ee_pos` | `None` | 覆盖 tracker→EE 平移；`None` = **内置实测值** |
| `robot.tracker_to_ee_quat` | `None` | 覆盖 tracker→EE 旋转 |
| `robot.tracker_wait_timeout` | `10.0` | 等待追踪器数据的秒数 |

上表按单夹爪写，完整字段见主仓库设备说明。`bi_taccap_gripper` 上 `enable_wrist_camera`、`tracker_serial`、`enable_gripper`、`enable_imu`、`gripper_open_rad`、`tracker_to_ee_pos/_quat` 每侧一个，加 `left_` / `right_` 前缀（如 `--robot.left_enable_wrist_camera`），其余两侧共用，见[参数](recording.md#params)。

## SDK 与二次开发

见 [SDK 与二次开发](../sdk/index.md)。

术语见[术语表](../common/reference.md#glossary)，反馈见[支持与反馈](../common/reference.md#support)。
