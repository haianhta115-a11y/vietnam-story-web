/**
 * LIFE IN VIETNAM 40 YEARS AGO - FULL ENGLISH CINEMATIC STORYTELLER
 * Features:
 * - 100% English Narration with Natural Fluent Voice (Jenny / Aria / Google US English)
 * - 3D Kinetic Embossed Bouncing Subtitles ("Chữ nổi nhảy theo giọng đọc")
 * - High-Definition HD Visuals with gentle Ken Burns motion
 * - Full English interface, controls, and contextual notes
 */

// ==========================================
// 1. STORY SCENE DATA (ENGLISH)
// ==========================================
const STORY_SCENES = [
  {
    id: 0,
    badge: "SCENE 1 / 3 • COUNTRYSIDE & HARD LABOR",
    text: "About forty years ago, life in Vietnam was very difficult. Many families were poor and lacked food and clothes. Adults worked hard in the fields,",
    camera: {
      start: { x: 0, y: -4, scale: 1.0 },
      mid:   { x: 0.5, y: 0, scale: 1.03 },
      end:   { x: -0.8, y: 4, scale: 1.06 }
    },
    estimatedSeconds: 10.8
  },
  {
    id: 1,
    badge: "SCENE 2 / 3 • WALK TO SCHOOL & HELPING FAMILY",
    text: "while children walked to school and helped their parents with housework.",
    camera: {
      start: { x: 1, y: -3, scale: 1.0 },
      mid:   { x: -0.5, y: 0, scale: 1.03 },
      end:   { x: 0, y: 3.5, scale: 1.05 }
    },
    estimatedSeconds: 6.2
  },
  {
    id: 2,
    badge: "SCENE 3 / 3 • BOUNDLESS LOVE & SOLIDARITY",
    text: "Although life was difficult, people always loved, cared for, and supported each other.",
    camera: {
      start: { x: 0, y: -3, scale: 1.0 },
      mid:   { x: 0.6, y: 0, scale: 1.03 },
      end:   { x: 0, y: 3.5, scale: 1.06 }
    },
    estimatedSeconds: 8.2
  }
];

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
const state = {
  currentScene: 0,
  isPlaying: false,
  isPaused: false,
  language: 'en-US',
  playbackRate: 0.98, // Fluent natural pacing
  playbackPitch: 1.12, // Bright, clear, pleasant timbre
  selectedVoice: null,
  availableVoices: [],
  sceneProgress: 0, // 0.0 to 1.0
  activeWordIndex: -1,
  sceneStartTime: 0,
  sceneDurationMs: 8000,
  animFrameId: null,
  speechSynth: window.speechSynthesis,
  currentUtterance: null
};

