import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Play, Square, RotateCcw } from 'lucide-react';
import './App.css';

// 🔊 Use shorter scream edits in the sequencer while keeping the full originals on disk.
import scream1Url from './assets/screams/short/scream-short.wav';
import scream2Url from './assets/screams/short/scream2-short.wav';
import scream3Url from './assets/screams/short/scream3-short.wav';

const tracks = [
  { id: 'kick', label: 'Bass Drum', detail: 'Low End', accent: 'kick' },
  { id: 'sine', label: 'Sine Wave', detail: 'Signal', accent: 'signal' },
  { id: 'white', label: 'White Noise', detail: 'Static', accent: 'static' },
  { id: 'brown', label: 'Brown Noise', detail: 'Grit', accent: 'grit' },
  { id: 'scream1', label: 'Scream 1', detail: 'Voice A', accent: 'voice-a' },
  { id: 'scream2', label: 'Scream 2', detail: 'Voice B', accent: 'voice-b' },
  { id: 'scream3', label: 'Scream 3', detail: 'Voice C', accent: 'voice-c' },
];

const initialBpm = 97;

const DrumMachine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(initialBpm);
  const bpmOptions = [97, 123, 138, 192];
  const [currentStep, setCurrentStep] = useState(0);
  const [pattern, setPattern] = useState({
    kick: Array(16).fill(false),
    sine: Array(16).fill(false),
    white: Array(16).fill(false),
    brown: Array(16).fill(false),
    scream1: Array(16).fill(false),
    scream2: Array(16).fill(false),
    scream3: Array(16).fill(false),
  });

  const [samplesLoaded, setSamplesLoaded] = useState(false);

  const loopRef = useRef(null);
  const kickRef = useRef(null);
  const sineRef = useRef(null);
  const whiteNoiseRef = useRef(null);
  const brownNoiseRef = useRef(null);
  const whiteNoiseFilterRef = useRef(null);
  const brownNoiseFilterRef = useRef(null);
  const drumBusRef = useRef(null);
  const screamBusRef = useRef(null);
  const screamFilterRef = useRef(null);
  const playersRef = useRef({}); // { scream1: Player, ... }
  const patternRef = useRef(pattern);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    const players = {};
    playersRef.current = players;

    const drumReverb = new Tone.Reverb({
      decay: 1.4,
      wet: 0.08,
      preDelay: 0.02,
    });
    const screamReverb = new Tone.Reverb({
      decay: 2.2,
      wet: 0.14,
      preDelay: 0.03,
    });
    const masterLimiter = new Tone.Limiter(-1).toDestination();
    const drumCompressor = new Tone.Compressor(-22, 2.5);
    const screamCompressor = new Tone.Compressor(-14, 1.5);
    const distortion = new Tone.Distortion(0.28);
    screamFilterRef.current = new Tone.Filter({
      type: 'highpass',
      frequency: 140,
      rolloff: -24,
    });

    drumBusRef.current = new Tone.Gain(0.92);
    screamBusRef.current = new Tone.Gain(1.08);

    distortion.connect(drumReverb);
    drumReverb.connect(drumCompressor);
    drumCompressor.connect(drumBusRef.current);
    drumBusRef.current.connect(masterLimiter);

    screamFilterRef.current.connect(screamReverb);
    screamReverb.connect(screamCompressor);
    screamCompressor.connect(screamBusRef.current);
    screamBusRef.current.connect(masterLimiter);

    Tone.Transport.bpm.value = initialBpm;

    kickRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.045,
      octaves: 7,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.48,
        sustain: 0,
        release: 0.16,
      },
    }).connect(distortion);
    kickRef.current.volume.value = 1;

    // Give the tonal voice more body so it holds space beside the screams.
    sineRef.current = new Tone.MonoSynth({
      oscillator: { type: 'fatsine', count: 3, spread: 24 },
      filter: { Q: 1, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.004, decay: 0.28, sustain: 0.08, release: 0.22 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0.2,
        release: 0.2,
        baseFrequency: 120,
        octaves: 3,
      },
    }).connect(distortion);
    sineRef.current.volume.value = -5;

    // Noise sources
    whiteNoiseFilterRef.current = new Tone.Filter({
      type: 'bandpass',
      frequency: 3200,
      Q: 1.8,
      rolloff: -24,
    });
    const whiteNoiseDrive = new Tone.Distortion(0.5);
    whiteNoiseFilterRef.current.connect(whiteNoiseDrive);
    whiteNoiseDrive.connect(distortion);

    whiteNoiseRef.current = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.11,
        sustain: 0,
        release: 0.04,
      },
    }).connect(whiteNoiseFilterRef.current);
    whiteNoiseRef.current.volume.value = -8;

    brownNoiseFilterRef.current = new Tone.Filter({
      type: 'highpass',
      frequency: 900,
      Q: 0.9,
      rolloff: -24,
    });
    const brownNoiseDrive = new Tone.Distortion(0.42);
    brownNoiseFilterRef.current.connect(brownNoiseDrive);
    brownNoiseDrive.connect(distortion);

    brownNoiseRef.current = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0,
        release: 0.05,
      },
    }).connect(brownNoiseFilterRef.current);
    brownNoiseRef.current.volume.value = -7;

    // Sample URLs (now coming from imports, so they are guaranteed to be real audio files)
    const sampleUrls = {
      scream1: scream1Url,
      scream2: scream2Url,
      scream3: scream3Url,
    };

    const keys = Object.keys(sampleUrls);
    let loadedCount = 0;

    keys.forEach((key) => {
      const url = sampleUrls[key];
      const player = new Tone.Player({
        url,
        autostart: false,
        onload: () => {
          loadedCount += 1;
          console.log(`${key} loaded from ${url}`);
          if (loadedCount === keys.length) {
            console.log('All scream samples loaded ✅');
            setSamplesLoaded(true);
          }
        },
        onerror: (err) => {
          console.error(`Error loading ${key} from ${url}`, err);
        },
      }).connect(screamFilterRef.current);

      player.fadeIn = 0.005;
      player.fadeOut = 0.05;
      // loud enough to be sure we hear them
      player.volume.value = -2;
      players[key] = player;
    });

    return () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
      kickRef.current?.dispose();
      sineRef.current?.dispose();
      whiteNoiseRef.current?.dispose();
      brownNoiseRef.current?.dispose();
      whiteNoiseFilterRef.current?.dispose();
      brownNoiseFilterRef.current?.dispose();
      drumBusRef.current?.dispose();
      screamBusRef.current?.dispose();
      screamFilterRef.current?.dispose();
      Object.values(players).forEach((p) => p.dispose());
      distortion.dispose();
      drumReverb.dispose();
      screamReverb.dispose();
      drumCompressor.dispose();
      screamCompressor.dispose();
      masterLimiter.dispose();
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.rampTo(bpm, 0.08);
  }, [bpm]);

  const handleBpmChange = (nextBpm) => {
    setBpm(nextBpm);

    Tone.Transport.bpm.cancelScheduledValues(Tone.now());
    if (Tone.Transport.state === 'started') {
      Tone.Transport.bpm.rampTo(nextBpm, 0.05);
    } else {
      Tone.Transport.bpm.value = nextBpm;
    }
  };

  const toggleStep = (track, step) => {
    setPattern((prev) => ({
      ...prev,
      [track]: prev[track].map((val, i) => (i === step ? !val : val)),
    }));
  };

  const playSound = (track, time) => {
    if (track === 'kick') {
      kickRef.current?.triggerAttackRelease('C1', '8n', time, 1);
    } else if (track === 'sine') {
      sineRef.current?.triggerAttackRelease('C2', '8n', time, 0.9);
    } else if (track === 'white') {
      if (!whiteNoiseRef.current) return;
      whiteNoiseRef.current.triggerAttackRelease('32n', time, 1);
    } else if (track === 'brown') {
      if (!brownNoiseRef.current) return;
      brownNoiseRef.current.triggerAttackRelease('16n', time, 1);
    } else {
      const player = playersRef.current[track];
      if (!player) return;

      if (!samplesLoaded) {
        console.warn(`Tried to play "${track}" before samples finished loading`);
        return;
      }

      try {
        if (player.state === 'started') {
          player.stop(time);
        }
        player.start(time);
      } catch (e) {
        console.error(`Error starting player "${track}"`, e);
      }
    }
  };

  const startStop = async () => {
    await Tone.start();

    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
        loopRef.current = null;
      }
      setCurrentStep(0);
      setIsPlaying(false);
    } else {
      let step = currentStep;
      Tone.Transport.stop();
      Tone.Transport.cancel();

      loopRef.current = new Tone.Loop((time) => {
        Object.keys(patternRef.current).forEach((track) => {
          if (patternRef.current[track][step]) {
            playSound(track, time);
          }
        });

        Tone.Draw.schedule(() => {
          setCurrentStep(step);
        }, time);

        step = (step + 1) % 16;
      }, '16n');

      loopRef.current.start(0);
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const reset = () => {
    setPattern({
      kick: Array(16).fill(false),
      sine: Array(16).fill(false),
      white: Array(16).fill(false),
      brown: Array(16).fill(false),
      scream1: Array(16).fill(false),
      scream2: Array(16).fill(false),
      scream3: Array(16).fill(false),
    });
    setCurrentStep(0);
  };

  return (
    <div className="drum-machine-shell">
      <div className="drum-machine-frame">
        <header className="machine-hero">
          <h1 className="machine-title">Messica Machine</h1>
          <p className="machine-subtitle">
            A dream scream machine for building sharp rhythms from bass drum,
            noise, synth, and voice.
          </p>
        </header>

        <div className="machine-layout">
          <section className="machine-panel">
            <div className="machine-panel-header">
              <div className="machine-status-pill" aria-live="polite">
                <span className="machine-status-dot" />
                {samplesLoaded ? 'Samples Ready' : 'Loading Samples'}
              </div>
            </div>

            <div className="machine-controls">
              <div className="machine-button-row">
                <button
                  onClick={startStop}
                  aria-pressed={isPlaying}
                  className={`machine-button machine-button-primary ${
                    isPlaying ? 'is-active' : ''
                  }`}
                >
                  {isPlaying ? <Square size={18} /> : <Play size={18} />}
                  {isPlaying ? 'Stop' : 'Play'}
                </button>

                <button
                  onClick={reset}
                  className="machine-button machine-button-secondary"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>

              <div className="machine-bpm-group">
                <div className="machine-bpm-label">Tempo {bpm} BPM</div>
                <div className="machine-bpm-options">
                  {bpmOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleBpmChange(option)}
                      aria-pressed={bpm === option}
                      className={`machine-bpm-button ${
                        bpm === option ? 'is-selected' : ''
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!samplesLoaded && (
              <p className="machine-loading">Loading scream samples…</p>
            )}
          </section>

          <section className="machine-panel">
            <div className="machine-grid">
              {tracks.map((track) => (
                <div key={track.id} className="machine-row">
                  <div className="machine-track">
                    <div className="machine-track-name">{track.label}</div>
                    <div className="machine-track-kind">{track.detail}</div>
                  </div>

                  <div className="machine-steps">
                    {pattern[track.id].map((active, i) => (
                      <button
                        key={i}
                        onClick={() => toggleStep(track.id, i)}
                        aria-label={`${track.label} step ${i + 1}`}
                        className={`machine-step machine-step-accent-${track.accent} ${
                          active ? 'is-active' : ''
                        } ${currentStep === i && isPlaying ? 'is-current' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DrumMachine;
