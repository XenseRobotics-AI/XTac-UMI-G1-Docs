# Troubleshooting

Most problems come down to serial permissions and ModemManager grabbing the port, so read "Serial permissions and device discovery" first. Before touching anything, run the self-check in [Quickstart](index.md).

## Attach the full log when reporting a problem {#logs}

The full log is at `~/xenselogs/session_<timestamp>.log`, one file per run; attach the whole file when reporting.

- It holds the collection program, `xensesdk` and encoding library logs plus key-press timestamps; the `[session]` line records the host, encoding and camera configuration.
- Only the latest 15 files are kept; change the directory with `XENSE_LOG_DIR` and the on-screen level with `XENSE_LOG_LEVEL`.

## Environment and installation

??? failure "`setup_env.sh --install` stops immediately with `needs system packages that are not installed`"
    **Cause:** the hardware SDKs are compiled on the spot, and some of `build-essential` / `cmake` / `pkg-config` / `git` / `curl` are missing.

    **Fix:** install what the printed line says; the full list is in [System packages](install.md#apt). Two more checks only warn, but do not skip them:

    - `libusb-0.1.so.4` (provided by `libusb-dev`): a camera runtime dependency; if missing, nothing fails until `connect()`;
    - `v4l-utils`: provides `v4l2-ctl` for camera troubleshooting.

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` fails"
    **Cause:** the environment is incomplete or not active.

    **Fix:** run `mamba activate xense-taccap`, then re-run `./setup_env.sh --install`. To verify them one by one, see [Verifying the install](install.md#25).

??? failure "`torchcodec` fails to load / video encoding errors"
    **Cause:** `torchcodec` does not match PyTorch, or PyAV is not `15.1.0`.

    **Fix:** re-run `setup_env.sh --install` to correct it; a system FFmpeg with `libsvtav1` is a separate install.

## Hardware faults {#hardware}

Note the serial number, connection, error and a photo of the setup; take anti-static precautions when powering on and off.

!!! danger "Odd smell, smoke, noticeable heat, structural damage or a frayed cable"
    Cut the power immediately and stop using the device.

??? failure "The software does not detect the leader gripper / `lsusb` shows the wrong count"
    **Cause:** an unlocked cable, poor contact or a faulty cable. The leader gripper must be powered only through the supplied Type-C cable (DC 5V/500mA), never a 9V/12V fast charger.

    **Fix:**

    - `lsusb` should list 6 UVC devices on a bimanual rig (4 `Xense Robotics ... GSPS01…` tactile + 2 `Sunplus ... XCA…` wrist cameras), 3 on a single arm; for left/right see [Serial numbers and left/right](../common/gripper.md#sn).
    - If the count is wrong, check locking and left/right wiring, restart the software, try another port or cable; if listed but not opening, see the next section.

??? failure "Black image / no image"
    **Cause:** the UVC device is not recognised, the sensor connection is faulty, or the wrong channel is selected.

    **Fix:** confirm recognition with `lsusb`, restart the software, power-cycle.

??? failure "Spots on the image / blurry image"
    **Cause:** dirt, foreign matter or damage on the sensor surface.

    **Fix:** clean with a lint-free cloth, see [Maintenance](../common/maintenance.md); a scratched or dented sensor must be replaced.

??? failure "The follower gripper does not power on / communication errors"
    **Cause:** no power means the 24V is not connected or the adapter is faulty; communication errors mean the Type-C is not connected, not recognised, or pulled by the robot's motion.

    **Fix:**

    - check the 24V adapter, outlet, connector and rating;
    - connect 24V first, then Type-C, and lock it (see [Power and connection requirements](../common/gripper.md#power));
    - route the cable away from moving parts and test at low speed before the first run.

??? failure "Binding the follower fails with `从爪固件版本过低,必须升级后才能使用本 SDK` / `Follower firmware too old`"
    **Cause:** follower firmware older than 1.2.5, which `--robot.role=follower` and the SDK both refuse (only from 1.2.5 does the closed zero sit on the mechanical stop); 1.2.5–1.2.10 connects but warns you to upgrade.

    **Fix:** flash the follower image bundled with the SDK, then **unplug the 24V power cable, wait about 2 seconds and plug it back in** (USB can stay connected):

    ```bash
    python third_party/taccap-gripper/python/examples/ota_update.py slave
    ```

    That works only with a single follower plugged in; with several, see the next entry or [Firmware OTA](versions.md#ota).

??? failure "Flashing fails with `firmware file not found`"
    **Cause:** the first argument was taken as an image file name that does not exist:

    - `slave left` / `master left` / `slave <SN>`: a role followed by another argument is treated as a file name;
    - the unversioned `tc-gu-01-master.bin` / `tc-gu-01-slave.bin`.

    **Fix:**

    - normally `ota_update.py --all`, flashing each gripper by role;
    - with one gripper of that role plugged in, `ota_update.py master` / `ota_update.py slave`;
    - to pick one, pass a file name listed under `shipped images` in the error plus a side or serial, e.g. `ota_update.py tc-gu-01-slave-1.2.14.bin left` (use the actual name in `firmware/`).

    See [Firmware OTA](versions.md#ota).

## Serial permissions and device discovery

??? failure "`connect()` reports `No leader gripper discovered for the <side> side.`"
    **Cause (most common):** the user is not in the `dialout` group and cannot open the serial port to read the SN, leaving `role=Unknown` / an empty `firmware_sn`. Underneath it is `IoError: SerialBus: open(...): Permission denied`.

    **Fix:** `sudo usermod -aG dialout "$USER"`, log out and back in (or `newgrp dialout`), then re-plug the gripper, see [Serial permissions](host-setup.md#31).

??? failure "`Device or resource busy` (starting immediately after a hot-plug; `/dev/ttyACM*` reporting busy inside the container is the same thing)"
    **Cause:**

    - ModemManager probes the CH343 serial port with AT commands for a few seconds on every hot-plug; `brltty` grabs it the same way. For containers the rule goes on the host.
    - Another program holds the gripper's serial port exclusively, e.g. a previous recording, calibration or example script that has not exited.

    **Fix:** close the other program first. For ModemManager: temporarily, wait about 3s after plugging in; permanently, add a udev rule ignoring `1a86` devices (`install_customer.sh` on the Docker path already installs it). Rule and verification are in [Stopping ModemManager from grabbing the port](host-setup.md#32); re-plug the gripper afterwards.

??? failure "`firmware_sn` is still empty after fixing permissions / `role=Unknown`"
    **Cause:** the SN was not burned in, the serial read still fails, or firmware communication or device configuration is faulty; an empty SN alone does not tell you the firmware version.

    **Fix:** save the low-level error, retest with another cable and port; if still empty, contact the device or firmware team.

??? failure "The error names a specific hub / serial number"
    **Cause:** the assembly breaks the "odd is left, even is right" rule: a non-conforming serial, the wrong count on a side, both tactile sensors mapping to one side, or a hub with no matching gripper.

    **Fix:** check the assembly and cabling of the device or hub the error names; rules in [Device discovery](host-setup.md#33).

??? failure "The wrist camera / visuotactile sensor will not open, `video ... busy`"
    **Cause:** an external service holds the camera, or the user is not in the `video` group.

    **Fix:** check the camera service; `sudo usermod -aG video "$USER"`, effective after logging back in. If a different camera fails each time, see USB bandwidth below.

### Not enough USB bandwidth {#usb-bandwidth}

!!! warning "On a bimanual rig, measure this on day one, do not wait for a camera to fail"
    The most common bimanual failure, decided by which physical ports the grippers use. The budget and how to read `lsusb -t` are in [USB bandwidth budget](host-setup.md#usb-budget).

??? failure "One camera will not open (`Cannot open camera N`), and it is a different one each time"
    **Cause:** not enough USB bandwidth. Every UVC camera reserves isochronous bandwidth when it opens; past the bus budget (about 384 Mbit/s) the last one to open fails, so the fault wanders.

    **Confirm:** with `lsusb -t`, count the cameras on each `480M` bus; six on one bus is very likely over. Watch the kernel log in another terminal while starting:

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    `--line-buffered` is not optional, or `grep` buffers and looks hung. `Not enough bandwidth for altsetting N` is the diagnosis. You can also run the two halves separately:

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

    Each half working but the combination failing means bandwidth; `enable_tactile=false` is for this diagnostic only, never record with it.

    **Fix:**

    - confirm the wrist cameras were not switched from the default `MJPG` (chosen to save bandwidth) to `YUYV` (`--robot.wrist_camera_fourcc`);
    - if still over, add a USB host controller, not a hub (a Thunderbolt / USB4 dock brings its own xHCI controller); after moving one gripper over, `lsusb -t` should show one more `480M` root_hub;
    - until then you can record without wrist cameras (no `{side}_wrist` key); decide before recording, not half with and half without.

??? question "How far over budget is it, exactly?"
    Measured on one bimanual host with a single `480M` bus:

    | Cameras enabled | Reserved | Result |
    |---|---|---|
    | Four tactile only (`_enable_wrist_camera=false` on both sides) | 242 Mbit/s | works |
    | Two wrist cameras only (`--robot.enable_tactile=false`) | within budget | works |
    | All six (default) | 6 × 60.4 = 362 Mbit/s | fails |

    `altsetting 6` is 944 bytes per microframe, i.e. 60.4 Mbit/s per tactile sensor (320x240 YUYV@30 is only about 37 Mbit/s of actual data); the wrist cameras request more. To read the numbers yourself:

    ```bash
    # I:* is the active altsetting; the class name is lower-case (video) in this file
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    Each video interface's `Alt=` and the `MxPS=` on its `E:` line give the reservation (`MxPS × 8000 × 8` bit/s); sum per bus and compare against about 384 Mbit/s. The request is set by the firmware's UVC descriptors; the collection program cannot change it.

??? question "Does another USB port, a lower `tactile_fps`, or `uvcvideo quirks=128` help?"
    None of them:

    - another physical USB port (blue USB 3 ports included): every port on one controller shares one USB 2.0 bus, so move to a different controller;
    - lowering `--robot.tactile_fps`: it only throttles the Python-side read, the USB stream is unchanged;
    - `uvcvideo quirks=128` (`UVC_QUIRK_FIX_BANDWIDTH`): measured to have no effect; it recomputes as `width × height × bpp`, which misses the MJPEG wrist cameras, the biggest consumers.

## Pico4 tracker and pose

??? failure "No pose / the tracker will not connect / the pose is unstable"
    **Cause:** most commonly the computer's WiFi conflicting with the Pico4 Ultra Enterprise wired network sharing; or the service or XTac-UMI XR not started, or the tracker unpaired or out of charge.

    **Fix:** turn the computer's WiFi off (see [Network connection](../common/pico4.md#pico-network)); walk through the [Power-on sequence](quickstart.md#power-on); start the service with `/opt/apps/roboticsservice/runService.sh`; if needed, self-check with `python -m lerobot.robots.taccap_gripper.check_tracker`.

??? failure "The pose reference frame drifts between episodes"
    **Cause:** XTac-UMI XR was restarted between episodes, resetting the world origin.

    **Fix:** do not restart it between episodes; treat data recorded after a restart as a new dataset, see [Frame alignment](../common/pico4.md#pico-frame).

??? failure "The pose cuts out between episodes / the headset blanks its screen by itself"
    **Cause:** screen blanking and sleep were left on, so after suspending, XTac-UMI XR was paused or killed.

    **Fix:** Enterprise settings → System settings → Power policy: set "System sleep" and then "Screen off" to "Never" (in the other order, blanking gets clamped back to a finite value), see [System settings](../common/pico4.md#pico-system).

??? failure "The tracker is not selectable in tracking mode / PC Service does not discover that SN / the pairing screen cannot find the tracker"
    **Cause:** the tracker is not bound to this headset (a new unit, a swapped device, or a factory reset); if pairing cannot find it, it is not in pairing mode (steady blue light).

    **Fix:** bind both trackers in the "Motion Tracker" app; before pairing, hold the power button for about 6 seconds until it alternates blue and red, then tap "Start pairing". See [Binding the trackers](../common/pico4.md#pico-tracker-bind).

??? failure "XTac-UMI XR will not connect (Not connected or Connection failed)"
    **Cause:** usually the wired network is not connected properly, or the computer's WiFi is still on.

    **Fix:** when wired, tick "USB network"; over WiFi, put the host's IP in "PC IP"; then tap "Connect". Otherwise redo the [Network connection](../common/pico4.md#pico-network); the screen is in [The app's interface](../common/pico4.md#pico-toolkit-ui).

??? failure "The headset says \"Connected\" but the PC receives no pose at all"
    **Cause:** "Connected" only means the app reached the service; the host service may not be running, or the tracker is off or unbound.

    **Fix:** start [XenseVR PC Service](host-setup.md#35); use `ConsoleDemo` in `/opt/apps/roboticsservice/` or `python -m lerobot.robots.taccap_gripper.check_tracker` to see whether a pose with an `sn` comes through. If not, go back to [binding](../common/pico4.md#pico-tracker-bind) and confirm both trackers are on and "connected".

??? failure "The tracker is matched to the wrong side / PC Service enumeration is unstable"
    **Cause:** a non-conforming serial number or enumeration jitter.

    **Fix:** pin it with `--robot.tracker_serial=<SN>` (no enumeration, no validation); or check the digit before the trailing `G` in the serial, odd is left, even is right, see [Tracker serial numbers](../common/pico4.md#pico-tracker-sn).

## Head camera {#head-camera}

??? failure "Fails with `... always records the headset ...` or `... does not record the headset ...`"
    **Cause:** a bimanual command passes `--robot.enable_head_camera`, contradicting `--robot.type`; the type decides whether the headset is included.

    **Fix:** drop `--robot.enable_head_camera`; to record the headset use `--robot.type=xtac_umi_g1`, otherwise `--robot.type=bi_taccap_gripper`. See [Head camera](recording.md#56).

??? failure "Recording the headset hangs waiting for the first frame"
    **Cause:** frames are relayed by PC Service: a service older than v0.2.0 (v0.1.0 does not relay head camera frames), or the headset app is not streaming.

    **Fix:** check in this order:

    ```bash
    # 1) the service deb version: needs ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) does it expose the camera interface
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

    Then confirm the headset is connected to PC Service and the app is streaming (it shares one connection with the tracker). Prerequisites are in [Head camera](recording.md#56).

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **Cause:** an older interface is loaded (the camera interface arrived with v0.2.0); the module links the `.deb`'s C SDK, so check the version first: `dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'`.

    **Fix:**

    - update to the release tag (see [Repo and submodule update](versions.md#repo-update)) and re-run `./setup_env.sh --install`, which also upgrades the `.deb` to the baseline;
    - if still `False`, use `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"` to see which copy loads;
    - if `Status` is not `install ok installed` (e.g. removed with `dpkg -r`, leaving `deinstall ok config-files`), reinstall the same way.

??? failure "Repeated left/right eye skew warnings in the log"
    **Cause:** the two eyes' independent messages differ in timestamp by more than `--robot.head_camera_pair_max_skew_ms` (20ms by default); usually a loaded host or link jitter.

    **Fix:** the warning does not interrupt recording, but those frames may be out of sync.

    - reduce load (fewer cameras, or `--robot.head_camera_eyes=left` for one eye);
    - for the link, see [Network connection](../common/pico4.md#pico-network);
    - only once sure it is just jitter, relax the threshold.

??? failure "`head_camera_width/_height` reports an unsupported size, or the size is valid but connect still reports a first-frame size mismatch"
    **Cause:** only `640x480` (default), `1024x768` and `1280x960` (all 4:3) are accepted; a valid size that still mismatches differs from the headset's actual output.

    **Fix:** the default is 640x480 per eye, so pass neither flag; if the headset resolution was changed, confirm it with [technical support](../common/reference.md#support) and set both flags to the same value, see [Head camera](recording.md#56). Episodes from before and after a size change cannot be mixed.

## Collecting and recording

??? failure "The command exits the moment you run it: `--robot.id is required`"
    **Cause:** `--robot.id` is the required station number.

    **Fix:** add it (`0` / `1`…; the prefix from `--robot.type` gives `taccap_0` / `bi_taccap_0` / `xtac_umi_g1_0`), e.g. `lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...`. It names the station, not the hardware, so swapping a gripper does not change it; device identity is in `meta/hardware.json`, see [`--robot.id` and the hardware manifest](recording.md#robot-id).

??? failure "On resume, the hardware does not match what the dataset recorded"
    **Cause:** the gripper or tactile sensors were swapped under `--resume`. This is not an error: the manifest opens a new epoch at the current episode count and logs `... recorded as a new epoch in .../hardware.json`; only a `--robot.type` mismatch keeps the original file with a warning.

    **Fix:** if intentional, carry on; if not (a wrong gripper plugged in, say), stop and put the original back.

??? failure "Resume fails with `refusing to resume it`"
    **Cause:** `--robot.id` differs from the station recorded in the dataset; it is refused before any device connects.

    **Fix:** resume with the original `--robot.id`, or record into a new `--dataset.repo_id`.

??? failure "Recording dies partway through with `ValueError: You must add one or several frames`"
    **Cause:** for about 2s between episodes no keyboard events are read (saving plus encoder warm-up), and a **right arrow** pressed in that gap stays pending, typically just as the previous reset times out on its own. The next episode exits with zero frames, saving raises this error and the whole session dies; it surfaces more than two minutes after the keypress.

    **Fix:** upgrade to `0.0.7` or newer, which discards key presses in that gap. The keyboard hook is global, so a right arrow in **any** window ends the episode (Rerun included); the keypress timestamps in the [session log](#logs) help trace it.

??? failure "`[stale_frames]` is printed after each reset phase, or a camera capture stall warning appears"
    **Cause:** a camera's background capture stalled. The collection loop is **not blocked** (it takes the cached previous frame), so the frame rate looks normal, but what gets recorded is a **repeat of the old image**. After each reset phase a line gives the duplicate count, number of runs and longest run; a re-recorded episode is marked ` (discarded take)`:

    ```text
    [stale_frames] episode 3 [left_tactile_left] 45/1800 frames served stale (2.5%): 25 gap(s), longest 21 frame(s)
    ```

    **Fix:**

    - **Single-frame** duplicates are expected: capture and recording each run at the nominal rate, and phase drift occasionally samples a frame twice; ignore them.
    - A **long contiguous run** is a real stall, most often the GPU encoder starving the tactile threads for 0.3 to 0.9s while 8 cameras encode.
    - A few percent in short runs is fine; discard an episode with a very long run.
    - If it persists, work through [Not enough USB bandwidth](#usb-bandwidth) or record fewer cameras.

    `[loop_summary]` gives the actual frame rate, e.g. `= 29.0 fps (nominal 30; dataset timestamps assume nominal)`: dataset timestamps are still written at the nominal rate.

??? failure "The log shows `[slow_frame] ... overrun=`"
    **Cause:** a frame exceeded the frame budget (33.3ms at 30fps). The Rerun display runs on its own thread and is **not a cause**.

    **Fix:** read the two parts:

    - ` | phases obs=… build=… add=… display=…`: time per phase;
    - `top_obs=` at the end: the slowest sensors.

    The first 5 `[slow_frame]` lines per episode reach the screen; the rest go to the [session log](#logs), and the screen shows a `[slow_frame_summary]` every 5s instead. Occasional ones do not affect the data; if they persist on the same camera, work through [Not enough USB bandwidth](#usb-bandwidth). Without an NVIDIA card see [Recording on a host without an NVIDIA GPU](recording.md#no-gpu).

??? failure "Recording stops partway through with `Device lost mid-recording`"
    **Cause:** a camera or the gripper encoder dropped off: a loose cable, untightened screws, cable strain, a hub losing power, unstable power or poor contact. What was recorded so far is saved.

    **Fix:** the last second or two of that episode is stale repeats, so discard it. Check the screws, routing and USB port (if it recurs and changing ports does not help, see [Not enough USB bandwidth](#usb-bandwidth)), then continue into the same dataset with `--resume`, see [Recording](recording.md#52).

??? failure "On a machine with no discrete GPU, recording fails at the start saying the encoder will not open"
    **Cause:** no NVIDIA driver, but a GPU hardware encoder is in use.

    **Fix:** switch to a CPU encoder and turn streaming encoding off: `lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false`. The reasoning is in [Recording on a host with no NVIDIA GPU](recording.md#no-gpu).

??? failure "The encoder cannot keep up and dropped-frame warnings appear in the log"
    **Cause:** a full encoding queue waits up to 0.1s, then drops the frame and warns `Encoder queue full … dropped N frame(s)` (rather than blocking the collection loop).

    **Fix:** raise `--dataset.encoder_threads`, use `--dataset.vcodec=auto`, or adjust `--dataset.encoder_queue_maxsize`, see [Recording options](recording.md#54).

??? failure "The gripper opening is wrong / it does not read 0 when closed"
    **Cause:** the encoder zero has drifted or was never calibrated; an uncalibrated leader is refused and the command to run is printed.

    **Fix:** `python third_party/taccap-gripper/python/examples/calibrate.py left` (or `right`) recalibrates the zero and travel limit into MCU flash, once per unit, see [Gripper calibration](calibration.md#41).

??? failure "Calibration reports `encoder-max calibration needs command set >= V2.1`"
    **Cause:** the firmware command set is below V2.1 (i.e. leader < 1.2.0) and does not support travel calibration; `calibrate.py` exits without changing anything.

    **Fix:** flash the firmware (upgrade the SDK first, pick the image by role, pass just the file name), see [Firmware OTA upgrade](versions.md#ota), then re-run `calibrate.py`.

## Data and disk

??? failure "Collection slows down / the disk fills up"
    **Cause:** a bimanual rig can produce around 280 MB/s of raw video; too little space, slow sustained writes or encoding that cannot keep up all cause trouble.

    **Fix:** measure encoded size and dropped frames on a few episodes first; check `df -h` and the dataset directory size regularly, see [Storage planning](dataset.md#storage-planning).

## Docker image {#docker}

Only for the [Docker image](install.md#docker) path. For a busy serial port in the container, see `Device or resource busy` above.

??? failure "`could not select device driver ... gpu` / no GPU visible inside the container"
    **Cause:** the NVIDIA Container Toolkit is not installed properly, or the Docker daemon was not restarted after installing it.

    **Fix:** `install_customer.sh` installs it for you. To check by hand, run `docker run --rm --gpus all ubuntu:22.04 nvidia-smi`; if no GPU shows, reinstall the Toolkit and `sudo systemctl restart docker`. The host driver must be ≥ 570.144.

??? failure "`Unknown runtime specified nvidia`, `docker compose` will not start"
    **Cause:** the NVIDIA runtime is not registered with Docker, while `compose.yaml` uses `runtime: nvidia` (see [Graphics from inside the container](install.md#docker-gui)).

    **Fix:**

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # nvidia must appear in the output
    ```

??? failure "Rerun will not start in the container: `Failed to create surface for any enabled backend` / Vulkan adapter errors, but `nvidia-smi` is fine"
    **Cause:** X11 was not authorised; or the container lacks NVIDIA's Vulkan ICD, typically because `runtime: nvidia` in `compose.yaml` was changed to `gpus: all`, which requests compute + utility only. Then `vulkaninfo` reports `INCOMPATIBLE_DRIVER` or lists no NVIDIA device.

    **Fix:**

    - as the host desktop user, run `xhost +si:localuser:root` and check that `echo "$DISPLAY"` is non-empty and `/tmp/.X11-unix` exists;
    - if `docker info --format '{{json .Runtimes}}'` does not list nvidia, register it as in the previous entry; if it does, change `compose.yaml` back to `runtime: nvidia`;
    - confirm `vulkaninfo --summary` inside the container recognises the GPU.

??? failure "`pull access denied ... 'docker login'`, or you changed `LEROBOT_IMAGE_TAG` and still get the old image"
    **Cause:** the image is public and needs no login; the image name resolved wrongly, or `.env` was not pulled again after the change, or you are not in the `docker compose` directory.

    **Fix:** run `docker compose config --images` to see the image name, check `LEROBOT_IMAGE` in `.env` (the default is `ghcr.io/xenserobotics-ai/xense-taccap-lerobot`, and normally `.env` needs only the tag line), then `docker compose pull`. See [Pin the image version](install.md#docker-pin).

??? failure "Entering the container prints `groups: cannot find name for group ID <n>`"
    Harmless: the NVIDIA runtime injected the host's `render` group GID, and the container has no group by that name.

??? failure "Images `0.0.5` and earlier: `mamba activate` says `Shell not initialized`; recording dies as it starts with `FileNotFoundError: 'spd-say'`; every exported `.mp4` reports `Permission denied` while the metadata copies fine"
    **Cause:** three known problems of the old images, fixed from `0.0.6` on:

    - the environment is already active when you enter the container, so there is nothing to activate;
    - the image has no `spd-say` for voice announcements while `--play_sounds` defaults to `true`, so the process dies with `terminate called without an active exception`;
    - videos are `-rw------- root` while metadata is `0644`, so a non-root copy fails on the videos only; the files themselves are fine.

    **Fix:** upgrade the image (see [Pin the image version](install.md#docker-pin)). If you stay on an old image:

    - to switch environments by hand, run `eval "$(mamba shell hook --shell bash)"` first;
    - add `--play_sounds=false` when recording; collection is unaffected;
    - old-image videos keep their permissions after upgrading, so copy them as root and `chown` afterwards as in [Where the data lives](install.md#docker-data); do not use `--user`.

??? failure "The host sees the tactile sensors, the container does not"
    **Cause:** the container was not started through Compose (`/dev` and `/run/udev` not passed through), or the nodes have not settled after re-enumeration.

    **Fix:** enter with `docker compose run --rm xense-taccap` and check the nodes with `ls /dev/v4l/by-id/*GSPS*`. If empty, re-plug the USB hub on the host and run `sudo udevadm settle --timeout=20`.

??? failure "After a container restart the sensors are re-read and startup is slow"
    **Cause:** the `xensesdk-cache` volume was deleted; it caches sensor configuration by serial number so each start avoids re-reading flash and re-enumerating USB.

    **Fix:** keep it; what each volume holds is in [Where the data lives](install.md#docker-data).

---

Still stuck? Report it through the channels in [Support and feedback](../common/reference.md#support), with the complete error, the self-check output (`scan_grippers`'s side / role / firmware_sn), version information and the command that reproduces it.
