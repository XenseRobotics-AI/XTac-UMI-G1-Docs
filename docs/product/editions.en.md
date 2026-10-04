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

| | Backpack Kit · XTac-UMI Backpack | Developer Kit · XTac-UMI G1 Developer Kit |
|---|---|---|
| Compute | The backpack in the box | Your own x86 workstation, NVIDIA GPU recommended |
| Interface | Browser console; a tablet is enough | Terminal + Rerun preview window |
| Headset link | Type-C to the backpack, wired only | Type-C to the workstation, wired by default |
| Recording control | Mainly the gripper buttons; the console works too | `lerobot-record` command line |
| Capture modes | Two grippers / one gripper / headset only, optionally with headset images; only two-gripper modes export today | One or two grippers, optionally with headset images |
| On disk | One MCAP raw recording per take | LeRobotDataset v3 directly |
| Export and upload | Export per task as LeRobot v3 / MCAP; download, or upload to ModelScope, S3, FTP, NFS and more | Push to the Hugging Face Hub |
| Upgrades | Import an update package in the console; can roll back | Update the repo or image |
| Customisation | Not open source; build on the exported data | Open source (Apache-2.0); change the code, hook up your own robot |
| For | Large-scale data factories and field collection teams | Research and algorithm teams with their own training pipelines |

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

    You supply the host; the requirements are in [Collection host requirements](../pc/install.md#host-spec). Three cables in total:

    - **Leader grippers × 2**: a Type-C to USB-A cable from each gripper to a USB-A port on the host; put the two grippers on two separate USB buses, see [The USB bandwidth budget](../pc/host-setup.md#usb-budget).
    - **Headset × 1**: a Type-C to Type-C cable to the host, over wired network sharing, see [Network connection](../common/pico4.md#pico-network).

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
