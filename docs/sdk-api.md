# API 要点

最常用的接口。示例为 Python;C++ 接口同名。完整说明可用 `help()` 查看,例如 `help(t.FollowerGripper)`。

```python
import xense.taccap as t
```

## 设备发现 {#discovery}

```python
for e in t.scan_grippers():
    print(e.side, e.role, e.firmware_sn, e.mcu_device)
```

多只夹爪时,按左右和主从一起挑出要用的那只,再用它的 `mcu_device` 打开:

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

只接一只时也可以用 `t.find_follower()` / `t.find_leader()`。

!!! danger "扫描会中断其他程序"
    扫描会停掉其他程序正在使用的夹爪数据流,正在夹持的从夹爪会卸力。在自己的程序里只在启动时扫描一次。

## 主夹爪:读取 {#leader}

```python
g = t.LeaderGripper(ep.mcu_device, normalize_position=True)   # ep 按上面的方法挑出主夹爪
g.encoder.on_data(lambda s: print(s.position))   # 0 = 闭合,1 = 张开
g.imu.on_data(lambda s: print(s))
g.start_streaming(imu_hz=100, encoder_hz=100)
# ...
g.stop_streaming()
```

`normalize_position=True` 需要主夹爪已完成行程标定,见 [标定与自检](04-calibration.md)。

## 从夹爪:控制 {#follower}

用法与注意事项见 [从夹爪 → 运动控制](follower-control.md)。

| | 阻抗控制(默认) | 力位控制 |
|---|---|---|
| 控制器 | `ImpedanceController` | `ForcePositionController` |
| 配置 | `ImpedanceConfig.for_spec(g.motor.get_spec())` | `ForcePositionConfig.for_spec(g.motor.get_spec())` |
| 可调参数 | 一般不调 | `grasp_torque_nm`(夹持力,≤ 1.1 N·m) |
| 常用调用 | `set_target(开度)` | `set_target(开度)`、`release()`、`hold_position()` |
| 是否夹住 | — | `snapshot().holding` |

两种控制器都有 `start()` / `stop()`(或用 `with`)、`snapshot()`、`reset()`。调用顺序:
`g.motor.clear_fault()` → 启动控制器 → `g.motor.enable()` → `set_target()` → 停止控制器。

`snapshot().observation` 里有 `position`(开度)、`velocity`、`torque`(正值 = 往闭合方向)、`motor_temp_c`。

不控制时读开度:`g.position()`。

## 电机底层接口 {#motor-primitives}

`g.motor.submit_*` 等底层接口直接向电机下发命令,不经过控制器的保护。**请使用控制器**,不要调用它们。

以下接口会修改夹爪或电机里保存的配置,**只在技术支持指导下使用**:
`set_model()`、`set_startup_limit_torque()`、`switch_protocol()`、`set_can_id()`、`set_private_param()`、
`set_zero()`、`set_gripper_config()`、`set_envelope()`、`set_auto_cal_config()`。

## 腕部相机与鱼眼矫正 {#camera}

夹爪对象默认不打开腕部相机。需要时:

```python
g = t.FollowerGripper(ep.mcu_device, wrist_video="/dev/v4l/by-id/<相机>-video-index0",
                      open_cameras=True, undistort_wrist=True)
g.wrist_camera.start(lambda f: print(f.frame_index))
```

画面默认是 RGB。查看画面可以直接用示例 `wrist_camera.py`,见 [示例](sdk-examples.md#camera)。

### 鱼眼标定读不到时会怎样 {#fisheye-fallback}

鱼眼内参存在每只夹爪里。没有标定过的夹爪,SDK 会自动改用一组内置的参考内参并打印告警,矫正不会失败。
读取内参时用:

```python
cal, is_reference, reason = g.calibration.resolve_fisheye()
```

`is_reference` 为真表示用的是参考内参。

!!! warning "参考内参只是近似"
    各台镜头的装配位置略有差异,参考内参只适合看画面。需要在矫正图上按像素测量(手眼标定、视觉伺服等)时,
    给这台夹爪写入它自己的标定:`python python/examples/fisheye_cal.py set-fisheye right --from-npz cam.npz`
    (从夹爪加 `--follower`)。

!!! note "矫正后画面偏心是正常的"
    传感器不一定正好装在镜头光心上,矫正后画面可能偏向一侧,而标定是正确的,不要去改内参里的 `cx`。
