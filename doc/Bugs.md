# Bugs

## Open

| # | File | Description | Severity |
|---|------|-------------|----------|
| 1 | `app/(tabs)/coloring-vehicles.tsx` | Drawing strokes are not clipped to the vehicle silhouette — brush strokes can be drawn outside the vehicle outline | Medium |

---

## Closed

| # | File | Description | Fixed In |
|---|------|-------------|----------|
| 1 | `app/(tabs)/memory.tsx` | Duplicate `dot` style key in `StyleSheet.create` caused TS1117 compile error | Session 2025-05-06 |
| 2 | `hooks/use-music.ts` | `playsInSilentModeIOS` is not a valid property on `AudioMode` in expo-audio — should be `playsInSilentMode` | Session 2025-05-06 |
| 3 | `assets/sounds/` | CDN audio URLs returned 403 at runtime — correct.wav / wrong.wav / win.wav not playing | Session ~2025-05-01 |
| 4 | `app/(tabs)/sensory.tsx` | Rhythm Tap game pads hardcoded at 120×120px — overflowed on iPhone screens | Session ~2025-05-01 |
| 5 | `.expo/` | Entire `.expo` directory was root-owned, preventing Expo CLI from writing type files on startup | Session 2025-05-06 |
| 6 | `app/_layout.tsx` | `expo-env.d.ts` was root-owned, blocking Expo TypeScript type generation on start | Session 2025-05-06 |
