---
title: "Android Application Security: 30 Common Vulnerabilities and How to Fix Them"
date: "2026-03-17"
thumbnail: "/assets/img/thumbnail/post-android-30-vulnerabilities.png"
tags:
    - mobile
    - android
    - web
---

Mobile applications handle sensitive user data, making them a frequent target for attackers. Android, due to its open ecosystem, presents a wide attack surface if applications are not properly secured.

This article walks through 30 common Android vulnerabilities, along with practical methods to identify and remediate them using both static and dynamic analysis.

> This content is intended for security professionals, developers, and penetration testers working in authorized environments.

---

## 1. Task Hijacking (StrandHogg)

Task hijacking occurs when a malicious application exploits `taskAffinity` to insert itself into another app's task stack, allowing UI spoofing and data interception.

**How to identify**
- Review `AndroidManifest.xml` for custom `taskAffinity` values
- Check for risky launch modes such as `singleTask` or `singleInstance`
- Use dynamic tools like Frida or Xposed to monitor task behavior
- Manually switch between apps and observe unexpected UI transitions

**How to fix**
- Set `android:taskAffinity=""` unless required
- Prefer `standard` or `singleTop` launch modes
- Avoid unnecessary task manipulation

---

## 2. Tapjacking

Tapjacking tricks users into interacting with hidden UI elements through overlays.

**How to identify**
- Check for `android:filterTouchesWhenObscured="false"`
- Test overlays using a secondary app
- Observe whether touches pass through obscured screens

**How to fix**
- Enable `filterTouchesWhenObscured`
- Apply `setFilterTouchesWhenObscured(true)` to sensitive views
- Avoid transparent overlays for critical actions

---

## 3. Intent Sniffing

Sensitive data can leak when implicit intents are intercepted by other apps.

**How to identify**
- Look for implicit intents without a defined component
- Use Drozer to intercept broadcasts
- Monitor Logcat for exposed data

**How to fix**
- Use explicit intents
- Avoid sending sensitive data through intents
- Restrict component exposure with `android:exported="false"`

---

## 4. Intent Spoofing

Attackers send crafted intents to trigger unintended behavior in exported components.

**How to identify**
- Review exported activities, services, and receivers
- Use Drozer to send crafted intents
- Check for missing validation in intent handlers

**How to fix**
- Disable exporting unless necessary
- Enforce permission checks
- Validate incoming intent data and caller identity

---

## 5. Content Provider Leakage

Improperly secured content providers expose application data.

**How to identify**
- Look for exported providers without permissions
- Query providers using ADB or Drozer
- Test for SQL injection through URI parameters

**How to fix**
- Disable exporting where not required
- Apply read/write permissions
- Validate URIs and sanitize inputs

---

## 6. SQL Injection

Unvalidated inputs can manipulate database queries.

**How to identify**
- Search for raw SQL execution methods
- Inject payloads such as `' OR 1=1--`
- Observe abnormal query results

**How to fix**
- Use parameterized queries
- Validate and sanitize input
- Prefer ORM frameworks such as Room

---

## 7. Path Traversal

Attackers manipulate file paths to access restricted files.

**How to identify**
- Test inputs with sequences like `../../`
- Review file handling code for user-controlled paths

**How to fix**
- Resolve canonical paths before use
- Restrict file access to internal directories
- Avoid direct use of user input in file operations

---

## 8. Clipboard Hijacking

Sensitive data copied to the clipboard can be accessed by other apps.

**How to identify**
- Monitor clipboard access using ADB
- Test copying sensitive values such as tokens or passwords

**How to fix**
- Avoid copying sensitive data
- Clear clipboard after use
- Notify users when clipboard is used

---

## 9. WebView Cross-Site Scripting (XSS)

Improper input handling in WebViews allows JavaScript injection.

**How to identify**
- Check for `setJavaScriptEnabled(true)`
- Inject script payloads into WebView inputs
- Monitor execution behavior

**How to fix**
- Disable JavaScript unless necessary
- Sanitize all inputs
- Use secure WebView configurations

---

## 10. WebView File Access

WebViews may expose local files through `file://` access.

**How to identify**
- Check for file access settings enabled
- Attempt to load local file paths

**How to fix**
- Disable file access
- Restrict allowed URLs
- Avoid loading local resources

---

## 11. SSL/TLS Misconfiguration

Weak SSL validation allows interception attacks.

**How to identify**
- Intercept traffic using tools like Burp Suite
- Check for acceptance of invalid certificates

**How to fix**
- Use default trust managers
- Implement certificate pinning
- Disable cleartext traffic

---

## 12. Insecure Backup

Sensitive data may be exposed through backups.

**How to identify**
- Check manifest for backup settings
- Extract backups using ADB

**How to fix**
- Disable backups where not needed
- Exclude sensitive data
- Encrypt stored information

---

## 13. Debugging Enabled

Debuggable apps allow runtime inspection.

**How to identify**
- Check `android:debuggable`
- Attempt debugger attachment

