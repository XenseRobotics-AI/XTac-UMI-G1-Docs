# 准备与自检

依次完成四步再投入使用。第 1 步从零装好 SDK，背包版与 PC 版都适用。安装接线见 [夹爪连接与序列号 → 从夹爪安装与连接](../common/gripper.md#follower-install)，从夹爪要 **USB Type-C 和 24V 两路都接上**。

## 1. 安装 SDK 与主机配置 {#install}

无论用背包版还是 PC 版，只要用 SDK 控制夹爪，都要在运行 SDK 的电脑上做完下面的配置（每台电脑做一次）。系统要求 Ubuntu 22.04 或 24.04（x86_64）。按顺序复制执行即可。

!!! tip "已装好 PC 版数采环境的电脑"
    数采环境里已经带有 SDK 0.4.3（数采仓库的 `third_party/taccap-gripper`），跳过第 1–5 步，在数采环境里进入该目录，从[第 6 步](#host)做起。

### 第 1 步：安装 Miniforge（mamba） {#miniforge}

先检查是否已经装过：

```bash
mamba --version
```

能打印版本号就跳过这一步。否则：

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
```

一路回车，看到许可协议输入 `yes`，问是否初始化 shell 时也输入 `yes`。装完**关掉终端再开一个新的**，`mamba --version` 能打印版本号即可。

### 第 2 步：安装系统软件包 {#apt}

```bash
sudo apt update
sudo apt install -y git curl v4l-utils
```

`v4l-utils` 提供 `v4l2-ctl`，用来查看腕部相机。

### 第 3 步：下载 SDK {#clone}

```bash
cd ~
git clone --branch v0.4.3 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper
```

示例脚本就在这个目录里，装完**不要删除**。

### 第 4 步：创建 mamba 环境 {#env}

```bash
mamba env create -f environment.yml
mamba activate taccap
```

会新建名为 `taccap` 的环境，自动装好编译器、CMake、OpenCV 与 Python 3.12，需要几分钟。之后**每次打开新终端都要先执行 `mamba activate taccap`**，命令行开头出现 `(taccap)` 才算激活。

### 第 5 步：编译安装 SDK {#build}

在 `TacCap-Gripper` 目录、`taccap` 环境里执行：

```bash
uv pip install -e . --no-build-isolation
```

需要几分钟。验证：

```bash
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.4.3`。

!!! warning "编译报错或版本不对"
    - 必须先 `mamba activate taccap` 再安装，`--no-build-isolation` 不能省。
    - 版本不是 0.4.3：当前终端加载了别处的 SDK。关掉终端，开一个新的，只执行 `mamba activate taccap` 再试。

### 第 6 步：主机配置（缺一项就连不上） {#host}

!!! danger "这一步最容易漏，漏了夹爪会连不上"
    依次：卸载 `brltty`（Ubuntu 自带的盲文驱动，会抢占夹爪串口）→ 把当前用户加入 `dialout`（串口）与 `video`（相机）组 → 安装 udev 规则，阻止 ModemManager（调制解调器服务）在插拔时占用夹爪串口。

```bash
sudo apt purge -y brltty
sudo usermod -aG dialout,video "$USER"
sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
# XTac-UMI G1 MCUs are CH343 USB-serial (1a86:55d2) — keep ModemManager off them
ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger
```

然后**注销并重新登录**（或重启电脑），用户组才会生效。重新登录后接好夹爪，逐项确认：

```bash
dpkg -l brltty | grep ^ii                    # 没有输出 = brltty 已卸载
groups | grep -o -E "dialout|video"          # 应同时打印 dialout 和 video
udevadm info -q property -n /dev/ttyACM0 | grep ID_MM_DEVICE_IGNORE   # 应为 ID_MM_DEVICE_IGNORE=1
```

三项的原理见[主机配置 · 首次使用必做](../pc/host-setup.md#first-use)。

后续命令都在 `TacCap-Gripper` 目录（PC 版数采环境为 `third_party/taccap-gripper`）、已激活的环境里运行。

## 2. 找到设备 {#discover}

上电后等夹爪自己开合一次、停下来（约 10 秒），再运行：

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"
```

每只夹爪一行，从夹爪应显示 `Role.Follower`，序列号以 `s` 结尾，例如：

```text
Side.Left Role.Follower TCGU01A24A0001s
```

示例脚本都用 `left`、`right` 或完整序列号指定夹爪，只接一只时可以省略。

!!! warning "主从夹爪接在同一台电脑上时，用完整序列号"
    `left` / `right` 只看左右，不看主从。同一侧同时接着主夹爪和从夹爪时，脚本会报错；
    只接了主夹爪时，控制脚本会把它当从夹爪打开。这种接法一律用从夹爪的完整序列号。

!!! danger "不要在数采或控制程序运行时扫描"
    扫描设备（包括每个示例脚本启动时）会中断正在运行的其他程序，正在夹持的从夹爪会卸力。先停掉其他程序。

## 3. 自检 {#self-check}

```bash
python python/examples/follower_status.py left
```

这个脚本只读，不会让电机动。正常输出中要看的几行（中间省略）：

```text
[fw] FirmwareVersion(1.2.16.0)
...
[归一化] g.position() = 0.9183
...
[故障] 电机 0x00000000  锁存 0x00000000  固件 0x00000000
...
  299 帧 / 3.01 s = 99.5 Hz
  固件状态时间戳推进 3005 ms,墙钟 3006 ms  OK
```

| 看哪里 | 正常 | 不正常时 |
|---|---|---|
| `[fw]` | 1.2.16 | 低于 1.2.11 会打印升级提示，低于 1.2.5 会报错退出，都先[升级固件](firmware.md#mcu-ota) |
| `[归一化]` | 0 到 1 之间 | 报 `not calibrated`：清空爪子周围，断电重启 |
| `[故障]` | 全 0 | 见[故障排查](troubleshooting.md#fault) |
| `[开流读]` | 约 100Hz，显示 `OK` | 断电重启后再试，仍不正常见[故障排查](troubleshooting.md#self-check) |

## 4. 运动自检 {#motion-check}

用键盘控制台让从夹爪实际动一次，确认安全保护已生效，开合、力矩和温度都正常：

```bash
python python/examples/gripper_console.py left
```

!!! danger "会驱动真实电机"
    先清空爪子周围，手指远离夹爪，随时可以拔掉 24V。

控制台顶部一行显示夹爪信息和运动安全包络，下面一行是实时数据：

| 看哪里 | 正常 |
|---|---|
| 顶部 `envelope:` | 末尾是 `ENFORCED`，表示固件的力矩与过热保护已生效；显示 `未生效` 说明固件太旧，先[升级固件](firmware.md#mcu-ota) |
| `Act[0-1]` | 按 `o` 接近 1、按 `c` 接近 0；显示 `N/A` 说明没标定，断电重启 |
| `Torq(+闭合)` | 空载开合时接近 0；用一根笔挡在指间按 `c`，稳定在 1.1N·m，不会继续上涨 |
| `Temp(C)` | 室温附近；持续夹持会慢慢升高，超过 90°C 固件会自动降低力矩 |
| `State` | 运动中是 `EN`；出现 `FAULT` 等见[故障排查](troubleshooting.md#fault) |

常用按键：`o` / `c` 全开 / 全合，`j` / `k` 张开 / 闭合一步，`d` 松开电机，`q` 退出。全部按键见[运动控制](control.md#first-motion)。

以上都正常，从夹爪就可以投入使用了。

接下来见[运动控制](control.md)。
