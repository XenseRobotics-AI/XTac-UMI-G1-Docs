# API 要点

按用途列出最常用的接口。示例均为 Python;C++ 接口同名,位于 `xense::taccap::` 命名空间,
头文件在 SDK 源码的 `cpp/include/taccap/`。完整说明以源码中的注释与 Python docstring 为准(`help(t.FollowerGripper)`)。

```python
import xense.taccap as t
```

## 异常 {#errors}

| 异常 | 什么时候 |
|---|---|
| `t.ProtocolError` | 夹爪拒绝了命令(`NACK: InvalidCmd`、`NACK: SysBusy` 等),或固件版本不满足要求 |
| `t.IoError` | 串口打不开、设备不存在、找不到符合条件的夹爪 |
| `t.TimeoutError` | 夹爪在规定时间内没有应答 |
| `ValueError` | 参数或配置超出允许范围,例如控制器配置超过电机额定 |
| `RuntimeError` | 调用顺序不对,例如控制器没 `start()` 就 `set_target()` |

`t.TimeoutError` 是 SDK 自己的类,不是 Python 内置的 `TimeoutError`,捕获时写全名。

## 设备发现 {#discovery}

| 调用 | 返回 |
|---|---|
| `t.scan_grippers()` | 所有连着的夹爪,列表;没有设备时为空列表 |
| `t.find_one()` | 唯一一只夹爪;没有或多于一只时抛 `IoError` |
| `t.find_left()` / `t.find_right()` | 第一只左 / 右夹爪 |
| `t.find_leader()` / `t.find_follower()` | 第一只主 / 从夹爪 |
| `t.parse_serial(sn)` | 解析序列号,得到 `side`、`role`、`valid`;不会抛异常 |

每个结果(`GripperEndpoints`)有 `side`(`Side.Left/Right`)、`role`(`Role.Leader/Follower/Unknown`)、
`firmware_sn`(固件烧录的序列号)、`mcu_device`(串口路径,构造夹爪对象时用它)、`mcu_serial`(USB 芯片序列号,不用于识别)。

!!! warning "多设备时按侧别和角色一起过滤"
    `find_left/right/leader/follower` 返回**第一个**匹配项,多只匹配时不报错。
    一台电脑接着多只夹爪时,用 `scan_grippers()` 一次扫描,再同时按 `side` 和 `role` 过滤。

!!! danger "扫描会停掉其他程序的数据流"
    `scan_grippers()` 和各个 `find_*` 都会向每一只夹爪发送停止数据流的命令。其他程序正在采集或控制时调用,
    会中断它们,正在夹持的从夹爪会卸力。在自己的程序里只在启动时扫描一次。

## 主夹爪:读取 {#leader}

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Right and e.role == t.Role.Leader)
g = t.LeaderGripper(ep.mcu_device, normalize_position=True)

