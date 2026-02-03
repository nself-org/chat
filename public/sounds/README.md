# Notification Sounds

This directory contains notification sound files for the nself-chat application.

## Required Sound Files

The following sound files should be placed in this directory:

- `default.mp3` - Standard notification sound
- `mention.mp3` - @mention alert
- `dm.mp3` - Direct message notification
- `thread.mp3` - Thread reply notification
- `reaction.mp3` - Reaction received
- `ding.mp3` - Simple ding sound
- `pop.mp3` - Pop sound
- `chime.mp3` - Chime sound
- `bell.mp3` - Bell sound
- `knock.mp3` - Knock sound
- `whoosh.mp3` - Whoosh sound
- `subtle.mp3` - Subtle tone
- `alert.mp3` - Alert tone
- `system.mp3` - System notification sound

## Sound Requirements

- **Format**: MP3 or OGG
- **Duration**: 0.5 - 3 seconds recommended
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps or higher
- **Volume**: Normalized to -14 LUFS

## Free Sound Sources

You can obtain free notification sounds from:

- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [NotificationSounds.com](https://notificationsounds.com/)
- [Mixkit](https://mixkit.co/free-sound-effects/notification/)

## Custom Sound Upload

Users can upload custom sounds through the Notification Settings UI.
Custom sounds are stored in localStorage and managed by the sound system.

## Testing

To test sounds, use the Test Notification button in the UI or:

```typescript
import { playNotificationSound } from '@/lib/notifications/notification-sounds'

playNotificationSound('mention', 80) // soundId, volume
```

## License

Ensure all sound files used comply with their respective licenses.
For production, use royalty-free or properly licensed sounds.
