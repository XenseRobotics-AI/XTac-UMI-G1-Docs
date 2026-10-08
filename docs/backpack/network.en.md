# Network and console access

This page covers how to open the XTac-UMI Collector console (below, "the console"). **The recommended way is the bundled tablet over USB**, which can also put the backpack and the tablet on the site WiFi in one step.

## Identify the unit by its label, not by IP {#label}

![The body label: SN, WiFi name, password, IP and mDNS address](../assets/product/backpack-label.webp){ width="420" }

The label shows the SN, hotspot name and password, IP and device name.

- **The IP on the label**: the hotspot's fixed address `192.168.44.1`, usable only while on the hotspot.
- **Site network IP**: differs per unit and changes, so never write it into a procedure.
- **Identifying a unit**: by SN (System → [Device info](system.md#device-info)) and hotspot name.

## Recommended: the tablet over USB {#tablet}

Cable the tablet to the backpack's front `HOST1` or `HOST2` port and unlock it: the backpack opens System → Network on it by itself, with no WiFi to join and no address to type.

![The Network page the tablet opens over USB](../assets/backpack/tablet-usb-network-settings.webp)

- The bundled tablet is authorised on the production line and works as soon as it is plugged in.
- After a factory reset or revoked USB debugging authorisation it no longer opens; re-authorise it as in [Troubleshooting](troubleshooting.md#tablet-adb).

### Putting the backpack on WiFi from the tablet {#tablet-wifi}

Pick the site's 5 GHz WiFi on this page and enter its password: the backpack and the tablet **join together**. Once the backpack confirms the same network, the tablet switches to the backpack's WiFi address and you can unplug USB.

## The backpack's three network interfaces {#interfaces}

| Interface | What it is | Use |
|---|---|---|
| Wired | Ethernet to a router, IP by DHCP, static possible | Labs and fixed workstations; the steadiest bandwidth |
| Wireless | The backpack joins the site's 5 GHz WiFi | Several people on the same network |
| Hotspot | The backpack's own 5 GHz hotspot, fixed address `192.168.44.1` | The way in with no tablet and no site network |

## The backpack hotspot {#softap}

Without a tablet:

1. Join the hotspot from a phone, tablet or computer (name and password on the body label).
2. Open `http://192.168.44.1` in a browser.

!!! note "On a new unit the hotspot is off at first boot"
    Use "Turn on hotspot" in System → [Network](system.md#wifi); the device remembers it. You can reach the console with the [tablet over USB](#tablet) first to turn it on. The hotspot is 5 GHz only; 2.4 GHz-only devices will not see it.

- On iOS / Safari, type the full `http://` prefix.
- With several backpacks, check the hotspot name against the label before joining.
- Turn off auto-join for other saved networks so the device does not hop away mid-collection.

## Device name {#mdns}

- On the same network, use the `http://xense-xxxxxx.local` on the label's last line instead of an IP.
- Rename or turn it off in System → [Network](system.md#wifi).
- Windows and some Android phones cannot open `.local` names; use the IP from the [network drop-down](#status).

## Joining a site network {#lan}

### Wired {#wired}

- Run the backpack's Ethernet port to a router LAN port and it works; a computer on the same router uses the wired IP in the [network drop-down](#status) or the device name.
- **Ubuntu**: tick Wired in the system settings:

![The Ubuntu wired network switch](../assets/backpack/ubuntu-wired.webp){ width="480" }

Set a static IP only with no DHCP (backpack cabled straight to a computer) or when IT requires a fixed address, see System → [Wired IP](system.md#wifi-wired).

### Site WiFi {#site-wifi}

- **Easiest**: [WiFi setup from the tablet over USB](#tablet-wifi), which joins both together.
- **Backpack alone**: System → [Joining the site WiFi](system.md#wifi-site).
- The backpack only joins 5 GHz WiFi.

## Checking the current network state {#status}

The IP drop-down at the left of the console's top bar gathers every way into this unit; after a network change, look here first for which address to use.

- **Contents**: the wired IP, the wireless IP and the hotspot it is joined to, its own hotspot's SSID / password / gateway, and the mDNS device name.
- **Collapsed**: shows only "the one address you should use to reach it right now", the first available of wired > wireless > hotspot; open it to see them all.

![The top-bar network drop-down](../assets/backpack/network-dropdown-live.webp)

## Choosing a method by scenario {#choose}

| Scenario | Recommended method |
|---|---|
| Everyday collection with the bundled tablet | [Plug the tablet into USB](#tablet); the backpack opens the console for you |
| Lab or fixed workstation with your own router | [Wired](#wired) to a router LAN port, then use the address in the [network drop-down](#status) |
| Customer site, uncontrolled network | [Tablet over USB](#tablet), or turn on the [hotspot](#softap) |
| Site has 5 GHz WiFi and several people need access | Use the tablet to [put the backpack on the site WiFi](#site-wifi); PCs on that network reach it directly |
| Backpack wired directly to a laptop, no router | A [static IP](#wired) on the same subnet at each end |
| Nothing works at all | Plug the tablet into USB to check the network; if that fails, see [Troubleshooting](troubleshooting.md) |

## Advanced diagnosis: handled by technical support {#ssh}

- **Day-to-day work is in the console**: addresses in the [network drop-down](#status); the wired address, gateway, states such as "no cable", joining the site WiFi and changing the wired IP in System → [Network](system.md#wifi).
- **The device back end is for technical support diagnosis only**. **Do not log in or change the system configuration yourself**: the console cannot show those changes, and a bad configuration can cost you even the hotspot way in.

If you have worked through this page and [Troubleshooting](troubleshooting.md) and still cannot connect, hand these to technical support:

- The body-label SN, and which way in you used (hotspot / device name / wired IP);
- The addresses in the [network drop-down](#status), and the wired state and current internet connection on the System → [Network](system.md#wifi) page;
- The exact text of the error on screen.
