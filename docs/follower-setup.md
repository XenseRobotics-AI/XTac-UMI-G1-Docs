# 准备与自检

按顺序做完四步再让从夹爪运动。硬件安装与接线见 [硬件介绍 → 从夹爪安装与连接](hardware.md#follower-install)，
从夹爪要 **USB Type-C 和 24V 两路都接上**。

## 1. 安装 SDK {#install}

需要 Ubuntu 22.04 及以上，以及 `mamba` 或 `conda`。

```bash
git clone --branch v0.4.1 https://github.com/XenseRobotics-AI/TacCap-Gripper.git
cd TacCap-Gripper
mamba env create -f environment.yml     # 新建名为 taccap 的环境
mamba activate taccap
pip install . --no-build-isolation      # 需要几分钟
sudo usermod -aG dialout,video "$USER"  # 串口权限,注销后重新登录生效
```

验证：

```bash
python -c "import xense.taccap as t; print(t.hello())"
```

应输出 `taccap-gripper OK; version 0.4.1`。版本不对说明用错了环境，先 `mamba activate taccap`。

之后的命令都在 `TacCap-Gripper` 目录下、`taccap` 环境里运行。安装问题见 [SDK 附录 → 安装与构建](sdk-install.md)。

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
| `[fw]` | 1.2.14 | 低于 1.2.11 会打印升级提示，低于 1.2.5 会报错退出，都先[升级固件](follower-firmware.md#mcu-ota) |
| `[归一化]` | 0 到 1 之间 | 报 `not calibrated`：清空爪子周围，断电重启 |
| `[故障]` | 全 0 | 见[故障排查](follower-troubleshooting.md#fault) |
| `[开流读]` | 约 100 Hz，显示 `OK` | 断电重启后再试，仍不正常见[故障排查](follower-troubleshooting.md#self-check) |

## 4. 写入运动安全包络 {#envelope}

包络是固件里的力矩与过热保护，每只从夹爪写一次，掉电保留。数值由 SDK 按电机自动生成，不用填。
夹爪固件 1.2.12 起，没写过包络时固件会执行一套默认包络，更旧的固件则完全不保护；两种情况都要写一次。

先查看：

```bash
python python/examples/impedance_control.py left --show-envelope
```

`effective` 一行有 `flags=0x2003 ENFORCE`，且没有 `[warn]` 行，说明已经写过，可以跳过。否则写入：
（没写过包络的 1.2.12 及以上固件，`effective` 一行同样有 `ENFORCE`，但会多一行 `[warn]`，这时仍要写入。）

```bash
python python/examples/impedance_control.py left --set-envelope --show-envelope
```

显示 `已写入` 或 `已正确,未写入` 即完成。

!!! danger "`--set-envelope` 一定要和 `--show-envelope` 一起用"
    只加 `--set-envelope` 时，脚本写完后**会接着让电机运动**。

完成后就可以开始[运动控制](follower-control.md)了。
