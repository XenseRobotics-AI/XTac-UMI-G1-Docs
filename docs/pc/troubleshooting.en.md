# Troubleshooting

This page is organised by symptom; each entry gives the cause and the fix. Most problems come down to serial permissions and ModemManager grabbing the port, so read "Serial permissions and device discovery" below first. Before touching anything, run the self-check in [Quickstart](index.md), then match against the symptoms.

## Environment and installation

??? failure "`setup_env.sh --install` stops immediately with `needs system packages that are not installed`"
    **Cause:** the hardware SDKs are compiled on the spot, and some of `build-essential` / `cmake` / `pkg-config` / `git` / `curl` are missing; the script stops deliberately before it starts.

    **Fix:** install what the line it prints tells you to; the full list is in [System packages](install.md#apt). Two further checks only warn and do not block, but do not skip them either: `libusb-0.1.so.4` (provided by `libusb-dev`) is a runtime dependency of the cameras, so if it is missing nothing fails until `connect()`; check it first when a camera will not connect. `v4l-utils` provides `v4l2-ctl`, which you use to troubleshoot cameras.

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` fails"
    **Cause:** the environment is incomplete, or the `xense-taccap` environment is not active.

    **Fix:** run `mamba activate xense-taccap`, then re-run `./setup_env.sh --install`. To verify them one by one, see [Verifying the install](install.md#25).

??? failure "`torchcodec` fails to load / video encoding errors"
    **Cause:** `torchcodec` does not match the current PyTorch version, or PyAV is not the required `15.1.0`.

    **Fix:** re-run `setup_env.sh --install`, which corrects the versions automatically. Install a system FFmpeg with `libsvtav1` separately only if you need one.

## Docker image {#docker}

Only relevant on the [Docker image](install.md#docker) path. For a busy serial port inside the container, see `Device or resource busy` below.

??? failure "`could not select device driver ... gpu` / no GPU visible inside the container"
    **Cause:** the NVIDIA Container Toolkit is not installed properly, or the Docker daemon was not restarted after installing it.

    **Fix:** `install_customer.sh` installs it for you. To check by hand, run `docker run --rm --gpus all ubuntu:22.04 nvidia-smi`; if it shows no GPU, reinstall the Toolkit and `sudo systemctl restart docker`. The host driver must be ≥ 570.144.

??? failure "`Unknown runtime specified nvidia`, `docker compose` will not start"
    **Cause:** the NVIDIA runtime is not registered with Docker; `compose.yaml` uses `runtime: nvidia` to get graphics capability (see [Graphics from inside the container](install.md#docker-gui)).

    **Fix:**

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # nvidia must appear in the output
    ```

??? failure "Rerun will not start in the container: `Failed to create surface for any enabled backend` / Vulkan adapter errors, but `nvidia-smi` is fine"
    **Cause:** X11 was not authorised; or the container got CUDA but not NVIDIA's Vulkan ICD, typically because `runtime: nvidia` in `compose.yaml` was changed back to `gpus: all`, which requests compute + utility only. In that case `vulkaninfo` reports `INCOMPATIBLE_DRIVER` or lists no NVIDIA device.

    **Fix:** on the host, as the graphical desktop user, run `xhost +si:localuser:root` and check that `echo "$DISPLAY"` is non-empty and `/tmp/.X11-unix` exists. If `docker info --format '{{json .Runtimes}}'` does not list nvidia, register the runtime as in the previous entry; if it does, change `compose.yaml` back to `runtime: nvidia`. Then confirm that `vulkaninfo --summary` inside the container recognises the GPU.

??? failure "`pull access denied ... 'docker login'`, or you changed `LEROBOT_IMAGE_TAG` and still get the old image"
    **Cause:** the image is public and needs no login. Either the image name resolved wrongly, or `.env` was not pulled again after the change, or it is not in the directory you run `docker compose` from.

    **Fix:** run `docker compose config --images` to see the resolved image name, check `LEROBOT_IMAGE` in `.env` for a typo (the default is `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`, and normally `.env` needs only the tag line), then `docker compose pull`. See [Pin the image version](install.md#docker-pin).

??? failure "Entering the container prints `groups: cannot find name for group ID <n>`"
    Harmless. The NVIDIA runtime injected the host's `render` group GID and the container has no group by that name. It affects neither the GPU, nor the cameras, nor collection.

??? failure "Images `0.0.5` and earlier: `mamba activate` says `Shell not initialized`; recording dies as it starts with `FileNotFoundError: 'spd-say'`; every exported `.mp4` reports `Permission denied` while the metadata copies fine"
    **Cause:** three known problems of the old images, fixed from `0.0.6` on. The environment is already active when you enter the container, so there is nothing to activate; the image has no `spd-say` for the voice announcements while `--play_sounds` defaults to `true`, so the announcement raises and the process dies with `terminate called without an active exception`; recorded videos are `-rw------- root` while the metadata is `0644`, so a non-root copy fails on the videos only, and the files themselves are fine.

    **Fix:** upgrade the image (see [Pin the image version](install.md#docker-pin)). If you are still pinned to an old image: to switch environments by hand, run `eval "$(mamba shell hook --shell bash)"` first; add `--play_sounds=false` when recording, collection is unaffected (the container deliberately has no speech synthesiser, with one installed `spd-say` would hang forever; to hear the announcements, record on the host); videos recorded by an old image keep their permissions after upgrading, so copy them as root and `chown` afterwards as in [Where the data lives](install.md#docker-data), and do not use `--user`.

??? failure "The host sees the tactile sensors, the container does not"
    **Cause:** the container was not started through Compose (`/dev` and `/run/udev` were not passed through), or the device nodes have not settled after a USB re-enumeration.

    **Fix:** enter with `docker compose run --rm xense-taccap` and confirm the nodes exist with `ls /dev/v4l/by-id/*GSPS*`. If that is empty, go back to the host, re-plug the USB hub and run `sudo udevadm settle --timeout=20`.

??? failure "After a container restart the sensors are re-read and startup is slow"
    **Cause:** the `xensesdk-cache` volume was deleted. It caches each sensor's configuration by serial number, which avoids re-reading the flash, and the USB re-enumeration that triggers, on every start.

    **Fix:** leave it alone. What each volume holds is in [Where the data lives](install.md#docker-data).

## Hardware and indicator lights {#hardware}

First note down the device number, how it is connected, the indicator light state, the software error and a photo of the setup. At present only **steady white = normal operation** is a confirmed light pattern; the other states are still in development and testing, and the final release is authoritative. Take anti-static precautions when powering on and off.

!!! danger "Odd smell, smoke, noticeable heat, structural damage or a frayed cable"
    Cut the power immediately and stop using the device.

??? failure "The leader gripper's indicator light does not come on"
    **Cause:** the cable is not seated, the power supply is insufficient, or the port is damaged. The leader gripper must be powered only through the supplied Type-C cable (DC 5V/500mA); do not connect a 9V/12V fast-charge adapter.

    **Fix:** re-plug and tighten the locking screws, and try a different port on the host end. If it still does not light up, stop using it and contact support.

??? failure "Red light flashing / the device restarts unexpectedly"
    **Cause:** a device fault or a communication error.

    **Fix:** stop recording and power-cycle the device. If it keeps happening, contact technical support with the light state and the logs.

??? failure "The software does not detect the leader gripper / `lsusb` shows the wrong count"
    **Cause:** a USB problem, a faulty cable, or the software was not refreshed.

    **Fix:** `lsusb` should list all the UVC devices: 6 on a bimanual rig (4 `Xense Robotics ... GSPS01…` tactile + 2 `Sunplus ... XCA…` wrist cameras), 3 on a single arm. The last digit of the serial number is odd for left, even for right, see [Serial numbers and left/right](../common/gripper.md#sn). If the count is wrong, check the cable locking and the left/right wiring, restart the collection software, and try another Type-C port or cable. If they are listed but will not open, see the next section.

??? failure "Black image / no image"
    **Cause:** the UVC device is not recognised, the sensor connection is faulty, or the wrong channel is selected.

    **Fix:** confirm with `lsusb` that the device is recognised, restart the collection software, and power-cycle the device.

??? failure "Spots on the image / blurry image"
    **Cause:** dirt, foreign matter or damage on the sensor surface.

    **Fix:** clean with a lint-free cloth, see [Maintenance](../common/maintenance.md). A scratched or dented sensor must be replaced.

??? failure "The follower gripper does not power on / communication errors"
    **Cause:** the follower gripper takes power from the 24V adapter and communicates over Type-C. No power means the 24V is not connected or the adapter is faulty; communication errors mean the Type-C is not connected or not recognised, or the cable is being pulled by the robot's motion.

    **Fix:** check the 24V adapter, the outlet, the power connector and its rating; connect the 24V first, then the Type-C, and lock it (see [Power-on sequence](index.md#power-on)). Reconnect the Type-C and tighten the locking screws, route the cable away from the joints and the gripper's range of motion, and test at low speed before the first run.

??? failure "The blue light stays on too long during an OTA upgrade"
    **Cause:** the upgrade has not finished, or the procedure went wrong.

    **Fix:** do not cut the power during the upgrade. If nothing changes for a long time, follow [Firmware OTA upgrade](versions.md#ota) and contact support.

## Serial permissions and device discovery

??? failure "`connect()` reports `No leader gripper discovered for the <side> side.`"
    **Cause (most common):** the user is not in the `dialout` group, so the SDK can list the grippers but cannot open the serial port to read the firmware SN, leaving `role=Unknown` / an empty `firmware_sn`. Underneath it is `IoError: SerialBus: open(...): Permission denied`.

    **Fix:** `sudo usermod -aG dialout "$USER"`, then you must log out and back in (or `newgrp dialout`) and re-plug the gripper. Without a fresh login the error stays the same. Details in [Serial permissions](host-setup.md#31).

??? failure "`Device or resource busy` (starting immediately after a hot-plug; `/dev/ttyACM*` reporting busy inside the container is the same thing)"
    **Cause:** ModemManager probes the CH343 serial port with AT commands on every hot-plug and holds it for a few seconds. The classic shape: unplug, move to another port, restart immediately, and get busy. `brltty`, if installed, grabs it the same way. The container is no different, and the rule has to be installed on the host.

    **Fix:** temporarily, wait about 3 s after plugging in. Permanently, add a udev rule that makes ModemManager ignore `1a86` devices (`install_customer.sh` on the Docker path has already installed it once). The rule and the verification commands are in [Stopping ModemManager from grabbing the port](host-setup.md#32); re-plug the gripper after installing it.

??? failure "`firmware_sn` is still empty after fixing permissions / `role=Unknown`"
    **Cause:** the SN was not burned in, the serial read is still failing, firmware communication is faulty, or there is a device-side configuration problem. An empty SN alone is not enough to infer the firmware version.

    **Fix:** save the complete low-level error, retest with a different cable and port; if it is still empty, contact the device or firmware team to check the SN programming and the communication state.

??? failure "The error names a specific hub / serial number"
    **Cause:** the assembly does not match the "odd is left, even is right" rule: a non-conforming serial number, the wrong count on a side, both fingertip tactile sensors mapping to the same side, or a tactile hub with no matching gripper.

    **Fix:** work through the assembly and cabling of the physical device or hub the error names. The rules are in [Device discovery](host-setup.md#33).

??? failure "The wrist camera / visuotactile sensor will not open, `video ... busy`"
    **Cause:** the camera is held by an external camera service, or the user is not in the `video` group.

    **Fix:** check the camera service; `sudo usermod -aG video "$USER"`, effective after logging back in. If a different camera fails each time, see USB bandwidth below.

### Not enough USB bandwidth {#usb-bandwidth}

!!! warning "On a bimanual rig, measure this on day one, do not wait for a camera to fail"
    This is the most common failure on a bimanual rig in the field, and it is decided the moment you plug the cables in, by which physical ports the two grippers go into. How to work out the bandwidth budget and how to read `lsusb -t` are in [USB bandwidth budget](host-setup.md#usb-budget); this section only covers diagnosis and what to do.

??? failure "One camera will not open (`Cannot open camera N`), and it is a different one each time"
    **Cause:** not enough USB bandwidth; nothing is broken. Every UVC camera exclusively reserves a share of isochronous bandwidth when it opens, and once the bus budget (about 384 Mbit/s) is exceeded, whichever camera opened last fails. Which one that is differs every time, which is why the fault appears to wander. Using a blue USB 3 port does not help: the tactile sensors and wrist cameras still land on the same controller's USB 2.0 bus.

    **First confirm it is bandwidth:** with `lsusb -t`, count how many cameras hang off each `480M` bus; six on one bus on a bimanual rig is very likely over. Watch the kernel log in another terminal while starting up:

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    `--line-buffered` is not optional; without it `grep` keeps buffering and looks like it has hung. If `Not enough bandwidth for altsetting N` is printed the moment a camera fails to open, that is the diagnosis. You can also run the two halves separately:

    ```bash
    # tactile only (wrist cameras off)
    lerobot-teleoperate --robot.type=bi_taccap_gripper --robot.id=0 \
        --robot.left_enable_wrist_camera=false --robot.right_enable_wrist_camera=false \
        --robot.enable_tracker=false --fps=30 --display_data=true

    # wrist cameras only (tactile off)
    lerobot-teleoperate --robot.type=bi_taccap_gripper --robot.id=0 \
        --robot.enable_tactile=false \
        --robot.enable_tracker=false --fps=30 --display_data=true
    ```

    If each half works and the combination fails, it is bandwidth. `enable_tactile=false` is only for this diagnostic; never record data with it.

    **Fix:** first confirm the wrist cameras were not switched from the default `MJPG` to `YUYV` (`--robot.wrist_camera_fourcc`); `MJPG` is the default precisely to save bandwidth. If it is still over budget, the only fix is to add a USB host controller, not a hub (a Thunderbolt / USB4 dock brings its own xHCI controller, an ordinary hub does not). After moving one gripper onto it, `lsusb -t` should show one more `480M` root_hub line. Until the second controller is in place you can record with the wrist cameras off; the dataset will then have no `{side}_wrist` key. Decide this before you start recording, not half with and half without.

??? question "How far over budget is it, exactly?"
    Measure on the machine in front of you. Measured on one bimanual host with a single `480M` bus:

    | Cameras enabled | Reserved | Result |
    |---|---|---|
    | Four tactile only (`_enable_wrist_camera=false` on both sides) | 242 Mbit/s | works |
    | Two wrist cameras only (`--robot.enable_tactile=false`) | within budget | works |
    | All six (default) | 6 × 60.4 = 362 Mbit/s | fails |

    `altsetting 6` is 944 bytes per microframe, i.e. 60.4 Mbit/s per tactile sensor, while 320x240 YUYV@30 is only about 37 Mbit/s of actual data; the wrist cameras request more still. 362 against about 384 is right on the edge. To read the numbers yourself:

    ```bash
    # I:* is the active altsetting; the class name is lower-case (video) in this file
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    Each video interface's `Alt=` and the `MxPS=` on its `E:` line give the reservation (`MxPS × 8000 × 8` bit/s); sum per bus and compare against about 384 Mbit/s. How much a device requests is set by the firmware's UVC descriptors, and the collection program cannot change it.

??? question "Does another USB port, a lower `tactile_fps`, or `uvcvideo quirks=128` help?"
    None of them. Moving to a different physical USB port: every port on the same controller shares one USB 2.0 bus, so to change anything you have to move to a different controller. Lowering `--robot.tactile_fps`: it only throttles the Python-side read, the sensor SDK takes no fps argument, and the stream on the USB bus is unchanged. `uvcvideo quirks=128` (`UVC_QUIRK_FIX_BANDWIDTH`): measured to have no effect; it recomputes the reservation as `width × height × bpp`, which gives it nothing to work with on the MJPEG wrist cameras, the biggest consumers.

## Pico4 tracker and pose

??? failure "No pose / the tracker will not connect / the pose is unstable"
    **Cause:** the computer's WiFi conflicting with the Pico4 Ultra Enterprise wired network sharing (most common); or XenseVR PC Service or XTac-UMI XR not started, or the tracker unpaired or out of charge.

    **Fix:** turn the data-collection host's WiFi off first and leave only the wired network sharing (see [Network connection](../common/pico4.md#pico-network)); then walk through the [Power-on sequence](index.md#power-on) item by item; start the service with `/opt/apps/roboticsservice/runService.sh`; if needed, self-check with `python -m lerobot.robots.taccap_gripper.check_tracker`.

??? failure "The pose reference frame drifts between episodes"
    **Cause:** XTac-UMI XR was restarted between episodes, which reset the world origin.

    **Fix:** do not restart XTac-UMI XR between episodes. If it was restarted, treat the data recorded afterwards as a new dataset. See [Frame alignment](../common/pico4.md#pico-frame).

??? failure "The pose cuts out between episodes / the headset blanks its screen by itself"
    **Cause:** screen blanking and system sleep were not disabled on the headset, so after suspending, XTac-UMI XR was paused or killed; restarting it then causes the drift described in the previous entry.

    **Fix:** Enterprise settings → System settings → Power policy. Set "System sleep" to "Never" first, then set "Screen off" to "Never" (in the other order, blanking gets clamped back to a finite value by the sleep timeout). See [System settings](../common/pico4.md#pico-system).

??? failure "The tracker is not selectable in tracking mode / PC Service does not discover that SN / the pairing screen cannot find the tracker"
    **Cause:** the tracker is not bound to this headset (a new unit, a swapped tracker or headset, or a factory reset); if pairing cannot find it, the tracker is not in Bluetooth pairing mode (steady blue light).

    **Fix:** open the "Motion Tracker" app and complete the binding, for both trackers. Before pairing, hold the power button for about 6 seconds until the indicator alternates blue and red, then tap "Start pairing". See [Binding the trackers](../common/pico4.md#pico-tracker-bind).

??? failure "XTac-UMI XR keeps showing \"not connected\""
    **Cause:** usually not the app at all; the wired network sharing is not connected properly, or the data-collection host's WiFi is still on.

    **Fix:** tap "Reconnect" first. If that does not help, redo the [Network connection](../common/pico4.md#pico-network) and confirm the computer's WiFi is off. The screen is shown in [The app's interface](../common/pico4.md#pico-toolkit-ui).

??? failure "The headset says \"connected\" but the PC receives no pose at all"
    **Cause:** "connected" only means the app reached the service; the host-side service is not running, or the tracker is off or unbound.

    **Fix:** confirm the host has started [XenseVR PC Service](host-setup.md#35); then use `ConsoleDemo` in `/opt/apps/roboticsservice/` or `python -m lerobot.robots.taccap_gripper.check_tracker` to see whether a pose with an `sn` comes through. If not, go back to [binding](../common/pico4.md#pico-tracker-bind) and confirm both trackers are powered on and show "connected".

??? failure "The tracker is matched to the wrong side / PC Service enumeration is unstable"
    **Cause:** a non-conforming serial number, or jitter in enumeration.

    **Fix:** pin it literally with `--robot.tracker_serial=<SN>` (no enumeration, no validation); or check the digit before the trailing letter `G` in the serial number, odd is left, even is right, see [Tracker serial numbers](../common/pico4.md#pico-tracker-sn).

## Head camera {#head-camera}

??? failure "With `--robot.enable_head_camera=true` it hangs waiting for the first frame"
    **Cause:** the frames are relayed by PC Service, and any broken link in that chain means no frames: a service older than v0.2.0 (v0.1.0 does not relay head camera frames), or the headset app is not streaming.

    **Fix:** check in this order:

    ```bash
    # 1) the service deb version: needs ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) does it expose the camera interface
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

    Then confirm the headset is connected to PC Service and the app is streaming (the camera and the tracker share one connection). Prerequisites are in [Head camera](recording.md#56).

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **Cause:** an older interface is being loaded (the camera interface arrived with v0.2.0). This module links the C SDK taken from the installed `.deb`, so start by checking which version is installed: `dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'`.

    **Fix:** pull the latest main repo and re-run `./setup_env.sh --install`, which upgrades the `.deb` to the baseline version as well. If it is still `False`, use `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"` to see which copy is being loaded. If `Status` is not `install ok installed` (for example it was removed with `dpkg -r`, leaving `deinstall ok config-files`), reinstall the same way.

??? failure "Repeated left/right eye skew warnings in the log"
    **Cause:** the two eyes arrive as two independent messages, and their timestamps differ by more than `--robot.head_camera_pair_max_skew_ms` (20 ms by default). Usually a heavily loaded host, or jitter on the link between the headset and the PC.

    **Fix:** the warning does not interrupt recording, but for those frames the two eyes may not be in sync. Reduce host load first (fewer cameras, or `--robot.head_camera_eyes=left` to record one eye only); for link problems work through [Network connection](../common/pico4.md#pico-network); only once you are sure it is just jitter, relax the threshold moderately.

??? failure "`head_camera_width/_height` reports an unsupported size, or the size is valid but connect still reports a first-frame size mismatch"
    **Cause:** the head camera only accepts the three sizes that map one-to-one to the three "Resolution" settings in the headset app; anything else is an error. If the size is valid but still mismatches, the command line and the headset's "Resolution" do not agree; most often the headset was raised to `1024` or `1280` while the command line is still on the default.

    **Fix:** use the same value on both sides; if the headset stays at the default `640`, pass nothing. The mapping table is in [Head camera](recording.md#56). Changing the size means a different set of data: episodes from before and after the change cannot be mixed. The headset-side setting is in [The app's interface](../common/pico4.md#pico-toolkit-ui).

## Collecting and recording

??? failure "The command exits the moment you run it: `--robot.id is required`"
    **Cause:** `--robot.id` is the required station number, and it is checked while parsing the command line.

    **Fix:** add the station number; a bare number is enough (`0` / `1`…, one per rig, and a bimanual rig counts as one; the prefix is filled in from `--robot.type`, giving `taccap_0` / `bi_taccap_0`), for example `lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...`. It names the station, not the hardware, so swapping a gripper does not change it; the devices' identity is recorded in the dataset's `meta/hardware.json`, see [`--robot.id` and the hardware manifest](recording.md#robot-id).

??? failure "Resuming warns that the dataset's existing `meta/hardware.json` does not match the current hardware"
    **Cause:** the gripper or tactile sensors were swapped when resuming with `--resume`; the program keeps the original file and warns.

    **Fix:** the warning does not stop recording. If the hardware change was intentional, carry on; the warning is the record that this dataset spans two sets of hardware. If it was not intentional (a gripper plugged into the wrong place, say), stop and put the original device back.

??? failure "`[slow_frame]` appears constantly in the log after enabling `--display_data=true`"
    **Cause:** the Rerun display is eating the frame budget. Measured on a bimanual rig with the headset (four tactile streams, two wrist cameras, two eyes): 13.2 ms per frame with JPEG compression, 3.1 ms without, while the whole budget at 30 fps is 33.3 ms. Look at `top_obs=` at the end of the `[slow_frame]` line first to tell a slow sensor from an expensive display; the two have opposite fixes.

    **Fix:** confirm the two defaults `--display_compressed_images=false` and `--display_image_every_n=1` have not been changed. If it still overruns, raise `--display_image_every_n`: camera images refresh less often while scalars like `tcp.*` and `gripper.pos` stay at full rate. This is the last resort.

??? failure "Recording stops partway through with `Device lost mid-recording`"
    **Cause:** a camera or the gripper encoder dropped off: a loose cable, locking screws not tightened, strain on the cable, a hub losing power, unstable power or a bad USB port. Collection stops on purpose, and what was recorded so far is saved.

    **Fix:** the last second or two of that episode is repeated stale values, so discard it. Check the locking screws, the cable routing and the USB port (if it keeps happening and changing ports does not help, see [Not enough USB bandwidth](#usb-bandwidth)), then continue into the same dataset with `--resume`, see [Recording](recording.md#52).

??? failure "On a machine with no discrete GPU, recording fails at the start saying the encoder will not open"
    **Cause:** the machine has no NVIDIA driver but is using a GPU hardware encoder.

    **Fix:** switch to a CPU encoder and turn streaming encoding off: `lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false`. The reasoning is in [Recording on a host with no NVIDIA GPU](recording.md#no-gpu).

??? failure "The encoder cannot keep up and dropped-frame warnings appear in the log"
    **Cause:** when the real-time encoding queue is full, the oldest frame is dropped (rather than blocking the collection loop).

    **Fix:** raise `--dataset.encoder_threads`, use hardware encoding with `--dataset.vcodec=auto`, or adjust `--dataset.encoder_queue_maxsize`, see [Recording options](recording.md#54).

??? failure "The gripper opening is wrong / it does not read 0 when closed"
    **Cause:** the encoder zero has drifted or was never calibrated; for an uncalibrated leader gripper the collection program refuses to connect and prints the command to run.

    **Fix:** recalibrate with `python third_party/taccap-gripper/python/examples/calibrate.py left` (or `right`). It recalibrates both the zero and the travel limit and writes both into MCU flash; once per unit is enough. See [Gripper calibration](calibration.md#41).

??? failure "Calibration reports `encoder-max calibration needs command set >= V2.1`"
    **Cause:** the firmware command set is below V2.1 (i.e. leader < 1.2.0) and does not support travel calibration; `calibrate.py` exits as is without changing anything.

    **Fix:** flash the firmware. The procedure (upgrade the SDK first, pick the image by role, pass just the image file name) is in [Firmware OTA upgrade](versions.md#ota). Re-run `calibrate.py` afterwards.

## Data and disk

??? failure "Collection slows down / the disk fills up"
    **Cause:** a bimanual rig with several cameras can produce around 280 MB/s of raw video throughput; how much is written after encoding depends on resolution, scene content, the encoder and the bitrate. Insufficient free space, insufficient sustained write performance, or encoder threads that cannot keep up will all cause trouble.

    **Fix:** measure the encoded size and the dropped-frame situation on a handful of episodes before planning a large run; check `df -h` and the dataset directory size regularly, see [Storage planning](dataset.md#storage-planning).

---

Still stuck? Report it through the channels in [Support and feedback](../common/reference.md#support), with the complete error, the self-check output (`scan_grippers`'s side / role / firmware_sn), version information and the command that reproduces it.
