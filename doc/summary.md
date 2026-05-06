# Project Summary

## What is this app?

**Autism Learning Games** is an Expo (React Native) educational game app targeting children with autism. It runs in landscape orientation on both iPhone and iPad, with high-contrast visuals, large tap targets, and immediate feedback — all designed around autism-friendly UX principles.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 (managed workflow) |
| Language | TypeScript |
| Navigation | Expo Router (file-based, `app/(tabs)/`) |
| Animations | react-native-reanimated |
| Audio | expo-audio (`useAudioPlayer`) |
| Drawing | react-native-svg + PanResponder |
| Icons | @expo/vector-icons |

---

## Screens

| Screen | File | Description |
|--------|------|-------------|
| Home | `index.tsx` | Quick-access pills to all game areas |
| Learn | `learn.tsx` | Category cards linking to game areas |
| Explore | `explore.tsx` | Hub for explore mini-games |
| Memory | `memory.tsx` | Flip-card memory matching game |
| Sorting | `sorting.tsx` | Drag-to-bin category sorting game |
| Puzzle | `puzzle.tsx` | Picture puzzle game |
| Matching | `matching.tsx` | Emoji pair matching |
| Jigsaw | `jigsaw.tsx` | Jigsaw piece placement |
| Sensory | `sensory.tsx` | 4 sensory mini-games (colour, rhythm, bubble, texture) |
| Animal Colouring | `coloring.tsx` | Free-draw colouring with SVG animal outlines |
| Vehicle Colouring | `coloring-vehicles.tsx` | Free-draw colouring with SVG vehicle outlines |
| Activities | `activities.tsx` | Additional learning activities |

---

## Audio

Three local WAV sound effects in `assets/sounds/`:
- `correct.wav` — bright two-tone ding (C5→E5)
- `wrong.wav` — low descending buzz
- `win.wav` — 3-note fanfare (C5→E5→G5)

Background music controlled via `MusicControl` component (global overlay).

---

## Key Patterns

- **Sound playback:** `playSound(player)` helper — `player.seekTo(0); player.play()` wrapped in try/catch.
- **Responsive sizing:** `getScale(width)` helper; `isTablet = width >= 800`.
- **SVG drawing:** `PanResponder` + quadratic bezier `buildPath()`. Color/brush stored in `useRef` to avoid stale closures.
- **ClipPath drawing:** Animal strokes clipped to silhouette via `<Defs><ClipPath>` + `<G clipPath="url(#animalClip)">`.
- **Level progression:** `backToCategories()` resets `selectedCat` and `selectedLevel` to `null` after final level.
