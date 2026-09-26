# 固件与电机升级

从夹爪有两份固件,分开升级:

| | 夹爪固件 | 电机固件 |
|---|---|---|
| 是什么 | 夹爪主控板(MCU)的程序 | 夹爪里 RobStride 电机自己的程序 |
| 镜像从哪来 | 随 SDK 附带,在源码的 `firmware/` 目录 | 由技术支持提供 |
| 工具 | `ota_update.py` | `motor_ota_update.py` |
| 什么时候需要 | SDK 要求的最低版本以下,或技术支持要求 | 仅在技术支持要求时 |

两份都要升级时,**先刷夹爪固件,再刷电机固件**:刷夹爪固件会把电机切回常规控制模式,电机固件要在另一种模式下刷。

## 查看版本 {#check-version}

```bash
python python/examples/follower_status.py left
```

第二行 `[fw] FirmwareVersion(1.2.9.0)` 就是夹爪固件版本。这个值由固件本身报告,刷写后读到新版本号就说明刷成功了。

| 夹爪固件版本 | SDK 0.3.2 下 |
|---|---|
| 1.2.9 | 随 SDK 附带的版本,推荐 |
| 1.2.5 – 1.2.8 | 可以使用;建议升级到 1.2.9 |
| 低于 1.2.5 | `FollowerGripper` **拒绝打开**,报错里给出升级命令,必须先升级 |

## 升级夹爪固件 {#mcu-ota}

!!! danger "刷错角色的固件会让夹爪变砖"
    从夹爪只能刷 `slave` 镜像,主夹爪只能刷 `master` 镜像。刷错后主控板无法启动,只能返厂用专用烧录器恢复。
    角色看序列号**最后一个字母**(`s` = 从夹爪),与装在左手还是右手无关。

```bash
# 1. 确认要刷的是从夹爪:序列号以 s 结尾
python -c "from xense.taccap import scan_grippers
for g in scan_grippers(): print(g.side, g.role, g.firmware_sn)"

# 2. 刷写。slave 选镜像,left 选设备;脚本会先让你确认
python python/examples/ota_update.py slave left

# 3. 断电重启:USB 线和 24V 电源线同时拔掉,再插回(见下)

# 4. 确认版本
python python/examples/follower_status.py left
```

- 传输约 1 秒,之后主控板重启,1–3 秒后重新出现在 USB 上。
- 脚本按镜像内容识别它是哪个角色的;与目标夹爪的角色不符时,打印 `[ROLE MISMATCH]` 并拒绝刷写。
  **不要加 `--force` 绕过它。**
- 这项检查只对随 SDK 附带的镜像有效。技术支持单独提供的镜像不在 SDK 的镜像清单里,脚本只提示
  `image not in manifest, cannot verify` 就照常刷写——**刷之前自己核对镜像名里的角色与夹爪序列号末位一致**。
- 新固件先写到备用分区,校验通过才切换。传输中断或校验失败时,夹爪继续运行原来的固件,重新刷一次即可。
- 一次刷所有连着的夹爪:`python python/examples/ota_update.py --all`,每只按自己的角色选镜像。

### 刷完必须断电重启 {#power-cycle}

刷写后主控板只是软重启,USB 转串口芯片没有断电。这时设备看起来一切正常——版本号对、数据流在跑——
但会悄悄丢状态帧(实测每 60 秒丢 35–39 帧);断电重启后为 0。

**断电重启的做法:USB 线和 24V 电源线同时拔掉,两根都拔出后再插回。** 两路分别给主控板和电机供电,
只拔一根,或者拔一根插回再拔另一根,板子都没有真正断电。断电重启之前测到的任何数据都不可信。

## 升级电机固件 {#motor-ota}

只在技术支持要求时进行。电机不用拆下来,经从夹爪的 USB-C 就能刷。

前提:

- 夹爪固件 **1.2.8 或以上**。
- 镜像是技术支持提供的 **EL05** 电机固件,文件名形如 `el05-1.0.5.0.4.bin`。脚本从文件名认不出 5 段的版本号,
  所以刷写时要加 `--model EL05` 指定型号。
- 电机本身**不校验型号**,脚本会核对镜像型号与夹爪记录的电机型号一致,不一致就拒绝。
  脚本提示 `compile-time default ... confirm the nameplate` 是正常的,确认电机铭牌是 EL05 即可。
- 电机处于**私有协议**模式。电机平时运行在常规控制模式下,不响应升级命令,需要先切换:

```python
import xense.taccap as t
g = t.FollowerGripper(t.find_follower().mcu_device)
g.motor.switch_protocol(t.MotorProtocol.Private)
```

切换后把 USB 线和 24V 电源线同时拔掉,再插回,然后刷写:

```bash
python python/examples/motor_ota_update.py el05-1.0.5.0.4.bin left --model EL05
```

- 这个脚本必须指定目标设备(`left`、`right` 或序列号),不能省略。
- 刷完后电机通常自动回到常规控制模式,所以当场读不到电机版本。**断电重启一次,上电自动标定能正常走完,就说明电机工作正常。**
- 如果脚本提示电机仍在私有协议,或断电重启后爪子不做自动标定,手动切回常规模式,再断电重启:

    ```python
    g.motor.switch_protocol(t.MotorProtocol.Mit)
    ```

    电机停在私有协议时从夹爪无法控制。
- 电机没有应答时脚本报 `no reply after N attempts`。按电机厂商的建议,给夹爪断电(USB 和 24V 同时拔)后重新执行,升级会从头开始。

EL05 电机的固件需要 **1.0.5.0.4 或以上**:实测更早的版本速度反馈不随运动变化,控制质量明显变差。
SDK 不会自动检查电机固件版本,怀疑有问题时联系技术支持。
