# Monitoring

ɳChat uses nSelf's built-in monitoring stack. No extra setup is needed.

For the full reference, see the [CLI Monitoring Guide](https://github.com/nself-org/cli/wiki/monitoring).

## ɳChat-specific dashboards

When the monitoring stack is running, Grafana includes these ɳChat panels:

- **Chat message rate** — messages per second, broken down by channel
- **Active connections** — WebSocket connections open at any moment
- **LiveKit sessions** — active video/audio room count (requires ɳChat bundle)
- **Moderation queue depth** — pending moderation items (requires ɳChat bundle)

## Enable

Monitoring is on by default. Verify with:

```bash
nself status --monitoring
```