// ==========================================
// 3. DOM ELEMENTS
// ==========================================
const elements = {
  stage: document.getElementById('theater-stage'),
  cinemaFrame: document.getElementById('cinema-frame'),
  startOverlay: document.getElementById('start-overlay'),
  startBtn: document.getElementById('start-btn'),
  playPauseBtn: document.getElementById('play-pause-btn'),
  playIcon: document.getElementById('play-icon'),
  pauseIcon: document.getElementById('pause-icon'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  replayBtn: document.getElementById('replay-btn'),
  voiceSelect: document.getElementById('voice-select'),
  pitchSelect: document.getElementById('pitch-select'),
  speedSelect: document.getElementById('speed-select'),
  speechIndicator: document.getElementById('speech-indicator'),
  sceneBadge: document.getElementById('scene-badge'),
  captionPrimary: document.getElementById('caption-primary'),
  timelineBar: document.getElementById('timeline-bar'),
  timelineProgress: document.getElementById('timeline-progress'),
  timeCurrent: document.getElementById('time-current'),
  timeTotal: document.getElementById('time-total'),
  fullscreenBtn: document.getElementById('fullscreen-btn'),
  fsExpandIcon: document.getElementById('fs-expand-icon'),
  fsCompressIcon: document.getElementById('fs-compress-icon'),
  slides: document.querySelectorAll('.scene-slide'),
  imgs: [
    document.getElementById('img-scene-0'),
    document.getElementById('img-scene-1'),
    document.getElementById('img-scene-2')
  ],
  thumbBtns: document.querySelectorAll('.thumb-btn'),
  markers: document.querySelectorAll('.timeline-markers .marker')
};

const TOTAL_DURATION_SECONDS = STORY_SCENES.reduce((sum, s) => sum + s.estimatedSeconds, 0);

// ==========================================
// 4. SPEECH SYNTHESIS SETUP (NATURAL ENGLISH VOICES)
// ==========================================
function populateVoices() {
  if (!state.speechSynth) return;
  const allVoices = state.speechSynth.getVoices();
  state.availableVoices = allVoices;

  // Filter English voices
  let englishVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith('en'));
  if (englishVoices.length === 0) {
    englishVoices = allVoices;
  }

  elements.voiceSelect.innerHTML = '';
  englishVoices.forEach((voice) => {
    const opt = document.createElement('option');
    opt.value = voice.name;
    let cleanName = voice.name.replace(/Microsoft |Google /g, '');
    opt.textContent = `${cleanName} (${voice.lang})`;
    elements.voiceSelect.appendChild(opt);
  });

  // Prioritize top natural high-definition English voices:
  // Jenny (Natural), Aria (Natural), Guy (Natural), Google US English
  const preferredVoice = 
    englishVoices.find(v => v.name.includes('Jenny') && v.name.includes('Natural')) ||
    englishVoices.find(v => v.name.includes('Aria') && v.name.includes('Natural')) ||
    englishVoices.find(v => v.name.includes('Natural') && v.lang.includes('US')) ||
    englishVoices.find(v => v.name.includes('US English')) ||
    englishVoices.find(v => v.name.includes('Jenny')) ||
    englishVoices[0];

  if (preferredVoice) {
    elements.voiceSelect.value = preferredVoice.name;
    state.selectedVoice = preferredVoice;
  }
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoices;
}

// ==========================================
// 5. KEN BURNS MOTION ENGINE
// ==========================================
function updateCameraMotion(sceneIndex, progress) {
  const scene = STORY_SCENES[sceneIndex];
  const img = elements.imgs[sceneIndex];
  if (!scene || !img) return;

  const cam = scene.camera;
  const p = Math.max(0, Math.min(1, progress));

  let targetX, targetY, targetScale;
  if (p < 0.5) {
    const t = p * 2;
    targetX = cam.start.x + (cam.mid.x - cam.start.x) * t;
    targetY = cam.start.y + (cam.mid.y - cam.start.y) * t;
    targetScale = cam.start.scale + (cam.mid.scale - cam.start.scale) * t;
  } else {
    const t = (p - 0.5) * 2;
    targetX = cam.mid.x + (cam.end.x - cam.mid.x) * t;
    targetY = cam.mid.y + (cam.end.y - cam.mid.y) * t;
    targetScale = cam.mid.scale + (cam.end.scale - cam.mid.scale) * t;
  }

  // Smooth subtle breathing
  const time = performance.now();
  const breathe = Math.sin(time * 0.001) * 0.005;

  img.style.transform = `scale(${(targetScale + breathe).toFixed(4)}) translate3d(${targetX.toFixed(2)}%, ${targetY.toFixed(2)}%, 0)`;
}

// ==========================================
// 6. 3D KINETIC BOUNCING WORDS ENGINE
// ==========================================
let currentSceneWords = [];

function renderCaptions(sceneIndex) {
  const scene = STORY_SCENES[sceneIndex];
  elements.sceneBadge.textContent = scene.badge;

  currentSceneWords = scene.text.split(/\s+/);
  elements.captionPrimary.innerHTML = '';
  
  currentSceneWords.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.dataset.index = index;
    span.textContent = word + ' ';
    elements.captionPrimary.appendChild(span);
  });
}

function triggerWordJump(wordIndex) {
  if (wordIndex === state.activeWordIndex) return;
  state.activeWordIndex = wordIndex;

  const wordSpans = elements.captionPrimary.querySelectorAll('.word');
  wordSpans.forEach((span, idx) => {
    if (idx < wordIndex) {
      span.className = 'word spoken';
    } else if (idx === wordIndex) {
      // Re-trigger animation cleanly
      span.className = 'word';
      void span.offsetWidth; // Force CSS reflow
      span.className = 'word active';
    } else {
      span.className = 'word';
    }
  });
}

