# messica-machine

Dream scream machine for [10,000 Drum Machines](https://10kdrummachines.com).

A browser-based 16-step drum machine built with React and Tone.js. Messica Machine lets you build rhythms from bass drum, synth, noise, and preloaded scream samples in a minimal interface with responsive light and dark mode styling.

## Features

- 7 sound tracks
  - Bass Drum
  - Sine Wave
  - White Noise
  - Brown Noise
  - Scream 1
  - Scream 2
  - Scream 3
- 16-step sequencer grid for each track
- Selectable BPM presets: `97`, `123`, `138`, `192`
- Real-time step highlighting synced to Tone.js
- Built-in synthesis, sample playback, filtering, distortion, compression, and reverb
- Custom browser icon and simplified UI styling
- Responsive light and dark mode support

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

### 3. Build for production

```bash
npm run build
```

## Using Messica Machine

- Click `Play` to unlock audio and start the sequencer
- Turn steps on or off on any row
- Switch between BPM presets while the pattern is running
- Press `Reset` to clear the grid
- Layer bass drum, synth, noise, and scream tracks to build dense patterns

## Notes

- Audio starts after user interaction because browsers block autoplay by default.
- Scream samples are stored in `src/assets/screams/`.
- The current version includes a bass drum track, updated audio routing for better scream separation, and a simplified visual style.
