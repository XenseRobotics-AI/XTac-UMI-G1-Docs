# 安装与构建

## Python 安装 {#python}

**推荐直接用数采环境**：按 [安装](../pc/install.md) 装好之后就已经带有 SDK 0.4.3
（子模块 `third_party/taccap-gripper`），源码和示例脚本都在这个目录下。验证：

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.4.3`。版本不对时，拉子模块并重跑 `./setup_env.sh --install`，
见 [克隆仓库与子模块](../pc/install.md#22)。

### 单独安装（背包版或不用数采仓库） {#standalone}

背包版客户，或不使用数采仓库的电脑，按[从夹爪 · 准备与自检 · 安装 SDK 与主机配置](../follower/setup.md#install)从零安装：Miniforge → `v4l-utils` → 下载 SDK → 创建 mamba 环境 → 编译安装 → 主机配置。主夹爪与从夹爪用的是同一套步骤。

## 硬件自检 {#self-check}

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"
```

每只夹爪一行，主夹爪为 `Role.Leader`（序列号以 `m` 结尾），从夹爪为 `Role.Follower`（以 `s` 结尾）。
扫描会中断其他正在使用夹爪的程序，先停掉它们。从夹爪接着看 [准备与自检](../follower/setup.md#self-check)；
串口权限等问题见 [主机配置](../pc/host-setup.md)。

## 集成到 C++ / ROS 2 工程 {#cpp}

把 SDK 源码作为 CMake 子目录引入，链接 `taccap_core`：

```cmake
set(TACCAP_BUILD_PYTHON   OFF CACHE BOOL "" FORCE)
set(TACCAP_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
add_subdirectory(path/to/TacCap-Gripper taccap-gripper-build)
target_link_libraries(my_target PRIVATE taccap_core)
```

编译使用上面单独安装时创建的 `taccap` 环境，其中已含全部编译依赖。C++ 接口与 Python 同名，位于 `xense::taccap` 命名空间。

ROS 2 里的夹爪模型（URDF / Xacro）见 [XTac-UMI-Description](https://github.com/XenseRobotics-AI/XTac-UMI-Description)。
