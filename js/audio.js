// Real Lichess Audio Samples + WebAudio Synth Fallback
window.SoundFX = {
  muted: false,
  samples: {
    move: new Audio('https://lichess1.org/assets/sound/standard/Move.mp3'),
    capture: new Audio('https://lichess1.org/assets/sound/standard/Capture.mp3'),
    spell: new Audio('https://lichess1.org/assets/sound/standard/GenericNotify.mp3'),
    victory: new Audio('https://lichess1.org/assets/sound/standard/Victory.mp3')
  },
  play(type) {
    if (this.muted) return;
    const snd = this.samples[type] || this.samples.move;
    snd.currentTime = 0;
    snd.play().catch(() => {});
  }
};
