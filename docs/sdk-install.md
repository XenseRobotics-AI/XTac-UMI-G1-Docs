# 安装与构建

本页针对**单独使用 SDK**:自己写程序调用夹爪,或者使用[从夹爪](follower-overview.md)。
只做数采的,按 [环境安装](02-environment.md) 走即可,不需要本页。

SDK 目前只能从源码构建,没有预编译包。示例脚本与固件镜像都在源码目录里,装完请保留这份源码。

## 前置条件 {#prerequisites}

| 项 | 要求 |
|---|---|
| 操作系统 | Linux(Ubuntu 22.04 及以上实测);腕部相机走 V4L2,不支持 macOS / Windows |
| 环境管理 | `mamba` 或 `conda`,推荐。`environment.yml` 会装好 gcc 14、CMake、Ninja、OpenCV、spdlog、Python 3.12 与构建依赖 |
| 不用 conda 时 | gcc/g++ ≥ 13、CMake ≥ 3.20、Ninja、pkg-config,以及 OpenCV 与 spdlog 开发包;Python ≥ 3.10 |

## Python 安装 {#python}

```bash
git clone --branch v0.3.2 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper

mamba env create -f environment.yml     # 新建名为 taccap 的环境
mamba activate taccap
pip install . --no-build-isolation
```

一条 `pip` 同时编译 C++ 核心库与 Python 扩展。要改 SDK 源码自己调试时,改用可编辑安装
`pip install -e . --no-build-isolation`;注意改了 C++ 代码后要重新执行这条命令才会生效。

!!! warning "两个容易踩的坑"
    - **在已激活的环境里安装**,不要用绝对路径调用别的环境的 `pip`。否则构建时会找错工具,报一个看不懂的版本错误。
    - **不要省 `--no-build-isolation`**。它让构建使用环境里固定版本的依赖;省掉后会临时下载另一个版本的 pybind11 来编译。

验证:

```bash
env -u PYTHONPATH python -c "import xense.taccap as t; print(t.hello()); print(t.__file__)"
```

第一行应为 `taccap-gripper OK; version 0.3.2`,第二行应指向 `taccap` 环境。

!!! warning "`import` 到了别处的旧版本"
    叠加激活多个 conda 环境时,`PYTHONPATH` 可能把另一个环境(例如数采环境)的旧版 SDK 带进来,
    而且不报任何错。上面的命令用 `env -u PYTHONPATH` 排除它;`t.__file__` 显示实际加载的是哪一份。

## 设备权限 {#permissions}

```bash
sudo usermod -aG dialout,video "$USER"
# 注销后重新登录生效
```

SDK 不依赖 udev 规则。夹爪的控制串口通过 `/dev/serial/by-id/usb-1a86_USB_Dual_Serial_<序列号>-if02` 访问,
SDK 的设备发现会自动找到它。

## 仅构建 C++ {#cpp}

不需要 Python 绑定时(例如集成到 ROS 2 包),直接用 CMake 构建:

```bash
cmake -B build -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DTACCAP_BUILD_PYTHON=OFF \
    -DTACCAP_BUILD_EXAMPLES=ON \
    -DTACCAP_BUILD_TESTS=ON
cmake --build build -j
ctest --test-dir build --output-on-failure    # 可选:运行单元测试
```

| CMake 选项 | 默认 | 作用 |
|---|---|---|
| `TACCAP_BUILD_PYTHON` | `ON` | 构建 Python 扩展 |
| `TACCAP_BUILD_EXAMPLES` | `ON` | 构建 `cpp/examples/` 下的 C++ 示例 |
| `TACCAP_BUILD_TESTS` | `OFF` | 构建单元测试 |

产物是 `build/cpp/libtaccap_core.so`,C++ 示例在 `build/cpp/examples/`。

### 集成到自己的 CMake / ROS 2 工程 {#cmake-integration}

SDK **不安装头文件,也不导出 CMake 包配置**,不能用 `find_package`。把 SDK 源码作为子目录引入:

```cmake
set(TACCAP_BUILD_PYTHON   OFF CACHE BOOL "" FORCE)   # 不构建 Python 扩展(否则需要 pybind11)
set(TACCAP_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)   # 不构建示例
add_subdirectory(path/to/TacCap-Gripper taccap-gripper-build)
target_link_libraries(my_target PRIVATE taccap_core)
```

`taccap_core` 会把公共头文件目录以及 OpenCV、spdlog 依赖一并传给你的目标。只拷贝 `libtaccap_core.so`
不够用,还需要配套的头文件与依赖,不推荐。

## 硬件自检 {#self-check}

接上夹爪后:

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn, g.mcu_device)"
```

每只夹爪输出一行,`role` 应为 `Role.Leader`(序列号以 `m` 结尾)或 `Role.Follower`(以 `s` 结尾)。

!!! danger "扫描会停掉其他程序的数据流"
    扫描会向每一只夹爪发送停止数据流的命令。数采或控制程序运行时扫描,会中断它们,正在夹持的从夹爪会卸力。
    先停掉其他程序再扫描。

- 从夹爪接着做:[从夹爪 → 只读自检](follower-setup.md#self-check)。
- 串口权限、ModemManager 抢占等问题见 [主机与设备配置](03-host-hardware.md)。