// ==========================================
// 7. PLAYBACK & NARRATION CONTROLLER
// ==========================================
function switchSceneUI(sceneIndex) {
  state.currentScene = sceneIndex;
  state.sceneProgress = 0;
  state.activeWordIndex = -1;

  elements.slides.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === sceneIndex);
  });

  elements.thumbBtns.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === sceneIndex);
  });

  elements.markers.forEach((marker, idx) => {
    marker.classList.toggle('active', idx <= sceneIndex);
  });

  renderCaptions(sceneIndex);
  updateCameraMotion(sceneIndex, 0);
  updateTimelineUI();
}

function playScene(sceneIndex) {
  if (sceneIndex >= STORY_SCENES.length) {
    onStoryFinished();
    return;
  }

  switchSceneUI(sceneIndex);

  const scene = STORY_SCENES[sceneIndex];
  const textToSpeak = scene.text;

  if (state.speechSynth) {
    state.speechSynth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = state.playbackRate;
  utterance.pitch = state.playbackPitch;
  utterance.lang = 'en-US';

  const voiceName = elements.voiceSelect.value;
  const voice = state.availableVoices.find(v => v.name === voiceName);
  if (voice) {
    utterance.voice = voice;
  }

  state.currentUtterance = utterance;
  state.sceneStartTime = performance.now();
  state.sceneDurationMs = (scene.estimatedSeconds * 1000) / state.playbackRate;

  // Real-time word boundary jumping
  utterance.onboundary = (e) => {
    if (e.name === 'word') {
      const charIndex = e.charIndex;
      let charCount = 0;
      for (let i = 0; i < currentSceneWords.length; i++) {
        const cleanWord = currentSceneWords[i];
        const wordLen = cleanWord.length + 1;
        if (charIndex >= charCount && charIndex < charCount + wordLen) {
          triggerWordJump(i);
          state.sceneProgress = (i + 1) / currentSceneWords.length;
          break;
        }
        charCount += wordLen;
      }
    }
  };

  utterance.onstart = () => {
    state.isPlaying = true;
    state.isPaused = false;
    updatePlayPauseButtonUI();
    elements.speechIndicator.classList.add('active');
    triggerWordJump(0);
  };

  utterance.onend = () => {
    triggerWordJump(currentSceneWords.length);
    state.sceneProgress = 1.0;
    updateCameraMotion(sceneIndex, 1.0);
    elements.speechIndicator.classList.remove('active');

    if (state.isPlaying) {
      setTimeout(() => {
        if (state.isPlaying) {
          playScene(sceneIndex + 1);
        }
      }, 550);
    }
  };

  utterance.onerror = (err) => {
    console.warn("Speech synthesis notice:", err);
    elements.speechIndicator.classList.remove('active');
  };

  state.speechSynth.speak(utterance);
}

// Continuous frame loop for smooth camera & kinetic fallback sync
function animationLoop(timestamp) {
  if (state.isPlaying && !state.isPaused) {
    const elapsed = timestamp - state.sceneStartTime;
    const progress = Math.min(1.0, elapsed / state.sceneDurationMs);

    state.sceneProgress = progress;
    updateCameraMotion(state.currentScene, state.sceneProgress);

    // Fallback sync ensures words bounce on beat even if onboundary isn't supported
    const estimatedWordIndex = Math.min(
      currentSceneWords.length - 1,
      Math.floor(progress * currentSceneWords.length)
    );
    if (estimatedWordIndex > state.activeWordIndex) {
      triggerWordJump(estimatedWordIndex);
    }

    updateTimelineUI();
  } else {
    updateCameraMotion(state.currentScene, state.sceneProgress);
  }

  state.animFrameId = requestAnimationFrame(animationLoop);
}

// ==========================================
// 8. TIMELINE & SCRUBBING
// ==========================================
function updateTimelineUI() {
  let previousScenesDuration = 0;
  for (let i = 0; i < state.currentScene; i++) {
    previousScenesDuration += STORY_SCENES[i].estimatedSeconds;
  }
  const currentSceneDur = STORY_SCENES[state.currentScene] ? STORY_SCENES[state.currentScene].estimatedSeconds : 0;
  const currentElapsed = previousScenesDuration + (state.sceneProgress * currentSceneDur);

  const totalPercent = Math.min(100, (currentElapsed / TOTAL_DURATION_SECONDS) * 100);
  elements.timelineProgress.style.width = `${totalPercent.toFixed(1)}%`;

  elements.timeCurrent.textContent = formatTime(currentElapsed);
  elements.timeTotal.textContent = formatTime(TOTAL_DURATION_SECONDS);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

elements.timelineBar.addEventListener('click', (e) => {
  const rect = elements.timelineBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
  const targetSeconds = clickPercent * TOTAL_DURATION_SECONDS;

  let accumulated = 0;
  for (let i = 0; i < STORY_SCENES.length; i++) {
    const dur = STORY_SCENES[i].estimatedSeconds;
    if (targetSeconds <= accumulated + dur || i === STORY_SCENES.length - 1) {
      jumpToScene(i);
      break;
    }
    accumulated += dur;
  }
});

function jumpToScene(index) {
  if (state.speechSynth) {
    state.speechSynth.cancel();
  }
  state.currentScene = index;
  state.sceneProgress = 0;
  switchSceneUI(index);

  if (state.isPlaying) {
    playScene(index);
  }
}

// ==========================================
// 9. CONTROLS & EVENT HANDLERS
// ==========================================
function updatePlayPauseButtonUI() {
  if (state.isPlaying && !state.isPaused) {
    elements.playIcon.style.display = 'none';
    elements.pauseIcon.style.display = 'block';
  } else {
    elements.playIcon.style.display = 'block';
    elements.pauseIcon.style.display = 'none';
  }
}

function togglePlayPause() {
  if (!state.isPlaying) {
    state.isPlaying = true;
    state.isPaused = false;
    elements.startOverlay.classList.add('hidden');
    playScene(state.currentScene);
  } else if (state.isPaused) {
    state.isPaused = false;
    if (state.speechSynth.paused) {
      state.speechSynth.resume();
    } else {
      playScene(state.currentScene);
    }
    elements.speechIndicator.classList.add('active');
    updatePlayPauseButtonUI();
  } else {
    state.isPaused = true;
    state.speechSynth.pause();
    elements.speechIndicator.classList.remove('active');
    updatePlayPauseButtonUI();
  }
}

function onStoryFinished() {
  state.isPlaying = false;
  state.isPaused = false;
  updatePlayPauseButtonUI();
  elements.speechIndicator.classList.remove('active');
  elements.timelineProgress.style.width = '100%';
}

elements.startBtn.addEventListener('click', () => {
  elements.startOverlay.classList.add('hidden');
  togglePlayPause();
});

elements.playPauseBtn.addEventListener('click', togglePlayPause);

elements.prevBtn.addEventListener('click', () => {
  if (state.currentScene > 0) {
    jumpToScene(state.currentScene - 1);
  }
});

elements.nextBtn.addEventListener('click', () => {
  if (state.currentScene < STORY_SCENES.length - 1) {
    jumpToScene(state.currentScene + 1);
  }
});

elements.replayBtn.addEventListener('click', () => {
  jumpToScene(0);
});

elements.thumbBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const sceneIdx = parseInt(btn.dataset.scene, 10);
    jumpToScene(sceneIdx);
  });
});

