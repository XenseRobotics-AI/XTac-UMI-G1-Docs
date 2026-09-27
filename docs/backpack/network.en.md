# Network and console access

This page solves "how do I open the console": the backpack hotspot, the mDNS device name and a LAN IP are the three ways in, plus how to put the backpack on the site WiFi or configure a wired IP. By the end you can open the XTac-UMI Collector console (below, "the console") in any network environment.

## Identify the unit by its label, not by IP {#label}

![Body label: SN, WiFi name, password, IP and mDNS address](../assets/product/backpack-label.webp){ width="520" }

The body label carries every way into this device: the SN, the hotspot name `xense-<last 6 of the serial>`, the hotspot password, the hotspot IP `192.168.44.1` and the device name `http://xense-<last 6 of the serial>.local`. The backpack's wired IP comes from DHCP, so it changes and differs from unit to unit — never write an IP into any procedure. Identify a unit by its SN (which you can read on the console's System → [Device info](system.md#device-info) page), its hotspot name and its device name. Serials like `xense-e3d202` in this text are only examples.

## The backpack's three network interfaces {#interfaces}

| Interface | What it is | Address | Used for |
|---|---|---|---|
| Wired `eth0` | The Ethernet port into a router | Obtained by DHCP, can be set static | The main connection for a lab or a fixed workstation, with the steadiest bandwidth |
| Wireless `wlan0` | The backpack as a client on the site WiFi | Assigned by the site's router | Joining the site network where running a cable is inconvenient |
| Hotspot `ap0` | The backpack's own always-on WiFi hotspot | Gateway fixed at `192.168.44.1` | The fallback way in, independent of any site network |

All three work at once: with a cable plugged in and the site WiFi joined, the hotspot stays up. However the site network changes, joining the hotspot and opening `192.168.44.1` will always open the console. The console runs on port 80, so the address needs no port number.

## Option 1: the backpack hotspot {#softap}

Every backpack keeps its own hotspot up, and the SSID is its identity. On an uncontrolled customer network (multicast blocked, client isolation) this is the main way in: it never touches the site network and needs no permission from the site's IT.

1. Connect a phone, tablet or PC to the hotspot `xense-<last 6 of the serial>` (for example `xense-e3d202`); the password is on the body label or in the console's top-bar [network drop-down](#status).
2. Open `http://192.168.44.1` in a browser, or `http://xense-<last 6 of the serial>.local`.

- **On iOS / Safari you must type the full `http://` prefix** (for example `http://xense-e3d202.local`): a bare device name is treated as a search term and handed to a search engine, which looks like "it will not open" when in fact no request was ever made.
- Some Android models cannot open `.local` device names; use `http://192.168.44.1` instead.
- With several backpacks on site every hotspot starts with `xense-`, so check the last 6 characters against the target unit's body label before connecting — do not join the one next to it.
- Turn off "auto-connect" for the other saved networks on the phone or tablet, or the system will hop to a stronger network mid-collection and drop the console.

!!! warning "The hotspot is 5 GHz only"
    The connecting phone / tablet / PC must support 5 GHz WiFi; a device that only does 2.4 GHz will not see this hotspot.

## Option 2: the mDNS device name {#mdns}

On the same subnet as the backpack (the same router, or joined to its hotspot), use the device name directly and skip the IP:

```
http://xense-<last 6 of the serial>.local
```

macOS, iOS and most Linux systems work out of the box. Windows has unreliable mDNS support, and failing to open it there is a known environment difference: use the [device scanner](#scanner) to find the IP instead, or go in through the hotspot at `http://192.168.44.1`; for diagnosis see [Troubleshooting](troubleshooting.md).

## Option 3: joining a site network {#lan}

### Wired {#wired}

Run the backpack's Ethernet port to a router's LAN port; it ships on DHCP and works as soon as you plug it in. Put the PC on the same router and open the backpack's IP (found with the [scanner](#scanner)) or its device name in a browser; the cabling topology is in [A fixed workstation layout](unbox-connect.md#desk). On an Ubuntu PC, remember to tick Wired in the system settings:

![The Ubuntu wired network switch](../assets/backpack/ubuntu-wired.webp){ width="480" }

There are only two reasons to configure a static IP: the site has no DHCP (the backpack wired directly to a PC, or plugged into a switch without DHCP), or the site's IT requires a fixed address. How to configure it, and why doing so may cut you off, are in System → [Wired IP](system.md#wifi-wired).

### Site WiFi {#site-wifi}

The backpack can join the site WiFi as a client, after which PCs on the same subnet reach it directly; this suits sites with 5 GHz WiFi where several people need access at once, and is unnecessary when one tablet on the hotspot is enough. The recommended route is to join the hotspot first and configure the network from the console, which needs no existing connection on the backpack; the steps and the reason for "5 GHz only" are in System → [Joining site WiFi](system.md#wifi-site).

## Finding the IP on a LAN: the Windows device scanner {#scanner}

With the backpack and the PC on the same router, use `taccap-device-scanner.exe` on Windows to find the IP. It scans the subnet the PC is on automatically, and you can also enter a subnet by hand (for example `192.168.0.0/24`); it probes ports 80 and 8080 by default and can probe with OpenSSH at the same time; it scans TCP concurrently, does not rely on ping or ARP, and needs no administrator rights.

For every backpack it finds it lists the IP, device SN, WiFi ID, version, hardware serial and operating mode, and "Open in browser" takes you straight to the console:

![The device scanner](../assets/backpack/scanner.webp)

![Opening the live monitor page in a browser](../assets/backpack/scanner-open-monitor.webp)

With several backpacks on the same network it lists them all; check the SN / WiFi ID against the body labels to tell which is which, rather than going by a remembered IP.

## Checking the current network state {#status}

The IP drop-down at the left of the console's top bar gathers every way into this unit: the wired IP, the wireless IP and the hotspot it is joined to, and its own hotspot's SSID / password / gateway, plus the mDNS device name. Collapsed it shows only "the one address you should use to reach it right now" (the first available of wired > wireless > hotspot), and expanding it shows them all. When the network environment has changed and you are not sure which address to use, look here first.

![The top-bar network drop-down](../assets/backpack/network-dropdown-live.webp){ width="520" }

## Choosing a method by scenario {#choose}

| Scenario | Recommended method |
|---|---|
| Lab or fixed workstation with your own router | [Wired](#wired) to a router LAN port + the [scanner](#scanner) to find the IP |
| Customer site, uncontrolled network | [Hotspot](#softap) + `http://192.168.44.1`, never touching the site network |
| Site has 5 GHz WiFi and several people need access | Go in over the hotspot first and [put the backpack on the site WiFi](#site-wifi), after which PCs on the same network reach it directly |
| Backpack wired directly to a laptop, no router | A [static IP](#wired) on the same subnet at each end |
| Nothing works at all | Work through [Troubleshooting](troubleshooting.md); the last resort is to power-cycle and join the hotspot |

## Advanced diagnosis: handled by technical support {#ssh}

The day-to-day network state and connection operations are all done in the console: every address currently available for reaching this unit is in the top bar's [network drop-down](#status), and the wired address, the gateway, connection states such as "no cable", joining the site WiFi and changing the wired IP are all in System → [Network](system.md#wifi).

The device back end is for technical support to diagnose with. **Do not log in to the back end or change the system configuration yourself**: changes there are outside what the console can show you, and a bad configuration can cost you even the hotspot way in.

When you have worked through this page's access methods and [Troubleshooting](troubleshooting.md) and still cannot connect, hand these to technical support rather than going into the back end yourself:

- The SN on the body label, and which way in you were using (hotspot / device name / wired IP);
- The addresses shown in the top bar's [network drop-down](#status), and the wired state and current internet connection on the System → [Network](system.md#wifi) page;
- The exact text of the error on screen.
