# Upload Scanning

nChat scans uploaded files for malware when a virus scanner service is available. This page documents the `NEXT_PUBLIC_ALLOW_UNSCANNED_UPLOADS` flag, its default behavior, and when to enable it.

## Default behavior

When a file upload is requested and the virus scanner service is unavailable, nChat rejects the upload with:

```
Virus scanner unavailable. Please retry in a few minutes.
```

No file reaches the chat without being scanned. This is the safe default for all deployments.

## NEXT_PUBLIC_ALLOW_UNSCANNED_UPLOADS

| Value | Behavior |
|-------|----------|
| `false` (default) | Upload rejected when scanner is down. User sees an error message. |
| `true` | Upload proceeds without scanning. A loud security warning is emitted to the server console and a telemetry event is fired for every skipped scan. |

Set in `frontend/.env.example`:

```bash
# Controls upload behavior when virus scanner is unavailable.
# Default (false): uploads are rejected when scanner is down.
# Set to true only if you accept the risk of unscanned uploads.
NEXT_PUBLIC_ALLOW_UNSCANNED_UPLOADS=false
```

## When to set this to true

Only in environments where a virus scanner will never be present and you accept the security risk:

- Air-gapped deployments without network access to a scanner
- Development/testing environments (use dev auth mode instead where possible)

Never set this to `true` in a production deployment where users upload untrusted files.

## Security warning format

When `NEXT_PUBLIC_ALLOW_UNSCANNED_UPLOADS=true` and the scanner is unavailable, the server logs:

```
SECURITY: virus scan skipped for file <fileId>; ALLOW_UNSCANNED_UPLOADS=true
```

A telemetry event is also posted to `/api/telemetry/security-event` with `event: "virus_scan_skipped"`. This cannot be disabled — it is part of the Security-Always-Free baseline.

## Related

- `frontend/src/services/files/upload.service.ts` — implementation
- nself Security-Always-Free Doctrine
