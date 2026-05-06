# Bug Tracker

---

## Open Bugs

### High Priority


**BUG-002 · `app/(tabs)/sensory.tsx`**
BubblePop bubbles hardcoded at `66×66px`. ColorMix target box hardcoded at `210×88px`.
Neither value scales — layout breaks on iPad and landscape screens.

---

**BUG-005 · `app/(tabs)/matching.tsx`**
No visual highlight when a left-side item is tapped.
Children get no feedback that their selection was registered, and it silently clears on a wrong match.

---

### Medium Priority

**BUG-003 · `app/(tabs)/sensory.tsx`**
BubblePop `buildRound()` picks targets with `BUBBLE_EMOJIS[Math.floor(Math.random() * 5)]`,
capping at the first 5 of 10 emojis. The second half of the array is never reachable as a target.

---

**BUG-004 · `app/(tabs)/sensory.tsx`**
Bubble grid has a hardcoded `maxWidth: 500` with no tablet or landscape breakpoint —
grid is too narrow on iPad landscape.

---

**BUG-006 · `app/(tabs)/activities.tsx`**
Detail panel uses a fixed `width: 300`. On iPhone landscape (~667px wide) the panel
takes up 45% of the screen and can overflow or get cut off.

---

**BUG-007 · `app/(tabs)/jigsaw.tsx`**
Tile sizes are computed once from `Dimensions.get('window')` with no orientation-change listener.
Sizes do not recalculate when the device rotates mid-game.

---

### Low Priority

**BUG-008 · `app/(tabs)/jigsaw.tsx`**
`Animated.loop` pulse on the hint button is never stopped on unmount —
the animation loop leaks into background memory.

---

**BUG-009 · `eas.json`**
`cli.version` requires `>= 18.6.0` but the installed EAS CLI is `18.5.0`.
Build commands will fail with a version mismatch until the CLI is updated (`npm i -g eas-cli`).

---

## Closed Bugs

| ID | File | Description | Fixed |
|----|------|-------------|-------|
| CLOSED-001 | `app/(tabs)/memory.tsx` | Duplicate `dot` key in `StyleSheet.create` — TS1117 compile error | 2025-05-06 |
| CLOSED-002 | `hooks/use-music.ts` | `playsInSilentModeIOS` not valid on `AudioMode` — renamed to `playsInSilentMode` | 2025-05-06 |
| CLOSED-003 | `assets/sounds/` | CDN audio URLs returned 403 — replaced with local WAV files | 2025-05-01 |
| CLOSED-004 | `app/(tabs)/sensory.tsx` | Rhythm Tap pads hardcoded at 120×120px — overflowed on iPhone | 2025-05-01 |
| CLOSED-005 | `.expo/` | Directory root-owned, blocked Expo CLI type file writes on startup | 2025-05-06 |
| CLOSED-006 | `app/_layout.tsx` | `expo-env.d.ts` root-owned, blocked TypeScript type generation | 2025-05-06 |
| CLOSED-007 | `app/(tabs)/coloring-vehicles.tsx` | No `clipShape` / no `ClipPath` — strokes painted outside vehicle outlines | 2026-05-06 |
| CLOSED-008 | `app/(tabs)/coloring.tsx` + `coloring-vehicles.tsx` | Touch coordinates wrong in landscape — `Math.min(w,h)` ratio applied to both axes + SVG letterboxing offset | 2026-05-06 |
| CLOSED-009 | `app/(tabs)/coloring.tsx` + `coloring-vehicles.tsx` | Back button routed to `/` instead of `/drawing` hub | 2026-05-06 |
