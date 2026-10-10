# Troubleshooting

Most problems are caused by insufficient serial permissions or ModemManager claiming the serial port, so check "Serial permissions and device discovery" first. Before troubleshooting, run the self-check in [Quickstart](index.md).

## Attach the full log when reporting a problem {#logs}

The full log is at `~/xenselogs/session_<timestamp>.log`; each run creates one file. Attach the entire file when reporting a problem.

- The log contains the collection program, `xensesdk` and encoding library logs, plus key-press timestamps; the `[session]` line records the host, encoding and camera configuration.
- Only the latest 15 files are kept. Change the log directory with `XENSE_LOG_DIR` and the on-screen log level with `XENSE_LOG_LEVEL`.

## Environment and installation

??? failure "`setup_env.sh --install` fails at startup with `needs system packages that are not installed`"
    **Cause:** the hardware SDKs are compiled locally, and some of `build-essential` / `cmake` / `pkg-config` / `git` / `curl` are missing.

    **Fix:** install the packages named in the printed command; the full list is in [System packages](install.md#apt). The following two items only produce warnings, but must also be installed:

    - `libusb-0.1.so.4` (provided by `libusb-dev`): a camera runtime dependency; if it is missing, the failure only appears at `connect()`;
    - `v4l-utils`: provides `v4l2-ctl` for camera troubleshooting.

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` fails"
    **Cause:** the environment is incompletely installed or not activated.

    **Fix:** run `mamba activate xense-taccap`, then run `./setup_env.sh --install` again. To verify each module, see [Verifying the install](install.md#25).

??? failure "`torchcodec` fails to load / video encoding errors"
    **Cause:** the `torchcodec` and PyTorch versions do not match, or PyAV is not `15.1.0`.

    **Fix:** run `setup_env.sh --install` again to correct the versions automatically. A system FFmpeg with `libsvtav1` must be installed separately.

## Hardware faults {#hardware}

Record the serial number, connection method, error message and a photo of the setup. Take anti-static precautions when powering on and off.

!!! danger "Odd smell, smoke, noticeable heat, structural damage or a frayed cable"
    Cut the power immediately and stop using the device.

??? failure "The software does not detect the leader gripper / `lsusb` shows the wrong device count"
    **Cause:** an unlocked cable, poor contact or a faulty cable. The leader gripper must be powered only through the supplied Type-C cable (DC 5V/500mA), never a 9V/12V fast charger.

    **Fix:**

    - `lsusb` should list 6 UVC devices on a bimanual rig (4 `Xense Robotics ... GSPS01…` tactile sensors + 2 `Sunplus ... XCA…` wrist cameras), and 3 on a single arm. For left/right identification, see [Serial numbers and left/right](../common/gripper.md#sn).
    - If the count is wrong, check cable locking and left/right wiring, restart the software, and try another port or cable. If the devices are listed but cannot be opened, see the next section.

??? failure "Black image / no image"
    **Cause:** the UVC device is not recognized, the sensor connection is faulty, or the wrong channel is selected.

    **Fix:** confirm recognition with `lsusb`, restart the software, then power-cycle the device.

??? failure "Spots on the image / blurry image"
    **Cause:** dirt, foreign matter or damage on the sensor surface.

    **Fix:** clean the surface with a lint-free cloth, see [Maintenance](../common/maintenance.md). A scratched or dented sensor must be replaced.

??? failure "The follower gripper does not power on / communication errors"
    **Cause:** no power means the 24V supply is not connected or the adapter is faulty; communication errors mean the Type-C cable is not connected, not recognized, or pulled by the robot's motion.

    **Fix:**

    - check the 24V adapter, outlet, connector and rating;
    - connect 24V first, then Type-C, and lock the cable (see [Power and connection requirements](../common/gripper.md#power));
    - route the cable away from moving parts and test at low speed before the first run.

??? failure "Binding the follower fails with `从爪固件版本过低,必须升级后才能使用本 SDK` / `Follower firmware too old`"
    **Cause:** the follower firmware is older than 1.2.5, which both `--robot.role=follower` and the SDK refuse (from 1.2.5 onward, the closed zero sits on the mechanical stop). Versions 1.2.5–1.2.10 connect but prompt for an upgrade.

    **Fix:** flash the follower image bundled with the SDK, then **unplug the 24V power cable, wait about 2 seconds and plug it back in** (the USB cable can remain connected):

    ```bash
    python third_party/taccap-gripper/python/examples/ota_update.py slave
    ```

    This command applies only when a single follower is connected. With several connected, see the next entry or [Firmware OTA](versions.md#ota).

??? failure "Flashing fails with `firmware file not found`"
    **Cause:** the first argument was interpreted as an image file name, and that file does not exist:

    - `slave left` / `master left` / `slave <SN>`: when a role is followed by another argument, the role is treated as a file name;
    - the unversioned `tc-gu-01-master.bin` / `tc-gu-01-slave.bin` was used.

    **Fix:**

    - normally use `ota_update.py --all`, which flashes each gripper by role;
    - when only one gripper of that role is connected, use `ota_update.py master` / `ota_update.py slave`;
    - to target one gripper, pass a file name listed under `shipped images` in the error plus a side or serial number, e.g. `ota_update.py tc-gu-01-slave-1.2.14.bin left` (use the actual file name in `firmware/`).

    See [Firmware OTA](versions.md#ota).

## Serial permissions and device discovery

??? failure "`connect()` reports `No leader gripper discovered for the <side> side.`"
    **Cause (most common):** the user is not in the `dialout` group and cannot open the serial port to read the SN, which results in `role=Unknown` / an empty `firmware_sn`. The underlying error is `IoError: SerialBus: open(...): Permission denied`.

    **Fix:** run `sudo usermod -aG dialout "$USER"`, log out and back in (or run `newgrp dialout`), then re-plug the gripper. See [Serial permissions](host-setup.md#31).

??? failure "`Device or resource busy` (when starting immediately after a hot-plug; `/dev/ttyACM*` reporting busy inside the container has the same cause)"
    **Cause:**

    - On every hot-plug, ModemManager probes the CH343 serial port with AT commands for several seconds; `brltty` also claims the port. For containers, the rule must be installed on the host.
    - Another program holds the gripper's serial port exclusively, e.g. a previous recording, calibration or example script that has not exited.

    **Fix:** close the program holding the port first. For ModemManager, the temporary workaround is to wait about 3s after plugging in; the permanent fix is a udev rule that ignores `1a86` devices (`install_customer.sh` on the Docker path already installs it). The rule and its verification are in [Stopping ModemManager from grabbing the port](host-setup.md#32). Re-plug the gripper after installing the rule.

??? failure "`firmware_sn` is still empty after fixing permissions / `role=Unknown`"
    **Cause:** the SN was not written, the serial read still fails, or firmware communication or device configuration is faulty. An empty SN does not indicate the firmware version.

    **Fix:** save the low-level error and retest with another cable and port. If the SN is still empty, contact the device or firmware team.

??? failure "The error names a specific hub / serial number"
    **Cause:** the assembly violates the "odd is left, even is right" rule: a non-conforming serial number, the wrong count on one side, both tactile sensors mapped to the same side, or a hub with no matching gripper.

    **Fix:** check the assembly and cabling of the device or hub named in the error. The rules are in [Device discovery](host-setup.md#33).

??? failure "The wrist camera / visuotactile sensor cannot be opened, `video ... busy`"
    **Cause:** an external service holds the camera, or the user is not in the `video` group.

    **Fix:** check the camera service status; run `sudo usermod -aG video "$USER"`, which takes effect after logging back in. If a different camera fails each time, see the USB bandwidth section below.

### Not enough USB bandwidth {#usb-bandwidth}

!!! warning "Measure this on the first day of setting up a bimanual rig; do not wait for a camera to fail"
    This is the most common bimanual failure, and it depends on which physical ports the grippers use. The budget and how to read `lsusb -t` are in [USB bandwidth budget](host-setup.md#usb-budget).

??? failure "One camera cannot be opened (`Cannot open camera N`), and a different camera fails each time"
    **Cause:** not enough USB bandwidth. Every UVC camera reserves isochronous bandwidth when it opens. Once the bus budget (about 384 Mbit/s) is exceeded, the last camera to open fails, so the failing camera varies.

    **Confirm:** use `lsusb -t` to count the cameras on each `480M` bus; six cameras on one bus will very likely exceed the budget. While starting, watch the kernel log in another terminal:

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    `--line-buffered` is required; without it `grep` buffers its output and appears to hang. `Not enough bandwidth for altsetting N` confirms the diagnosis. Alternatively, run the two halves separately:

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

    If each half works on its own but the combination fails, the cause is bandwidth. `enable_tactile=false` is for this diagnostic only; do not record data with it.

    **Fix:**

    - confirm the wrist cameras were not switched from the bandwidth-saving default `MJPG` to `YUYV` (`--robot.wrist_camera_fourcc`);
    - if the budget is still exceeded, add a USB host controller, not a hub (a Thunderbolt / USB4 dock includes its own xHCI controller). After moving one gripper to it, `lsusb -t` should show one more `480M` root_hub;
    - until the new controller is in place, you can record without wrist cameras (no `{side}_wrist` key). Decide before recording; do not mix both configurations in one dataset.

??? question "How far over budget is it?"
    Measured on a bimanual host with a single `480M` bus:

    | Cameras enabled | Reserved | Result |
    |---|---|---|
    | Four tactile only (`_enable_wrist_camera=false` on both sides) | 242 Mbit/s | works |
    | Two wrist cameras only (`--robot.enable_tactile=false`) | within budget | works |
    | All six (default) | 6 × 60.4 = 362 Mbit/s | fails |

    `altsetting 6` is 944 bytes per microframe, i.e. 60.4 Mbit/s per tactile sensor (320x240 YUYV@30 carries only about 37 Mbit/s of actual data); the wrist cameras request more. To read the values yourself:

    ```bash
    # I:* is the active altsetting; the class name is lower-case (video) in this file
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    Each video interface's `Alt=` and the `MxPS=` on its `E:` line give the reservation (`MxPS × 8000 × 8` bit/s). Sum the reservations per bus and compare against about 384 Mbit/s. The request is set by the firmware's UVC descriptors; the collection program cannot change it.

??? question "Does another USB port, a lower `tactile_fps`, or `uvcvideo quirks=128` help?"
    No:

    - another physical USB port (including blue USB 3 ports): all ports on one controller share one USB 2.0 bus, so the camera must move to a different controller;
    - lowering `--robot.tactile_fps`: this only throttles the Python-side read; the USB stream is unchanged;
    - `uvcvideo quirks=128` (`UVC_QUIRK_FIX_BANDWIDTH`): measured to have no effect. It recomputes bandwidth as `width × height × bpp`, which does not cover the MJPEG wrist cameras, the largest consumers.

## Pico4 tracker and pose

??? failure "No pose / the tracker cannot connect / the pose is unstable"
    **Cause:** most commonly, the computer's WiFi conflicts with the Pico4 Ultra Enterprise wired network sharing. Other causes: the service or XTac-UMI XR is not running, or the tracker is unpaired or its battery is depleted.

    **Fix:** turn off the computer's WiFi (see [Network connection](../common/pico4.md#pico-network)); check each step of the [Power-on sequence](quickstart.md#power-on); start the service with `/opt/apps/roboticsservice/runService.sh`; if needed, run the self-check `python -m lerobot.robots.taccap_gripper.check_tracker`.

??? failure "The pose reference frame drifts between episodes"
    **Cause:** XTac-UMI XR was restarted between episodes, which reset the world origin.

    **Fix:** do not restart XTac-UMI XR between episodes. Treat data recorded after a restart as a new dataset, see [Frame alignment](../common/pico4.md#pico-frame).

??? failure "The pose drops out between episodes / the headset turns off its screen automatically"
    **Cause:** screen-off and sleep are still enabled on the headset; once it suspends, XTac-UMI XR is paused or terminated.

    **Fix:** in Enterprise settings → System settings → Power policy, set "System sleep" and then "Screen off" to "Never" (in the reverse order, screen-off is clamped back to a finite value), see [System settings](../common/pico4.md#pico-system).

??? failure "The tracker is not selectable in tracking mode / PC Service does not discover that SN / the pairing screen cannot find the tracker"
    **Cause:** the tracker is not bound to this headset (a new unit, a replaced device, or after a factory reset). If the pairing screen cannot find it, the tracker is not in pairing mode (steady blue light).

    **Fix:** bind both trackers in the "Motion Tracker" app. Before pairing, hold the tracker's power button for about 6 seconds until the light alternates blue and red, then tap "Start pairing". See [Binding the trackers](../common/pico4.md#pico-tracker-bind).

??? failure "XTac-UMI XR cannot connect (Not connected or Connection failed)"
    **Cause:** usually the wired network is not connected properly, or the computer's WiFi is still on.

    **Fix:** for a wired connection, tick "USB network"; over WiFi, enter the host's IP in "PC IP"; then tap "Connect". If it still fails, redo the [Network connection](../common/pico4.md#pico-network); the screen is described in [The app's interface](../common/pico4.md#pico-toolkit-ui).

??? failure "The headset shows \"Connected\" but the PC receives no pose"
    **Cause:** "Connected" only means the app has reached the service. The host service may not be running, or the tracker is powered off or unbound.

    **Fix:** start [XenseVR PC Service](host-setup.md#35); run `ConsoleDemo` in `/opt/apps/roboticsservice/` or `python -m lerobot.robots.taccap_gripper.check_tracker` to check whether a pose with an `sn` is received. If not, return to [binding](../common/pico4.md#pico-tracker-bind) and confirm both trackers are on and "connected".

??? failure "The tracker is matched to the wrong side / PC Service enumeration is unstable"
    **Cause:** a non-conforming serial number or unstable enumeration.

    **Fix:** pin the tracker with `--robot.tracker_serial=<SN>` (no enumeration, no validation), or check that the digit before the trailing `G` in the serial follows the odd-left, even-right rule, see [Tracker serial numbers](../common/pico4.md#pico-tracker-sn).

## Head camera {#head-camera}

??? failure "Fails with `... always records the headset ...` or `... does not record the headset ...`"
    **Cause:** a bimanual command passes `--robot.enable_head_camera`, which conflicts with `--robot.type`. The type determines whether the headset is recorded.

    **Fix:** remove `--robot.enable_head_camera`. To record the headset, use `--robot.type=xtac_umi_g1`; otherwise use `--robot.type=bi_taccap_gripper`. See [Head camera](recording.md#56).

??? failure "Recording the headset stops responding while waiting for the first frame"
    **Cause:** head camera frames are relayed by PC Service. Either the service is older than v0.2.0 (v0.1.0 does not relay head camera frames), or the headset app is not streaming.

    **Fix:** check in this order:

    ```bash
    # 1) the service deb version: needs ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) does it expose the camera interface
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

    Then confirm the headset is connected to PC Service and the app is streaming (it shares one connection with the tracker). Prerequisites are in [Head camera](recording.md#56).

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **Cause:** an older interface is loaded (the camera interface was added in v0.2.0). The module links the C SDK from the `.deb`, so check its version first: `dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'`.

    **Fix:**

    - update to the release tag (see [Repo and submodule update](versions.md#repo-update)) and run `./setup_env.sh --install` again, which also upgrades the `.deb` to the baseline version;
    - if the result is still `False`, run `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"` to see which copy is loaded;
    - if `Status` is not `install ok installed` (e.g. the package was removed with `dpkg -r`, leaving `deinstall ok config-files`), reinstall in the same way.

??? failure "Repeated left/right eye skew warnings in the log"
    **Cause:** the timestamps of the two eyes' independent messages differ by more than `--robot.head_camera_pair_max_skew_ms` (20ms by default). This is common when the host is heavily loaded or the link is unstable.

    **Fix:** the warning does not interrupt recording, but the affected frames may be out of sync.

    - reduce the load (fewer cameras, or `--robot.head_camera_eyes=left` to record one eye);
    - for link problems, see [Network connection](../common/pico4.md#pico-network);
    - relax the threshold only after confirming the cause is link jitter.

??? failure "`head_camera_width/_height` reports an unsupported size, or the size is valid but connect still reports a first-frame size mismatch"
    **Cause:** only `640x480` (default), `1024x768` and `1280x960` (all 4:3) are accepted. If a valid size still mismatches, it differs from the headset's actual output.

    **Fix:** the default is 640x480 per eye, so omit both flags. If the headset resolution was changed, confirm the value with [technical support](../common/reference.md#support) and set both flags to the same value, see [Head camera](recording.md#56). Episodes recorded before and after a size change cannot be mixed.

## Collecting and recording

??? failure "The command exits immediately: `--robot.id is required`"
    **Cause:** `--robot.id` is the required station number.

    **Fix:** add the station number (`0` / `1`…; the prefix from `--robot.type` produces `taccap_0` / `bi_taccap_0` / `xtac_umi_g1_0`), e.g. `lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...`. It identifies the station, not the hardware, so replacing a gripper does not require changing it. Device identity is recorded in `meta/hardware.json`, see [`--robot.id` and the hardware manifest](recording.md#robot-id).

??? failure "On resume, the hardware does not match the dataset record"
    **Cause:** the gripper or tactile sensors were replaced before `--resume`. This is not an error: the manifest starts a new epoch at the current episode count and logs `... recorded as a new epoch in .../hardware.json`. Only a `--robot.type` mismatch keeps the original file and issues a warning.

    **Fix:** if the replacement was intentional, continue recording. Otherwise (e.g. the wrong gripper is plugged in), stop and reconnect the original device.

??? failure "Resume fails with `refusing to resume it`"
    **Cause:** `--robot.id` differs from the station number recorded in the dataset, so resume is refused before any device connects.

    **Fix:** resume with the original `--robot.id`, or create a new dataset with a different `--dataset.repo_id`.

??? failure "Recording terminates partway through with `ValueError: You must add one or several frames`"
    **Cause:** for about 2s between episodes, keyboard input is not read (saving plus encoder warm-up). A **right arrow** pressed during this gap remains pending, typically when the previous reset ends on timeout. The next episode exits with zero frames, saving raises this error, and the whole session is aborted. The error appears more than two minutes after the key press.

    **Fix:** upgrade to `0.0.7` or later, which discards key presses during the gap. The keyboard listener is global, so a right arrow in **any** window (including Rerun) ends the episode. Use the key-press timestamps in the [session log](#logs) to investigate.

??? failure "`[stale_frames]` is printed after each reset phase, or a camera capture stall warning appears"
    **Cause:** a camera's background capture stalled. The collection loop is **not blocked** (it uses the cached previous frame), so the frame rate stays normal, but the recorded frames are **repeats of the old image**. After each reset phase, a line reports the duplicate count, number of runs and longest run; a re-recorded episode is marked ` (discarded take)`:

    ```text
    [stale_frames] episode 3 [left_tactile_left] 45/1800 frames served stale (2.5%): 25 gap(s), longest 21 frame(s)
    ```

    **Fix:**

    - **Single-frame** duplicates are expected: capture and recording each run at the nominal rate, and phase drift occasionally samples one frame twice. No action is needed.
    - A **long contiguous run** indicates a real stall, most often the GPU encoder starving the tactile threads for 0.3 to 0.9s while 8 cameras encode.
    - Episodes with a low single-digit percentage in short runs are usable; discard episodes that contain a very long run.
    - If the problem persists, work through [Not enough USB bandwidth](#usb-bandwidth) or record fewer cameras.

    `[loop_summary]` reports the actual frame rate, e.g. `= 29.0 fps (nominal 30; dataset timestamps assume nominal)`. Dataset timestamps are still written at the nominal rate.

??? failure "The log shows `[slow_frame] ... overrun=`"
    **Cause:** a frame exceeded the frame budget (33.3ms at 30fps). The Rerun display runs on a separate thread and is **not the cause**.

    **Fix:** read the following two parts:

    - ` | phases obs=… build=… add=… display=…`: time spent in each phase;
    - `top_obs=` at the end of the line: the slowest sensors.

    The first 5 `[slow_frame]` lines per episode are shown on screen; the rest go to the [session log](#logs), and the screen shows one `[slow_frame_summary]` every 5s instead. Occasional occurrences do not affect the data; if they persistently point to the same camera, work through [Not enough USB bandwidth](#usb-bandwidth). For a host without an NVIDIA GPU, see [Recording on a host without an NVIDIA GPU](recording.md#no-gpu).

??? failure "Recording stops partway through with `Device lost mid-recording`"
    **Cause:** a camera or the gripper encoder disconnected, due to a loose cable, untightened screws, cable strain, a hub losing power, an unstable power supply or poor contact. The data recorded so far is saved.

    **Fix:** the last second or two of that episode contain stale values, so discard the episode. Check the screws, cable routing and USB port (if the problem recurs and changing ports does not help, see [Not enough USB bandwidth](#usb-bandwidth)), then continue into the same dataset with `--resume`, see [Recording](recording.md#52).

??? failure "On a host without a discrete GPU, recording fails at startup because the encoder cannot be opened"
    **Cause:** there is no NVIDIA driver, but a GPU hardware encoder is selected.

    **Fix:** switch to a CPU encoder and disable streaming encoding: `lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false`. The rationale is in [Recording on a host with no NVIDIA GPU](recording.md#no-gpu).

??? failure "The encoder cannot keep up and dropped-frame warnings appear in the log"
    **Cause:** when the encoding queue is full, it waits up to 0.1s; if it is still full, the frame is dropped with the warning `Encoder queue full … dropped N frame(s)` (the collection loop is not blocked).

    **Fix:** increase `--dataset.encoder_threads`, use `--dataset.vcodec=auto`, or adjust `--dataset.encoder_queue_maxsize`, see [Recording options](recording.md#54).

??? failure "The gripper opening is incorrect / it does not read 0 when closed"
    **Cause:** the encoder zero has drifted or was never calibrated (an uncalibrated leader is refused, and the calibration command is printed).

    **Fix:** run `python third_party/taccap-gripper/python/examples/calibrate.py left` (or `right`) to recalibrate the zero and travel limit and write them to MCU flash. Calibration is required only once per unit, see [Gripper calibration](calibration.md#41).

??? failure "Calibration reports `encoder-max calibration needs command set >= V2.1`"
    **Cause:** the firmware command set is below V2.1 (i.e. leader < 1.2.0) and does not support travel calibration; `calibrate.py` exits without making changes.

    **Fix:** flash the firmware (upgrade the SDK first, select the image by role, and pass only the file name), see [Firmware OTA upgrade](versions.md#ota). Then run `calibrate.py` again.

## Data and disk

??? failure "Collection slows down / the disk fills up"
    **Cause:** a bimanual rig can produce around 280 MB/s of raw video. Insufficient disk space, slow sustained writes or encoding that cannot keep up all cause this problem.

    **Fix:** first record a few episodes to measure the encoded size and dropped frames; check `df -h` and the dataset directory size regularly, see [Storage planning](dataset.md#storage-planning).

## Docker image {#docker}

This section applies only to the [Docker image](install.md#docker) path. For a busy serial port inside the container, see `Device or resource busy` above.

??? failure "`could not select device driver ... gpu` / no GPU visible inside the container"
    **Cause:** the NVIDIA Container Toolkit is not installed correctly, or the Docker daemon was not restarted after installation.

    **Fix:** `install_customer.sh` installs it automatically. To check manually, run `docker run --rm --gpus all ubuntu:22.04 nvidia-smi`. If no GPU is shown, reinstall the Toolkit and run `sudo systemctl restart docker`. The host driver must be ≥ 570.144.

??? failure "`Unknown runtime specified nvidia`, `docker compose` does not start"
    **Cause:** the NVIDIA runtime is not registered with Docker, while `compose.yaml` uses `runtime: nvidia` (see [Graphics from inside the container](install.md#docker-gui)).

    **Fix:**

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # nvidia must appear in the output
    ```

??? failure "Rerun does not start in the container: `Failed to create surface for any enabled backend` / Vulkan adapter errors, but `nvidia-smi` works"
    **Cause:** X11 access is not authorized, or the container lacks NVIDIA's Vulkan ICD. Typically, `runtime: nvidia` in `compose.yaml` was changed to `gpus: all`, which requests only compute + utility. In that case `vulkaninfo` reports `INCOMPATIBLE_DRIVER` or lists no NVIDIA device.

    **Fix:**

    - as the host desktop user, run `xhost +si:localuser:root`, and confirm that `echo "$DISPLAY"` is non-empty and `/tmp/.X11-unix` exists;
    - if `docker info --format '{{json .Runtimes}}'` does not list nvidia, register it as in the previous entry; if it does, change `compose.yaml` back to `runtime: nvidia`;
    - confirm that `vulkaninfo --summary` inside the container recognizes the GPU.

??? failure "`pull access denied ... 'docker login'`, or the old image is still pulled after changing `LEROBOT_IMAGE_TAG`"
    **Cause:** the image is public and requires no login. The image name was resolved incorrectly, `.env` was changed without pulling again, or the command was not run in the `docker compose` directory.

    **Fix:** run `docker compose config --images` to see the image name, check `LEROBOT_IMAGE` in `.env` (the default is `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`; normally `.env` needs only the tag line), then run `docker compose pull`. See [Pin the image version](install.md#docker-pin).

??? failure "Entering the container prints `groups: cannot find name for group ID <n>`"
    This message is harmless: the NVIDIA runtime injects the host's `render` group GID, and the container has no group with that name.

??? failure "Images `0.0.5` and earlier: `mamba activate` reports `Shell not initialized`; recording terminates at startup with `FileNotFoundError: 'spd-say'`; every exported `.mp4` reports `Permission denied` while the metadata copies normally"
    **Cause:** three known issues in old images, fixed from `0.0.6` onward:

    - the environment is already active when you enter the container, so no activation is needed;
    - the image lacks `spd-say` for voice announcements while `--play_sounds` defaults to `true`; the announcement raises an exception and the process exits with `terminate called without an active exception`;
    - video files are `-rw------- root` while metadata is `0644`, so a non-root user cannot copy the videos; the files themselves are intact.

    **Fix:** upgrade the image (see [Pin the image version](install.md#docker-pin)). If you continue to use an old image:

    - before switching environments manually, run `eval "$(mamba shell hook --shell bash)"`;
    - add `--play_sounds=false` when recording; collection is not affected;
    - videos recorded with an old image keep their permissions after upgrading, so copy them as root as described in [Where the data lives](install.md#docker-data) and run `chown` afterwards. Do not use `--user`.

??? failure "The host sees the tactile sensors, but the container does not"
    **Cause:** the container was not started through Compose (`/dev` and `/run/udev` are not passed through), or the device nodes have not settled after re-enumeration.

    **Fix:** enter the container with `docker compose run --rm xense-taccap` and check the nodes with `ls /dev/v4l/by-id/*GSPS*`. If the list is empty, re-plug the USB hub on the host and run `sudo udevadm settle --timeout=20`.

??? failure "After a container restart, sensor configuration is re-read and startup is slow"
    **Cause:** the `xensesdk-cache` volume was deleted. It caches sensor configuration by serial number so that each start avoids re-reading flash and re-enumerating USB.

    **Fix:** keep the volume. The purpose of each volume is described in [Where the data lives](install.md#docker-data).

---

If the problem persists, report it through the channels in [Support and feedback](../common/reference.md#support), including the complete error, the self-check output (`scan_grippers`'s side / role / firmware_sn), version information and the command that reproduces it.
