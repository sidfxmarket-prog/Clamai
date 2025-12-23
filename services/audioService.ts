
export interface AmbientBackground {
  start: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

export function createAmbientBackground(ctx: AudioContext): AmbientBackground {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  // Pad Layer (Existing Chords)
  const padGain = ctx.createGain();
  padGain.gain.value = 0.4;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 350;
  filter.Q.value = 1.2;
  filter.connect(padGain);
  padGain.connect(masterGain);

  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  // Frequencies for a calm F major/add9 chord (F2, C3, A3, G3)
  const freqs = [87.31, 130.81, 220.00, 196.00];

  const setupPad = () => {
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      
      // Very soft volume
      g.gain.value = 0.03 + (Math.random() * 0.02);
      
      // Slow volume LFO for "movement"
      const volLfo = ctx.createOscillator();
      const volLfoGain = ctx.createGain();
      volLfo.frequency.value = 0.05 + (i * 0.02);
      volLfoGain.gain.value = 0.02;
      volLfo.connect(volLfoGain);
      volLfoGain.connect(g.gain);
      volLfo.start();

      // Pitch drift LFO
      const pitchLfo = ctx.createOscillator();
      const pitchLfoGain = ctx.createGain();
      pitchLfo.frequency.value = 0.1 + (Math.random() * 0.1);
      pitchLfoGain.gain.value = 1.5;
      pitchLfo.connect(pitchLfoGain);
      pitchLfoGain.connect(osc.frequency);
      pitchLfo.start();

      osc.connect(g);
      g.connect(filter);
      
      oscillators.push(osc);
      gains.push(g);
      osc.start();
    });
  };

  // Noise Layer (Ocean/Wind)
  const setupNoise = () => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Create pinkish noise
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // rough compensation
        b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;

    // Ocean Wave LFO (Slow swell)
    const waveLfo = ctx.createOscillator();
    const waveLfoGain = ctx.createGain();
    waveLfo.frequency.value = 0.15; // 6-7 second wave cycle
    waveLfoGain.gain.value = 0.03;
    waveLfo.connect(waveLfoGain);
    waveLfoGain.connect(noiseGain.gain);
    waveLfo.start();

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();
  };

  setupPad();
  setupNoise();

  return {
    start: () => {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(0.4, now, 3); // Slow fade in
    },
    stop: () => {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(0, now, 1.5); // Graceful fade out
    },
    setVolume: (volume: number) => {
      const now = ctx.currentTime;
      masterGain.gain.setTargetAtTime(volume, now, 0.8);
    }
  };
}
