# Fixes

## 2025-05-06

### TypeScript Compile Errors
- **`app/(tabs)/memory.tsx`** — Renamed duplicate `dot` style to `cardDot` and updated its usage on line 557.
- **`hooks/use-music.ts`** — Changed `playsInSilentModeIOS` → `playsInSilentMode` to match the current `expo-audio` API.

### Expo Startup Permission Errors
- Removed root-owned `expo-env.d.ts` (deleted and let Expo regenerate it with correct ownership).
- Fixed root-owned `.expo/` directory by running `sudo chown -R reyrubi:reyrubi /home/reyrubi/Developer/autisapp`.

---

## 2025-05-01 (approximate)

### Audio Not Playing
- Replaced CDN URLs (Pixabay returned 403) with locally generated WAV files.
- Generated `correct.wav`, `wrong.wav`, `win.wav` using Python's `wave` module.
- Files stored in `assets/sounds/`.

### Splash Screen Removed
- Removed animated splash overlay from `app/_layout.tsx`.
- App now goes directly to the home screen after Expo hides the native splash.

### Sensory — Rhythm Tap Too Large on iPhone
- Made pad size responsive: `isTablet ? 120 : 80`.
- Passed `isTablet` prop down to `RhythmTapGame`.

### SVG ClipPath — Animal Coloring
- Added `clipShape()` silhouette function to all 8 animals in `coloring.tsx`.
- Strokes SVG wrapped with `<Defs><ClipPath id="animalClip">` + `<G clipPath="url(#animalClip)">` so brush stays inside the outline.
