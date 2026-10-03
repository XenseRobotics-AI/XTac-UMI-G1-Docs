# 安装与构建

## Python 安装 {#python}

**推荐直接用数采环境**：按 [环境安装](02-environment.md) 装好之后就已经带有 SDK 0.4.1
（子模块 `third_party/taccap-gripper`），源码和示例脚本都在这个目录下。验证：

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.4.1`。版本不对时，拉子模块并重跑 `./setup_env.sh --install`，
见 [2.2 克隆仓库与子模块](02-environment.md#22)。

### 不使用数采仓库时单独安装（可选） {#standalone}

只想在别的机器上开发、不需要数采仓库时，也可以单独安装。需要 Ubuntu 22.04 及以上，以及 `mamba` 或
`conda`。SDK 从源码编译，示例脚本也在源码目录里，装完请保留。

```bash
git clone --branch v0.4.1 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper
mamba env create -f environment.yml     # 新建名为 taccap 的环境,包含编译所需的全部依赖
mamba activate taccap
pip install . --no-build-isolation      # 需要几分钟
sudo usermod -aG dialout,video "$USER"  # 串口与相机权限,注销后重新登录生效
```

验证方法同上，应输出 `taccap-gripper OK; version 0.4.1`。

!!! warning "常见问题"
    - **必须先 `mamba activate taccap` 再安装**，`--no-build-isolation` 也不要省，否则编译会报错。
    - 版本不是 0.4.1：当前环境加载了别处的 SDK。换一个干净的终端，只激活 `taccap` 再试。

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

编译环境用上面单独安装时创建的 `taccap` 环境，它带有编译所需的全部依赖。C++ 接口与 Python 同名，位于 `xense::taccap` 命名空间。
