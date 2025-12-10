import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Play, Square, RotateCcw } from 'lucide-react';

// 🔊 import scream samples so bundler gives us valid URLs
import scream1Url from './assets/screams/scream.wav';
import scream2Url from './assets/screams/scream2.wav';
import scream3Url from './assets/screams/scream3.wav';

const DrumMachine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(97);
  const bpmOptions = [97, 123, 138, 192];
  const [currentStep, setCurrentStep] = useState(0);
  const [pattern, setPattern] = useState({
    sine: Array(16).fill(false),
    white: Array(16).fill(false),
    brown: Array(16).fill(false),
    scream1: Array(16).fill(false),
    scream2: Array(16).fill(false),
    scream3: Array(16).fill(false),
  });

  const [samplesLoaded, setSamplesLoaded] = useState(false);

  const loopRef = useRef(null);
  const sineRef = useRef(null);
  const whiteNoiseRef = useRef(null);
  const brownNoiseRef = useRef(null);
  const playersRef = useRef({}); // { scream1: Player, ... }

  useEffect(() => {
    const distortion = new Tone.Distortion(0.8).toDestination();

    // Sine synth
    sineRef.current = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 },
    }).connect(distortion);
    sineRef.current.volume.value = -12;

    // Noise sources
    whiteNoiseRef.current = new Tone.Noise('white').connect(distortion);
    whiteNoiseRef.current.volume.value = -15;

    brownNoiseRef.current = new Tone.Noise('brown').connect(distortion);
    brownNoiseRef.current.volume.value = -15;

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
      }).connect(distortion);

      // loud enough to be sure we hear them
      player.volume.value = 0;
      playersRef.current[key] = player;
    });

    return () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
      }
      sineRef.current?.dispose();
      whiteNoiseRef.current?.dispose();
      brownNoiseRef.current?.dispose();
      Object.values(playersRef.current).forEach((p) => p.dispose());
      distortion.dispose();
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const toggleStep = (track, step) => {
    setPattern((prev) => ({
      ...prev,
      [track]: prev[track].map((val, i) => (i === step ? !val : val)),
    }));
  };

  const playSound = (track, time) => {
    if (track === 'sine') {
      sineRef.current?.triggerAttackRelease('C4', '16n', time);
    } else if (track === 'white') {
      if (!whiteNoiseRef.current) return;
      whiteNoiseRef.current.start(time);
      whiteNoiseRef.current.stop(time + 0.1);
    } else if (track === 'brown') {
      if (!brownNoiseRef.current) return;
      brownNoiseRef.current.start(time);
      brownNoiseRef.current.stop(time + 0.15);
    } else {
      const player = playersRef.current[track];
      if (!player) return;

      if (!samplesLoaded) {
        console.warn(`Tried to play "${track}" before samples finished loading`);
        return;
      }

      try {
        player.start(time);
      } catch (e) {
        console.error(`Error starting player "${track}"`, e);
      }
    }
  };

  const startStop = async () => {
    await Tone.start();
    await Tone.loaded();

    if (isPlaying) {
      Tone.Transport.stop();
      if (loopRef.current) {
        loopRef.current.stop();
      }
      setCurrentStep(0);
      setIsPlaying(false);
    } else {
      let step = 0;

      loopRef.current = new Tone.Loop((time) => {
        Object.keys(pattern).forEach((track) => {
          if (pattern[track][step]) {
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
      sine: Array(16).fill(false),
      white: Array(16).fill(false),
      brown: Array(16).fill(false),
      scream1: Array(16).fill(false),
      scream2: Array(16).fill(false),
      scream3: Array(16).fill(false),
    });
    setCurrentStep(0);
  };

  const tracks = [
    { id: 'sine', label: 'Sine Wave', color: 'bg-cyan-500' },
    { id: 'white', label: 'White Noise', color: 'bg-gray-400' },
    { id: 'brown', label: 'Brown Noise', color: 'bg-amber-700' },
    { id: 'scream1', label: 'Scream 1', color: 'bg-red-500' },
    { id: 'scream2', label: 'Scream 2', color: 'bg-orange-500' },
    { id: 'scream3', label: 'Scream 3', color: 'bg-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-green-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-orange-400">
          Messica Machine
        </h1>

        <div className="bg-green-900 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={startStop}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isPlaying ? <Square size={20} /> : <Play size={20} />}
              {isPlaying ? 'Stop' : 'Play'}
            </button>

            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-green-700 hover:bg-green-600 transition"
            >
              <RotateCcw size={20} />
              Reset
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <label className="font-semibold">BPM:</label>
              <div className="flex gap-2">
                {bpmOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setBpm(option)}
                    className={`px-4 py-2 rounded font-semibold transition ${
                      bpm === option
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-800 hover:bg-green-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!samplesLoaded && (
            <p className="text-xs text-orange-200 mt-2">
              Loading scream samples…
            </p>
          )}
        </div>

        <div className="bg-green-900 rounded-lg p-6">
          {tracks.map((track) => (
            <div key={track.id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-4">
                <div className="w-32 font-semibold text-sm text-orange-200">
                  {track.label}
                </div>
                <div className="flex gap-1">
                  {pattern[track.id].map((active, i) => (
                    <button
                      key={i}
                      onClick={() => toggleStep(track.id, i)}
                      className={`w-12 h-12 rounded transition ${
                        active
                          ? track.color
                          : 'bg-green-800 hover:bg-green-700'
                      } ${
                        currentStep === i && isPlaying
                          ? 'ring-4 ring-orange-400'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrumMachine;