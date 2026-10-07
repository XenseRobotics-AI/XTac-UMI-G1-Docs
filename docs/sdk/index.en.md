# SDK overview

`xense.taccap` (repository [TacCap-Gripper](https://github.com/XenseRobotics-AI/TacCap-Gripper)) is the development kit for the XTac-UMI G1
grippers. It provides both Python and C++ interfaces, for writing your own programs that read the leader gripper and control the follower gripper.

!!! note "This appendix is written for SDK 0.4.1"
    The data-collection repository `xense-taccap-lerobot` ships SDK 0.4.1 (submodule `third_party/taccap-gripper`).
    Once the collection environment is set up per [Installation](../pc/install.md) it is ready to use; see [Install and build](install.md).

## What it can do {#scope}

| | Leader gripper | Follower gripper |
|---|---|---|
| Opening | Encoder, 0..1 opening | Motor position, 0..1 opening |
| Other data | IMU, buttons | Motor velocity, torque, temperature |
| Control | — | Impedance control (default), force-position control |
| Shared | LED, wrist camera, fisheye intrinsics, firmware upgrade | Same as left; plus motor firmware upgrade and version query |

Visuotactile images are captured by `xensesdk` and are not part of this SDK. Teleoperation, grasping policies and data recording belong to higher-level applications.

## Before you start {#notes}

- The computer never drives the motor directly: every command is relayed by the gripper's main control board, and no program can bypass the protection on that board (the motion safety envelope).
- A gripper is used by only one program, and one controller, at a time. Scanning for devices interrupts any other program currently using a gripper.
- Logs are written to `~/.taccaplogs/` (change it with the environment variable `TACCAP_LOG_DIR`), one file per run. Attach the matching log when reporting a problem.

## Other pages in this appendix {#pages}

- [Install and build](install.md): installing for Python, and integrating into C++ / ROS 2 projects.
- [API essentials](api.md): device discovery, reading the leader gripper, controlling the follower gripper, calibration and the wrist camera.
- [Examples](examples.md): the example scripts at a glance, and migrating from older versions.
