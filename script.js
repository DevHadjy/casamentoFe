const giftButton = document.querySelector("#giftButton");
const envelopeScene = document.querySelector("#envelopeScene");
const introScreen = document.querySelector("#introScreen");
const celebrationScreen = document.querySelector("#celebrationScreen");
const giftScreen = document.querySelector("#giftScreen");
const themeSelect = document.querySelector("#themeSelect");
const backButton = document.querySelector("#backButton");
const presentButton = document.querySelector("#presentButton");
const presentReveal = document.querySelector("#presentReveal");
const surpriseMessage = document.querySelector("#surpriseMessage");

let weddingAudioContext;
let weddingMasterGain;
let weddingMusicLoop;
let presentRevealTimer;
let isWeddingMusicPlaying = false;
const activeWeddingOscillators = new Set();

const weddingMelody = [
  { notes: ["C4", "E4", "G4"], duration: 0.65 },
  { notes: ["C4", "F4", "A4"], duration: 0.65 },
  { notes: ["B3", "D4", "G4"], duration: 0.65 },
  { notes: ["C4", "E4", "G4", "C5"], duration: 0.95 },
  { notes: ["E4", "G4", "C5"], duration: 0.55 },
  { notes: ["F4", "A4", "C5"], duration: 0.55 },
  { notes: ["D4", "G4", "B4"], duration: 0.55 },
  { notes: ["E4", "G4", "C5"], duration: 0.95 },
  { notes: ["A3", "E4", "C5"], duration: 0.65 },
  { notes: ["F3", "F4", "A4"], duration: 0.65 },
  { notes: ["G3", "D4", "B4"], duration: 0.65 },
  { notes: ["C4", "E4", "G4", "C5"], duration: 1.15 },
];

function getNoteFrequency(note) {
  const [, name, octave] = note.match(/^([A-G]#?)(\d)$/);
  const semitones = {
    C: -9,
    "C#": -8,
    D: -7,
    "D#": -6,
    E: -5,
    F: -4,
    "F#": -3,
    G: -2,
    "G#": -1,
    A: 0,
    "A#": 1,
    B: 2,
  };

  return 440 * 2 ** ((semitones[name] + (Number(octave) - 4) * 12) / 12);
}

function getWeddingAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return null;
  }

  if (!weddingAudioContext) {
    weddingAudioContext = new AudioContext();
    weddingMasterGain = weddingAudioContext.createGain();
    weddingMasterGain.gain.value = 0;
    weddingMasterGain.connect(weddingAudioContext.destination);
  }

  return weddingAudioContext;
}

function playWeddingNote(note, startTime, duration, volume) {
  const oscillator = weddingAudioContext.createOscillator();
  const gain = weddingAudioContext.createGain();
  const endTime = startTime + duration;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(getNoteFrequency(note), startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, Math.max(startTime + 0.08, endTime - 0.05));

  oscillator.connect(gain);
  gain.connect(weddingMasterGain);
  oscillator.addEventListener("ended", () => {
    activeWeddingOscillators.delete(oscillator);
  });
  activeWeddingOscillators.add(oscillator);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function scheduleWeddingMusic() {
  if (!isWeddingMusicPlaying) {
    return;
  }

  let startTime = weddingAudioContext.currentTime + 0.08;

  weddingMelody.forEach(({ notes, duration }) => {
    notes.forEach((note, index) => {
      playWeddingNote(note, startTime, duration, index === notes.length - 1 ? 0.045 : 0.026);
    });

    startTime += duration;
  });

  weddingMusicLoop = window.setTimeout(scheduleWeddingMusic, (startTime - weddingAudioContext.currentTime - 0.3) * 1000);
}

function startWeddingMusic() {
  const audioContext = getWeddingAudioContext();

  if (!audioContext || isWeddingMusicPlaying) {
    return;
  }

  isWeddingMusicPlaying = true;
  audioContext.resume();

  const now = audioContext.currentTime;
  weddingMasterGain.gain.cancelScheduledValues(now);
  weddingMasterGain.gain.setValueAtTime(weddingMasterGain.gain.value, now);
  weddingMasterGain.gain.linearRampToValueAtTime(0.78, now + 0.6);

  scheduleWeddingMusic();
}

function stopWeddingMusic() {
  if (!weddingAudioContext || !isWeddingMusicPlaying) {
    return;
  }

  isWeddingMusicPlaying = false;
  window.clearTimeout(weddingMusicLoop);

  const now = weddingAudioContext.currentTime;
  weddingMasterGain.gain.cancelScheduledValues(now);
  weddingMasterGain.gain.setValueAtTime(weddingMasterGain.gain.value, now);
  weddingMasterGain.gain.linearRampToValueAtTime(0, now + 0.35);

  activeWeddingOscillators.forEach((oscillator) => {
    try {
      oscillator.stop(now + 0.35);
    } catch (error) {
      activeWeddingOscillators.delete(oscillator);
    }
  });
}

function revealGift() {
  giftButton.disabled = true;
  envelopeScene.classList.add("is-opening");

  window.setTimeout(() => {
    introScreen.classList.add("is-hidden");
  }, 620);

  window.setTimeout(() => {
    introScreen.hidden = true;
    introScreen.setAttribute("aria-hidden", "true");
    celebrationScreen.hidden = false;
    celebrationScreen.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      celebrationScreen.classList.add("is-visible");
    });
  }, 1050);

  window.setTimeout(() => {
    celebrationScreen.classList.remove("is-visible");
    celebrationScreen.hidden = true;
    celebrationScreen.setAttribute("aria-hidden", "true");
    giftScreen.hidden = false;
    giftScreen.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      giftScreen.classList.add("is-visible");
    });
  }, 2950);
}

function returnToEnvelope() {
  celebrationScreen.classList.remove("is-visible");
  celebrationScreen.hidden = true;
  celebrationScreen.setAttribute("aria-hidden", "true");

  giftScreen.classList.remove("is-visible");
  giftScreen.hidden = true;
  giftScreen.setAttribute("aria-hidden", "true");

  introScreen.hidden = false;
  introScreen.classList.remove("is-hidden");
  introScreen.setAttribute("aria-hidden", "false");

  envelopeScene.classList.remove("is-opening");
  giftButton.disabled = false;
  resetPresent();
}

function revealPresent() {
  presentButton.disabled = true;
  presentButton.classList.add("is-opening");
  presentButton.setAttribute("aria-expanded", "true");
  startWeddingMusic();

  presentRevealTimer = window.setTimeout(() => {
    presentButton.hidden = true;
    presentReveal.hidden = false;

    window.requestAnimationFrame(() => {
      presentReveal.classList.add("is-visible");
      surpriseMessage.classList.add("is-visible");
    });
  }, 780);
}

function resetPresent() {
  window.clearTimeout(presentRevealTimer);
  presentButton.hidden = false;
  presentButton.disabled = false;
  presentButton.classList.remove("is-opening");
  presentButton.setAttribute("aria-expanded", "false");
  presentReveal.classList.remove("is-visible");
  presentReveal.hidden = true;
  surpriseMessage.classList.remove("is-visible");
  stopWeddingMusic();
}

giftButton.addEventListener("click", revealGift);
backButton.addEventListener("click", returnToEnvelope);
presentButton.addEventListener("click", revealPresent);

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
});

window.addEventListener("pagehide", stopWeddingMusic);
