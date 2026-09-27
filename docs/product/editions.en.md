# Product line and configuration comparison

XTac-UMI comes in two configurations: the **Backpack Kit** (the XTac-UMI Backpack) and the **Developer Kit** (the XTac-UMI G1 Developer Kit). Both use the same XTac-UMI G1 leader grippers and Pico4 Ultra headset; they differ only in where the compute node sits, what interface the operator faces, and what format the raw data lands in. This page helps you pick a side and check the box contents and the wiring.

<div class="grid cards" markdown>

-   :material-bag-personal:{ .lg .middle } __Backpack Kit · the XTac-UMI Backpack__

    ---

    For high-volume collection operations and collection teams: the backpack is the host, a tablet is the console, and the gripper buttons start recording. The software is delivered closed-source with support for light customisation.

    [Quickstart](../backpack/index.md){ .md-button .md-button--primary }

-   :material-desktop-tower-monitor:{ .lg .middle } __Developer Kit · the XTac-UMI G1 Developer Kit__

    ---

    Built on the open-source lerobot ecosystem and suited to research and algorithm teams: connect it to your own workstation and produce a LeRobotDataset directly, with customisation completely open.

    [Quickstart](../pc/index.md){ .md-button .md-button--primary }

</div>

## How the two differ

| | Backpack Kit · the XTac-UMI Backpack | Developer Kit · the XTac-UMI G1 Developer Kit |
|---|---|---|
| Compute node | The RK3588 backpack that ships with it, eMMC system disk + NVMe data disk | Your own x86 workstation, installed from source with Mamba or from a Docker image; real collection requires an NVIDIA GPU, and the Mamba path installs without one but can only record in a degraded mode |
| Interface | A browser console: live monitor / projects / replay / system; a tablet, phone or PC acts purely as a browser | Terminal commands plus a Rerun preview window |
| How it connects | The grippers go to `UMI-L` / `UMI-R`; the headset goes to the `PICO` port over the USB network (wired by default, WiFi only for quick debugging); the operating device joins the backpack hotspot or the LAN | The grippers connect to the host over USB directly; the headset connects to the host with a Type-C cable over wired network sharing (wired by default, WiFi only for quick debugging); the host runs XenseVR PC Service |
| Recording control | Long-press the right gripper to start, long-press the left to stop, double-click the left to delete the previous take; LED feedback; the console can do the same | `lerobot-record` command-line arguments, with `--robot.id` required |
| Capture modes | Dual gripper · dual gripper + headset · single gripper · single gripper + headset · headset only | Single or dual gripper, with the headset camera optional |
| Raw data | On the device, one MCAP raw recording plus H.264 per episode; the `LeRobot dataset` and `mcap` you hand out are both offline export products | LeRobotDataset v3 written straight to disk |
| Export and upload | Task-level export: pick the destination first (download to device / upload to remote), then the format (`LeRobot dataset` / `mcap`, two equals). Downloading gives you an archive; uploading goes through an upload backend you configured beforehand, local files are kept by default after an upload, and "Archive" — always available — frees the space | Hugging Face Hub |
| Upgrading | Import a firmware bundle (`.tar.zst`) on the System page, with the previous version kept for rollback; stop recording before applying one by hand, and an update pushed remotely waits for the current take to finish before restarting | Pull the repo, run the install script or switch the image tag; gripper firmware OTA uses the SDK script |
| Customisation | Closed-source and light: the collection software is delivered and upgraded as a whole firmware bundle, and customisation builds on the exported `LeRobot dataset` / `mcap` output, the upload configuration and the capture settings rather than on the software itself | Completely open: built on the open-source lerobot ecosystem, you can change the Python code and connect your own robot |
| Who it suits | High-volume collection operations, data collection teams, external sites | Research and algorithm teams, in-house training pipelines |

## Box contents and wiring {#kit}