**How to fix**
- Disable debugging in release builds
- Remove debug logs and symbols

---

## 14. Hardcoded Secrets

Credentials embedded in code can be extracted easily.

**How to identify**
- Search decompiled code for keys and tokens
- Review resource files

**How to fix**
- Move secrets to backend services
- Use secure storage mechanisms
- Obfuscate code

---

## 15. Insecure Data Storage

Sensitive data stored without encryption is easily accessible.

**How to identify**
- Inspect SharedPreferences and local files
- Extract data using ADB or rooted devices

**How to fix**
- Encrypt data using Keystore
- Use internal storage
- Avoid external storage for sensitive data

---

## 16. Component Exposure

Exported components can be accessed by other applications.

**How to identify**
- Review manifest for exported components
- Interact with components using testing tools

**How to fix**
- Disable exporting where unnecessary
- Restrict access with permissions
- Validate caller identity

---

## 17. Deep Link Abuse

Improper handling of deep links allows unauthorized actions.

**How to identify**
- Test custom URI schemes
- Inject malicious parameters

**How to fix**
- Validate all inputs
- Restrict domains and schemes
- Use verified app links

---

## 18. Insecure Network Configuration

Allowing HTTP traffic weakens communication security.

**How to identify**
- Review network security config
- Intercept traffic

**How to fix**
- Enforce HTTPS
- Disable cleartext traffic
- Use strong TLS settings

---

## 19. Root Detection Bypass

Weak detection allows tampering on rooted devices.

**How to identify**
- Test app on rooted environments
- Attempt bypass using Frida

**How to fix**
- Implement root detection checks
- Use integrity verification tools
- Restrict functionality when compromised

---

## 20. Frida and Dynamic Analysis Bypass

Lack of protection allows runtime instrumentation.

**How to identify**
- Attach Frida and observe behavior
- Check for missing anti-debugging controls

**How to fix**
- Add anti-debugging checks
- Detect instrumentation frameworks
- Obfuscate sensitive logic

---

## 21. Insecure OAuth Implementation

Improper handling of tokens leads to account compromise.

**How to identify**
- Intercept authentication flows
- Check token storage and redirects

**How to fix**
- Use secure token storage
- Implement PKCE
- Validate redirect URIs

---

## 22. Activity Hijacking

Fake activities mimic legitimate UI.

**How to identify**
- Test UI transitions between apps
- Analyze task behavior

**How to fix**
- Restrict exported activities
- Validate calling applications

---

## 23. Broadcast Injection

Unprotected broadcast receivers can be triggered externally.

**How to identify**
- Send custom broadcasts
- Observe receiver behavior

**How to fix**
- Restrict receivers
- Validate sender identity
- Use internal broadcast mechanisms

---

## 24. Keystore Misuse

Improper key management weakens encryption.

**How to identify**
- Look for hardcoded keys
- Analyze encryption methods

**How to fix**
- Use Android Keystore
- Apply strong cryptographic algorithms
- Avoid embedding keys

---

## 25. Insecure PendingIntent

Mutable PendingIntents can be modified by attackers.

**How to identify**
- Review PendingIntent flags
- Test intent manipulation

**How to fix**
- Use immutable flags
- Explicitly define intent targets

---

## 26. Logcat Leakage

Sensitive information may appear in logs.

**How to identify**
- Monitor Logcat output during app usage

**How to fix**
- Remove sensitive logs
- Disable logging in production

---

## 27. Insecure File Permissions

Improper permissions expose files to other apps.

**How to identify**
- Inspect file permissions on device
- Attempt unauthorized access

**How to fix**
- Use private modes
- Store files internally
- Encrypt sensitive content

---

## 28. Custom Scheme Hijacking

Custom URI schemes can be abused by other apps.

**How to identify**
- Test crafted URIs
- Review intent filters

**How to fix**
- Validate inputs strictly
- Prefer HTTPS-based links
- Restrict allowed hosts

---

## 29. Weak Biometric Authentication

Poor implementation allows bypass of biometric checks.

**How to identify**
- Test fallback mechanisms
- Attempt bypass using instrumentation

**How to fix**
- Enforce strong biometric policies
- Avoid weak fallbacks
- Bind authentication to secure storage

---

## 30. Code Injection

Loading untrusted code allows arbitrary execution.

**How to identify**
- Look for dynamic class loading
- Test with malicious inputs

**How to fix**
- Avoid loading external code
- Validate integrity of loaded components
- Restrict execution paths

---

## Tools for Android Security Testing

| Category | Tools |
|---|---|
| Static Analysis | MobSF, APKTool, JADX |
| Dynamic Analysis | Frida, Drozer, Burp Suite |
| Manual Testing | ADB, Rooted devices or emulators |

---

## Final Thoughts

Android security is not a one-time effort. It requires continuous testing, secure coding practices, and awareness of evolving threats.

Combining static analysis, dynamic testing, and proper defensive design significantly reduces the attack surface. Aligning with the **OWASP Mobile Security Testing Guide** is a good baseline for building and assessing secure applications.
