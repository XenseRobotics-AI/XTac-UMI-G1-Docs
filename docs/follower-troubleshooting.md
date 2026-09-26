# 从夹爪故障排查

按**症状**分类。每条:症状 → 原因 → 解决。先跑一遍只读自检,多数问题从它的输出就能看出来:

```bash
python python/examples/follower_status.py left
```

本页说的**断电重启**,都是指 USB 线和 24V 电源线**同时**拔掉,两根都拔出后再插回。只拔一根不算。

## 找不到设备、打不开 {#connect}

??? failure "`scan_grippers()` 什么都没输出,或 `find_follower` 报 `no follower gripper detected`"
    **原因**:串口权限不够;USB 没接好;别的程序同时在读这个串口,把应答读走了(这时角色显示 `Unknown`、序列号为空);
    或者序列号确实不是 `s` 结尾(旧设备、未烧录序列号)。
    **解决**:

    - 确认已把用户加入 `dialout` 组并重新登录,见 [安装 SDK](follower-setup.md#install)。
    - `lsusb` 里应有 `1a86:55d2`;没有就检查 USB 线,换一个 USB 口。
    - 关掉数采程序和其他正在用夹爪的脚本,再重新扫描。注意扫描本身会停掉其他程序的数据流,
      见 [找到设备](follower-setup.md#discover)。
    - 没有别的程序占用,角色仍显示 `Role.Unknown` 时,联系[技术支持](versions.md#support)。

??? failure "脚本报 `2 plugged-in grippers report side=Left`"
    **原因**:`left` / `right` 只按侧别匹配。同一侧接着主夹爪和从夹爪时,两只都匹配。
    **解决**:改用从夹爪的完整序列号,例如 `python python/examples/follower_status.py TCGU01A24A0001s`。

??? failure "打开时报 `从爪固件版本过低,必须升级后才能使用本 SDK / Follower firmware too old`"
    **原因**:夹爪固件低于 1.2.5。这个版本以下,运动时的堵转保护或闭合零点与 SDK 不匹配,SDK 拒绝驱动。
    **解决**:按报错里给出的命令升级固件,再断电重启,见 [升级夹爪固件](follower-firmware.md#mcu-ota)。

??? failure "`import xense.taccap` 报 `AttributeError: ... has no attribute ...`,或 `hello()` 显示的版本不是 0.3.2"
    **原因**:导入的是别处的旧版 SDK,常见于在数采环境里运行,或 `PYTHONPATH` 指向了旧源码。
    **解决**:`mamba activate taccap`,并用 `env -u PYTHONPATH python ...` 排除 `PYTHONPATH` 的影响;还不行就在 SDK 源码目录重新执行一次 `pip install . --no-build-isolation`。

??? failure "电机命令报 `SensorOffline`"
    **原因**:打开的其实是一只主夹爪。SDK 在枚举阶段分不出主从,用 `FollowerGripper` 打开主夹爪能成功,到发电机命令时才失败。
    **解决**:按角色选设备,确认序列号以 `s` 结尾,见 [找到设备](follower-setup.md#discover)。

??? failure "读 IMU、编码器报 `ProtocolError: NACK: InvalidCmd`"
    **原因**:从夹爪没有 IMU、编码器和按键,固件不接受这些命令。
    **解决**:开合量从电机读:控制时用 `snapshot().observation.position`,不控制时用 `g.position()`。

## 自检输出异常 {#self-check}

??? failure "`g.position()` 报 `gripper config is not calibrated`"
    **原因**:上电自动标定没有完成,夹爪里没有有效的行程记录。常见于上电时爪子被东西挡住,或 24V 没接上。
    **解决**:清空爪子的运动范围,接好 24V,断电重启,等爪子自己开合一次停下后再试。

??? failure "状态帧率明显低于 100 Hz,或时间戳推进和墙钟对不上"
    **原因**:USB 线或接口接触不良;别的程序同时在读这个串口;或者读到的状态没有在更新。
    **解决**:关掉其他程序,换线或换 USB 口,断电重启后重新自检。

    刷完固件没断电重启的夹爪也会丢帧,但丢得很少(每 60 秒几十帧),自检里看不出来。
    所以刷完一律断电重启,不要靠自检判断,见 [刷完必须断电重启](follower-firmware.md#power-cycle)。

??? failure "RS00 从夹爪 `get_model()` 显示 EL05 或 `COMPILE-TIME DEFAULT`"
    **原因**:夹爪没有记录 RS00 型号,按 EL05 的量程换算每一帧命令。实际输出的力矩是命令值的约 **2.3 倍**
    (命令 1.1 N·m,实际约 2.57 N·m),而反馈读数只有实际值的约 0.43 倍,所以软件里看起来一切正常,
    电脑上的力矩检查也不会触发。**夹软的、易碎的东西会被夹坏。**
    **解决**:停止使用,按 [RS00 从夹爪的额外步骤](follower-firmware.md#rs00) 记录型号、调整启动上限、重写包络。

??? failure "RS00 从夹爪已记录型号,但夹持力很小"
    **原因**:运动安全包络还是按 EL05 写的,把力矩限在 EL05 的数值上。
    **解决**:按 [写入运动安全包络](follower-setup.md#envelope) 重新写一次,SDK 会按 RS00 的数值改写。

## 启动控制器时报错 {#start-errors}

??? failure "`start()` 报 `ValueError: ... exceeds the <型号>'s continuous stall rating ...` 或 `... exceeds the <型号>'s rated torque ...`"
    **原因**:配置里的力矩超过了这台电机的额定值,多半是没用 `for_spec()`,或手动把 `grasp_torque_nm` 设得太大。
    **解决**:配置一律从 `t.ForcePositionConfig.for_spec(g.motor.get_spec())`(位置跟随用 `ImpedanceConfig.for_spec`)生成;
    夹持力不能超过持续堵转额定(EL05 1.1 N·m,RS00 3.6 N·m)。

??? failure "`start()` 报 `RuntimeError: ... stored motor startup torque limit is <x> Nm, but motion_torque_limit_nm is <y> Nm ...`"
    **原因**:配置和电机里存的启动力矩上限不是同一个型号的。典型情况是 RS00 从夹爪用了裸配置(EL05 的 6.0),而电机存的是 14。
    **解决**:用 `for_spec()` 生成配置。如果 RS00 电机里存的反而是 6.0,按 [RS00 从夹爪的额外步骤](follower-firmware.md#rs00) 改成 14.0。

??? failure "使能报 `NACK: SysBusy`,或刚上电时命令没反应"
    **原因**:上电后约 10 秒内固件在做自动标定,这段时间拒绝控制命令。
    **解决**:等爪子自己开合一次停下来,再启动控制器。

??? failure "`<控制器>::set_target called before start`"
    **原因**:没有调用 `start()`,或已经 `stop()` 过了。
    **解决**:先 `start()`;控制器停止后要重新 `start()` 并 `enable()`。

??? failure "`target position must be in [0,1]`"
    **原因**:力位控制的目标开度超出范围,不会自动截断。
    **解决**:把目标限制在 0(闭合)到 1(张开)之间。

## 运动中出问题 {#fault}

??? failure "控制器进入 `FAULT`"
    **原因**:看 `snapshot().fault_reason`,含义见 [故障与恢复](follower-control.md#fault)。
    **解决**:排除原因后 `g.motor.clear_fault()`,再 `c.reset()`。电机故障位非零时,对照下面的状态位表。

??? failure "夹紧硬物后夹爪突然松手,程序报 `SerialBus::write: Input/output error`,USB 断开"
    **原因**:力矩需求过大,把 24V 电源拉垮,电机欠压保护动作,USB 随之断开。几乎都是运动安全包络没有生效。
    **解决**:断电重启,按 [写入运动安全包络](follower-setup.md#envelope) 检查并写入;确认 24V 电源适配器符合规格。

??? failure "长时间夹持后夹持力变小"
    **原因**:电机发热,固件按温度降低输出。这是保护行为,不是故障。
    **解决**:降低夹持力或缩短夹持时间,见 [力位控制:夹持](follower-control.md#force-position)。

??? failure "控制时偶尔丢帧、读数跳变"
    **原因**:控制期间调用了 `g.motor.read_status()`,或同时运行了两个控制器 / 直接下发了 `submit_*` 命令。
    **解决**:控制期间只读 `snapshot()`;一只夹爪只用一个控制器。

## 电机状态位 {#status-bits}

`snapshot().observation.status` 与 `read_status().status` 是一个整数,按位含义:

| 位 | 名称 | 含义 |
|---|---|---|
| `0x0001` | Enabled | 已使能(正常运行时置位) |
| `0x0002` | Fault | 有故障 |
| `0x0004` | Stalled | 堵转;夹住物体时出现是正常的 |
| `0x0008` | OverTemp | 过温 |
| `0x0010` | OverCurrent | 过流 |
| `0x0020` | OverVolt | 过压 |
| `0x0040` | UnderVolt | 欠压,多为 24V 供电不足或被拉垮 |
| `0x0080` | EncoderError | 编码器错误 |
| `0x0100` | DriverFault | 驱动故障 |
| `0x0200` | PositionInitError | 位置初始化错误 |
| `0x0400` | HardwareIdError | 硬件识别错误 |
| `0x0800` | EncoderUncalibrated | 编码器未标定 |

更完整的故障信息:

```python
print(g.motor.fault_report())
```

自检里 `[故障]` 一行的**锁存**位要显式清除(`g.motor.clear_fault()`)才会消失;当前为 0 不代表从没出过故障。
`Stalled`(`0x0004`)在每次正常夹持时都会出现,控制器不把它当故障。
除 Enabled 和 Stalled 以外的位反复出现,或清除后立即复现,记下 `fault_report()` 的输出联系[技术支持](versions.md#support)。
