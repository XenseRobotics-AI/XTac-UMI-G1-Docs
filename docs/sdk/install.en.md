# Install and build

## Python install {#python}

**We recommend using the collection environment directly**: once it is set up per [Installation](../pc/install.md) it already includes SDK 0.4.1
(submodule `third_party/taccap-gripper`), and the source and example scripts are all in that directory. To verify:

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

It should print `taccap-gripper OK; version 0.4.1`. If the version is wrong, pull the submodules and rerun `./setup_env.sh --install`,
see [Clone the repo and its submodules](../pc/install.md#22).

### Standalone install without the data-collection repository (optional) {#standalone}

If you only want to develop on another machine and do not need the data-collection repository, you can install the SDK on its own. This needs Ubuntu 22.04 or later, and `mamba` or
`conda`. The SDK is compiled from source and the example scripts live in the source tree, so keep it after installing.

```bash
git clone --branch v0.4.1 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper
mamba env create -f environment.yml     # creates an environment named taccap with every build dependency
mamba activate taccap
pip install . --no-build-isolation      # takes a few minutes
sudo usermod -aG dialout,video "$USER"  # serial and camera permissions; takes effect after logging out and back in
```

Verify the same way as above; it should print `taccap-gripper OK; version 0.4.1`.

!!! warning "Common problems"
    - **Run `mamba activate taccap` before installing**, and do not drop `--no-build-isolation`, or the build will fail.
    - Version is not 0.4.1: the current environment is loading an SDK from somewhere else. Open a clean terminal, activate only `taccap` and try again.

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
