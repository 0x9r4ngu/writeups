---
title: "Mobile API Testing: Bypassing SSL Pinning with Frida"
date: "2026-03-22"
tags:
    - mobile
    - api
    - frida
    - web
---

## The Problem With Mobile Testing

Mobile apps aren't the target — their backend APIs are. The app is just a client. But to get to the API, you need to intercept its traffic, and most production apps implement SSL pinning to block exactly that.

This post covers the full setup: rooted Android device, Burp as a proxy, and Frida to bypass pinning at runtime.

---

## Lab Setup

- Rooted Android device (or emulator with Magisk)
- Burp Suite with a custom CA cert installed
- Frida server running on the device
- `objection` as a Frida wrapper for quick pinning bypass

---

## Step 1 — Configure the Proxy

On Burp: Proxy → Options → Add listener on `0.0.0.0:8080`.

On the Android device: WiFi settings → Manual proxy → your machine's IP, port 8080.

Export Burp's CA cert (`DER` format), push it to the device, install as a user certificate. For Android 7+, apps no longer trust user CAs by default — which is where Frida comes in.

---

## Step 2 — Install Frida Server

Download the correct Frida server binary for your device architecture:

```bash
adb shell getprop ro.product.cpu.abi
# arm64-v8a

# download frida-server-16.x.x-android-arm64 from github releases
adb push frida-server /data/local/tmp/
adb shell chmod +x /data/local/tmp/frida-server
adb shell /data/local/tmp/frida-server &
```

Verify:

```bash
frida-ps -U | grep -i <appname>
```

---

## Step 3 — Bypass SSL Pinning

The fastest route is `objection`:

```bash
objection --gadget "com.target.app" explore
```

Once in the objection shell:

```
android sslpinning disable
```

This injects Frida hooks that intercept common pinning implementations (OkHttp, TrustManager, Conscrypt) and make them trust any certificate — including Burp's.

For apps with custom pinning or native SSL implementations, use the universal Frida script from `httptoolkit/frida-interception-and-unpinning`:

```bash
frida -U -f com.target.app -l unpin.js --no-pause
```

---

## Step 4 — Intercept and Analyze

With pinning bypassed, all app traffic flows through Burp. Now the real testing starts.

**What to look for immediately:**

1. **Auth tokens** — How is the session maintained? Bearer token, cookie, device fingerprint?
2. **User IDs in requests** — Are they in the path, body, or headers? Try changing them.
3. **API versioning** — Does `v1` have different (weaker) controls than `v2`?
4. **Unauthenticated endpoints** — Spider the API, try removing the auth header from every request.

---

## Step 5 — API-First Testing

Once you have a traffic baseline, treat it like a web API test:

```bash
# Export Burp history, feed to ffuf for endpoint discovery
ffuf -u https://api.target.com/FUZZ -w endpoints.txt -H "Authorization: Bearer eyJ..."

# Test for IDOR on every endpoint with an ID
# Test for missing auth on every endpoint
# Check all token claims — decode JWT, look for roles/permissions
```

A common finding: the mobile app uses a separate API subdomain (`mobile-api.target.com`) that shares the same backend but was security-tested less thoroughly than the web-facing API.

---

## Notes on Emulators

Rooted emulators (Genymotion, Android Studio with Magisk) work for most apps but some implement emulator detection. If the app crashes on launch or behaves differently, check for:

- `Build.FINGERPRINT` checks
- `ro.kernel.qemu` property reads
- Frida detection (process name scanning, `ptrace` checks)

Frida has bypass scripts for most of these. The game of cat and mouse continues.

---

## Takeaway

SSL pinning is a speed bump, not a wall. Every pinning implementation can be bypassed at the OS level with root access and Frida. The real security of a mobile application lives in its backend API — and that's where testing effort should be focused.
