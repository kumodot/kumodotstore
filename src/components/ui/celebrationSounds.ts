// Unlock celebration sounds, made on the fly with Web Audio (no sound files).

/** A short burst of applause, made on the fly with Web Audio (no sound file): many people clapping at random,
 *  swelling in and fading out. Call it from a click or key press, browsers block sound that starts on its own. */
export function playApplause(seconds = 3.2, delay = 0) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const t0 = ctx.currentTime + 0.02 + delay;
    // one clap = a very short noise burst
    const len = Math.floor(ctx.sampleRate * 0.03);
    const noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    const people = 26;
    for (let p = 0; p < people; p++) {
      const rate = 3.2 + Math.random() * 2.6;           // claps per second for this person
      const tone = 900 + Math.random() * 1700;           // each pair of hands sounds a bit different
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 1.6 - 0.8;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = tone; bp.Q.value = 0.9;
      bp.connect(pan).connect(master);
      let t = t0 + Math.random() * 0.5;
      while (t < t0 + seconds) {
        const age = (t - t0) / seconds;
        const env = Math.min(1, age * 4) * Math.pow(1 - age, 1.4);   // swell in, fade out
        const src = ctx.createBufferSource();
        src.buffer = noise;
        src.playbackRate.value = 0.85 + Math.random() * 0.3;
        const g = ctx.createGain();
        g.gain.value = env * (0.35 + Math.random() * 0.4);
        src.connect(g).connect(bp);
        src.start(t);
        t += 1 / rate + (Math.random() - 0.5) * 0.06;
      }
    }
    setTimeout(() => void ctx.close(), (seconds + delay + 1) * 1000);
  } catch { /* no audio */ }
}

/** A tiny 8-bit "you got an item!" jingle (square-wave lead + triangle bass), an original tune made with Web Audio.
 *  Same rule as the applause: call it from a click or key press. */
export function playFanfare() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const t0 = ctx.currentTime + 0.03;
    const master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    const note = (type: OscillatorType, f: number, at: number, dur: number, vol: number, vib = false) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      const s0 = t0 + at, e = s0 + dur;
      g.gain.setValueAtTime(vol, s0);
      g.gain.setValueAtTime(vol, e - 0.02);
      g.gain.linearRampToValueAtTime(0, e);
      if (vib) {   // a little vibrato on the held last note
        const lfo = ctx.createOscillator(); const lg = ctx.createGain();
        lfo.frequency.value = 6; lg.gain.value = f * 0.012;
        lfo.connect(lg).connect(o.frequency); lfo.start(s0 + 0.12); lfo.stop(e);
      }
      o.connect(g).connect(master);
      o.start(s0);
      o.stop(e + 0.02);
    };
    const S = 0.075;   // one step
    // lead: two rising arpeggios, then a held two-note chord
    [1046.5, 1318.5, 1568.0, 2093.0].forEach((f, i) => note("square", f, i * S, S, 0.5));
    [1174.7, 1480.0, 1760.0, 2349.3].forEach((f, i) => note("square", f, (4 + i) * S, S, 0.5));
    note("square", 2093.0, 8 * S, 0.6, 0.45, true);
    note("square", 2637.0, 8 * S, 0.6, 0.3, true);
    // bass
    note("triangle", 261.6, 0, 4 * S, 0.9);
    note("triangle", 293.7, 4 * S, 4 * S, 0.9);
    note("triangle", 261.6, 8 * S, 0.6, 0.9);
    setTimeout(() => void ctx.close(), 2000);
  } catch { /* no audio */ }
}
