# Troubleshooting

Organised by **symptom**. Each entry: symptom → cause → fix. Most problems land in one of two
buckets — **serial permissions** and **ModemManager stealing the port** — so start there.

!!! tip "How to narrow it down"
    Run the self-check commands in [Quickstart §2](quickstart.md) first, then match against the
    symptoms below.

## Environment and installation

??? failure "`setup_env.sh --install` stops immediately with `needs system packages that are not installed`"
    **Cause**: the hardware SDKs are compiled on the spot, and the machine is missing some of
    `build-essential` / `cmake` / `pkg-config` / `git` / `curl`. The script stops **deliberately,
    before it starts** — otherwise the error would surface at the CMake or link stage and look
    like a broken SDK.
    **Fix**: type the line it prints. The full list is in
    [Prerequisite: system packages](02-environment.md#apt).

    There is a second check that only **warns** and does not block: missing `v4l-utils` /
    `usbutils`. **Do not skip it** — `v4l2-ctl` and `lsusb -t` are the only tools you have when a
    camera will not open.

??? failure "`import xensesdk` / `import xensevr_pc_service_sdk` / `import xense.taccap` fails"
    **Cause**: the environment is incomplete, or the `xense-taccap` environment is not active.
    **Fix**:
    ```bash
    mamba activate xense-taccap
    ./setup_env.sh --install     # re-run the install
    ```
    Verifying them one by one: [Environment setup §2.5](02-environment.md#25).

??? failure "`torchcodec` fails to load / video encoding errors"
    **Cause**: `torchcodec` does not match the PyTorch it is running against, or PyAV is not the
    required `15.1.0`.
    **Fix**: re-run `setup_env.sh --install`, which corrects the versions automatically. Install a
    system FFmpeg with `libsvtav1` separately only if you actually need one.

## Docker delivery image {#docker}

Only relevant on [the Docker path](02-environment.md#docker).

??? failure "`could not select device driver ... gpu` / no GPU inside the container"
    **Cause**: the NVIDIA Container Toolkit is not installed, or the Docker daemon was not
    restarted after installing it.
    **Fix**: `install_customer.sh` installs it for you; to check by hand —

    ```bash
    docker run --rm --gpus all ubuntu:22.04 nvidia-smi
    ```

    The container can only use the GPU if this shows it. If it does not, reinstall the Toolkit and
    `sudo systemctl restart docker`. The host driver itself must be **≥ 570.144**.

    !!! note "Passing this does not mean graphics works"
        `--gpus all` requests compute + utility only. CUDA working while Rerun refuses to start is
        a different problem — see the `Failed to create surface` entry below.

??? failure "`Unknown runtime specified nvidia`, `docker compose` will not start"
    **Cause**: the NVIDIA runtime is not registered with Docker. `compose.yaml` uses
    `runtime: nvidia` (to get graphics capability — the reasoning is in
    [Graphics from inside the container](02-environment.md#docker-gui)), and without the
    registration it fails outright.
    **Fix**:

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    docker info --format '{{json .Runtimes}}'     # nvidia must appear in the output
    ```

??? failure "Rerun reports `Failed to create surface for any enabled backend`, but `nvidia-smi` is fine"
    **Cause**: the container got CUDA but not NVIDIA's Vulkan ICD. The usual reason is that
    someone changed `runtime: nvidia` in `compose.yaml` back to `gpus: all`, which requests
    compute + utility only. Inside the container `vulkaninfo` will report `INCOMPATIBLE_DRIVER` or
    list no NVIDIA device.
    **Fix**:

    ```bash
    docker info --format '{{json .Runtimes}}'     # confirm nvidia is listed
    ```

    If it is not, register the runtime as in the previous entry. If it is, change `compose.yaml`
    back to `runtime: nvidia` — **do not** use `gpus: all`.

??? failure "`docker compose` reports `pull access denied ... 'docker login'`"
    **Cause**: usually not a permissions problem — the image package is **public** and pulling
    needs no login. Far more often the image name resolved to something unexpected.
    **Fix**:

    ```bash
    docker compose config --images
    ```

    Check the resolved image name, then look for a mistyped `LEROBOT_IMAGE` in `.env`. The default
    is `ghcr.io/vertax42/xense-taccap-lerobot`, and **normally `.env` needs only the tag line** —
    see [Pin a version before you record](02-environment.md#docker-pin).

??? failure "Changed `LEROBOT_IMAGE_TAG` in `.env` but still get the old image"
    **Cause**: it was not pulled again after the change, or `.env` is not in the directory you run
    `docker compose` from.
    **Fix**: confirm what resolves, then pull:

    ```bash
    docker compose config --images
    docker compose pull
    ```

    See [Pin a version before you record](02-environment.md#docker-pin).

??? failure "`mamba activate` inside the container says `Shell not initialized`"
    **Cause**: there is nothing to activate — **the environment is already active** when you enter
    the container, and commands like `lerobot-info` work straight away.
    **Fix**: if you really do want to switch environments by hand, initialise the shell hook once:

    ```bash
    eval "$(mamba shell hook --shell bash)"
    ```

    Images from `0.0.6` on ship this hook already, so the message no longer appears.

??? failure "Entering the container prints `groups: cannot find name for group ID <n>`"
    **Harmless**, ignore it. The NVIDIA runtime injected the host's `render` group GID and the
    container has no group by that name — that is all. It affects neither the GPU, nor the
    cameras, nor collection.

??? failure "`lerobot-record` in the container dies as recording starts, with `FileNotFoundError: 'spd-say'`"
    **Cause**: each episode is announced by text-to-speech, and the `spd-say` binary it uses is
    **not in the `0.0.5` or earlier images** — while `--play_sounds` defaults to `true`. The first
    episode announcement raises, the "Stop recording" announcement in teardown raises again while
    that is being handled, and the process dies with
    `terminate called without an active exception`.
    **Fix**: turn the announcements off. **Collection itself is unaffected:**

    ```bash
    lerobot-record --play_sounds=false ...
    ```

    **Fixed from `0.0.6` on** — a failed announcement warns once and recording continues, so the
    flag is no longer needed after upgrading. Machines still pinned to `0.0.5` or earlier need it.
    Hosts on the Mamba path that have `speech-dispatcher` installed are unaffected.

    !!! note "Even after the fix, the container stays silent"
        The `0.0.6` image installs `speech-dispatcher` but **no speech synthesiser module**, so the
        announcement is skipped safely and warned about once. **That is deliberate**: there is no
        working audio sink in the container, and adding a synthesiser turns `spd-say` from failing
        immediately into hanging, which is worse. To actually hear the announcements, record on the
        host.

??? failure "Exporting data fails with `Permission denied` on every `.mp4`, while the metadata copies fine"
    **Cause**: videos recorded by the `0.0.5` and earlier images are `-rw------- root` (the
    temporary file used for concatenation is `0600` and the move preserved its mode), while the
    metadata is a normal `0644`. So a non-root copy fails on **the videos only**, which reads like a
    few damaged files — the files are in fact fine.
    **Fix**: export using the **copy as root, then `chown`** form in
    [Where the data lives](02-environment.md#docker-data); do not use `--user`. **From `0.0.6` on,
    recorded videos are `0644`** and this stops happening — but that depends on the image that
    recorded the data, and upgrading does not rewrite files already written, so older data still
    needs the form above.

??? failure "`/dev/ttyACM*` is visible in the container but reports busy"
    **Cause**: ModemManager took the port, which is a **host** matter — the container has no say
    over the host's hot-plug rules.
    **Fix**: install the udev rule on the host (see [3.2](03-host-hardware.md#32)) and re-plug the
    gripper. `install_customer.sh` already installed it once; verifying by hand is the same as 3.2.

??? failure "The host sees the tactile sensors, the container does not"
    **Cause**: the container was not started through Compose (so `/dev` and `/run/udev` were not
    passed through), or the device nodes have not settled after a USB re-enumeration.
    **Fix**: enter with `docker compose run --rm xense-taccap`, then confirm the nodes exist inside
    the container —

    ```bash
    ls /dev/v4l/by-id/*GSPS*
    ```

    If that is empty, go back to the host, re-plug the USB hub and run
    `sudo udevadm settle --timeout=20`.

??? failure "No Rerun window from the container / Vulkan adapter errors"
    **Cause**: X11 was never authorised, or the container cannot see the NVIDIA GPU.
    **Fix**: on the host, as the graphical desktop user, run `xhost +si:localuser:root` and check
    that `echo "$DISPLAY"` is non-empty and `/tmp/.X11-unix` exists. Then, inside the container,
    confirm that both `nvidia-smi` and `vulkaninfo --summary` recognise the GPU.
    See [Graphics from inside the container](02-environment.md#docker-gui).

    If `nvidia-smi` is fine and only `vulkaninfo` cannot see the GPU, graphics capability was not
    injected — see the `Failed to create surface` entry above.

??? failure "After a container restart the sensors are re-read and startup is slow"
    **Cause**: the `xensesdk-cache` volume was deleted, taking the configuration cache with it.
    **Fix**: leave it alone. It caches each sensor's configuration by serial, which avoids
    re-reading sensor flash — and the USB re-enumeration that triggers — on every start. What each
    volume holds: [Where the data lives](02-environment.md#docker-data).

## Serial permissions and device discovery

??? failure "`connect()` reports `No leader gripper discovered for the <side> side.`"
    **Cause** (by far the most common): the user is not in the `dialout` group, so the SDK can
    *list* the grippers but cannot open the serial port to read the firmware SN — leaving
    `role=Unknown` and an empty `firmware_sn`. Underneath it is
    `IoError: SerialBus: open(...): Permission denied`.
    **Fix**:
    ```bash
    sudo usermod -aG dialout "$USER"
    ```
    **You must log out and back in after adding the group** (or `newgrp dialout`) **and then
    re-plug the gripper.** Without a fresh login the terminal still holds the old permissions and
    the error is identical, which makes it very easy to think the command did not work. Details in
    [3.1 Serial permissions](03-host-hardware.md#31).

??? failure "`Device or resource busy` (starting immediately after a hot-plug)"
    **Cause**: **ModemManager** probes the CH343 serial port with AT commands on every hot-plug and
    holds it for a few seconds. The classic shape: the first start works, then you unplug, move to
    another port, restart immediately, and get busy. (`brltty`, if installed, grabs it the same
    way.)
    **Fix**: temporarily — wait ~3 s after plugging in. Permanently — a udev rule that makes it
    ignore `1a86` devices:
    ```bash
    sudo tee /etc/udev/rules.d/99-taccap-ignore-modemmanager.rules >/dev/null <<'EOF'
    ACTION=="add|change", SUBSYSTEMS=="usb", ATTRS{idVendor}=="1a86", ENV{ID_MM_DEVICE_IGNORE}="1"
    EOF
    sudo udevadm control --reload-rules && sudo udevadm trigger
    ```
    Details in [3.2 Stopping ModemManager from grabbing the port](03-host-hardware.md#32).

??? failure "`firmware_sn` is still empty after fixing permissions / `role=Unknown`"
    **Cause**: the device SN may not have been burned in, the serial read may still be failing, or
    there may be a firmware communication or device-side configuration problem. An empty SN alone
    is not enough to conclude anything about a particular firmware version.
    **Fix**: save the complete low-level error, retest with a different cable and a different port,
    and if it is still empty, contact the device or firmware team to check the SN programming and
    the communication state.

??? failure "The error names a specific hub or serial number"
    **Cause**: discovery found that the hardware assembly does not match the "odd is left, even is
    right" rule — a non-conforming serial, the wrong count on a side, both fingertip tactile
    sensors mapping to the same side, or a tactile hub with no matching gripper.
    **Fix**: work through the assembly and cabling of **the physical device/hub the error names**.
    The rules are in [3.3 Device discovery](03-host-hardware.md#33).

## Pico4 Ultra Enterprise Edition tracker and pose

??? failure "No pose / the tracker will not connect / the pose is unstable"
    **Cause**: **the computer's WiFi conflicting with the Pico4 Ultra Enterprise Edition wired
    network sharing** (most common); or XenseVR PC Service not started, XTac-UMI XR not started, or
    the tracker unpaired or out of charge.
    **Fix**: **turn the collection machine's WiFi off first** (leave only the Pico4 Ultra
    Enterprise Edition wired sharing — see [3.4 Network](03-host-hardware.md#pico-network)), then
    walk through the [power-on order](03-host-hardware.md#36). Start the service with
    `/opt/apps/roboticsservice/runService.sh`, and if needed self-check with
    `python -m lerobot.robots.taccap_gripper.check_tracker`.

??? failure "The pose reference frame drifts between episodes"
    **Cause**: **XTac-UMI XR was restarted** partway through, which reset the world origin.
    **Fix**: **never restart** XTac-UMI XR during a collection session. See
    [3.4 Pico4 Ultra Enterprise Edition setup](03-host-hardware.md#34).

??? failure "The pose cuts out between episodes / the headset blanks its screen by itself"
    **Cause**: screen blanking and system sleep were not disabled on the headset, so after
    suspending, XTac-UMI XR was paused or killed by the system. Restarting XTac-UMI XR then
    re-freezes the world frame, which stacks the previous entry's frame drift on top.
    **Fix**: Enterprise settings → System settings → **Power policy**. Set **system sleep** to
    "Never" **first**, and **only then** set **screen blanking** to "Never" — in the other order,
    blanking gets clamped back to a finite value by the sleep timeout. See
    [System settings · Power policy](03-host-hardware.md#pico-system).

??? failure "The tracker is not selectable in tracking mode / PC Service does not discover that SN"
    **Cause**: the tracker is **not bound to this headset** (a new unit, a swapped tracker, a
    swapped headset, or a factory reset).
    **Fix**: open the "Motion Tracker" app and complete the binding — both units. See
    [Binding the motion trackers to the headset](03-host-hardware.md#pico-tracker-bind).

??? failure "The pairing screen cannot find the tracker"
    **Cause**: the tracker is merely powered on (**steady blue light**) and not in Bluetooth
    pairing mode.
    **Fix**: **hold the power button for about 6 seconds** until the indicator **alternates blue
    and red**, then tap "Start pairing". See
    [Binding the motion trackers to the headset](03-host-hardware.md#pico-tracker-bind).

??? failure "XTac-UMI XR keeps showing \"not connected\""
    **Cause**: usually not the app at all — the wired network sharing is not connected properly, or
    the collection machine's WiFi is still on.
    **Fix**: tap "**Reconnect**" first. If that does not help, redo
    [the network setup](03-host-hardware.md#pico-network) and confirm the computer's WiFi is off.
    See [The app's interface](03-host-hardware.md#pico-toolkit-ui).

??? failure "The headset says \"connected\" but the PC receives no pose at all"
    **Cause**: the headset showing connected only means the app reached the service. If the
    host-side service is not running, or the tracker is off or unbound, there is still no pose.
    **Fix**: confirm the host has started
    [XenseVR PC Service](03-host-hardware.md#35), then use `ConsoleDemo` in
    `/opt/apps/roboticsservice/` or
    `python -m lerobot.robots.taccap_gripper.check_tracker` to see whether a pose with an `sn`
    comes through. If not, go back to [binding](03-host-hardware.md#pico-tracker-bind) and confirm
    both trackers are powered on and show "connected".

??? failure "The tracker is matched to the wrong side / PC Service enumeration is unstable"
    **Cause**: a non-conforming serial number, or jitter in enumeration.
    **Fix**: pin it literally with `--robot.tracker_serial=<SN>` (no enumeration, no validation),
    or check **the digit before the trailing letter `G`** in the serial: odd is left, even is
    right.

## Headset camera {#head-camera}

??? failure "`--robot.enable_head_camera=true` hangs waiting for the first frame"
    **Cause**: the camera frames are relayed by PC Service, and any broken link in that chain means
    no frames: a service older than v0.2.0 (v0.1.0 does not relay headset camera frames), or the
    headset app not streaming.
    **Fix**: check in this order —

    ```bash
    # 1) the service deb version: needs ≥ 0.2.0
    dpkg -s xensevr-pc-service | grep -E '^(Version|Architecture):'
    # 2) does it expose the camera interface
    python -c "import xensevr_pc_service_sdk as xrt; print(hasattr(xrt, 'has_pico_camera_frame'))"
    ```

    Then confirm the headset is connected to PC Service and the app is streaming (the camera and
    the tracker **share one connection**). See
    [5.6 Headset camera · prerequisites](05-data-collection.md#56).

??? failure "`AttributeError: module 'xensevr_pc_service_sdk' has no attribute 'has_pico_camera_frame'`"
    **Cause**: an **older interface** is being loaded (the camera interface arrived with v0.2.0).
    This module links the C SDK taken from the installed `.deb`, so **start by checking which
    `.deb` is installed**:

    ```bash
    dpkg -s xensevr-pc-service | grep -E '^(Status|Version):'
    ```

    **Fix**: pull the latest main repo and re-run `./setup_env.sh --install` (it upgrades the
    `.deb` to the baseline version as well). If it is still `False`, use
    `python -c "import xensevr_pc_service_sdk as x; print(x.__file__)"` to see which copy is being
    loaded. If `Status` is not `install ok installed` — e.g. it was removed with `dpkg -r`, leaving
    `deinstall ok config-files` — reinstall the same way.

??? failure "Repeated left/right eye skew warnings in the log"
    **Cause**: the two eyes arrive as two independent messages, and their frame numbers differ
    while their timestamps differ by more than `--robot.head_camera_pair_max_skew_ms` (20 ms by
    default). Usually a heavily loaded host, or jitter on the link between headset and PC.
    **Fix**: the warning **does not interrupt recording**, but for those frames the two eyes may
    not be the same exposure. Reduce host load first (fewer cameras, or
    `--robot.head_camera_eyes=left` to record one eye only); for link problems work through
    [3.4 Network](03-host-hardware.md#pico-network). Only once you are sure it is just jitter,
    consider relaxing the threshold.

??? failure "`head_camera_width/_height` errors saying the size is unsupported"
    **Cause**: the headset camera **only accepts `640x480` (default), `1024x768` and `1280x960`**
    (all 4:3, matching the sensor), one per setting in the headset app's Resolution. Anything else
    is an error rather than a silent downgrade — resampling would quietly change the recorded field
    of view.
    **Fix**: go back to one of the three supported sizes. Note that **changing the size means a
    different set of data**: episodes from before and after the change cannot be mixed. See
    [5.6 Headset camera](05-data-collection.md#56).

??? failure "The size is one of the supported values but connect still reports a first-frame size mismatch"
    **Cause**: the size on the command line does not match the **"Resolution" setting in the
    headset**. The headset is what produces the image; the parameter only declares what you expect
    to receive.
    **The common case**: the headset was raised to `1024` or `1280` while the command line is
    still on the default 640x480.
    **Fix**: use the same value on both sides — at the headset's default `640` pass nothing; at
    `1024` add `--robot.head_camera_width=1024 --robot.head_camera_height=768`; at `1280` add
    `--robot.head_camera_width=1280 --robot.head_camera_height=960`.
    The headset-side setting is in [The app's interface](03-host-hardware.md#pico-toolkit-ui).

## Collecting and recording

??? failure "The command exits the moment you press enter: `--robot.id is required`"
    **Cause**: `--robot.id` is the **required** station number, and it is checked **while parsing
    the command line** — so it exits before touching any device. That is a good thing: no rig ever
    records a batch of data anonymously.
    **Fix**: add the station number. **A bare number is enough** (`0`, `1`, …; one per rig, and a
    bimanual rig counts as one). The prefix is filled in from `--robot.type`, giving `taccap_0` or
    `bi_taccap_0`:

    ```bash
    lerobot-record --robot.type=bi_taccap_gripper --robot.id=0 ...
    ```

    It names the station, not the hardware, so swapping a gripper does not change it; the devices'
    identity is recorded in the dataset's `meta/hardware.json` — see
    [`--robot.id` and the hardware manifest](05-data-collection.md#robot-id).

??? failure "Resuming warns that the dataset's existing `meta/hardware.json` does not match the current hardware"
    **Cause**: you resumed into a dataset with `--resume` but **the hardware changed** (a different
    gripper or different tactile sensors). The program **keeps the original file** and warns — the
    episodes already recorded really did come from the original devices, and overwriting the file
    would misattribute them.
    **Fix**: the warning does not stop recording. If the hardware change was intentional, carry
    on — the warning is precisely the record that "this dataset spans two sets of hardware". If it
    was not intentional (a gripper plugged into the wrong place, say), stop and put the original
    hardware back.

??? failure "`[slow_frame]` appears constantly in the log after enabling `--display_data=true`"
    **Cause**: the Rerun display is itself eating the frame budget. Measured on a bimanual rig with
    the headset (four tactile streams, two wrist cameras, two eyes): 13.2 ms per frame with JPEG
    compression, 3.1 ms without. At 30 fps the whole budget is 33.3 ms, so compression alone takes
    40% — before camera reads and pose computation.

    **Look at `top_obs=` at the end of the `[slow_frame]` line first**: a slow sensor and an
    expensive display look identical in the timeout number but have opposite fixes.

    **Fix**: both defaults are already the fast ones (`--display_compressed_images=false`,
    `--display_image_every_n=1`) — first confirm nobody changed them. If it still overruns, raise
    `--display_image_every_n`: camera images refresh less often while scalars like `tcp.*` and
    `gripper.pos` stay at full rate. Treat it as a last resort, since it is the only option that
    changes what the operator sees.

??? failure "Recording stops partway through with `Device lost mid-recording`"
    **Cause**: a camera or the gripper encoder **dropped off the bus** (a loose cable, a hub losing
    power, a bad USB port). Collection stops on purpose once it detects this, and **what was
    recorded so far is saved** — deliberately, because it beats writing invented values into the
    dataset.
    **Fix**: the last second or two of that episode is repeated stale values, so **discard that
    episode**. Check the cable and the USB port (if it keeps happening and changing ports does not
    help, see [Not enough USB bandwidth](#usb-bandwidth)), then continue into the same dataset with
    `--resume`. See [5.2 Recording](05-data-collection.md#52).

??? failure "On a machine with no discrete GPU, recording fails at the start saying the encoder will not open"
    **Cause**: the machine has no NVIDIA driver but is being asked to use a GPU hardware encoder.
    **Fix**: switch to a CPU encoder and turn streaming encoding off —

    ```bash
    lerobot-record ... --dataset.vcodec=libsvtav1 --dataset.streaming_encoding=false
    ```

    Why a host without a GPU should turn streaming encoding off:
    [Recording on a machine with no NVIDIA GPU](05-data-collection.md#no-gpu).

??? failure "The encoder cannot keep up and dropped-frame warnings appear"
    **Cause**: when the real-time encoding queue is full the oldest frame is dropped (rather than
    blocking the collection loop).
    **Fix**: raise `--dataset.encoder_threads`, use hardware encoding with
    `--dataset.vcodec=auto`, or adjust `--dataset.encoder_queue_maxsize`. See
    [5.4 Recording options](05-data-collection.md#54).

??? failure "The gripper opening is wrong / it does not read 0 when closed"
    **Cause**: the encoder zero has drifted, or was never calibrated.
    **Fix**: re-run the zero calibration:
    ```bash
    python third_party/taccap-gripper/python/examples/calibrate.py left    # or right
    ```
    This calibrates both the zero and the travel limit, and writes both into MCU flash. See
    [4.1 Gripper calibration](04-calibration.md#41).

??? failure "Calibration reports `encoder-max calibration needs command set >= V2.1`"
    **Cause**: this gripper's firmware command set is below V2.1 (i.e. leader < 1.2.0) and does not
    support travel calibration. `calibrate.py` **exits without changing anything**, so you are never
    left with a half-done "zero calibrated, travel not" state.
    **Fix**: flash the firmware. Since 0.1.7 the SDK ships the released images in
    `third_party/taccap-gripper/firmware/`, so the firmware sources are no longer needed:
    ```bash
    python third_party/taccap-gripper/python/examples/ota_update.py \
        tc-gu-01-master.bin --side left
    ```
    **Upgrade the SDK before flashing** (flashing requires SDK 0.1.7 or newer), and pick the image
    **by role** — by the trailing `m`/`s` of the firmware SN, not by left or right. Full procedure
    and risks: [Firmware OTA upgrade](versions.md#ota). Re-run `calibrate.py` afterwards.

??? failure "Flashing says it is looking for the `.bin` under some directory that does not exist"
    **Cause**: the image path was written the wrong way. The images ship with the SDK under
    `third_party/taccap-gripper/firmware/`; you do not assemble the path yourself.
    **Fix**: **pass just the file name** — `tc-gu-01-master.bin` / `tc-gu-01-slave.bin`. The script
    looks it up in the SDK's `firmware/` itself, from whatever directory you run it in. See
    [Firmware OTA upgrade](versions.md#ota).

??? failure "The wrist camera or a tactile sensor will not open, `video ... busy`"
    **Cause**: the camera is held by an external camera service, or the user is not in the `video`
    group.
    **Fix**: check the camera service, and add the user to the `video` group
    (`sudo usermod -aG video "$USER"`, effective after logging back in).

### Not enough USB bandwidth {#usb-bandwidth}

!!! danger "On a bimanual rig, measure this on day one — do not wait for a camera to fail"
    This is **the most common** class of failure on a bimanual rig in the field, and it is already
    decided the moment you plug the cables in — by **which physical ports the two grippers went
    into**. How to measure it is under "First establish that it is bandwidth" below; running
    `lsusb -t` once during bring-up is far faster than tracing back through serial numbers, cables
    and drivers after something breaks.

??? failure "One camera will not open (`Cannot open camera N`), and it is a different one each time"
    **Cause**: **not enough USB bandwidth** — nothing is broken. Every UVC camera **exclusively
    reserves** a share of isochronous bandwidth for as long as it is open, and that budget is
    computed **per USB 2.0 bus**: 480 Mbit/s per bus, of which about **384 Mbit/s** is available
    for isochronous transfers. Once the budget is exceeded, **whichever camera opened last fails**
    — and which one that is can differ every time, which is why the fault appears to wander. The
    device nodes exist and `lerobot-find-cameras` lists them; they just will not open.

    !!! warning "Using a blue USB 3 port does not help"
        Both the tactile sensors and the wrist cameras are **USB 2.0 devices**. Plugged into a
        USB 3 port they still land on that controller's USB 2.0 bus and draw on the same budget.

    **First establish that it is bandwidth** — count the cameras on each bus:

    ```bash
    lsusb -t
    ```

    **Every `480M` `root_hub` line in the output is one budget.** A bimanual rig has **six**
    cameras (four tactile + two wrist), plus a laptop's built-in webcam. Six on one bus is **very
    likely over** (measurements below); **three on each of two `480M` buses** has plenty of room.

    Watch the kernel log in another terminal while starting up:

    ```bash
    sudo dmesg -w | grep --line-buffered -iE "uvcvideo|bandwidth|disconnect"
    ```

    `--line-buffered` **is not optional** — without it `grep` buffers and looks like it has hung.
    The moment a camera fails to open it prints `Not enough bandwidth for altsetting N`, and the
    diagnosis ends there: this is not something software can work around.

    **You can also run the two halves separately**, which turns "a camera is broken" into
    arithmetic:

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

    If each half works and the combination fails, it is bandwidth.
    **`enable_tactile=false` is only for this diagnostic — never record with it**, or the dataset
    comes out with no tactile data at all.

    **Fix**: first confirm the wrist cameras were not switched from the default `MJPG` to `YUYV`
    (`--robot.wrist_camera_fourcc`) — `MJPG` is the default precisely to free up bandwidth. If it
    is still over budget, **the only thing that actually works is adding another USB host
    controller**, not another hub: a Thunderbolt / USB4 dock brings its own xHCI controller, an
    ordinary hub does not. Once it is connected, move one gripper onto it and re-run `lsusb -t` to
    confirm what appeared is **a new `480M` root_hub line**, not another nested hub.

    Until a second controller is in place you can record with the **wrist cameras off**: tactile,
    pose and gripper opening are all still there, but the dataset will not have the
    `{side}_wrist` key — **decide this before you start recording**, not halfway, because half with
    and half without are two incompatible observation schemas.

??? failure "How far over budget is it, exactly?"
    **There is no universal answer to whether six cameras fit on one bus** — how much each device
    requests can vary between production batches, so **measure on the machine in front of you** and
    do not carry over a conclusion from elsewhere. This is also exactly why it gets mistaken for
    "flaky hardware".

    Measured on one bimanual host that was over budget (a single `480M` bus):

    | Cameras enabled | Reserved | Result |
    |---|---|---|
    | Four tactile only (`_enable_wrist_camera=false` on both sides) | 242 Mbit/s | works |
    | Two wrist cameras only (`--robot.enable_tactile=false`) | within budget | works |
    | All six (default) | 6 × 60.4 = 362 Mbit/s | **fails** |

    `altsetting 6` is 944 bytes per microframe, i.e. **60.4 Mbit/s per tactile sensor**, while
    320x240 YUYV@30 is only about 37 Mbit/s of actual data — devices request more than they use,
    and the wrist cameras more still. 362 against ~384 is **right on the edge**, which is why a
    different camera fails each time and it looks intermittent.

    To read these numbers yourself:

    ```bash
    # I:* is the active altsetting; the class name is lower-case (video) in this file
    sudo grep -E "^(T:|I:\*.*video|E:.*Isoc)" /sys/kernel/debug/usb/devices
    ```

    Each video interface's `Alt=` and the `MxPS=` on its `E:` line give the reservation
    (`MxPS × 8000 × 8` bit/s); **sum per bus** and compare against ~384 Mbit/s. How much a device
    requests is written into **the firmware's UVC descriptors** and the collection program cannot
    change it — which is why the conclusion can only be "this bus cannot hold these cameras", never
    "some parameter is set wrong".

??? failure "Three things that look like fixes and are not"
    - **Moving to a different physical USB port.** The cameras are USB 2.0 devices and **every port
      on the same controller shares one bus**. To change anything you have to move to **a different
      controller** (see the entry above).
    - **Lowering `--robot.tactile_fps`.** It only throttles the Python-side read loop; the sensor
      SDK's streaming interface takes no fps argument, so **nothing changes on the USB bus**.
    - **`uvcvideo quirks=128`** (`UVC_QUIRK_FIX_BANDWIDTH`). Measured to have no effect: it
      recomputes the reservation as `width × height × bpp`, and a compressed format has no
      meaningful bpp — so it has nothing to work with on the MJPEG wrist cameras, which are the
      biggest consumers.

## Data and disk

??? failure "Collection slows down / the disk fills up"
    **Cause**: a bimanual rig with several cameras can produce around 280 MB/s of raw video
    throughput; how much actually reaches the disk after real-time encoding depends on resolution,
    scene content, the encoder and the bitrate. Insufficient free space, insufficient sustained
    write performance, or encoder threads that cannot keep up will all cause trouble.
    **Fix**: measure the encoded size and the dropped-frame situation on a handful of episodes
    before planning a large run, and keep an eye on `df -h` and the dataset directory size. Details
    in [Data Management & Naming](data-management.md#storage-planning).

---

Still stuck? Report it through the channels in [Versions & Support](versions.md#support), with the
complete error, the self-check output (`scan_grippers`'s side / role / firmware_sn), version
information and the command that reproduces it.
