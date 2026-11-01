/**
 * KÝ ỨC VIỆT NAM 40 NĂM TRƯỚC - CINEMATIC STORYTELLER (CLEAN HD)
 * - Sắc nét HD không vỡ hình, không grain/vết nứt
 * - Chuyển động Ken Burns êm dịu theo giọng đọc
 * - Giọng đọc thanh thoát, lưu loát (Pitch 1.15x, ưu tiên giọng Hoài My / Jenny)
 * - Đã xóa hoàn toàn nhạc nền theo yêu cầu
 */

// ==========================================
// 1. STORY SCENE DATA
// ==========================================
const STORY_SCENES = [
  {
    id: 0,
    badge: "CẢNH 1 / 3 • ĐỒNG QUÊ & NỖI NHỌC NHẰN",
    text_vi: "Khoảng 40 năm trước, cuộc sống ở Việt Nam còn muôn vàn khó khăn. Nhiều gia đình nghèo khó, thiếu thốn cái ăn, manh áo; người lớn vất vả sớm hôm trên những cánh đồng,",
    text_en: "About forty years ago, life in Vietnam was very difficult. Many families were poor and lacked food and clothes, while adults worked hard in the fields,",
    camera: {
      start: { x: 0, y: -4, scale: 1.0 },
      mid:   { x: 0.5, y: 0, scale: 1.03 },
      end:   { x: -0.8, y: 4, scale: 1.06 }
    },
    estimatedSeconds: 10.5
  },
  {
    id: 1,
    badge: "CẢNH 2 / 3 • ĐẾN LỚP & ĐỠ ĐẦN CHA MẸ",
    text_vi: "trong khi trẻ nhỏ ngày ngày đi bộ đến trường và chăm chỉ giúp đỡ cha mẹ việc nhà.",
    text_en: "while children walked to school and diligently helped their parents with housework.",
    camera: {
      start: { x: 1, y: -3, scale: 1.0 },
      mid:   { x: -0.5, y: 0, scale: 1.03 },
      end:   { x: 0, y: 3.5, scale: 1.05 }
    },
    estimatedSeconds: 6.5
  },
  {
    id: 2,
    badge: "CẢNH 3 / 3 • TÌNH YÊU THƯƠNG & ĐÙM BỌC",
    text_vi: "Dù cuộc sống muôn vàn gian nan, mọi người vẫn luôn tràn ngập yêu thương, quan tâm và đùm bọc lẫn nhau.",
    text_en: "Although life was difficult, people always loved, cared for, and supported each other.",
    camera: {
      start: { x: 0, y: -3, scale: 1.0 },
      mid:   { x: 0.6, y: 0, scale: 1.03 },
      end:   { x: 0, y: 3.5, scale: 1.06 }
    },
    estimatedSeconds: 8.0
  }
];

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
const state = {
  currentScene: 0,
  isPlaying: false,
  isPaused: false,
  language: 'vi-VN', // Default to Vietnamese for the clearest pronunciation
  playbackRate: 1.0,
  playbackPitch: 1.15, // Âm sắc thanh thoát
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
  langSelect: document.getElementById('lang-select'),
  voiceSelect: document.getElementById('voice-select'),
  pitchSelect: document.getElementById('pitch-select'),
  speedSelect: document.getElementById('speed-select'),
  speechIndicator: document.getElementById('speech-indicator'),
  sceneBadge: document.getElementById('scene-badge'),
  captionPrimary: document.getElementById('caption-primary'),
  captionSecondary: document.getElementById('caption-secondary'),
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
// 4. SPEECH SYNTHESIS SETUP (THANH & LƯU LOÁT)
// ==========================================
function populateVoices() {
  if (!state.speechSynth) return;
  const allVoices = state.speechSynth.getVoices();
  state.availableVoices = allVoices;

  const currentLang = state.language;
  const langPrefix = currentLang.substring(0, 2).toLowerCase();
  let matchingVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));

  // If no direct match for Vietnamese, show all available voices
  if (matchingVoices.length === 0 && langPrefix === 'vi') {
    matchingVoices = allVoices;
  }

  elements.voiceSelect.innerHTML = '';
  matchingVoices.forEach((voice) => {
    const opt = document.createElement('option');
    opt.value = voice.name;
    let cleanName = voice.name.replace(/Microsoft |Google /g, '');
    opt.textContent = `${cleanName} (${voice.lang})`;
    elements.voiceSelect.appendChild(opt);
  });

  // Ưu tiên các giọng nữ thanh thoát, tự nhiên nhất:
  // - Tiếng Việt: Microsoft HoaiMy Online (Natural), Google tiếng Việt
  // - Tiếng Anh: Microsoft Jenny Online (Natural), Microsoft Aria, Google US English
  let preferredVoice = null;
  if (langPrefix === 'vi') {
    preferredVoice = matchingVoices.find(v => v.name.includes('HoaiMy') || v.name.includes('Hoài My')) ||
                     matchingVoices.find(v => v.name.includes('Natural') && v.lang.startsWith('vi')) ||
                     matchingVoices.find(v => v.lang.toLowerCase().startsWith('vi')) ||
                     matchingVoices[0];
  } else {
    preferredVoice = matchingVoices.find(v => v.name.includes('Jenny') && v.name.includes('Natural')) ||
                     matchingVoices.find(v => v.name.includes('Aria')) ||
                     matchingVoices.find(v => v.name.includes('Natural')) ||
                     matchingVoices[0];
  }

  if (preferredVoice) {
    elements.voiceSelect.value = preferredVoice.name;
    state.selectedVoice = preferredVoice;
  }
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoices;
}

