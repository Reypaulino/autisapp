# What's Next

## Pending / In Progress

### High Priority

| Task | Details |
|------|---------|
| **Vehicle Colouring — SVG ClipPath** | `coloring-vehicles.tsx` still draws outside vehicle outlines. Needs `clipShape()` silhouette added to each of the 8 vehicles and strokes wrapped in `<Defs><ClipPath id="vehicleClip">` + `<G clipPath="url(#vehicleClip)">` — same fix already applied to `coloring.tsx`. |

---

### Medium Priority

| Task | Details |
|------|---------|
| **Progress tracking** | Save completed levels per game to AsyncStorage. Show a progress indicator on the home screen. |
| **Kid profile / name** | Let the parent set a child's name on first launch. Display it on the home screen (e.g. "Hi Emma! 👋"). |
| **Haptics** | Add `expo-haptics` feedback on correct/wrong answers and card flips for a more tactile experience. |
| **Sound toggle** | A persistent mute button for all game sounds (separate from background music). |

---

### Low Priority / Ideas

| Task | Details |
|------|---------|
| **More animals / vehicles** | Add more SVG subjects to the colouring pages (dinosaurs, insects, trains, boats). |
| **More sensory games** | Expand `sensory.tsx` with a sound-matching game or a breathing / calm-down activity. |
| **Difficulty settings** | Per-game difficulty selector accessible from the home screen rather than inside each game. |
| **Onboarding flow** | Short 3-screen intro for first-time users explaining how the app works. |
| **Tablet-specific layout** | Side-by-side two-column layout on iPad for the home screen category grid. |
| **Localisation** | i18n support — at minimum English + Spanish. |
| **App icon & splash** | Custom branded icon and native splash image in `app.json`. |

---

## Future Games to Add

| Game | Description |
|------|-------------|
| **Tracing letters** | Guided finger-tracing of A–Z and 0–9 with SVG paths. |
| **Counting objects** | Tap to count visible objects — score based on accuracy. |
| **Shape matching** | Drag geometric shapes to matching outlines. |
| **Story sequencing** | Put 3–4 picture cards in the correct story order. |
| **Emotion recognition** | Show a face emoji, ask the child to identify the emotion. |