=== "Backpack Kit"

    | Item | Qty | Notes |
    |---|---|---|
    | Pico4 Ultra Enterprise headset + controller | 1 | Comes with two motion trackers, fitted on top of the two leader grippers |
    | XTac-UMI G1 leader gripper | 2 | One left and one right, told apart by the last digit of the serial number: odd is left, even is right |
    | Type-C cable | 2 | A locking connector at the gripper end, the other end into the backpack's `UMI-L` / `UMI-R` |
    | Backpack | 1 | RK3588 compute node, with an always-on 5 GHz hotspot |
    | Power adapter | 1 | 12 V 3 A, 36 W, into the backpack's `DC` port |
    | Power bank | 2 | Type-C output 5 V 3 A / 12 V 3 A; one for the backpack, one for the headset |

    Use the adapter at a fixed workstation and the power banks for mobile collection:

    ![Adapter wiring: the headset to the PICO port, the left and right grippers to UMI-L / UMI-R, the adapter to DC](../assets/product/backpack-wiring-adapter.webp){ width="720" }

    ![Power-bank wiring: the headset takes the two-in-one cable, its charging leg to a power bank and its data leg to the PICO port; the other power bank feeds the backpack](../assets/product/backpack-wiring-powerbank.webp){ width="720" }

    The wiring steps are in [Adapter power](../backpack/unbox-connect.md#adapter) and [Power-bank power](../backpack/unbox-connect.md#powerbank); the safety requirements for powering and unplugging in order are in [The backpack and its power](safety.md#backpack-power); connecting to the backpack and opening the console is in [The backpack hotspot](../backpack/network.md#softap).

=== "Developer Kit"

    | Item | Qty | Notes |
    |---|---|---|
    | XTac-UMI G1 leader gripper | 2 | One left and one right, told apart by the last digit of the serial number: odd is left, even is right |
    | Type-C cable | 2 | A locking connector at the gripper end, with Type-C or Type-A at the other end depending on the host's ports |
    | Pico4 Ultra Enterprise headset | 1 | Controller included |
    | Motion tracker | 2 | Fitted on top of the two leader grippers |

    You supply the host; the requirements are in [Collection host requirements](../pc/install.md#host-spec). There are only two things to wire:

    - Each gripper connects to the host with its own Type-C cable, and with two grippers the six camera feeds have to be split across two USB buses, see [The USB bandwidth budget](../pc/host-setup.md#usb-budget).
    - The headset connects to the host with a Type-C cable over wired network sharing, or over WiFi, see [Network connection](../common/pico4.md#pico-network).

    The power-up order and your first collection run are in [Developer Kit quickstart](../pc/index.md#power-on).

## Common questions

??? question "Can data from the two configurations be trained on together"

    Yes. The `LeRobot dataset` exported by the Backpack Kit and what the Developer Kit writes straight to disk are both LeRobotDataset v3, and the same `lerobot` tooling loads both. The camera key names and the state field layout are not identical on the two sides, so compare their `meta/info.json` before merging; the Developer Kit's fields are in [Datasets](../pc/dataset.md#61).

??? question "Can the Backpack Kit be customised"

    Yes, but lightly. The collection software on the backpack is closed-source and is delivered and upgraded as a whole firmware bundle; customisation builds on the exported `LeRobot dataset` / `mcap` output, the upload configuration and the capture settings rather than on the software itself. To change the collection logic or connect your own robot, choose the fully open Developer Kit.

??? question "Does the Developer Kit have to have an NVIDIA graphics card"

    For real collection, yes: at least an RTX 3060 / 8 GB, an RTX 4070 / 12 GB recommended, driver ≥ 570.144, see [Host requirements](../pc/install.md#host-spec). A machine without one can turn off streaming encoding and still record, but writing to disk is slow and frames drop more easily, so it is only a stopgap, see [Recording on a host with no NVIDIA GPU](../pc/recording.md#no-gpu).

??? question "Is the headset required"

    Both configurations need it. The 6-DoF pose comes from the headset and the two trackers fitted on top of the grippers, so without the headset there is no pose. The "+ headset" in the Backpack Kit's capture modes means additionally recording the headset's stereo views, not whether the headset is needed at all.

??? question "Can a phone be the Backpack Kit's console"

    Yes — a tablet, phone or PC all act purely as a browser. Join the backpack hotspot and open `http://192.168.44.1`, or use the device name `http://xense-<last 6 of the serial>.local`. On iOS Safari you have to type the full `http://` prefix or the device name is treated as a search term; some Android models cannot open `.local` names, so use the IP directly.

??? question "Does the Backpack Kit need an internet connection"

    Not for collecting. The backpack keeps its own 5 GHz hotspot up with the gateway fixed at `192.168.44.1`, independent of any site network. Only "upload to remote" at export time requires the backpack to reach the internet: plug in a cable, or put the backpack on the site's 5 GHz WiFi from the System page. Downloading to the device needs no internet.

## Getting in touch and getting started

Once you have chosen, go to the matching entry point: [Backpack Kit quickstart](../backpack/index.md) or [Developer Kit quickstart](../pc/index.md). Cables, adapters, power banks and the like follow the contract configuration and the packing list — if something is missing, contact your project manager rather than substituting it yourself. The channels for reporting technical problems and what to include are in [Support and feedback](../common/reference.md#support).
