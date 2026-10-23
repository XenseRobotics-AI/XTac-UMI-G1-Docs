# Install and build

## Python install {#python}

**We recommend using the collection environment directly**: once it is set up per [Installation](../pc/install.md) it already includes SDK 0.4.3
(submodule `third_party/taccap-gripper`), and the source and example scripts are all in that directory. To verify:

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

It should print `taccap-gripper OK; version 0.4.3`. If the version is wrong, pull the submodules and rerun `./setup_env.sh --install`,
see [Clone the repo and its submodules](../pc/install.md#22).

### Standalone install (Backpack Kit, or without the data-collection repository) {#standalone}

Backpack Kit customers, and computers that do not use the data-collection repository, install from scratch per [Follower · Setup and self-check · Install the SDK and set up the host](../follower/setup.md#install): Miniforge → `v4l-utils` → download the SDK → create the mamba environment → build and install → host setup. Leader and follower grippers use the same steps.

## Hardware self-check {#self-check}

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"
```

One line per gripper: a leader gripper shows `Role.Leader` (serial number ending in `m`), a follower gripper `Role.Follower` (ending in `s`).
Scanning interrupts any other program using a gripper, so stop those first. For the follower gripper, continue with [Setup and self-check](../follower/setup.md#self-check);
serial permissions and similar issues are covered in [Host setup](../pc/host-setup.md).

## Integrating into C++ / ROS 2 projects {#cpp}

Add the SDK source as a CMake subdirectory and link `taccap_core`:

```cmake
set(TACCAP_BUILD_PYTHON   OFF CACHE BOOL "" FORCE)
set(TACCAP_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
add_subdirectory(path/to/TacCap-Gripper taccap-gripper-build)
target_link_libraries(my_target PRIVATE taccap_core)
```

For the build environment use the `taccap` environment created by the standalone install above; it has every build dependency. The C++ interface uses the same names as Python, in the `xense::taccap` namespace.

For gripper models in ROS 2 (URDF / Xacro), see [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description).
