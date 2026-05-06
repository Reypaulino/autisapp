# Developer Guide

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo`)
- Expo Go app on your iPhone or iPad

### Install & Run

```bash
cd /home/reyrubi/Developer/autisapp
npm install
npx expo start
```

> **Note:** If Expo fails with `EACCES` permission errors on startup, run:
> ```bash
> sudo chown -R reyrubi:reyrubi /home/reyrubi/Developer/autisapp
> ```

### Run on a Specific Port

```bash
npx expo start --port 8082
```

---

## Project Structure

```
autisapp/
├── app/
│   ├── _layout.tsx          # Root layout (nav container, MusicControl)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar configuration
│       ├── index.tsx        # Home screen
│       ├── learn.tsx        # Learning hub
│       ├── explore.tsx      # Explore hub
│       ├── memory.tsx       # Memory game
│       ├── sorting.tsx      # Sorting game
│       ├── puzzle.tsx       # Puzzle game
│       ├── matching.tsx     # Matching game
│       ├── jigsaw.tsx       # Jigsaw game
│       ├── sensory.tsx      # Sensory mini-games
│       ├── coloring.tsx     # Animal colouring
│       └── coloring-vehicles.tsx  # Vehicle colouring
├── assets/
│   ├── sounds/
│   │   ├── correct.wav
│   │   ├── wrong.wav
│   │   └── win.wav
│   └── images/
├── components/
│   ├── music-control.tsx
│   └── splash-screen.tsx
├── hooks/
│   └── use-music.ts
└── doc/                     # This folder
```

---

## Adding a New Game Screen

1. Create `app/(tabs)/mygame.tsx` with a default export component.
2. Add a tab entry in `app/(tabs)/_layout.tsx`:
   ```tsx
   <Tabs.Screen name="mygame" options={{ title: 'My Game', ... }} />
   ```
3. Add a card in `learn.tsx` linking to `/mygame`.
4. Add a quick pill in `index.tsx` if it's a top-level game.

---

## Audio

Import and initialise players at the top of any component:

```ts
import { useAudioPlayer } from 'expo-audio';

const SND_CORRECT = require('@/assets/sounds/correct.wav');
const SND_WRONG   = require('@/assets/sounds/wrong.wav');
const SND_WIN     = require('@/assets/sounds/win.wav');

function playSound(p: ReturnType<typeof useAudioPlayer>) {
  try { p.seekTo(0); p.play(); } catch (_) {}
}

// Inside component:
const correctPlayer = useAudioPlayer(SND_CORRECT);
const wrongPlayer   = useAudioPlayer(SND_WRONG);
const winPlayer     = useAudioPlayer(SND_WIN);
```

---

## Drawing (SVG + PanResponder)

Use `colorRef` / `brushRef` to avoid stale closures inside `PanResponder.create()`:

```ts
const colorRef = useRef(selectedColor);
const brushRef = useRef(brushSize);
useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);
useEffect(() => { brushRef.current = brushSize; }, [brushSize]);
```

Canvas coordinates → SVG viewBox (200×200):
```ts
const ratio = 200 / canvasSizeRef.current;
const x = e.nativeEvent.locationX * ratio;
```

To clip strokes inside a shape, wrap with `<Defs><ClipPath>` in the strokes SVG layer (see `coloring.tsx`).

---

## Responsive Layout

```ts
function getScale(w: number) {
  if (w >= 1300) return 1.3;
  if (w >= 1000) return 1.1;
  if (w >= 800)  return 1.0;
  return 0.85;
}
const isTablet = width >= 800;
```

Listen for orientation changes:
```ts
const [dims, setDims] = useState(Dimensions.get('window'));
useEffect(() => {
  const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
  return () => sub.remove();
}, []);
```
