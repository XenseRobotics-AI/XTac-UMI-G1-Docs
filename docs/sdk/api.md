# API 要点

最常用的接口。示例为 Python；C++ 接口同名。完整说明可用 `help()` 查看，例如 `help(t.FollowerGripper)`。

```python
import xense.taccap as t
```

## 设备发现 {#discovery}

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

!!! danger "扫描会中断其他程序"
    扫描会停掉其他程序正在使用的夹爪数据流，正在夹持的从夹爪会卸力。在自己的程序里只在启动时扫描一次。

## 主夹爪：读取 {#leader}

```python
g = t.LeaderGripper(ep.mcu_device, normalize_position=True)   # ep 按上面的方法挑出主夹爪
g.encoder.on_data(lambda s: print(s.position))   # 0 = 闭合,1 = 张开
g.imu.on_data(lambda s: print(s))
g.start_streaming(imu_hz=100, encoder_hz=100)
# ...
g.stop_streaming()
```

`normalize_position=True` 需要主夹爪已完成行程标定，见 [标定与自检](../pc/calibration.md)。

## 从夹爪：控制 {#follower}

从夹爪的控制器、状态读取与示例脚本见 [从夹爪 → API 与示例](../follower/api.md)。

<span id="motor-primitives"></span>
电机底层接口不经过控制器的保护，不要直接调用，见[电机底层接口](../follower/api.md#motor-primitives)。

## 腕部相机与鱼眼矫正 {#camera}

夹爪对象默认不打开腕部相机。需要时：

```python
g = t.FollowerGripper(ep.mcu_device, wrist_video="/dev/v4l/by-id/<相机>-video-index0",
                      open_cameras=True, undistort_wrist=True)
g.wrist_camera.start(lambda f: print(f.frame_index))
```

画面默认是 RGB。查看画面可以直接用示例 `wrist_camera.py`，见 [示例](examples.md#camera)。

### 鱼眼标定读不到时会怎样 {#fisheye-fallback}

鱼眼内参存在每只夹爪里。没有标定过的夹爪，SDK 会自动改用一组内置的参考内参并打印告警，矫正不会失败。
读取内参时用：

```python
cal, is_reference, reason = g.calibration.resolve_fisheye()
```

`is_reference` 为真表示用的是参考内参。

!!! warning "参考内参只是近似"
    各台镜头的装配位置略有差异，参考内参只适合看画面。需要在矫正图上按像素测量（手眼标定、视觉伺服等）时，
    给这台夹爪写入它自己的标定：`python python/examples/fisheye_cal.py set-fisheye right --from-npz cam.npz`
    （从夹爪加 `--follower`）。

!!! note "矫正后画面偏心是正常的"
    传感器不一定正好装在镜头光心上，矫正后画面可能偏向一侧，而标定是正确的，不要去改内参里的 `cx`。
