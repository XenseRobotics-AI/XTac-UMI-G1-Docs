# 准备与自检

本页从装好 SDK 到第一次让从夹爪动起来之前的所有准备:安装、找到设备、只读自检、写入运动安全包络。
按顺序做,**第 4 步做完之前不要驱动电机**。

硬件安装与接线见 [硬件介绍 → 从夹爪安装与连接](hardware.md#follower-install)。从夹爪需要
**USB Type-C 和 24V 两路都接上**:USB 给主控板,24V 给电机。

## 1. 安装 SDK {#install}

SDK 目前只能从源码构建,没有预编译包。本章的示例脚本都在源码目录里,所以也需要保留这份源码。

| 项 | 要求 |
|---|---|
| 操作系统 | Linux(Ubuntu 22.04 及以上实测);不支持 macOS / Windows |
| Python | 3.12(`environment.yml` 固定的版本,也是持续集成测试的版本) |
| 环境管理 | `mamba` 或 `conda`;`environment.yml` 会装好编译器、CMake 与全部依赖 |

```bash
git clone --branch v0.3.2 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper

mamba env create -f environment.yml     # 新建名为 taccap 的环境
mamba activate taccap
pip install . --no-build-isolation      # 编译 C++ 核心与 Python 扩展,需要几分钟
```

!!! warning "必须在已激活的环境里安装"
    不激活环境、用绝对路径调用 `pip`,构建时会找错工具,报一个看不懂的版本错误。
    `--no-build-isolation` 也不要省:它让构建使用环境里固定版本的依赖。

验证:

```bash
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.3.2`。

!!! warning "不要和数采环境混用"
    数采仓库 `xense-taccap-lerobot` 自带旧版 SDK。本章的命令都在上面新建的 `taccap` 环境里运行;
    如果 `hello()` 打印的版本不是 0.3.2,说明用错了环境,或者 `PYTHONPATH` 指向了别处的旧版本。

**串口权限(每台电脑一次)**:

```bash
sudo usermod -aG dialout,video "$USER"
# 注销后重新登录生效
```

之后的命令都在 `TacCap-Gripper` 源码目录下、`taccap` 环境里运行。

## 2. 找到设备 {#discover}

从夹爪上电后,固件会先**自动标定约 10 秒**:闭合到底取零点,再张开到底取行程。这段时间内
电机不接受控制命令,爪子会自己动一次,等它停下来再往下做。

```bash
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn, g.mcu_device)"
```

每只连着的夹爪输出一行,例如:

```text
Side.Left Role.Follower TCGU01A24A0001s /dev/serial/by-id/usb-1a86_USB_Dual_Serial_XXXXXXXXXX-if02
```

`role` 应为 `Role.Follower`,序列号以 `s` 结尾。显示 `Role.Unknown` 且序列号为空,多半是别的程序同时在读这个串口,
关掉后重新扫描。

!!! danger "不要在其他程序控制夹爪时扫描"
    扫描会向**每一只**连着的夹爪发送停止数据流的命令;所有示例脚本启动时也会先扫描。
    数采或控制程序正在运行时扫描,会停掉那个程序的数据流——正在夹持的从夹爪随之卸力,**夹着的东西会掉**。
    先停掉其他程序,再扫描或运行示例脚本。

**示例脚本怎么选设备**:所有示例脚本都接受同一个位置参数——`left`、`right` 或完整序列号。
只插了一只夹爪时可以省略;插了两只又不指定,脚本会拒绝运行而不是替你猜。

!!! warning "`left` / `right` 只看侧别,不看主从"
    同一台电脑上接着左主夹爪和左从夹爪时,`left` 会匹配到两只,脚本报错退出,这时要传从夹爪的**完整序列号**。
    只接了左主夹爪时,`gripper_console.py left` 之类的控制脚本会把主夹爪当从夹爪打开。
    主从夹爪接在同一台电脑上时,一律用完整序列号。

```bash
python python/examples/follower_status.py left
python python/examples/follower_status.py TCGU01A24A0001s
```

**在自己的程序里选设备**,先扫描一次,再**同时按侧别和角色**过滤:

```python
import xense.taccap as t

eps = t.scan_grippers()
ep = next(e for e in eps if e.side == t.Side.Left and e.role == t.Role.Follower)
g = t.FollowerGripper(ep.mcu_device)
```

!!! warning "`find_left()` / `find_follower()` 在多设备时不报错"
    这几个便捷函数返回**第一个**匹配的设备。一台电脑上同时接着左主夹爪和左从夹爪时,
    `find_left()` 可能拿到主夹爪;接着两只从夹爪时,`find_follower()` 拿到哪只不确定。
    只接一只从夹爪时可以放心用,多设备一律按上面的写法过滤。

## 3. 只读自检 {#self-check}

```bash
python python/examples/follower_status.py left
```

这个脚本只读,不会驱动电机。正常输出类似:

```text
[discovery] TCGU01A24A0001s  /dev/serial/by-id/usb-1a86_USB_Dual_Serial_XXXXXXXXXX-if02
[fw] FirmwareVersion(1.2.9.0)

[一次性读] g.motor.read_status()
  位置    -1.11804 rad     (电机轴原始角,零点由上电标定确定)
  速度    -0.01221 rad/s
  力矩    -0.0015 Nm    (反馈值,不是命令值)
  温度    32.0 °C
  status=0x0000 stop=None_

[归一化] g.position() = 0.9183
  行程 min_open=0.00000  max_open=1.21755 rad

[故障] 电机 0x00000000  锁存 0x00000000  固件 0x00000000
  锁存位要显式清除才会消失 —— 当前为 0 不代表从没出过故障。

[开流读] g.start_streaming(motor_hz=100) + on_status()
  299 帧 / 3.01 s = 99.5 Hz
  固件状态时间戳推进 3005 ms,墙钟 3006 ms  OK
  位置区间 [-1.11804, -1.11804] rad  (静止时这两个数应当几乎相等)
```

逐项核对:

| 看哪里 | 正常 | 不正常时 |
|---|---|---|
| `[fw]` | `1.2.9` 或更高 | 低于 1.2.5 会直接报错退出,先[升级固件](follower-firmware.md#mcu-ota) |
| `[归一化]` | 0 到 1 之间,张开时接近 1 | 报"not calibrated":上电自动标定没完成,断电重启再试 |
| `[故障]` | 全 0 | 非 0 见[故障排查](follower-troubleshooting.md#fault) |
| `[开流读]` 帧率 | 约 100 Hz | 明显偏低:检查 USB 线与接口;其他程序是否在读同一个串口 |
| 时间戳推进 | 与墙钟一致,显示 `OK` | 不推进说明读到的是旧状态,断电重启 |

再确认电机规格:

```bash
python -c "import xense.taccap as t
g = t.FollowerGripper(t.find_follower().mcu_device)
print(g.motor.get_spec())"
```

应显示 `MotorSpec(EL05, rated=1.800000, peak=6.000000)`。显示的不是 EL05 时停止使用,联系[技术支持](versions.md#support)。

## 4. 写入运动安全包络 {#envelope}

包络是固件里的力矩与温度保护,**出厂时是关的**,每台需要写一次,掉电保留。数值不需要你填:
SDK 从夹爪读出电机的额定值,按它生成。

先看当前状态(只读):

```bash
python python/examples/impedance_control.py left --show-envelope
```

```text
[envelope] stored    GripperEnvelope(cont=1.100 Nm, peak=1.800 Nm, temp=0/0C, flags=0x2003 ENFORCE)
[envelope] effective GripperEnvelope(cont=1.100 Nm, peak=1.800 Nm, temp=0/0C, flags=0x2003 ENFORCE)
```

`flags=0x2003 ENFORCE`、`effective` 有值,**并且没有打印 `[warn]` 行**,说明包络已生效且数值与电机规格相符,这一步可以跳过。
`effective` 一行显示 `*** 固件什么都不执行 ***`,或者打印了 `[warn]`,就需要写入:

```bash
python python/examples/impedance_control.py left --set-envelope --show-envelope
```

写完打印 `[envelope] 已写入 ...`;已经正确时打印 `[envelope] 已正确,未写入`,不会重复写。

!!! danger "`--set-envelope` 一定要和 `--show-envelope` 一起用"
    只加 `--set-envelope` 时,脚本写完包络后**会接着驱动电机**跑一轮开合测试。
    这一步只想写包络,就两个参数一起加,脚本写完即退出。

写入的数值:

| 字段 | 数值 | 含义 |
|---|---|---|
| `peak` | 1.8 N·m | 运动中的瞬时力矩上限(电机额定力矩) |
| `cont` | 1.1 N·m | 顶住物体时可以一直保持的力矩(持续堵转额定) |
| 温度 | 0 → 固件默认 | 90 °C 开始降额,100 °C 以上只保留 0.30 N·m |

包络写好后就可以开始[运动控制](follower-control.md)了。
