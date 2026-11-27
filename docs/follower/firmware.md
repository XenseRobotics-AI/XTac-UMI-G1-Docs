# 固件与电机升级

从夹爪有两份固件：**夹爪固件**（随 SDK 附带）和**电机固件**（由技术支持提供，只在技术支持要求时升级）。两份都要升级时，先刷夹爪固件，再刷电机固件。

## 查看版本 {#check-version}

[自检](setup.md#self-check)输出的 `[fw]` 一行是夹爪固件版本；电机固件见[电机固件版本](#motor-version)。

| 夹爪固件版本 | 说明 |
|---|---|
| 1.3.1 | 随 SDK 0.5.0 附带，使用命令集 V2.11。640×480 与 1920×1080 分别存储鱼眼标定。<br>新版支持 IMU 校准及磁力计数据采集，并优化初始化和回零。 |
| 1.2.17 | 随 SDK 0.4.5 / 0.4.6 附带，可以使用；设备时间戳为 1 MHz 时基，主机须为 SDK 0.4.5 及以上 |
| 1.2.16 | 随 SDK 0.4.3 / 0.4.4 附带，可以使用 |
| 1.2.11 – 1.2.15 | 可以使用，建议升级 |
| 1.2.5 – 1.2.10 | 能打开，但 SDK 会提示升级：控制串口偶发溢出后，夹爪会收不到命令、夹持力下降，**必须升级** |
| 低于 1.2.5 | SDK 拒绝打开，必须先升级 |

## 升级夹爪固件 {#mcu-ota}

!!! danger "刷错固件会让夹爪无法启动"
    从夹爪只能刷 `slave` 固件，主夹爪只能刷 `master` 固件，刷错后只能返厂修复。
    **刷之前确认序列号最后一个字母是 `s`。**

```bash
# 1. 确认序列号以 s 结尾
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"

# 2. 刷写,按提示确认(只接着一只从夹爪时)
python python/examples/ota_update.py slave

# 3. 断电重启(见下)

# 4. 自检,确认版本
python python/examples/follower_status.py left
```

- 接着多只从夹爪、只刷其中一只时，在角色后加左右：`python python/examples/ota_update.py slave left`（SDK 0.5.0 起）。
- 刷写约 1 秒，之后夹爪自动重启。升级至 1.3.1 会保留电机参数、CAN ID、电机型号、夹爪配置和原有 640×480 标定。旧设备的 1920×1080 标定槽为空，使用前请完成对应标定。
- 脚本发现固件与夹爪角色不符时会拒绝刷写，**不要加 `--force` 强制**。
- 刷写中断不会损坏夹爪，原固件继续运行，重新刷一次即可。

### 刷完必须断电重启 {#power-cycle}

**拔下 24V 电源线，等约 2 秒再插回，USB 线不用拔。** 主控板和电机都由 24V 供电，只拔 USB 线不会重启。
不断电重启的话，夹爪看起来正常，但会悄悄丢数据。

## 升级电机固件 {#motor-ota}

需要夹爪固件 1.2.8 或以上，电机不用拆下来。

1. 把电机切换到升级模式：

    ```bash
    python -c "import xense.taccap as t
    g = t.FollowerGripper(t.find_follower().mcu_device)
    g.motor.switch_protocol(t.MotorProtocol.Private)"
    ```

2. 断电重启（拔插 24V）。
3. 刷写技术支持提供的固件文件：

    ```bash
    python python/examples/motor_ota_update.py el05-1.0.5.0.4.bin left --model EL05
    ```

    按提示输入 `yes` 开始刷写；提示 `confirm the nameplate` 时，确认电机铭牌是 EL05 即可。

4. 断电重启。夹爪上电后能正常自己开合一次，说明升级成功。
   夹爪固件 1.2.14 及以上时，脚本刷完会把新的电机固件版本记进夹爪，之后随时可以[查看](#motor-version)。

- 若脚本提示电机仍在升级模式，或断电重启后夹爪不自己开合，运行下列命令切回，再断电重启；
  否则从夹爪无法控制：

    ```bash
    python -c "import xense.taccap as t
    g = t.FollowerGripper(t.find_follower().mcu_device)
    g.motor.switch_protocol(t.MotorProtocol.Mit)"
    ```

- 脚本报 `no reply` 时，断电重启后重新刷写。

## 电机固件版本 {#motor-version}

SDK 0.5.0 随包提供 EL05 电机固件 **1.0.5.0.4**。EL05 要求 1.0.5.0.4 或以上，低版本可能导致速度反馈异常或运动抖动。按[技术支持](../common/reference.md#support)指引获取所需文件并升级。

查看版本（不要在控制运行时执行，读取可能让电机停下；需要夹爪固件 1.2.14 及以上）：

```bash
python -c "import xense.taccap as t
g = t.FollowerGripper(t.find_follower().mcu_device)
print(g.motor.motor_version())"
```

输出 `MotorVersion(1.0.5.0.4, flash: ...)` 即为版本号；带 `flash` 字样表示读的是夹爪里保存的记录。显示 `invalid` 表示这台夹爪里还没有记录，请联系技术支持。