g.encoder.on_data(lambda s: print(s.position_rad, s.position))   # 弧度,以及 [0,1] 开度
g.imu.on_data(lambda s: print(s))
g.start_streaming(imu_hz=100, encoder_hz=100)    # 某项填 0 表示不开这一路
# ...
g.stop_streaming()
```

- `normalize_position=True` 时,打开时读取夹爪里存的行程上限,之后每个编码器样本都带 `.position`(0 = 闭合,1 = 张开)。
  行程上限没标定过时构造会抛 `ProtocolError`,先运行 `calibrate.py` 标定,见 [标定与自检](04-calibration.md)。
- 一次性读取:`g.encoder.read_once()`、`g.imu.read_once()`、`g.position()`。
- 编码器与 IMU 的实际速率是固件内部 1 kHz 的整数分频,可能与请求值略有出入。
- 重新标定行程后调用 `g.reload_position_map()`。

## 从夹爪:控制 {#follower}

```python
g = t.FollowerGripper(ep.mcu_device)
```

使用方法、调用顺序与注意事项见 [从夹爪 → 运动控制](follower-control.md),这里只列接口。

**两种控制器**,接口相同:`start()`、`stop()`、`set_target(开度)`、`snapshot()`、`reset()`,
支持 `with` 语句(进入时 `start()`,退出时 `stop()`)。

| | `ForcePositionController` | `ImpedanceController` |
|---|---|---|
| 配置 | `ForcePositionConfig.for_spec(g.motor.get_spec())` | `ImpedanceConfig.for_spec(g.motor.get_spec())` |
| 可调参数 | `grasp_torque_nm`、`close_speed_radps` | `kp`、`kd`(运行中用 `set_gains()`) |
| 独有调用 | `release()`、`hold_position()`、`set_target(p, grasp_torque_nm=...)` | `set_gains(kp, kd, feedforward_torque=0)` |
| 状态 | `IDLE`、`HOLDING_POSITION`、`CLOSING`、`HOLDING_FORCE`、`OPENING`、`FAULT` | `IDLE`、`TRACKING`、`TORQUE_CAPPED`、`FAULT` |
| `snapshot()` 常用字段 | `state`、`observation`、`holding`、`arrived`、`commanded_torque_nm`、`fault_reason` | `state`、`observation`、`torque_capped`、`commanded_torque_nm`、`fault_reason` |

`snapshot().observation` 的字段:`position`(0..1)、`velocity`、`torque`(正 = 往闭合方向)、`raw_pos`(电机原始弧度)、
`motor_temp_c`、`status`、`age_ms`、`valid`。

**不控制时读状态**:

```python
g.position()                          # 当前开度,0..1
g.motor.read_status()                 # 一次性读电机状态
g.motor.on_status(cb); g.start_streaming(motor_hz=100)   # 流式读取,固件上限 100 Hz
```

**运动安全包络**(只能在控制器未运行时调用):

| 调用 | 作用 |
|---|---|
| `g.audit_envelope()` | 只读。分别给出 flash 里存的值、固件实际执行的值、推荐值 |
| `g.ensure_envelope()` | 按电机规格写入;已经正确时不写 |
| `g.set_envelope(...)` | 写入任意数值,不按规格检查。不要使用,用 `ensure_envelope()` |

## 电机状态与底层原语 {#motor-primitives}

!!! danger "底层原语不经过任何主机侧保护"
    下面的 `submit_*` 直接把电机命令发到串口:没有误差钳位,没有力矩上限,只剩固件包络一层。
    自由节奏地发送还会和电机状态帧冲突,造成丢帧。**控制夹爪请用控制器**;只有在开发自己的控制律时才用这些原语,
    并且不能与控制器同时使用。

| 调用 | 说明 |
|---|---|
| `g.motor.clear_fault()` / `enable()` / `disable()` | 清故障、使能、失能 |
| `g.motor.submit_impedance(target_pos_rad, kp_nm_per_rad, kd_nm_s_per_rad, feedforward_torque_nm, feedforward_vel_radps=0)` | MIT 阻抗命令,位置为电机原始弧度 |
| `g.motor.submit_position(...)` / `submit_velocity(...)` / `submit_torque(...)` | 其他控制模式 |
| `g.pos_to_rad(p)` / `g.rad_to_pos(rad)` | 开度与电机原始弧度互换 |
| `g.motor.control_stats()` | 命令发送的统计,检查是否丢帧 |
| `g.motor.fault_report()` | 故障详情 |
| `g.motor.get_spec()` / `get_model()` | 电机规格与记录的型号 |

- 电机原始弧度的零点是完全闭合位;张开方向在不同夹爪上可能是电机的负方向,用 `pos_to_rad()` 换算,不要自己假设符号。
- 主机停止发命令 300 ms 后,固件进入零速保持(0.35 N·m);30 s 后电机失能。
- Python 里没有阻塞式的 `Motor.set_position / set_velocity / set_torque / set_impedance`,
  也没有 `FollowerGripper.set_position`,这些只在 C++ 里有。

以下接口会改变电机或夹爪的持久配置,**只在技术支持指导下使用**:
`set_model()`(见 [RS00 从夹爪的额外步骤](follower-firmware.md#rs00))、`set_startup_limit_torque()`、
`switch_protocol()`(见 [升级电机固件](follower-firmware.md#motor-ota))、`set_can_id()`、`set_private_param()`、`set_zero()`、
`set_gripper_config()`、`set_envelope()`、`set_auto_cal_config()`。其中 `set_gripper_config()` 若不是先读后改,会清掉运动安全包络。

## 标定记录 {#calibration}

`g.calibration` 读写存在夹爪 flash 里的两份记录,掉电保留:

| 记录 | 适用 | 读 / 写 |
|---|---|---|
| 腕部相机鱼眼内参 `fx, fy, cx, cy, k1..k4` | 主夹爪、从夹爪 | `read_fisheye()` / `write_fisheye()`,推荐用 `resolve_fisheye()` 读 |
| 编码器行程上限(弧度) | **仅主夹爪**;从夹爪上报 `InvalidCmd` | `read_encoder_max_rad()` / `write_encoder_max_rad()` |

从夹爪的行程由上电自动标定得到,不在这里。

### 鱼眼标定读不到时会怎样 {#fisheye-fallback}

**未标定的夹爪不会让矫正失败,而是回退到 SDK 内置的一组参考内参并告警。**每台
夹爪用的是同一颗镜头、同一块 640×480 传感器,所以共享参数比完全不矫正近得多。

读取时优先用 `resolve_fisheye()`,而不是 `read_fisheye()`——除非你确实要知道 flash 里存的原始内容:

```python
cal, is_reference, reason = g.calibration.resolve_fisheye()
if is_reference:
    print("使用 SDK 参考内参:", reason)
