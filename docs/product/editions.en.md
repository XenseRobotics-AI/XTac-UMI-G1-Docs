# Product line and configuration comparison

XTac-UMI comes in two configurations that share the same XTac-UMI G1 grippers and Pico4 Ultra Enterprise headset and record the same data:

- **Backpack Kit**: the backpack runs all collection and a tablet browser is the console; turnkey and built for large-scale field collection. The collection software is not open source.
- **Developer Kit (open source)**: the grippers and headset connect straight to your workstation and record with open-source LeRobot; built for research and algorithm teams who want to customise freely.

This page compares the two and lists each kit's box contents and wiring.

<div class="grid cards xu-cards" markdown>

-   ![Backpack Kit wiring: both grippers and the headset connected to the backpack](../assets/product/backpack-wiring-adapter.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--backpack">Backpack Kit</span>

    **XTac-UMI Data Collection Backpack**{ .xu-card__title }

    ---

    The backpack is the host and a tablet the console; record with the gripper buttons and publish to ModelScope in one click.

    [Quickstart](../backpack/index.md){ .md-button .md-button--primary }

-   ![Developer Kit live Rerun preview while recording](../assets/dataset/rerun-xtac-umi-g1.webp){ .xu-card__img }

    <span class="xu-tag xu-tag--pc">Developer Kit</span>

    **XTac-UMI G1 Developer Kit (open source)**{ .xu-card__title }

    ---

    Plugs into your workstation and records a LeRobotDataset; the collection software and SDK are open source.

    [Quickstart](../pc/quickstart.md){ .md-button .md-button--primary }

</div>

## How the two differ

| | Backpack Kit · the XTac-UMI Backpack | Developer Kit · the XTac-UMI G1 Developer Kit |
|---|---|---|
| Compute node | The RK3588 backpack that ships with it, eMMC system disk + NVMe data disk | Your own x86 workstation, installed from source with Mamba or from a Docker image; real collection requires an NVIDIA GPU, and the Mamba path installs without one but can only record in a degraded mode |
| Interface | A browser console: live monitor / projects / replay / system; a tablet, phone or PC acts purely as a browser | Terminal commands plus a Rerun preview window |
| How it connects | The grippers go to `UMI-L` / `UMI-R`; the headset goes to the `PICO` port over the USB Network (wired only); the operating device joins the backpack hotspot or the LAN | The grippers connect to the host over USB directly; the headset connects to the host with a Type-C cable over wired network sharing (wired by default, WiFi only for quick debugging); the host runs XenseVR PC Service |
| Recording control | Long-press the right gripper to start, long-press the left to stop, double-click the left to delete the previous take; LED feedback; the console can do the same | `lerobot-record` command-line arguments, with `--robot.id` required |
| Capture modes | Dual gripper · dual gripper + stereo headset · dual gripper + right mono headset · single gripper · single gripper + stereo headset · stereo headset only; every mode needs the headset for pose, and only the three dual-gripper modes can currently be exported | Single or dual gripper, with the headset camera optional |
| Raw data | On the device, one MCAP raw recording per episode, storing the cameras' raw MJPEG frames (hardware H.264 encoding is used only for live preview); the `LeRobot dataset` and `mcap` you hand out are both offline export products | LeRobotDataset v3 written straight to disk |
| Export and upload | Task-level export: pick the destination first (download to device / upload to remote), then the format (`LeRobot dataset` / `mcap`, two equals). Downloading gives you an archive; uploading goes through an upload backend you configured beforehand (ModelScope, S3, FTP / FTPS, NFS or STS), local files are kept by default after an upload, and "Archive" — always available — frees the space | Hugging Face Hub |
| Upgrading | Import a firmware bundle (`.tar.zst`) on the System page, with the previous version kept for rollback; stop recording before applying one by hand, and an update pushed remotely waits for the current take to finish before restarting | Pull the repo, run the install script or switch the image tag; gripper firmware OTA uses the SDK script |
| Customisation | Not open source, light: the collection software is delivered and upgraded as a whole firmware bundle, and customisation builds on the exported `LeRobot dataset` / `mcap` output, the upload configuration and the capture settings rather than on the software itself | Fully open: the collection software and gripper SDK are open source under Apache-2.0, so you can change the Python code or hook up your own robot |
| Who it suits | High-volume collection operations, data collection teams, external sites | Research and algorithm teams, in-house training pipelines |

## Box contents and wiring {#kit}

=== "Backpack Kit"

    | Item | Qty | Spec and notes |
    |---|---|---|
    | XTac-UMI G1 leader gripper | 2 | One left and one right, told apart by the last digit of the serial number: odd is left, even is right |
    | Leader gripper cable | 2 | Type-C to Type-C, 1.5 m, one per side; locking connector at the gripper end, the other end into the backpack's `UMI-L` / `UMI-R` |
    | Pico4 Ultra Enterprise headset | 1 | With controllers and motion trackers; the trackers mount on top of the two leader grippers |
    | Tracker charging dock | 1 | Three-way |
    | Headset cable (Pico → Pack) | 1 | Type-C to Type-C, 1.5 m, headset to the backpack's `PICO` port |
    | Backpack | 1 | Compute node with an always-on 5 GHz hotspot |
    | Waist belt | 1 | For wearing the backpack |
    | 12 V power adapter | 1 | 12 V 3 A, 1.5 m lead, into the backpack's `DC` port |
    | Power bank | 1 | 20000 mAh, 45 W |
    | 12 V PD power cable | 1 | 0.3 m, power bank to the backpack's `DC` port |
    | Tablet | 1 | 6 GB + 128 GB, with case; serves as the console |
    | Type-C charging plug | 1 | |

    Use the adapter at a fixed workstation and the power bank for mobile collection:

    <div class="tc-pair tc-pair--wiring" markdown>

    <figure class="tc-shot" markdown>
    ![Adapter wiring: the headset to the PICO port, the left and right grippers to UMI-L / UMI-R, the adapter to DC](../assets/product/backpack-wiring-adapter.webp)
    <figcaption>Adapter power (fixed workstation)</figcaption>
    </figure>

    <figure class="tc-shot" markdown>
    ![Power-bank wiring: both leader grippers and the headset to the backpack, the power bank to the backpack's DC port](../assets/product/backpack-wiring-powerbank.webp)
    <figcaption>Power-bank power (mobile collection)</figcaption>
    </figure>

    </div>

    The wiring steps are in [Adapter power](../backpack/unbox-connect.md#adapter) and [Power-bank power](../backpack/unbox-connect.md#powerbank); the safety requirements for powering and unplugging in order are in [The backpack and its power](safety.md#backpack-power); connecting to the backpack and opening the console is in [The backpack hotspot](../backpack/network.md#softap).

=== "Developer Kit"

    | Item | Qty | Spec and notes |
    |---|---|---|
    | XTac-UMI G1 leader gripper | 2 | One left and one right, told apart by the last digit of the serial number: odd is left, even is right |
    | Leader gripper cable | 2 | Type-C to Type-A, USB 2.0, 3 m; locking connector at the gripper end |
    | Pico4 Ultra Enterprise headset | 1 | With controllers and motion trackers; the trackers mount on top of the two leader grippers |
    | Tracker charging dock | 1 | Three-way |
    | Headset cable | 1 | Type-C to Type-C, 1.5 m, headset to the host |

    With the optional follower grippers you also get:

    | Item | Qty | Spec and notes |
    |---|---|---|
    | XTac-UMI G1 follower gripper | 2 | One left and one right, mounted on the robot's end effector |
    | 24 V power adapter | 2 | 24 V 2.5 A, 4.5 m lead with ferrite, one per follower |
    | Cable sleeve | 1 | 3 m, for routing cables along the arm |

    You supply the host; the requirements are in [Collection host requirements](../pc/install.md#host-spec). There are only two things to wire:

    - Each gripper connects to a USB-A port on the host with its own leader gripper cable, and with two grippers the six camera feeds have to be split across two USB buses, see [The USB bandwidth budget](../pc/host-setup.md#usb-budget).
    - The headset connects to the host with the headset cable over wired network sharing, or over WiFi, see [Network connection](../common/pico4.md#pico-network).

    The power-up order and your first collection run are in [Developer Kit quickstart](../pc/quickstart.md#power-on).

## Common questions

??? question "Can data from the two configurations be trained on together"

    Yes. The `LeRobot dataset` exported by the Backpack Kit and what the Developer Kit writes straight to disk are both LeRobotDataset v3, and the same `lerobot` tooling loads both. The camera key names and the state field layout are not identical on the two sides, so compare their `meta/info.json` before merging; the Developer Kit's fields are in [Datasets](../pc/dataset.md#61).

??? question "Can the Backpack Kit be customised"

    Yes, but lightly. The collection software on the backpack is closed-source and is delivered and upgraded as a whole firmware bundle; customisation builds on the exported `LeRobot dataset` / `mcap` output, the upload configuration and the capture settings rather than on the software itself. To change the collection logic or connect your own robot, choose the fully open Developer Kit.

??? question "Does the Developer Kit have to have an NVIDIA graphics card"

    For real collection, yes: at least an RTX 3060 / 8 GB, an RTX 5060 Laptop / 8 GB or better recommended, driver ≥ 570.144, see [Host requirements](../pc/install.md#host-spec). A machine without one can turn off streaming encoding and still record, but writing to disk is slow and frames drop more easily, so it is only a stopgap, see [Recording on a host with no NVIDIA GPU](../pc/recording.md#no-gpu).

??? question "Is the headset required"

    Both configurations need it. The 6-DoF pose comes from the headset and the two trackers fitted on top of the grippers, so without the headset there is no pose. The "+ stereo headset" and "+ right mono headset" in the Backpack Kit's capture modes mean additionally recording the headset's views, not whether the headset is needed at all.

??? question "Can a phone be the Backpack Kit's console"

    Yes — a tablet, phone or PC all act purely as a browser. Join the backpack hotspot and open `http://192.168.44.1`, or use the device name `http://xense-<last 6 of the serial>.local`. On iOS Safari you have to type the full `http://` prefix or the device name is treated as a search term; some Android models cannot open `.local` names, so use the IP directly.

??? question "Does the Backpack Kit need an internet connection"

    Not for collecting. The backpack keeps its own 5 GHz hotspot up with the gateway fixed at `192.168.44.1`, independent of any site network. Only "upload to remote" at export time requires the backpack to reach the upload target: cloud targets such as ModelScope or S3 usually need internet access, while an FTP / NFS server on the local network only needs the backpack on the same network; plug in a cable, or put the backpack on the site's 5 GHz WiFi from the System page. Downloading to the device needs no network.

## Getting in touch and getting started

Once you have chosen, go to the matching entry point: [Backpack Kit quickstart](../backpack/index.md) or [Developer Kit quickstart](../pc/quickstart.md). Cables, adapters, power banks and the like follow the contract configuration and the packing list — if something is missing, contact your project manager rather than substituting it yourself. The channels for reporting technical problems and what to include are in [Support and feedback](../common/reference.md#support).
