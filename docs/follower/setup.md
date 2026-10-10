# 准备与自检

按顺序做完四步再投入使用。硬件安装与接线见 [夹爪连接与序列号 → 从夹爪安装与连接](../common/gripper.md#follower-install)，
从夹爪要 **USB Type-C 和 24V 两路都接上**。

## 1. 安装 SDK {#install}

装好数采环境（[安装](../pc/install.md)）就已经带有 SDK 0.4.1，不需要另外安装。示例脚本在数采仓库的
`third_party/taccap-gripper/python/examples/` 下。串口权限见 [串口权限](../pc/host-setup.md#31)。

验证（在数采仓库根目录、数采环境里）：

```bash
cd third_party/taccap-gripper
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.4.1`。版本不对说明 SDK 子模块没更新或没重新编译，见
[从夹爪故障排查](troubleshooting.md#connect)。

之后的命令都在 `third_party/taccap-gripper` 目录下、数采环境里运行。不使用数采仓库、单独安装 SDK 的方法见
[SDK 附录 → 安装与构建](../sdk/install.md)。

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
[fw] FirmwareVersion(1.2.14.0)
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
| `[fw]` | 1.2.14 | 低于 1.2.11 会打印升级提示，低于 1.2.5 会报错退出，都先[升级固件](firmware.md#mcu-ota) |
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
