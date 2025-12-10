# messica-machine
Dream scream machine for [10,000 drum machines](https://10kdrummachines.com).

A browser-based 16-step drum machine built with React, Tone.js, and a set of preloaded scream samples. This sequencer lets you create rhythms using synthesized sounds (sine + noise) along with three built-in scream samples.


## 🔊 Features

- 6 Sound Tracks
  - Sine Wave  
  - White Noise  
  - Brown Noise  
  - Scream 1 (preloaded)
  - Scream 2 (preloaded) 
  - Scream 3 (preloaded)
  
- 16-step sequencer grid for each track  
- Selectable BPM presets: 97, 123, 138, 192  
- Real-time step highlighting synced to Tone.js’ audio clock  
- Built-in distortion effect for added grit  
- Sample playback + synthesis using Tone.Transport and Tone.Loop  


## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server
   
```
npm start
```

Then open the app at:

```
http://localhost:3000
```

### 4. Using the Drum Machine

- Click Play to unlock audio and start the sequencer
- Toggle steps on any track
- Switch between BPM presets
- Press Reset to clear the entire grid
- The built-in screams will play automatically whenever their steps are active.

<img width="1231" height="669" alt="Screenshot 2025-12-10 at 11 58 26 AM" src="https://github.com/user-attachments/assets/54317cf6-c304-46c2-bd6d-b1b3718ec6be" />