// Voice selection
elements.voiceSelect.addEventListener('change', () => {
  if (state.isPlaying) {
    playScene(state.currentScene);
  }
});

// Pitch selection (Tone)
elements.pitchSelect.addEventListener('change', (e) => {
  state.playbackPitch = parseFloat(e.target.value);
  if (state.isPlaying) {
    playScene(state.currentScene);
  }
});

// Speed selection
elements.speedSelect.addEventListener('change', (e) => {
  state.playbackRate = parseFloat(e.target.value);
  if (state.isPlaying) {
    playScene(state.currentScene);
  }
});

// Fullscreen Toggle
elements.fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    elements.cinemaFrame.requestFullscreen().catch(err => {
      console.warn("Fullscreen request error:", err);
    });
    elements.fsExpandIcon.style.display = 'none';
    elements.fsCompressIcon.style.display = 'block';
  } else {
    document.exitFullscreen();
    elements.fsExpandIcon.style.display = 'block';
    elements.fsCompressIcon.style.display = 'none';
  }
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    elements.fsExpandIcon.style.display = 'block';
    elements.fsCompressIcon.style.display = 'none';
  }
});

// ==========================================
// 10. INITIALIZATION
// ==========================================
function init() {
  populateVoices();
  switchSceneUI(0);
  updateTimelineUI();
  state.animFrameId = requestAnimationFrame(animationLoop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
