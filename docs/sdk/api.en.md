# API essentials

The most commonly used interfaces. Examples are in Python; the C++ interface uses the same names. For full documentation use `help()`, for example `help(t.FollowerGripper)`.

```python
import xense.taccap as t
```

## Device discovery {#discovery}

```python
for e in t.scan_grippers():
    print(e.side, e.role, e.firmware_sn, e.mcu_device)
```

With several grippers attached, pick the one you want by side and by leader/follower role together, then open it with its `mcu_device`:

```python
ep = next(e for e in t.scan_grippers()
          if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

With only one gripper attached you can also use `t.find_follower()` / `t.find_leader()`.

!!! danger "Scanning interrupts other programs"
    A scan stops the gripper data streams other programs are using, and a follower gripper that is holding an object goes limp. In your own program, scan only once at startup.

## Leader gripper: reading {#leader}

```python
g = t.LeaderGripper(ep.mcu_device, normalize_position=True)   # ep: pick the leader gripper as shown above
g.encoder.on_data(lambda s: print(s.position))   # 0 = closed, 1 = open
g.imu.on_data(lambda s: print(s))
g.start_streaming(imu_hz=100, encoder_hz=100)
# ...
g.stop_streaming()
```

`normalize_position=True` requires the leader gripper's travel calibration to be done; see [Calibration and self-check](../pc/calibration.md).

## Follower gripper: control {#follower}

The follower gripper's controllers, state reading and example scripts are in [Follower gripper → API and examples](../follower/api.md).

<span id="motor-primitives"></span>
The low-level motor interfaces bypass the controller's protection and must not be called directly; see [Low-level motor interfaces](../follower/api.md#motor-primitives).

## Wrist camera and fisheye undistortion {#camera}

Gripper objects do not open the wrist camera by default. When you need it:

```python
g = t.FollowerGripper(ep.mcu_device, wrist_video="/dev/v4l/by-id/<camera>-video-index0",
                      open_cameras=True, undistort_wrist=True)
g.wrist_camera.start(lambda f: print(f.frame_index))
```

Frames are RGB by default. To view the image you can simply use the example `wrist_camera.py`; see [Examples](examples.md#camera).

### What happens when the fisheye calibration cannot be read {#fisheye-fallback}

Fisheye intrinsics are stored in each gripper. For a gripper that has never been calibrated, the SDK automatically falls back to a set of built-in reference intrinsics and prints a warning; undistortion does not fail.
To read the intrinsics, use:

```python
cal, is_reference, reason = g.calibration.resolve_fisheye()
```

`is_reference` being true means the reference intrinsics are in use.

!!! warning "Reference intrinsics are only an approximation"
    Lens mounting varies slightly from unit to unit, so the reference intrinsics are only good for viewing. When you need pixel measurements on the undistorted image (hand-eye calibration, visual servoing and so on),
    write this gripper's own calibration to it: `python python/examples/fisheye_cal.py set-fisheye right --from-npz cam.npz`
    (add `--follower` for a follower gripper).

!!! note "An off-center image after undistortion is normal"
    The sensor is not necessarily mounted exactly on the lens's optical center, so the undistorted image may lean to one side even though the calibration is correct. Do not change `cx` in the intrinsics.
