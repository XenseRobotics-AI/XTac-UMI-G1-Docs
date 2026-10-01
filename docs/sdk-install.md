# 安装与构建

只做数采的，按 [环境安装](02-environment.md) 走即可，不需要本页。

## Python 安装 {#python}

需要 Ubuntu 22.04 及以上，以及 `mamba` 或 `conda`。SDK 从源码编译，示例脚本也在源码目录里，装完请保留。

```bash
git clone --branch v0.4.1 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper
mamba env create -f environment.yml     # 新建名为 taccap 的环境,包含编译所需的全部依赖
mamba activate taccap
pip install . --no-build-isolation      # 需要几分钟
sudo usermod -aG dialout,video "$USER"  # 串口与相机权限,注销后重新登录生效
```

验证：

```bash
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.4.1`。

!!! warning "常见问题"
    - **必须先 `mamba activate taccap` 再安装**，`--no-build-isolation` 也不要省，否则编译会报错。
    - 版本不是 0.4.1：当前环境加载了别处的旧版 SDK，常见于同时激活了数采环境。换一个干净的终端，
      只激活 `taccap` 再试。

## 硬件自检 {#self-check}

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"
```

每只夹爪一行，主夹爪为 `Role.Leader`（序列号以 `m` 结尾），从夹爪为 `Role.Follower`（以 `s` 结尾）。
扫描会中断其他正在使用夹爪的程序，先停掉它们。从夹爪接着看 [准备与自检](follower-setup.md#self-check)；
串口权限等问题见 [主机与设备配置](03-host-hardware.md)。

## 集成到 C++ / ROS 2 工程 {#cpp}

把 SDK 源码作为 CMake 子目录引入，链接 `taccap_core`：

```cmake
set(TACCAP_BUILD_PYTHON   OFF CACHE BOOL "" FORCE)
set(TACCAP_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
add_subdirectory(path/to/TacCap-Gripper taccap-gripper-build)
target_link_libraries(my_target PRIVATE taccap_core)
```

编译环境同样用上面的 `taccap` 环境。C++ 接口与 Python 同名，位于 `xense::taccap` 命名空间。