```

三种拿不到自身标定的情形都会回退:

| 情形 | 怎么识别 |
|---|---|
| 这颗镜头从未标定过 | `read_fisheye()` 返回 `None` |
| **固件回了一条全零的记录** | `t.is_usable_fisheye_cal(cal)` 为假,见下 |
| 固件太旧,不支持这条命令 | 读取抛 `ProtocolError`(`InvalidCmd`) |

!!! danger "别用 `is None` 判断有没有标定"
    未标定的夹爪**不一定返回 `None`**。实测固件 1.1.1 与 1.2.2 都会返回一条**存在但 8 个字段全为 0** 的记录。
    它能通过 `if cal is None` 的判断,然后拿 `fx = fy = 0` 去建重映射表——每个像素都映射到源图之外,
    **"矫正"后是一张纯黑图,而且不抛任何异常**。正确的判断是 `is_usable_fisheye_cal()`
    (`fx`、`fy` 有限且大于 0),或者直接交给 `resolve_fisheye()`。

!!! warning "参考内参只是近似,不能替代逐台标定"
    镜头相对传感器的装配位置逐台不同,**主点尤其会漂**:实测一台主夹爪的真实光轴与参考值相差 37.7 像素。
    在矫正图上按像素测量的用途(视觉伺服、手眼标定、尺寸估计)都应当先给这台存一份自己的标定:

    ```bash
    python python/examples/fisheye_cal.py set-fisheye right --from-npz cam.npz             # 主夹爪
    python python/examples/fisheye_cal.py set-fisheye right --follower --from-npz cam.npz  # 从夹爪
    ```

    `cam.npz` 是 OpenCV 鱼眼标定输出的 `K` / `D`。只是看画面则不必,回退路径的观感已经足够好。

**光轴不一定在画幅中心,这是装配问题,不是标定问题。** 矫正后画面偏心、甚至略微倾斜,而标定完全正确,
是可能发生的:传感器未必装在镜头光心上,去畸变绕**主点**展开,不是绕画幅中心。实测一台:640 宽的画面上
`cx = 359.1`,光轴比画幅中心右偏 39 像素;两个爪尖相对光轴机械对称,爪尖中点落在 x = 360.1,
与标定的 `cx` 只差约 1 像素。原始鱼眼图里,桶形畸变把周边压缩了,这个偏移看不出来;矫正把周边展开,
偏移就显眼了。**不要去"修正" `cx`**——实测把它改回 320 反而让爪尖偏得更远并引入倾斜。

矫正只支持 640×480;相机以其他分辨率运行时直接报错,不会按猜测的比例缩放。

## 腕部相机 {#camera}

夹爪对象默认**不打开**腕部相机,因为相机通常由别的程序占用。需要时显式打开:

```python
g = t.FollowerGripper(ep.mcu_device, wrist_video="/dev/v4l/by-id/<相机>-video-index0",
                      open_cameras=True, undistort_wrist=True)
g.wrist_camera.start(lambda f: print(f.frame_index))
```

- 未打开时访问 `g.wrist_camera` 抛 `IoError`:`wrist camera not opened (construct with open_cameras=true and wrist_video set)`。
- 夹爪对象给出的帧默认是 **RGB**;单独构造的 `t.Camera(device)` 默认是 **BGR**(与 OpenCV 一致)。
- `wrist_video` 建议用 `/dev/v4l/by-id/` 下的路径,插拔后不会变。
- 查看画面:先 `python python/examples/wrist_camera.py --list` 查相机序列号,再 `wrist_camera.py <相机序列号> --undistort`。

## LED 与诊断 {#led-diagnostics}

```python
g.led.set(t.Ws2812Mode.Override, 0, 255, 0, brightness=120)   # 常亮绿色
g.led.effect(t.Ws2812EffectType.ColorBreathe, 0, 0, 255)      # 蓝色呼吸
g.led.off()

print(g.diagnostics.uart_stats())   # 固件自己的串口收发计数
```

`uart_stats()` 用来判断丢帧发生在哪一段。计数是上电以来的累计值,在一段时间的开头和结尾各读一次取差值:
固件在这段时间里发出的数据**多于**电脑实际收到的,说明丢在线缆或 USB 转串口芯片上,不是固件的问题。
反馈丢帧问题时附上两次读数。
