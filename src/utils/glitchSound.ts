// Short synthesized glitch burst (no audio files): stuttering filtered noise sweeping up, plus a few
// square blips. Plays on a theme change. It stays quiet and has an on/off switch saved in localStorage.
const KEY = "kumodot_glitch_sound";
let ctx: AudioContext | null = null;

export function isSoundOn(): boolean {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return true; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ }
}

export function playGlitch(ms = 280) {
  if (!isSoundOn() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    const dur = ms / 1000;

    const master = ctx.createGain();
    master.gain.value = 0.11;
    master.connect(ctx.destination);

    // noise, band-pass sweeping up, chopped by a stuttering gate
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(900, t0);
    bp.frequency.exponentialRampToValueAtTime(5200, t0 + dur);
    const gate = ctx.createGain();
    gate.gain.setValueAtTime(0, t0);
    let t = t0;
    while (t < t0 + dur) {
      gate.gain.setValueAtTime(0.9, t);
      t += 0.012 + Math.random() * 0.03;
      gate.gain.setValueAtTime(Math.random() < 0.35 ? 0.25 : 0, t);
      t += 0.008 + Math.random() * 0.025;
    }
    gate.gain.setValueAtTime(0, t0 + dur);
    src.connect(bp).connect(gate).connect(master);
    src.start(t0);

    // a few square blips
    for (let i = 0; i < 3; i++) {
      const at = t0 + (dur * i) / 3 + Math.random() * 0.03;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 220 + Math.random() * 1500;
      env.gain.setValueAtTime(0.35, at);
      env.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
      osc.connect(env).connect(master);
      osc.start(at);
      osc.stop(at + 0.05);
    }
  } catch { /* audio blocked or unsupported: stay silent */ }
}