// ==========================================
// 5. KEN BURNS MOTION ENGINE (SUBTLE & CRISP)
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
// 6. CAPTION & SUBTITLE RENDERING
// ==========================================
let currentSceneWords = [];

function renderCaptions(sceneIndex) {
  const scene = STORY_SCENES[sceneIndex];
  elements.sceneBadge.textContent = scene.badge;

  const isVi = state.language === 'vi-VN';
  const primaryText = isVi ? scene.text_vi : scene.text_en;
  const secondaryText = isVi ? scene.text_en : scene.text_vi;

  currentSceneWords = primaryText.split(/\s+/);
  elements.captionPrimary.innerHTML = '';
  
  currentSceneWords.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.dataset.index = index;
    span.textContent = word + ' ';
    elements.captionPrimary.appendChild(span);
  });

  elements.captionSecondary.textContent = secondaryText;
}

function highlightWord(wordIndex) {
  state.activeWordIndex = wordIndex;
  const wordSpans = elements.captionPrimary.querySelectorAll('.word');
  wordSpans.forEach((span, idx) => {
    if (idx < wordIndex) {
      span.className = 'word spoken';
    } else if (idx === wordIndex) {
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
  const isVi = state.language === 'vi-VN';
  const textToSpeak = isVi ? scene.text_vi : scene.text_en;

  if (state.speechSynth) {
    state.speechSynth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = state.playbackRate;
  utterance.pitch = state.playbackPitch; // Giọng thanh và trong trẻo
  utterance.lang = state.language;

  const voiceName = elements.voiceSelect.value;
  const voice = state.availableVoices.find(v => v.name === voiceName);
  if (voice) {
    utterance.voice = voice;
  }

  state.currentUtterance = utterance;
  state.sceneStartTime = performance.now();
  state.sceneDurationMs = (scene.estimatedSeconds * 1000) / state.playbackRate;

  utterance.onboundary = (e) => {
    if (e.name === 'word') {
      const charIndex = e.charIndex;
      let charCount = 0;
      for (let i = 0; i < currentSceneWords.length; i++) {
        const wordLen = currentSceneWords[i].length + 1;
        if (charIndex >= charCount && charIndex < charCount + wordLen) {
          highlightWord(i);
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
  };

  utterance.onend = () => {
    highlightWord(currentSceneWords.length);
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

// Continuous frame loop
function animationLoop(timestamp) {
  if (state.isPlaying && !state.isPaused) {
    const elapsed = timestamp - state.sceneStartTime;
    const progress = Math.min(1.0, elapsed / state.sceneDurationMs);

    state.sceneProgress = progress;
    updateCameraMotion(state.currentScene, state.sceneProgress);

    const estimatedWordIndex = Math.min(
      currentSceneWords.length - 1,
      Math.floor(progress * currentSceneWords.length)
    );
    if (estimatedWordIndex > state.activeWordIndex) {
      highlightWord(estimatedWordIndex);
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

// Language Switch
elements.langSelect.addEventListener('change', (e) => {
  state.language = e.target.value;
  populateVoices();
  renderCaptions(state.currentScene);
  if (state.isPlaying) {
    playScene(state.currentScene);
  }
});

// Voice selection
elements.voiceSelect.addEventListener('change', () => {
  if (state.isPlaying) {
    playScene(state.currentScene);
  }
});

// Pitch selection (Âm sắc thanh thoát)
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
