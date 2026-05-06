# Bugs

## Open

| # | File | Description | Severity |
|---|------|-------------|----------|
| 1 | `app/(tabs)/coloring-vehicles.tsx` | Drawing strokes are not clipped to the vehicle silhouette — brush strokes can be drawn outside the vehicle outline. Needs `<Defs><ClipPath id="vehicleClip">` + `<G clipPath="url(#vehicleClip)">` wrapping on the strokes SVG layer, same pattern already used in `coloring.tsx`. | High |
| 2 | `app/(tabs)/sensory.tsx` | BubblePop game bubbles hardcoded at `width: 66, height: 66`. ColorMix target box hardcoded at `width: 210, height: 88`. Neither scales to iPad or landscape — layout breaks on larger screens. | High |
| 3 | `app/(tabs)/sensory.tsx` | BubblePopGame `buildRound()` picks the target emoji with `BUBBLE_EMOJIS[Math.floor(Math.random() * 5)]`, capping at the first 5 emojis out of 10 — the second half of the array is never used as a target. | Medium |
| 4 | `app/(tabs)/sensory.tsx` | Bubble grid `maxWidth: 500` is hardcoded with no landscape or tablet breakpoint — grid is too narrow on iPad landscape. | Medium |
| 5 | `app/(tabs)/matching.tsx` | No visual highlight when a left-side item is tapped — children with autism get no feedback that their selection was registered. Selection also silently clears on a wrong match without explanation. | High |
| 6 | `app/(tabs)/activities.tsx` | Detail panel uses fixed `width: 300` — overflows or gets cut off in landscape on iPhone (screen width can be ~667px, panel takes 45%). | Medium |
| 7 | `app/(tabs)/jigsaw.tsx` | Tile sizing (`tileSize = Math.min(tileByW, tileByH, maxTile)`) is computed at render time from `Dimensions.get('window')` but there is no orientation-change listener — sizes do not recalculate when the device rotates mid-game. | Medium |
| 8 | `app/(tabs)/jigsaw.tsx` | `Animated.loop` pulse animation on the hint button is never stopped on component unmount — animation loop leaks into background memory. | Low |
| 9 | `eas.json` | `"cli": { "version": ">= 18.6.0" }` but installed EAS CLI is `18.5.0` — build commands will fail with a version mismatch warning until CLI is updated. | Low |

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
