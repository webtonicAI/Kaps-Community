---
layout: default
title: Performance Help & FAQ
---

{% include nav.html %}

# Performance Help & FAQ

The full, most up-to-date GPU setup and export FAQ now lives in the Kaps app:

**[kaps.ai → Info → Performance FAQ](https://kaps.ai/info?doc=performance)**

Quickest fix for the most common issue — renders running at 3–5 fps: Chrome is using your integrated GPU instead of your discrete one. In Windows, set `chrome.exe` to your NVIDIA/AMD GPU in both Windows Graphics settings and the NVIDIA Control Panel, then fully relaunch Chrome. Full steps, macOS notes, and the rest of the FAQ: see the link above.
