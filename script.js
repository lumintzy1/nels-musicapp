let playlist = [
  {
    title: "Softy",
    artist: "Hideaway Feat. Mondo Loops",
    gif: "med1.gif",
    audioSrc: "Softy.mp3"
  },
  {
    title: "Midnight Thoughts",
    artist: "Yasumu",
    gif: "med2.gif",
    audioSrc: "MidnightThoughts.mp3"
  },
  {
    title: "Final moments",
    artist: "Nadav Cohen - Topik",
    gif: "med3.gif",
    audioSrc: "FinalMoments.mp3"
  },
  {
    title: "Cool Winds",
    artist: "Kudo - Topik",
    gif: "med4.gif",
    audioSrc: "CoolWinds.mp3"
  },
  {
    title: "Observations",
    artist: "Elijah Cat - Topik",
    gif: "med5.gif",
    audioSrc: "Observations.mp3"
  },
  {
    title: "Streets of Kyoto",
    artist: "Satsuto - Topik",
    gif: "med6.gif",
    audioSrc: "StreetsofKyoto.mp3"
  },
  {
    title: "Osaka Dreams",
    artist: "Satsuto - Topik",
    gif: "med7.gif",
    audioSrc: "OsakaDreams.mp3"
  }
];

let currentIndex = 0;
let isShuffle = false;
let isLoop = false;

// YouTube Music streaming integration state
let currentSource = 'local'; // 'local' or 'youtube'
let ytPlayer = null;
let ytPlayerReady = false;
let ytPlaylist = [];
let ytCurrentIndex = 0;

// DOM Elements Deck Audio
const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const loopBtn = document.getElementById('loop-btn');

const titleEl = document.getElementById('song-title');
const artistEl = document.getElementById('artist-name');
const coverImg = document.getElementById('cover-art');
const trackBadge = document.getElementById('track-badge');
const sysState = document.getElementById('sys-state');
const runeGem = document.getElementById('rune-gem');

const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const volumeSlider = document.getElementById('volume-slider');
const trackListUI = document.getElementById('track-list-ui');

// Web Audio Context & Beep
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function play8BitBeep(freq = 440, duration = 0.06, type = 'square') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playGameOverSynth() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    
    // Deeper pitch-falling sweep downwards for dramatic game over feel
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.65);
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
  } catch (e) {
    play8BitBeep(120, 0.4, 'sawtooth');
  }
}

function formatTime(sec) {
  if (isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Global Game state variables (declared at top to avoid Temporal Dead Zone ReferenceErrors)
let activeGame = 'snake'; // 'snake', 'tetris', 'invaders'
let gameRunning = false;
let gamePaused = false;
let gameLoopId = null;
let gameScore = 0;
let gameLevel = 1;
let systemDifficulty = 'normal'; // 'easy', 'normal', 'hard'

const highScores = {
  snake: 0,
  tetris: 0,
  invaders: 0
};

// Load scores
if (localStorage.getItem('arcade_hi_snake')) highScores.snake = parseInt(localStorage.getItem('arcade_hi_snake')) || 0;
if (localStorage.getItem('arcade_hi_tetris')) highScores.tetris = parseInt(localStorage.getItem('arcade_hi_tetris')) || 0;
if (localStorage.getItem('arcade_hi_invaders')) highScores.invaders = parseInt(localStorage.getItem('arcade_hi_invaders')) || 0;

// Navigasi Tampilan (Music Deck / Weather Radar / Mini Games)
const tabMusicBtn = document.getElementById('tab-music-btn');
const tabWeatherBtn = document.getElementById('tab-weather-btn');
const tabGamesBtn = document.getElementById('tab-games-btn');
const viewMusic = document.getElementById('view-music');
const viewWeather = document.getElementById('view-weather');
const viewGames = document.getElementById('view-games');
const pageHeroTitle = document.getElementById('page-hero-title');
const pageHeroSubtitle = document.getElementById('page-hero-subtitle');

function switchView(viewName) {
  play8BitBeep(640, 0.08);
  
  // Reset all tabs & views
  if (tabMusicBtn) tabMusicBtn.classList.remove('active');
  if (tabWeatherBtn) tabWeatherBtn.classList.remove('active');
  if (tabGamesBtn) tabGamesBtn.classList.remove('active');
  if (viewMusic) viewMusic.classList.remove('view-active');
  if (viewWeather) viewWeather.classList.remove('view-active');
  if (viewGames) viewGames.classList.remove('view-active');
  
  // Stop running game loops when switching tabs
  stopAllGames();
  
  if (viewName === 'music') {
    if (tabMusicBtn) tabMusicBtn.classList.add('active');
    if (viewMusic) viewMusic.classList.add('view-active');
    if (pageHeroTitle) pageHeroTitle.textContent = "RETRO//WAVE";
    if (pageHeroSubtitle) pageHeroSubtitle.textContent = "FM STEREO CASSETTE // WORKSTATION";
  } else if (viewName === 'weather') {
    if (tabWeatherBtn) tabWeatherBtn.classList.add('active');
    if (viewWeather) viewWeather.classList.add('view-active');
    if (pageHeroTitle) pageHeroTitle.textContent = "WEATHER//RADAR";
    if (pageHeroSubtitle) pageHeroSubtitle.textContent = "ORBITAL TELEMETRY & DISTANCE SCAN";
    setTimeout(() => {
      resizeRadarCanvas();
    }, 50);
  } else if (viewName === 'games') {
    if (tabGamesBtn) tabGamesBtn.classList.add('active');
    if (viewGames) viewGames.classList.add('view-active');
    if (pageHeroTitle) pageHeroTitle.textContent = "RETRO//ARCADE";
    if (pageHeroSubtitle) pageHeroSubtitle.textContent = "8-BIT SYNTH GAMING WORKSTATION";
    setTimeout(() => {
      initSelectedGame();
    }, 50);
  }
}

tabMusicBtn.addEventListener('click', () => switchView('music'));
tabWeatherBtn.addEventListener('click', () => switchView('weather'));
tabGamesBtn.addEventListener('click', () => switchView('games'));

// Media Session API
function updateMediaSession() {
  if ('mediaSession' in navigator) {
    const currentTrack = playlist[currentIndex];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: "Retro Lo-Fi Tape 1989",
      artwork: [{ src: currentTrack.gif, sizes: '512x512', type: 'image/gif' }]
    });

    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime && !isNaN(audio.duration)) {
        audio.currentTime = details.seekTime;
      }
    });
  }
}

// Render Playlist
function renderPlaylist() {
  if (!trackListUI) return;
  trackListUI.innerHTML = '';
  playlist.forEach((track, i) => {
    const li = document.createElement('li');
    li.className = `track-entry ${i === currentIndex ? 'active' : ''}`;
    li.innerHTML = `
      <span>0${i + 1}. ${track.title}</span>
      <span style="opacity: 0.7;">[PLAY]</span>
    `;
    li.addEventListener('click', () => {
      play8BitBeep(520, 0.08);
      currentIndex = i;
      loadTrack(currentIndex);
      audio.play();
      updatePlayState(true);
    });
    trackListUI.appendChild(li);
  });
}

function loadTrack(index) {
  currentSource = 'local';
  if (ytPlayerReady && ytPlayer) {
    try {
      ytPlayer.pauseVideo();
    } catch(e){}
  }
  
  const track = playlist[index];
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist.toUpperCase();
  coverImg.src = track.gif;
  audio.src = track.audioSrc;
  trackBadge.textContent = `0${index + 1}/0${playlist.length}`;
  progressFill.style.width = '0%';
  currentTimeEl.textContent = "00:00";
  renderPlaylist();
  updateMediaSession();
  renderYtPlaylistUI(); // Redraw online list to clear highlights
}

function updatePlayState(playing) {
  if (playing) {
    sysState.textContent = "PLAYING";
    runeGem.classList.add('active');
    playIcon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>`;
  } else {
    sysState.textContent = "PAUSED";
    runeGem.classList.remove('active');
    playIcon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  }
}

function togglePlay() {
  play8BitBeep(480, 0.07);
  if (currentSource === 'local') {
    if (audio.paused) {
      audio.play().then(() => updatePlayState(true)).catch(err => console.log(err));
    } else {
      audio.pause();
      updatePlayState(false);
    }
  } else {
    if (ytPlayerReady && ytPlayer) {
      try {
        const state = ytPlayer.getPlayerState();
        if (state === 1) { // YT.PlayerState.PLAYING
          ytPlayer.pauseVideo();
          updatePlayState(false);
        } else {
          ytPlayer.playVideo();
          updatePlayState(true);
        }
      } catch (e) {}
    }
  }
}

function nextTrack() {
  play8BitBeep(580, 0.05);
  if (currentSource === 'local') {
    if (isShuffle) {
      currentIndex = Math.floor(Math.random() * playlist.length);
    } else {
      currentIndex = (currentIndex + 1) % playlist.length;
    }
    loadTrack(currentIndex);
    audio.play();
    updatePlayState(true);
  } else {
    if (ytPlaylist.length > 0) {
      if (isShuffle) {
        ytCurrentIndex = Math.floor(Math.random() * ytPlaylist.length);
      } else {
        ytCurrentIndex = (ytCurrentIndex + 1) % ytPlaylist.length;
      }
      loadYtTrack(ytCurrentIndex);
    }
  }
}

function prevTrack() {
  play8BitBeep(390, 0.05);
  if (currentSource === 'local') {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentIndex);
    audio.play();
    updatePlayState(true);
  } else {
    if (ytPlaylist.length > 0) {
      ytCurrentIndex = (ytCurrentIndex - 1 + ytPlaylist.length) % ytPlaylist.length;
      loadYtTrack(ytCurrentIndex);
    }
  }
}

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

shuffleBtn.addEventListener('click', () => {
  play8BitBeep(440, 0.04);
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

loopBtn.addEventListener('click', () => {
  play8BitBeep(440, 0.04);
  isLoop = !isLoop;
  loopBtn.classList.toggle('active', isLoop);
});

audio.addEventListener('ended', () => {
  if (isLoop) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextTrack();
  }
});

audio.addEventListener('loadedmetadata', () => {
  if (currentSource === 'local') {
    totalDurationEl.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('timeupdate', () => {
  if (currentSource === 'local' && !isNaN(audio.duration)) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    totalDurationEl.textContent = formatTime(audio.duration);
  }
});

progressBar.addEventListener('click', (e) => {
  play8BitBeep(300, 0.05);
  const rect = progressBar.getBoundingClientRect();
  const clickPos = (e.clientX - rect.left) / rect.width;
  
  if (currentSource === 'local') {
    if (!isNaN(audio.duration)) {
      audio.currentTime = clickPos * audio.duration;
    }
  } else {
    if (ytPlayerReady && ytPlayer) {
      try {
        const duration = ytPlayer.getDuration();
        if (duration > 0) {
          ytPlayer.seekTo(clickPos * duration, true);
        }
      } catch (e) {}
    }
  }
});

volumeSlider.addEventListener('input', (e) => {
  audio.volume = e.target.value;
});

// CRT Scanlines Toggle
const crtToggleBtn = document.getElementById('crt-toggle');
const screenContainer = document.getElementById('screen-container');

crtToggleBtn.addEventListener('click', () => {
  play8BitBeep(520, 0.04);
  screenContainer.classList.toggle('crt-active');
  const isActive = screenContainer.classList.contains('crt-active');
  crtToggleBtn.textContent = isActive ? "CRT: ON" : "CRT: OFF";
});

// Clock & Timers
let timerMode = "CLOCK";
let timerSeconds = 0;
let timerInterval = null;

const clockDisplay = document.getElementById('pixel-clock');
const timerLabel = document.getElementById('timer-label');
const btnClock = document.getElementById('btn-mode-clock');
const btnPomo = document.getElementById('btn-mode-pomo');
const btnSleep = document.getElementById('btn-mode-sleep');

function setTimerMode(mode, minutes = 0) {
  play8BitBeep(450, 0.05);
  timerMode = mode;
  clearInterval(timerInterval);

  [btnClock, btnPomo, btnSleep].forEach(b => b.classList.remove('active'));

  if (mode === "CLOCK") {
    btnClock.classList.add('active');
    timerLabel.textContent = "RETRO CITY 1989";
    updateClock();
  } else if (mode === "POMO") {
    btnPomo.classList.add('active');
    timerLabel.textContent = "FOCUS SESSION (25M)";
    timerSeconds = minutes * 60;
    startTimerCountdown();
  } else if (mode === "SLEEP") {
    btnSleep.classList.add('active');
    timerLabel.textContent = "SLEEP TIMER (45M)";
    timerSeconds = minutes * 60;
    startTimerCountdown();
  }
}

function startTimerCountdown() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      play8BitBeep(300, 0.2, 'sawtooth');
      let fadeOut = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume -= 0.05;
        } else {
          clearInterval(fadeOut);
          audio.pause();
          updatePlayState(false);
          audio.volume = volumeSlider.value;
          setTimerMode("CLOCK");
        }
      }, 150);
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  clockDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

btnClock.addEventListener('click', () => setTimerMode("CLOCK"));
btnPomo.addEventListener('click', () => setTimerMode("POMO", 25));
btnSleep.addEventListener('click', () => setTimerMode("SLEEP", 45));

function updateClock() {
  if (timerMode !== "CLOCK") return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clockDisplay.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// Tape Speed Pitch
const pitchSlider = document.getElementById('pitch-slider');
const pitchVal = document.getElementById('pitch-val');
const btnSlowed = document.getElementById('btn-slowed');
const btnNormal = document.getElementById('btn-normal');
const btnSpeed = document.getElementById('btn-speed');

function setTapePlaybackRate(rate) {
  audio.playbackRate = rate;
  pitchSlider.value = rate;
  pitchVal.textContent = `${parseFloat(rate).toFixed(2)}x`;
}

pitchSlider.addEventListener('input', (e) => setTapePlaybackRate(e.target.value));
btnSlowed.addEventListener('click', () => { play8BitBeep(360, 0.05); setTapePlaybackRate(0.85); });
btnNormal.addEventListener('click', () => { play8BitBeep(440, 0.05); setTapePlaybackRate(1.00); });
btnSpeed.addEventListener('click', () => { play8BitBeep(520, 0.05); setTapePlaybackRate(1.15); });

// Drag & Drop MP3 & GIF Pemutar Kaset
const dropZone = document.getElementById('drop-zone');

['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });
});

dropZone.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;

  play8BitBeep(600, 0.1);

  Array.from(files).forEach(file => {
    const fileUrl = URL.createObjectURL(file);

    if (file.type.includes('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const newTrack = {
        title: cleanName,
        artist: "LOCAL CASSETTE",
        gif: coverImg.src,
        audioSrc: fileUrl
      };
      playlist.unshift(newTrack);
      currentIndex = 0;
      loadTrack(0);
      audio.play();
      updatePlayState(true);
      document.getElementById('track-count').textContent = `SIDE A // ${playlist.length} TRK`;
    } else if (file.type.includes('image') || file.name.endsWith('.gif')) {
      coverImg.src = fileUrl;
      playlist[currentIndex].gif = fileUrl;
    }
  });
});

// Synthesizer Noise Ambience
const ambienceNodes = {
  rain: { node: null, gain: null, active: false },
  fire: { node: null, gain: null, active: false },
  cricket: { node: null, gain: null, active: false }
};

function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function toggleAmbience(type) {
  const ctx = getAudioContext();
  const amb = ambienceNodes[type];
  const btn = document.getElementById(`${type}-btn`);
  const stat = document.getElementById(`${type}-stat`);
  const slider = document.getElementById(`${type}-vol`);

  if (amb.active) {
    amb.gain.gain.setValueAtTime(amb.gain.gain.value, ctx.currentTime);
    amb.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    setTimeout(() => {
      if (amb.node) amb.node.stop();
      amb.active = false;
    }, 300);
    btn.classList.remove('active');
    stat.textContent = "OFF";
  } else {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 850;
      gain.gain.value = parseFloat(slider.value) * 0.15;
    } else if (type === 'fire') {
      filter.type = 'bandpass';
      filter.frequency.value = 2400;
      gain.gain.value = parseFloat(slider.value) * 0.06;
    } else if (type === 'cricket') {
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      gain.gain.value = parseFloat(slider.value) * 0.12;
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    amb.node = noise;
    amb.gain = gain;
    amb.active = true;
    btn.classList.add('active');
    stat.textContent = "LIVE";
  }
}

['rain', 'fire', 'cricket'].forEach(type => {
  document.getElementById(`${type}-btn`).addEventListener('click', () => toggleAmbience(type));
  document.getElementById(`${type}-vol`).addEventListener('input', (e) => {
    const amb = ambienceNodes[type];
    if (amb.gain && amb.active) {
      amb.gain.gain.value = parseFloat(e.target.value) * 0.15;
    }
  });
});

// Retro Animated Horizon Background
const retroCanvas = document.getElementById('retro-canvas');
const rCtx = retroCanvas.getContext('2d');

function resizeRetroCanvas() {
  retroCanvas.width = window.innerWidth;
  retroCanvas.height = window.innerHeight;
}
resizeRetroCanvas();
window.addEventListener('resize', resizeRetroCanvas);

const stars = Array.from({ length: 90 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * (window.innerHeight * 0.65),
  size: Math.random() * 2 + 1,
  color: Math.random() > 0.5 ? '#00f0ff' : '#ff2a85',
  baseAlpha: Math.random() * 0.5 + 0.3
}));

let gridOffset = 0;
let timeTick = 0;

function drawRetroBackground() {
  rCtx.clearRect(0, 0, retroCanvas.width, retroCanvas.height);
  timeTick += 0.03;

  const w = retroCanvas.width;
  const h = retroCanvas.height;
  const horizon = h * 0.62;

  const skyGrad = rCtx.createLinearGradient(0, 0, 0, horizon);
  skyGrad.addColorStop(0, '#040108');
  skyGrad.addColorStop(1, '#200a35');
  rCtx.fillStyle = skyGrad;
  rCtx.fillRect(0, 0, w, horizon);

  stars.forEach(s => {
    const alpha = s.baseAlpha + Math.sin(timeTick * 4 + s.x) * 0.25;
    rCtx.fillStyle = s.color;
    rCtx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
    rCtx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
  });
  rCtx.globalAlpha = 1.0;

  const sunRadius = Math.min(w * 0.16, 95);
  const sunX = w / 2;
  const sunY = horizon - 20;

  const sunGlow = rCtx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 1.5);
  sunGlow.addColorStop(0, 'rgba(255, 42, 133, 0.4)');
  sunGlow.addColorStop(0.5, 'rgba(255, 170, 0, 0.15)');
  sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  rCtx.fillStyle = sunGlow;
  rCtx.beginPath();
  rCtx.arc(sunX, sunY, sunRadius * 1.5, 0, Math.PI * 2);
  rCtx.fill();

  rCtx.save();
  rCtx.beginPath();
  rCtx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  rCtx.clip();

  const sunGrad = rCtx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
  sunGrad.addColorStop(0, '#ffea00');
  sunGrad.addColorStop(0.5, '#ff2a85');
  sunGrad.addColorStop(1, '#590059');
  rCtx.fillStyle = sunGrad;
  rCtx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

  const stripCount = 8;
  for (let i = 0; i < stripCount; i++) {
    const stripY = sunY + (i / stripCount) * sunRadius;
    const stripHeight = (i + 1) * 1.4;
    rCtx.fillStyle = '#0f061b';
    rCtx.fillRect(sunX - sunRadius, stripY, sunRadius * 2, stripHeight);
  }
  rCtx.restore();

  const groundGrad = rCtx.createLinearGradient(0, horizon, 0, h);
  groundGrad.addColorStop(0, '#100320');
  groundGrad.addColorStop(1, '#040108');
  rCtx.fillStyle = groundGrad;
  rCtx.fillRect(0, horizon, w, h - horizon);

  gridOffset = (gridOffset + 0.65) % 24;

  rCtx.lineWidth = 1.5;
  for (let y = horizon; y < h; y += 4) {
    const normalized = (y - horizon) / (h - horizon);
    const curvedDist = Math.pow(normalized, 2.3) * (h - horizon);
    const drawY = horizon + curvedDist + (gridOffset * normalized * 1.6);

    if (drawY >= horizon && drawY <= h) {
      rCtx.strokeStyle = `rgba(255, 42, 133, ${0.15 + normalized * 0.7})`;
      rCtx.beginPath();
      rCtx.moveTo(0, drawY);
      rCtx.lineTo(w, drawY);
      rCtx.stroke();
    }
  }

  rCtx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  const centerPointX = w / 2;
  const numVLines = 36;
  const spread = w * 2.2;

  for (let i = -numVLines; i <= numVLines; i++) {
    const bottomX = centerPointX + (i * (spread / numVLines));
    rCtx.beginPath();
    rCtx.moveTo(centerPointX + (i * 2.5), horizon);
    rCtx.lineTo(bottomX, h);
    rCtx.stroke();
  }

  rCtx.strokeStyle = '#00f0ff';
  rCtx.lineWidth = 2;
  rCtx.shadowColor = '#00f0ff';
  rCtx.shadowBlur = 12;
  rCtx.beginPath();
  rCtx.moveTo(0, horizon);
  rCtx.lineTo(w, horizon);
  rCtx.stroke();
  rCtx.shadowBlur = 0;

  requestAnimationFrame(drawRetroBackground);
}
drawRetroBackground();

// Visualizer Bar Equalizer
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const barCount = 18;
const bars = Array.from({ length: barCount }, () => ({
  height: 2,
  target: 2,
  peak: 2
}));

function drawPixelVisualizer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = Math.floor(canvas.width / barCount);
  const blockSize = 4;

  for (let i = 0; i < barCount; i++) {
    if (!audio.paused) {
      bars[i].target = Math.sin(Date.now() * 0.007 + i * 0.45) * 14 + Math.random() * 12 + 4;
    } else {
      bars[i].target = 2;
    }

    bars[i].height += (bars[i].target - bars[i].height) * 0.25;

    if (bars[i].height > bars[i].peak) {
      bars[i].peak = bars[i].height;
    } else {
      bars[i].peak = Math.max(2, bars[i].peak - 0.2);
    }

    const blockCount = Math.floor(bars[i].height / blockSize);
    const peakBlock = Math.floor(bars[i].peak / blockSize);

    for (let b = 0; b < blockCount; b++) {
      const y = canvas.height - (b + 1) * blockSize;
      ctx.fillStyle = b > 3 ? '#ff2a85' : '#8c0041';
      ctx.fillRect(i * barWidth + 2, y, barWidth - 4, blockSize - 1);
    }

    if (peakBlock > 0) {
      const peakY = canvas.height - (peakBlock + 1) * blockSize;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(i * barWidth + 2, peakY, barWidth - 4, blockSize - 1);
    }
  }

  requestAnimationFrame(drawPixelVisualizer);
}
drawPixelVisualizer();

// ====================================================
// CUACA REALTIME, JARAK RANGE & RADAR DENGAN BACKGROUND GIF
// ====================================================
let userOrigin = {
  name: "JAKARTA, ID",
  lat: -6.2088,
  lon: 106.8456
};

const citiesData = {
  jakarta: { 
    name: "JAKARTA, INDONESIA", 
    lat: -6.2088, 
    lon: 106.8456,
    gif: "med1.gif",
    gifTitle: "JAKARTA METROPOLIS RAIN",
    tip: "Humid tropical air over the metropolis. Keep your tape heads cleaned and neon lights glowing."
  },
  tokyo: { 
    name: "TOKYO, JAPAN", 
    lat: 35.6762, 
    lon: 139.6503,
    gif: "med6.gif",
    gifTitle: "SHINJUKU CYBER DRIZZLE",
    tip: "Shinjuku cyber drizzle expected. Perfect atmosphere for lo-fi chillhop and coffee."
  },
  swiss: { 
    name: "ZURICH, SWITZERLAND", 
    lat: 47.3769, 
    lon: 8.5417,
    gif: "med4.gif",
    gifTitle: "ALPINE SNOWFALL VALLEY",
    tip: "Alpine breeze sweeping through the valley. Crisp signals and deep ambient frequencies."
  },
  china: { 
    name: "BEIJING, CHINA", 
    lat: 39.9042, 
    lon: 116.4074,
    gif: "med7.gif",
    gifTitle: "FORBIDDEN NEON OVERCAST",
    tip: "Cool northern front across the Forbidden City. Atmospheric pressure stable on shortwave."
  }
};

let activeWeatherCity = 'jakarta';

// Rumus Haversine: Hitung Jarak Lengkung Bumi (KM)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Rumus Arah Kompas (Bearing)
function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  brng = (brng + 360) % 360;
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(brng / 22.5) % 16;
  return `BEARING: ${Math.round(brng)}° ${directions[index]}`;
}

// Hitung Waktu Terbang Pesawat (~850 km/h)
function calculateFlightETA(distanceKm) {
  if (distanceKm <= 50) return "0h 00m";
  const hours = distanceKm / 850;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `~${h}h ${String(m).padStart(2, '0')}m`;
}

// Update Range Radar Display & GIF
function updateDistanceRadar(cityKey) {
  const target = citiesData[cityKey];
  const distKm = calculateDistance(userOrigin.lat, userOrigin.lon, target.lat, target.lon);
  const bearing = calculateBearing(userOrigin.lat, userOrigin.lon, target.lat, target.lon);
  const eta = calculateFlightETA(distKm);

  // Update Teks RNG di Pojok Kiri Atas Layar Radar
  const radarRangeDisplay = document.getElementById('radar-range-display');
  if (radarRangeDisplay) {
    if (distKm === 0) {
      radarRangeDisplay.textContent = "RNG: 0 KM (ORIGIN)";
    } else {
      radarRangeDisplay.textContent = `RNG: ${distKm.toLocaleString()} KM`;
    }
  }

  // Update Telemetri Penerbangan
  const rangeEtaEl = document.getElementById('range-eta');
  const rangeBearingEl = document.getElementById('range-bearing');
  if (rangeEtaEl) rangeEtaEl.textContent = eta;
  if (rangeBearingEl) rangeBearingEl.textContent = bearing;

  // Update GIF Background di Radar
  const radarBgGif = document.getElementById('radar-bg-gif');
  const radarGifTitle = document.getElementById('radar-gif-title');
  if (radarBgGif) radarBgGif.src = target.gif;
  if (radarGifTitle) radarGifTitle.textContent = target.gifTitle;
}

// Tombol Deteksi Lokasi Asli GPS
const btnDetectGPS = document.getElementById('btn-detect-gps');
btnDetectGPS.addEventListener('click', () => {
  play8BitBeep(700, 0.08);
  btnDetectGPS.textContent = "LOCATING...";
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userOrigin = {
          name: "GPS MY DEVICE",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        };
        btnDetectGPS.textContent = "📍 ORIGIN: GPS";
        updateDistanceRadar(activeWeatherCity);
      },
      () => {
        btnDetectGPS.textContent = "📍 ORIGIN: JKT";
        alert("Tidak dapat mengakses GPS. Lokasi tetap diatur ke Jakarta.");
      }
    );
  }
});

// Weather Elements
const heroIcon = document.getElementById('hero-icon');
const heroTemp = document.getElementById('hero-temp');
const heroCity = document.getElementById('hero-city');
const heroDesc = document.getElementById('hero-desc');
const heroCoords = document.getElementById('hero-coords');
const teleWind = document.getElementById('tele-wind');
const teleHumid = document.getElementById('tele-humid');
const teleCloud = document.getElementById('tele-cloud');
const weatherTipText = document.getElementById('weather-tip-text');

const cityTabBtns = document.querySelectorAll('.city-tab-btn');
const citySummaryCards = document.querySelectorAll('.city-summary-card');

function parseWeatherCode(code) {
  if (code === 0) return { desc: "CLEAR SKY", icon: "☀️" };
  if (code === 1 || code === 2) return { desc: "PARTLY CLOUDY", icon: "🌤️" };
  if (code === 3) return { desc: "OVERCAST", icon: "☁️" };
  if ([45, 48].includes(code)) return { desc: "FOGGY MIST", icon: "🌫️" };
  if ([51, 53, 55, 61, 63, 65].includes(code)) return { desc: "LIGHT RAIN", icon: "🌧️" };
  if ([80, 81, 82].includes(code)) return { desc: "HEAVY RAIN", icon: "⛈️" };
  if ([71, 73, 75, 85, 86].includes(code)) return { desc: "SNOW FALL", icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { desc: "THUNDERSTORM", icon: "⚡" };
  return { desc: "RETRO HAZY", icon: "✨" };
}

async function loadAllCitiesWeather() {
  for (const [key, city] of Object.entries(citiesData)) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover`;
      const res = await fetch(url);
      const data = await res.json();
      const cur = data.current;
      const info = parseWeatherCode(cur.weather_code);

      const tempEl = document.getElementById(`card-temp-${key}`);
      const iconEl = document.getElementById(`card-icon-${key}`);
      const descEl = document.getElementById(`card-desc-${key}`);
      if (tempEl) tempEl.textContent = `${Math.round(cur.temperature_2m)}°C`;
      if (iconEl) iconEl.textContent = info.icon;
      if (descEl) descEl.textContent = info.desc;

      if (key === activeWeatherCity) {
        updateHeroTelemetry(key, cur, info);
      }
    } catch (e) {
      console.error("Weather fetch failed for", key, e);
    }
  }
}

function updateHeroTelemetry(key, cur, info) {
  const city = citiesData[key];
  heroIcon.textContent = info.icon;
  heroTemp.textContent = `${Math.round(cur.temperature_2m)}°C`;
  heroCity.textContent = city.name;
  heroDesc.textContent = info.desc;
  heroCoords.textContent = `LAT: ${city.lat.toFixed(2)}° / LON: ${city.lon.toFixed(2)}°`;

  teleWind.textContent = `${Math.round(cur.wind_speed_10m)} KM/H`;
  teleHumid.textContent = `${cur.relative_humidity_2m}%`;
  teleCloud.textContent = `${cur.cloud_cover}%`;
  weatherTipText.textContent = `"${city.tip}"`;
}

function selectWeatherCity(key) {
  play8BitBeep(520, 0.05);
  activeWeatherCity = key;

  cityTabBtns.forEach(b => b.classList.toggle('active', b.dataset.city === key));
  citySummaryCards.forEach(c => c.classList.toggle('selected', c.dataset.city === key));

  updateDistanceRadar(key);
  loadAllCitiesWeather();
}

cityTabBtns.forEach(btn => {
  btn.addEventListener('click', () => selectWeatherCity(btn.dataset.city));
});

citySummaryCards.forEach(card => {
  card.addEventListener('click', () => selectWeatherCity(card.dataset.city));
});

// Drag & Drop Custom GIF ke Radar Scope
const radarDropZone = document.getElementById('radar-drop-zone');
['dragenter', 'dragover'].forEach(eventName => {
  radarDropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    radarDropZone.style.borderColor = "var(--neon-pink)";
  });
});

['dragleave', 'drop'].forEach(eventName => {
  radarDropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    radarDropZone.style.borderColor = "var(--relic-cyan)";
  });
});

radarDropZone.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (file.type.includes('image') || file.name.endsWith('.gif')) {
    play8BitBeep(620, 0.1);
    const fileUrl = URL.createObjectURL(file);
    const radarBgGif = document.getElementById('radar-bg-gif');
    const radarGifTitle = document.getElementById('radar-gif-title');
    if (radarBgGif) radarBgGif.src = fileUrl;
    if (radarGifTitle) radarGifTitle.textContent = "CUSTOM USER GIF FEED";
    citiesData[activeWeatherCity].gif = fileUrl;
  }
});

// Animasi Canvas Sapuan Radar
const radarCanvas = document.getElementById('radar-canvas');
const rdCtx = radarCanvas.getContext('2d');
let radarAngle = 0;

function resizeRadarCanvas() {
  if (!radarCanvas || !radarCanvas.parentElement) return;
  radarCanvas.width = radarCanvas.parentElement.clientWidth;
  radarCanvas.height = radarCanvas.parentElement.clientHeight;
}
resizeRadarCanvas();
window.addEventListener('resize', resizeRadarCanvas);

const radarBlips = [
  { r: 0.35, angle: 0.8, size: 4, pulse: 0 },
  { r: 0.65, angle: 2.4, size: 5, pulse: 0 },
  { r: 0.82, angle: 4.5, size: 3, pulse: 0 }
];

function drawRadarScope() {
  if (!radarCanvas.width || !radarCanvas.height) {
    resizeRadarCanvas();
  }

  rdCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

  const cx = radarCanvas.width / 2;
  const cy = radarCanvas.height / 2;
  const maxR = Math.min(cx, cy) - 12;

  // Safety Guard: prevent negative or zero radius which throws IndexSizeError on some browers
  if (maxR <= 0) {
    requestAnimationFrame(drawRadarScope);
    return;
  }

  // Garis Lingkaran Radar
  rdCtx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  rdCtx.lineWidth = 1;
  for (let r = 0.25; r <= 1.0; r += 0.25) {
    rdCtx.beginPath();
    rdCtx.arc(cx, cy, maxR * r, 0, Math.PI * 2);
    rdCtx.stroke();
  }

  // Crosshairs Sumbu X & Y
  rdCtx.beginPath();
  rdCtx.moveTo(cx - maxR, cy);
  rdCtx.lineTo(cx + maxR, cy);
  rdCtx.moveTo(cx, cy - maxR);
  rdCtx.lineTo(cx, cy + maxR);
  rdCtx.stroke();

  // Sapuan Garis Radar Berputar
  radarAngle += 0.035;
  const endX = cx + Math.cos(radarAngle) * maxR;
  const endY = cy + Math.sin(radarAngle) * maxR;

  const sweepGrad = rdCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  sweepGrad.addColorStop(0, 'rgba(0, 255, 136, 0.25)');
  sweepGrad.addColorStop(1, 'rgba(0, 255, 136, 0)');

  rdCtx.fillStyle = sweepGrad;
  rdCtx.beginPath();
  rdCtx.moveTo(cx, cy);
  rdCtx.arc(cx, cy, maxR, radarAngle - 0.45, radarAngle);
  rdCtx.closePath();
  rdCtx.fill();

  rdCtx.strokeStyle = '#00ff88';
  rdCtx.lineWidth = 1.5;
  rdCtx.beginPath();
  rdCtx.moveTo(cx, cy);
  rdCtx.lineTo(endX, endY);
  rdCtx.stroke();

  // Titik Sinyal (Blips)
  radarBlips.forEach(b => {
    const bx = cx + Math.cos(b.angle) * (maxR * b.r);
    const by = cy + Math.sin(b.angle) * (maxR * b.r);

    const diff = Math.abs((radarAngle % (Math.PI * 2)) - (b.angle % (Math.PI * 2)));
    if (diff < 0.2) b.pulse = 1.0;
    b.pulse = Math.max(0.2, b.pulse - 0.02);

    rdCtx.fillStyle = `rgba(0, 240, 255, ${b.pulse})`;
    rdCtx.shadowColor = '#00f0ff';
    rdCtx.shadowBlur = 8 * b.pulse;
    rdCtx.beginPath();
    rdCtx.arc(bx, by, b.size, 0, Math.PI * 2);
    rdCtx.fill();
    rdCtx.shadowBlur = 0;
  });

  requestAnimationFrame(drawRadarScope);
}
drawRadarScope();

// ============================================================================
//                       RETRO MINI GAMES ENGINE (CYBER//OS)
// ============================================================================

const gCanvas = document.getElementById('game-canvas');
const gCtx = gCanvas ? gCanvas.getContext('2d') : null;
const gOverlay = document.getElementById('game-overlay');
const gOverlayTitle = document.getElementById('overlay-title');
const gOverlayInstructions = document.getElementById('overlay-instructions');
const gOverlayStartBtn = document.getElementById('btn-overlay-start');
const gScoreVal = document.getElementById('game-score');
const gHiScoreVal = document.getElementById('game-hi-score');
const gLevelVal = document.getElementById('game-level');
const gRuneGem = document.getElementById('game-rune-gem');
const gPanelTitle = document.getElementById('game-panel-title');
const gToggleRunBtn = document.getElementById('btn-game-toggle-run');
const gToggleRunIcon = document.getElementById('game-toggle-icon');
const gInstructionsBox = document.getElementById('game-instructions-box');
const gUserLeaderboardScore = document.getElementById('user-leaderboard-score');

// Game state variables moved to top of file to avoid TDZ ReferenceErrors

// Game 1: Snake Variables
let snake = [];
let snakeDir = { x: 1, y: 0 };
let snakeNextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let snakeSpeed = 130;
let snakeTrail = [];
let snakeLength = 15;

// Game 2: Tetris Variables
const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
let tetrisGrid = [];
let currentPiece = null;
let tetrisTickTime = 800;

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#00f0ff' },
  O: { shape: [[1,1],[1,1]], color: '#ffaa00' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#ff2a85' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#00ff88' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#fbe6ff' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#9d4edd' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#ff5500' }
};

// Game 3: Space Invaders (Defender) Variables
let playerX = 180;
let playerLasers = [];
let alienLasers = [];
let aliens = [];
let alienDirection = 1;
let alienSpeed = 0.7;

function initSelectedGame() {
  stopAllGames();
  gameRunning = false;
  gamePaused = false;
  gameScore = 0;
  gameLevel = 1;
  updateScoreUI();
  
  if (activeGame === 'snake') {
    if (gPanelTitle) gPanelTitle.textContent = "NEON SERPENT";
    if (gOverlayTitle) gOverlayTitle.textContent = "NEON SERPENT";
    if (gOverlayInstructions) gOverlayInstructions.innerHTML = "COLLECT GLOWING ENERGY NODES<br><br>[ SPACE ] OR START TO RUN";
    if (gInstructionsBox) gInstructionsBox.innerHTML = `
      🐍 NEON SERPENT:<br>
      - ARROW KEYS to slide neon serpent.<br>
      - Eat glowing nodes to grow & score.<br>
      - Avoid walls and your own tail!<br>
      - Mobile: Use D-pad buttons below.
    `;
    initSnakeGame();
  } else if (activeGame === 'tetris') {
    if (gPanelTitle) gPanelTitle.textContent = "BLOCK STACKER";
    if (gOverlayTitle) gOverlayTitle.textContent = "BLOCK STACKER";
    if (gOverlayInstructions) gOverlayInstructions.innerHTML = "STACK BLOCKS & CLEAR LINES<br><br>[ SPACE ] OR START TO RUN";
    if (gInstructionsBox) gInstructionsBox.innerHTML = `
      🧱 BLOCK STACKER:<br>
      - LEFT/RIGHT ARROW to move.<br>
      - UP ARROW / BUTTON A to rotate.<br>
      - DOWN ARROW to soft drop.<br>
      - SPACEBAR / BUTTON B to hard drop.<br>
      - Clear rows to score bonus points.
    `;
    initTetrisGame();
  } else if (activeGame === 'invaders') {
    if (gPanelTitle) gPanelTitle.textContent = "NEON DEFENDER";
    if (gOverlayTitle) gOverlayTitle.textContent = "NEON DEFENDER";
    if (gOverlayInstructions) gOverlayInstructions.innerHTML = "DEFEND THE SYSTEM CORE<br><br>[ SPACE ] OR START TO RUN";
    if (gInstructionsBox) gInstructionsBox.innerHTML = `
      🚀 NEON DEFENDER:<br>
      - LEFT/RIGHT ARROW to move ship.<br>
      - SPACEBAR / BUTTON A / B to shoot.<br>
      - Obliterate incoming invaders.<br>
      - Do not let them reach the bottom!
    `;
    initInvadersGame();
  }
  
  if (gOverlay) gOverlay.style.display = 'flex';
  if (gToggleRunIcon) gToggleRunIcon.textContent = "START";
  if (gRuneGem) gRuneGem.classList.remove('active');
  
  drawGame();
}

// -----------------------------------------------------
// GAME 1: NEON SERPENT MECHANICS (SMOOTH SLITHER.IO WORM PHYSICS)
// -----------------------------------------------------
function initSnakeGame() {
  const startX = 200;
  const startY = 170;
  
  // Starting segments list in exact pixel coordinates
  snake = [];
  for (let i = 0; i < 15; i++) {
    snake.push({ x: startX - i * 10, y: startY });
  }
  
  // Trail history list in exact pixel coordinates
  snakeTrail = [];
  for (let i = 0; i < 300; i++) {
    snakeTrail.push({ x: startX - i * 1.5, y: startY });
  }
  
  snakeLength = 15;
  snakeDir = { x: 1, y: 0 };
  snakeNextDir = { x: 1, y: 0 };
  
  // Base speed in pixels per frame
  const baseSpeed = systemDifficulty === 'easy' ? 2.0 : (systemDifficulty === 'hard' ? 3.8 : (systemDifficulty === 'turbo' ? 5.8 : 2.8));
  snakeSpeed = baseSpeed;
  
  placeFood();
}

function placeFood() {
  const margin = 20;
  const width = 400;
  const height = 340;
  let onSnake = true;
  
  while (onSnake) {
    food = {
      x: margin + Math.random() * (width - margin * 2),
      y: margin + Math.random() * (height - margin * 2)
    };
    // Ensure food doesn't spawn directly on top of snake segments
    onSnake = snake.some(part => Math.hypot(part.x - food.x, part.y - food.y) < 22);
  }
}

function tickSnake() {
  // Smoothly turn towards target direction (gives a beautiful realistic slither.io turning curvature)
  const turnRate = 0.22;
  snakeDir.x += (snakeNextDir.x - snakeDir.x) * turnRate;
  snakeDir.y += (snakeNextDir.y - snakeDir.y) * turnRate;
  
  // Keep the movement vector normalized
  const len = Math.hypot(snakeDir.x, snakeDir.y);
  if (len > 0) {
    snakeDir.x /= len;
    snakeDir.y /= len;
  }
  
  // Calculate new head position
  const currentHead = snake[0];
  const newHead = {
    x: currentHead.x + snakeDir.x * snakeSpeed,
    y: currentHead.y + snakeDir.y * snakeSpeed
  };
  
  // Collision: Arena bounds boundary checks
  const margin = 8;
  const width = 400;
  const height = 340;
  if (newHead.x < margin || newHead.x > width - margin || newHead.y < margin || newHead.y > height - margin) {
    gameOver();
    return;
  }
  
  // Collision: Self-bite checks (only check segments starting from index 14 to avoid head-neck overlaps)
  const collisionRadius = 8;
  for (let i = 14; i < snake.length; i++) {
    const dist = Math.hypot(newHead.x - snake[i].x, newHead.y - snake[i].y);
    if (dist < collisionRadius) {
      gameOver();
      return;
    }
  }
  
  // Update trail history
  snakeTrail.unshift({ x: newHead.x, y: newHead.y });
  if (snakeTrail.length > 2000) {
    snakeTrail.pop();
  }
  
  // Build snake segments from the trail at fixed 10px physical distances
  const segmentDistance = 10;
  const newSnake = [ { x: newHead.x, y: newHead.y } ];
  let trailIdx = 0;
  let currentSearchPos = { x: newHead.x, y: newHead.y };
  
  for (let i = 1; i < snakeLength; i++) {
    let found = false;
    while (trailIdx < snakeTrail.length) {
      const pt = snakeTrail[trailIdx];
      const dist = Math.hypot(pt.x - currentSearchPos.x, pt.y - currentSearchPos.y);
      if (dist >= segmentDistance) {
        newSnake.push({ x: pt.x, y: pt.y });
        currentSearchPos = { x: pt.x, y: pt.y };
        found = true;
        break;
      }
      trailIdx++;
    }
    if (!found) {
      const lastPt = snakeTrail[snakeTrail.length - 1] || newHead;
      newSnake.push({ x: lastPt.x, y: lastPt.y });
    }
  }
  snake = newSnake;
  
  // Collision: Eat glowing food
  const foodEatRadius = 16;
  const foodDist = Math.hypot(newHead.x - food.x, newHead.y - food.y);
  if (foodDist < foodEatRadius) {
    gameScore += 100;
    
    // Satisfying ascending 8-bit retro synth arpeggio
    play8BitBeep(880, 0.04, 'square');
    setTimeout(() => play8BitBeep(1320, 0.06, 'triangle'), 40);
    
    placeFood();
    
    // Grow the worm!
    snakeLength += 2;
    
    // Speed up slightly as you grow
    snakeSpeed = Math.min(5.0, snakeSpeed + 0.1);
    
    if (gameScore % 500 === 0) {
      gameLevel++;
      play8BitBeep(1200, 0.15, 'triangle');
    }
    updateScoreUI();
  }
}

// -----------------------------------------------------
// GAME 2: BLOCK STACKER (TETRIS) MECHANICS
// -----------------------------------------------------
function initTetrisGame() {
  tetrisGrid = Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0));
  gameScore = 0;
  gameLevel = 1;
  spawnTetromino();
  tetrisTickTime = systemDifficulty === 'easy' ? 1000 : (systemDifficulty === 'hard' ? 500 : (systemDifficulty === 'turbo' ? 220 : 800));
}

function spawnTetromino() {
  const keys = Object.keys(TETROMINOES);
  const nextType = keys[Math.floor(Math.random() * keys.length)];
  const pieceData = TETROMINOES[nextType];
  currentPiece = {
    shape: JSON.parse(JSON.stringify(pieceData.shape)),
    color: pieceData.color,
    x: Math.floor((TETRIS_COLS - pieceData.shape[0].length) / 2),
    y: 0
  };
  
  if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
    gameOver();
  }
}

function checkCollision(px, py, shape) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const gridX = px + c;
        const gridY = py + r;
        if (gridX < 0 || gridX >= TETRIS_COLS || gridY >= TETRIS_ROWS) {
          return true;
        }
        if (gridY >= 0 && tetrisGrid[gridY][gridX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function rotatePiece() {
  const shape = currentPiece.shape;
  const N = shape.length;
  const M = shape[0].length;
  const rotated = Array.from({ length: M }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < M; c++) {
      rotated[c][N - 1 - r] = shape[r][c];
    }
  }
  if (!checkCollision(currentPiece.x, currentPiece.y, rotated)) {
    currentPiece.shape = rotated;
    play8BitBeep(400, 0.04);
  }
}

function movePiece(dir) {
  if (!checkCollision(currentPiece.x + dir, currentPiece.y, currentPiece.shape)) {
    currentPiece.x += dir;
    play8BitBeep(300, 0.03);
  }
}

function dropPiece() {
  if (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
    currentPiece.y++;
  } else {
    lockPiece();
  }
}

function hardDrop() {
  while (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
    currentPiece.y++;
  }
  lockPiece();
  play8BitBeep(180, 0.08);
}

function lockPiece() {
  const shape = currentPiece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        if (currentPiece.y + r >= 0) {
          tetrisGrid[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
        }
      }
    }
  }
  clearLines();
  spawnTetromino();
}

function clearLines() {
  let linesCleared = 0;
  for (let r = TETRIS_ROWS - 1; r >= 0; r--) {
    if (tetrisGrid[r].every(val => val !== 0)) {
      tetrisGrid.splice(r, 1);
      tetrisGrid.unshift(Array(TETRIS_COLS).fill(0));
      linesCleared++;
      r++;
    }
  }
  if (linesCleared > 0) {
    const rewards = [0, 100, 300, 500, 800];
    gameScore += rewards[linesCleared] * gameLevel;
    play8BitBeep(600, 0.12, 'sawtooth');
    
    if (gameScore >= gameLevel * 1500) {
      gameLevel++;
      tetrisTickTime = Math.max(100, tetrisTickTime - 100);
      play8BitBeep(1000, 0.2, 'sine');
    }
    updateScoreUI();
  }
}

// -----------------------------------------------------
// GAME 3: NEON DEFENDER (SPACE INVADERS) MECHANICS
// -----------------------------------------------------
function initInvadersGame() {
  playerX = 180;
  playerLasers = [];
  alienLasers = [];
  aliens = [];
  alienDirection = 1;
  
  const baseSpeed = systemDifficulty === 'easy' ? 0.4 : (systemDifficulty === 'hard' ? 1.0 : (systemDifficulty === 'turbo' ? 1.7 : 0.7));
  alienSpeed = baseSpeed;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      aliens.push({
        x: 40 + c * 50,
        y: 40 + r * 35,
        width: 24,
        height: 16,
        alive: true,
        type: r
      });
    }
  }
}

function shootInvaderLaser() {
  if (playerLasers.length >= 3) return;
  playerLasers.push({
    x: playerX + 12,
    y: 310,
    speed: 6
  });
  play8BitBeep(900, 0.05, 'triangle');
}

function tickInvaders() {
  for (let i = playerLasers.length - 1; i >= 0; i--) {
    playerLasers[i].y -= playerLasers[i].speed;
    if (playerLasers[i].y < 0) {
      playerLasers.splice(i, 1);
    }
  }

  for (let i = alienLasers.length - 1; i >= 0; i--) {
    alienLasers[i].y += alienLasers[i].speed;
    if (alienLasers[i].y >= 315 && alienLasers[i].y <= 330 && alienLasers[i].x >= playerX && alienLasers[i].x <= playerX + 25) {
      play8BitBeep(120, 0.3, 'sawtooth');
      gameOver();
      return;
    }
    if (alienLasers[i].y > 350) {
      alienLasers.splice(i, 1);
    }
  }

  let hitWall = false;
  let activeAliens = aliens.filter(a => a.alive);
  
  if (activeAliens.length === 0) {
    gameLevel++;
    gameScore += 500;
    play8BitBeep(1100, 0.25, 'triangle');
    initInvadersGame();
    alienSpeed += 0.25;
    updateScoreUI();
    return;
  }

  activeAliens.forEach(alien => {
    alien.x += alienSpeed * alienDirection;
    if (alien.x < 10 || alien.x > 365) {
      hitWall = true;
    }
    if (alien.y >= 300) {
      gameOver();
    }
  });

  if (hitWall) {
    alienDirection *= -1;
    aliens.forEach(alien => {
      alien.y += 15;
    });
  }

  for (let l = playerLasers.length - 1; l >= 0; l--) {
    const laser = playerLasers[l];
    let hit = false;
    for (let a = 0; a < aliens.length; a++) {
      const alien = aliens[a];
      if (alien.alive && laser.x >= alien.x && laser.x <= alien.x + alien.width && laser.y >= alien.y && laser.y <= alien.y + alien.height) {
        alien.alive = false;
        hit = true;
        playerLasers.splice(l, 1);
        gameScore += (3 - alien.type) * 100;
        play8BitBeep(220, 0.08, 'sawtooth');
        updateScoreUI();
        break;
      }
    }
  }

  if (Math.random() < 0.015 + (gameLevel * 0.005) && activeAliens.length > 0) {
    const randomAlien = activeAliens[Math.floor(Math.random() * activeAliens.length)];
    alienLasers.push({
      x: randomAlien.x + randomAlien.width / 2,
      y: randomAlien.y + randomAlien.height,
      speed: 3 + (gameLevel * 0.5)
    });
  }
}

// -----------------------------------------------------
// CORE DRAW / CANVAS RENDERER
// -----------------------------------------------------
function drawGame() {
  if (!gCtx) return;
  
  gCtx.fillStyle = '#090512';
  gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
  
  // Grid visual helper
  gCtx.strokeStyle = 'rgba(255, 42, 133, 0.03)';
  gCtx.lineWidth = 1;
  const spacing = 20;
  for (let x = 0; x < gCanvas.width; x += spacing) {
    gCtx.beginPath();
    gCtx.moveTo(x, 0);
    gCtx.lineTo(x, gCanvas.height);
    gCtx.stroke();
  }
  for (let y = 0; y < gCanvas.height; y += spacing) {
    gCtx.beginPath();
    gCtx.moveTo(0, y);
    gCtx.lineTo(gCanvas.width, y);
    gCtx.stroke();
  }

  if (activeGame === 'snake') {
    // Glowing pulsate food (plasma gem)
    const pulseScale = 1 + 0.15 * Math.sin(Date.now() / 120);
    gCtx.fillStyle = '#ff2a85';
    gCtx.shadowColor = '#ff2a85';
    gCtx.shadowBlur = 14 * pulseScale;
    gCtx.beginPath();
    gCtx.arc(food.x, food.y, 8 * pulseScale, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.shadowBlur = 0;

    // First draw the inner spine connecting lines to make the serpent look like one single connected realistic biological/cybernetic creature
    gCtx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    gCtx.lineWidth = 14;
    gCtx.lineCap = 'round';
    gCtx.lineJoin = 'round';
    gCtx.beginPath();
    snake.forEach((part, idx) => {
      if (idx === 0) {
        gCtx.moveTo(part.x, part.y);
      } else {
        gCtx.lineTo(part.x, part.y);
      }
    });
    gCtx.stroke();

    // Now draw the gorgeous layered overlapping 3D gradient beads/segments of the serpent (from tail to head for correct overlap depth)
    for (let idx = snake.length - 1; idx >= 0; idx--) {
      const part = snake[idx];
      if (!part) continue;

      const x = part.x;
      const y = part.y;
      
      // Organic tapering: segments scale down smoothly towards the tail
      const baseRadius = 9; // ~18px thickness
      const r = baseRadius * (1 - (idx / snake.length) * 0.45); // Head is full size, tail is tapered

      if (idx === 0) {
        // DRAW HEAD - Cybernetic Neon Cobra head
        gCtx.fillStyle = '#00f0ff';
        gCtx.shadowColor = '#00f0ff';
        gCtx.shadowBlur = 12;
        gCtx.beginPath();
        gCtx.arc(x, y, r + 1.5, 0, Math.PI * 2);
        gCtx.fill();
        gCtx.shadowBlur = 0;

        // Draw animated eyes that look in the direction the snake is moving
        let eyeLeft = { x: x, y: y };
        let eyeRight = { x: x, y: y };
        
        let angle = 0;
        if (snake.length > 1) {
          angle = Math.atan2(snake[0].y - snake[1].y, snake[0].x - snake[1].x);
        } else {
          angle = Math.atan2(snakeDir.y, snakeDir.x);
        }

        const eyeOffsetAngle = 0.5; // ~30 degrees outward
        const eyeDist = 6;
        eyeLeft.x = x + Math.cos(angle - eyeOffsetAngle) * eyeDist;
        eyeLeft.y = y + Math.sin(angle - eyeOffsetAngle) * eyeDist;
        eyeRight.x = x + Math.cos(angle + eyeOffsetAngle) * eyeDist;
        eyeRight.y = y + Math.sin(angle + eyeOffsetAngle) * eyeDist;

        // Draw glowing golden eyes of the realistic neon serpent
        gCtx.fillStyle = '#ffea00';
        gCtx.beginPath();
        gCtx.arc(eyeLeft.x, eyeLeft.y, 2.5, 0, Math.PI * 2);
        gCtx.arc(eyeRight.x, eyeRight.y, 2.5, 0, Math.PI * 2);
        gCtx.fill();

        // Draw tiny subtle nostrils
        gCtx.fillStyle = '#00aaff';
        gCtx.beginPath();
        gCtx.arc(x + Math.cos(angle) * 8 - Math.sin(angle) * 2, y + Math.sin(angle) * 8 + Math.cos(angle) * 2, 1, 0, Math.PI * 2);
        gCtx.arc(x + Math.cos(angle) * 8 + Math.sin(angle) * 2, y + Math.sin(angle) * 8 - Math.cos(angle) * 2, 1, 0, Math.PI * 2);
        gCtx.fill();

      } else {
        // DRAW BODY SEGMENTS - Glossy 3D glass beads with radial neon shading (skin alternates between cyan and pink like premium slither skins!)
        const alpha = Math.max(0.45, 1 - (idx / snake.length));
        
        // Offset radial gradient for a gorgeous glossy 3D shiny light refraction
        const radGrad = gCtx.createRadialGradient(
          x - r * 0.25, y - r * 0.25, r * 0.1,
          x, y, r
        );
        
        const isEven = idx % 2 === 0;
        const mainColor = isEven ? '0, 240, 255' : '255, 42, 133';
        const darkColor = isEven ? '0, 100, 180' : '150, 0, 70';
        
        radGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        radGrad.addColorStop(0.3, `rgba(${mainColor}, ${alpha})`);
        radGrad.addColorStop(0.8, `rgba(${darkColor}, ${alpha * 0.9})`);
        radGrad.addColorStop(1, `rgba(10, 5, 30, ${alpha * 0.8})`);

        gCtx.fillStyle = radGrad;
        gCtx.beginPath();
        gCtx.arc(x, y, r, 0, Math.PI * 2);
        gCtx.fill();

        // Draw an inner core glow on each bead
        gCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
        gCtx.beginPath();
        gCtx.arc(x - r * 0.15, y - r * 0.15, r * 0.2, 0, Math.PI * 2);
        gCtx.fill();
      }
    }
    gCtx.shadowBlur = 0;

  } else if (activeGame === 'tetris') {
    const blockW = 16;
    const offsetX = Math.floor((gCanvas.width - TETRIS_COLS * blockW) / 2);
    const offsetY = Math.floor((gCanvas.height - TETRIS_ROWS * blockW) / 2);

    gCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    gCtx.lineWidth = 2;
    gCtx.strokeRect(offsetX - 2, offsetY - 2, TETRIS_COLS * blockW + 4, TETRIS_ROWS * blockW + 4);
    gCtx.fillStyle = '#05020a';
    gCtx.fillRect(offsetX, offsetY, TETRIS_COLS * blockW, TETRIS_ROWS * blockW);

    for (let r = 0; r < TETRIS_ROWS; r++) {
      for (let c = 0; c < TETRIS_COLS; c++) {
        if (tetrisGrid[r][c] !== 0) {
          gCtx.fillStyle = tetrisGrid[r][c];
          gCtx.fillRect(offsetX + c * blockW + 1, offsetY + r * blockW + 1, blockW - 2, blockW - 2);
        }
      }
    }

    if (currentPiece) {
      gCtx.fillStyle = currentPiece.color;
      gCtx.shadowColor = currentPiece.color;
      gCtx.shadowBlur = 6;
      const shape = currentPiece.shape;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            const pieceY = currentPiece.y + r;
            if (pieceY >= 0) {
              gCtx.fillRect(offsetX + (currentPiece.x + c) * blockW + 1, offsetY + pieceY * blockW + 1, blockW - 2, blockW - 2);
            }
          }
        }
      }
      gCtx.shadowBlur = 0;
    }

  } else if (activeGame === 'invaders') {
    // Ship
    gCtx.fillStyle = '#00f0ff';
    gCtx.shadowColor = '#00f0ff';
    gCtx.shadowBlur = 10;
    gCtx.beginPath();
    gCtx.moveTo(playerX + 12, 312);
    gCtx.lineTo(playerX, 325);
    gCtx.lineTo(playerX + 25, 325);
    gCtx.closePath();
    gCtx.fill();
    gCtx.shadowBlur = 0;

    // Aliens
    const alienColors = ['#ff2a85', '#ffaa00', '#00ff88'];
    aliens.forEach(alien => {
      if (alien.alive) {
        gCtx.fillStyle = alienColors[alien.type];
        gCtx.fillRect(alien.x, alien.y, alien.width, alien.height);
        
        gCtx.fillStyle = '#05020a';
        gCtx.fillRect(alien.x + 4, alien.y + 4, 4, 4);
        gCtx.fillRect(alien.x + alien.width - 8, alien.y + 4, 4, 4);
      }
    });

    // Player Lasers
    gCtx.fillStyle = '#00ff88';
    gCtx.shadowColor = '#00ff88';
    gCtx.shadowBlur = 6;
    playerLasers.forEach(laser => {
      gCtx.fillRect(laser.x - 1, laser.y, 3, 10);
    });
    gCtx.shadowBlur = 0;

    // Enemy Lasers
    gCtx.fillStyle = '#ff2a85';
    gCtx.shadowColor = '#ff2a85';
    gCtx.shadowBlur = 6;
    alienLasers.forEach(laser => {
      gCtx.fillRect(laser.x - 1, laser.y, 3, 10);
    });
    gCtx.shadowBlur = 0;
  }
}

// -----------------------------------------------------
// GAME CONTROL ENGINE
// -----------------------------------------------------
function startGameLoop() {
  if (gameLoopId) stopAllGames();
  
  // Re-initialize variables and setup clean board if starting from a clean slate or game-over
  if (!gameRunning) {
    initSelectedGame();
  }
  
  gameRunning = true;
  gamePaused = false;
  if (gOverlay) gOverlay.style.display = 'none';
  if (gToggleRunIcon) gToggleRunIcon.textContent = "PAUSE";
  if (gRuneGem) gRuneGem.classList.add('active');
  play8BitBeep(780, 0.1, 'sine');
  
  let lastTick = 0;
  
  function loop(timestamp) {
    if (!gameRunning || gamePaused) return;
    
    let interval = 100;
    if (activeGame === 'snake') {
      interval = snakeSpeed;
    } else if (activeGame === 'tetris') {
      interval = tetrisTickTime;
    } else if (activeGame === 'invaders') {
      interval = 25;
    }
    
    if (timestamp - lastTick >= interval) {
      lastTick = timestamp;
      if (activeGame === 'snake') {
        tickSnake();
      } else if (activeGame === 'tetris') {
        dropPiece();
      }
    }
    
    if (activeGame === 'invaders') {
      tickInvaders();
    }
    
    drawGame();
    gameLoopId = requestAnimationFrame(loop);
  }
  
  gameLoopId = requestAnimationFrame(loop);
}

function stopAllGames() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

function toggleGamePause() {
  if (!gameRunning) {
    startGameLoop();
    return;
  }
  
  play8BitBeep(320, 0.05);
  gamePaused = !gamePaused;
  if (gamePaused) {
    gOverlayTitle.textContent = "PAUSED";
    gOverlayInstructions.innerHTML = "PRESS START OR SPACEBAR TO RESUME";
    gOverlay.style.display = 'flex';
    gToggleRunIcon.textContent = "RESUME";
    gRuneGem.classList.remove('active');
  } else {
    gOverlay.style.display = 'none';
    gToggleRunIcon.textContent = "PAUSE";
    gRuneGem.classList.add('active');
    startGameLoop();
  }
}

function gameOver() {
  stopAllGames();
  gameRunning = false;
  playGameOverSynth();
  
  if (gameScore > highScores[activeGame]) {
    highScores[activeGame] = gameScore;
    localStorage.setItem(`arcade_hi_${activeGame}`, gameScore);
  }
  
  gOverlayTitle.textContent = "GAME OVER";
  gOverlayInstructions.innerHTML = `FINAL SCORE: ${String(gameScore).padStart(4, '0')}<br><br>PRESS START TO RETRY`;
  gOverlay.style.display = 'flex';
  gToggleRunIcon.textContent = "RETRY";
  gRuneGem.classList.remove('active');
  updateScoreUI();
}

function updateScoreUI() {
  if (gScoreVal) gScoreVal.textContent = String(gameScore).padStart(4, '0');
  if (gHiScoreVal) gHiScoreVal.textContent = String(highScores[activeGame]).padStart(4, '0');
  if (gLevelVal) gLevelVal.textContent = String(gameLevel).padStart(2, '0');
  
  const highBadge = document.getElementById('game-high-badge');
  if (highBadge) highBadge.textContent = `HI: ${String(highScores[activeGame]).padStart(4, '0')}`;
  
  if (gUserLeaderboardScore) gUserLeaderboardScore.textContent = `${highScores[activeGame]} pts`;
}

function handleGameInput(key) {
  if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
    if (!gameRunning || gamePaused) {
      startGameLoop();
    } else {
      if (activeGame === 'tetris') {
        hardDrop();
      } else if (activeGame === 'invaders') {
        shootInvaderLaser();
      }
    }
    return;
  }
  
  if (!gameRunning || gamePaused) return;
  
  if (activeGame === 'snake') {
    if ((key === 'ArrowUp' || key === 'w') && snakeDir.y !== 1) {
      snakeNextDir = { x: 0, y: -1 };
    } else if ((key === 'ArrowDown' || key === 's') && snakeDir.y !== -1) {
      snakeNextDir = { x: 0, y: 1 };
    } else if ((key === 'ArrowLeft' || key === 'a') && snakeDir.x !== 1) {
      snakeNextDir = { x: -1, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'd') && snakeDir.x !== -1) {
      snakeNextDir = { x: 1, y: 0 };
    }
  } else if (activeGame === 'tetris') {
    if (key === 'ArrowLeft' || key === 'a') {
      movePiece(-1);
    } else if (key === 'ArrowRight' || key === 'd') {
      movePiece(1);
    } else if (key === 'ArrowUp' || key === 'w') {
      rotatePiece();
    } else if (key === 'ArrowDown' || key === 's') {
      dropPiece();
    }
  } else if (activeGame === 'invaders') {
    if (key === 'ArrowLeft' || key === 'a') {
      playerX = Math.max(10, playerX - 15);
      play8BitBeep(450, 0.02, 'sine');
    } else if (key === 'ArrowRight' || key === 'd') {
      playerX = Math.min(365, playerX + 15);
      play8BitBeep(450, 0.02, 'sine');
    }
  }
}

// Global Keyboard listener
document.addEventListener('keydown', (e) => {
  if (viewGames && viewGames.classList.contains('view-active')) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
    handleGameInput(e.key);
  }
});

// Selector and controller binding
const btnSelectSnake = document.getElementById('btn-select-snake');
const btnSelectTetris = document.getElementById('btn-select-tetris');
const btnSelectInvaders = document.getElementById('btn-select-invaders');

function changeActiveGame(newGame) {
  play8BitBeep(450, 0.08);
  activeGame = newGame;
  
  if (btnSelectSnake) btnSelectSnake.classList.toggle('active', newGame === 'snake');
  if (btnSelectTetris) btnSelectTetris.classList.toggle('active', newGame === 'tetris');
  if (btnSelectInvaders) btnSelectInvaders.classList.toggle('active', newGame === 'invaders');
  
  initSelectedGame();
}

if (btnSelectSnake) btnSelectSnake.addEventListener('click', () => changeActiveGame('snake'));
if (btnSelectTetris) btnSelectTetris.addEventListener('click', () => changeActiveGame('tetris'));
if (btnSelectInvaders) btnSelectInvaders.addEventListener('click', () => changeActiveGame('invaders'));

const btnDiffEasy = document.getElementById('btn-diff-easy');
const btnDiffNormal = document.getElementById('btn-diff-normal');
const btnDiffHard = document.getElementById('btn-diff-hard');
const btnDiffTurbo = document.getElementById('btn-diff-turbo');
const diffVal = document.getElementById('diff-val');

function changeDifficulty(diff) {
  play8BitBeep(480, 0.06);
  systemDifficulty = diff;
  diffVal.textContent = diff.toUpperCase();
  
  if (btnDiffEasy) btnDiffEasy.classList.toggle('active', diff === 'easy');
  if (btnDiffNormal) btnDiffNormal.classList.toggle('active', diff === 'normal');
  if (btnDiffHard) btnDiffHard.classList.toggle('active', diff === 'hard');
  if (btnDiffTurbo) btnDiffTurbo.classList.toggle('active', diff === 'turbo');
  
  initSelectedGame();
}

if (btnDiffEasy) btnDiffEasy.addEventListener('click', () => changeDifficulty('easy'));
if (btnDiffNormal) btnDiffNormal.addEventListener('click', () => changeDifficulty('normal'));
if (btnDiffHard) btnDiffHard.addEventListener('click', () => changeDifficulty('hard'));
if (btnDiffTurbo) btnDiffTurbo.addEventListener('click', () => changeDifficulty('turbo'));

if (gToggleRunBtn) gToggleRunBtn.addEventListener('click', toggleGamePause);
if (gOverlayStartBtn) gOverlayStartBtn.addEventListener('click', () => startGameLoop());

// Mobile Controls
const bindCtrl = (id, key) => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', () => { play8BitBeep(400, 0.03); handleGameInput(key); });
};
bindCtrl('btn-ctrl-up', 'ArrowUp');
bindCtrl('btn-ctrl-down', 'ArrowDown');
bindCtrl('btn-ctrl-left', 'ArrowLeft');
bindCtrl('btn-ctrl-right', 'ArrowRight');

const btnCtrlA = document.getElementById('btn-ctrl-a');
if (btnCtrlA) btnCtrlA.addEventListener('click', () => {
  play8BitBeep(500, 0.04);
  if (activeGame === 'tetris') handleGameInput('ArrowUp');
  else if (activeGame === 'invaders') shootInvaderLaser();
});

const btnCtrlB = document.getElementById('btn-ctrl-b');
if (btnCtrlB) btnCtrlB.addEventListener('click', () => {
  play8BitBeep(500, 0.04);
  if (activeGame === 'tetris') handleGameInput('ArrowUp');
  else if (activeGame === 'invaders') shootInvaderLaser();
});

// Run initial UI update so stored high scores load instantly on page load
updateScoreUI();

// ============================================================================
//                       YOUTUBE MUSIC STREAMING INTEGRATION
// ============================================================================

// 1. Tab Navigation between Local Cassette and YouTube Search
const btnTabLocal = document.getElementById('btn-tab-local');
const btnTabYt = document.getElementById('btn-tab-yt');
const panelLocalTape = document.getElementById('panel-local-tape');
const panelYtMusic = document.getElementById('panel-yt-music');

if (btnTabLocal && btnTabYt && panelLocalTape && panelYtMusic) {
  btnTabLocal.addEventListener('click', () => {
    play8BitBeep(440, 0.05);
    btnTabLocal.classList.add('active');
    btnTabYt.classList.remove('active');
    panelLocalTape.style.display = 'block';
    panelYtMusic.style.display = 'none';
  });

  btnTabYt.addEventListener('click', () => {
    play8BitBeep(440, 0.05);
    btnTabLocal.classList.remove('active');
    btnTabYt.classList.add('active');
    panelLocalTape.style.display = 'none';
    panelYtMusic.style.display = 'flex';
  });
}

// 2. YouTube Search Handler
const ytSearchInput = document.getElementById('yt-search-input');
const ytSearchBtn = document.getElementById('yt-search-btn');
const ytResultsList = document.getElementById('yt-results-list');

async function performYtSearch() {
  if (!ytSearchInput || !ytResultsList) return;
  const q = ytSearchInput.value.trim();
  if (!q) return;
  
  play8BitBeep(520, 0.05);
  ytResultsList.innerHTML = `
    <li class="track-entry" style="opacity: 0.8; justify-content: center; text-align: center; padding: 25px 0;">
      <span class="pulse-text">📡 SCANNING SKIES FOR "${q.toUpperCase()}"...</span>
    </li>
  `;
  
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      ytPlaylist = data.results;
      ytCurrentIndex = 0;
      renderYtPlaylistUI();
    } else {
      ytResultsList.innerHTML = `
        <li class="track-entry" style="opacity: 0.8; justify-content: center; text-align: center; padding: 25px 0;">
          <span>❌ NO SIGNALS RECEIVED. TRY ANOTHER QUERY.</span>
        </li>
      `;
    }
  } catch (err) {
    console.error('Search fetch failed:', err);
    ytResultsList.innerHTML = `
      <li class="track-entry" style="opacity: 0.8; justify-content: center; text-align: center; padding: 25px 0;">
        <span>⚠️ TELEMETRY CONNECTION ERROR.</span>
      </li>
    `;
  }
}

if (ytSearchBtn) ytSearchBtn.addEventListener('click', performYtSearch);
if (ytSearchInput) {
  ytSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performYtSearch();
  });
}

// 3. Render YouTube Playlist Results
function renderYtPlaylistUI() {
  if (!ytResultsList) return;
  if (ytPlaylist.length === 0) {
    ytResultsList.innerHTML = `
      <li class="track-entry" style="opacity: 0.5; justify-content: center; text-align: center; padding: 25px 0;">
        <span>🔍 Enter query to scan the skies...</span>
      </li>
    `;
    return;
  }
  ytResultsList.innerHTML = '';
  
  ytPlaylist.forEach((track, i) => {
    const li = document.createElement('li');
    const isCurrentYt = (currentSource === 'youtube' && i === ytCurrentIndex);
    li.className = `track-entry ${isCurrentYt ? 'active' : ''}`;
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '8px';
    li.style.padding = '6px 8px';
    li.style.fontSize = '12px';
    li.style.cursor = 'pointer';
    
    li.innerHTML = `
      <img src="${track.thumbnail}" style="width: 24px; height: 24px; border-radius: 2px; object-fit: cover; border: 1px solid rgba(0,240,255,0.25);" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 viewBox=%220 0 50 50%22><rect width=%2250%22 height=%2250%22 fill=%22%23140a24%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2300f0ff%22 font-family=%22monospace%22 font-size=%2212%22>YT</text></svg>'" />
      <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <span style="display: block; font-weight: bold; overflow: hidden; text-overflow: ellipsis;">${track.title}</span>
        <span style="display: block; font-size: 10px; opacity: 0.6; overflow: hidden; text-overflow: ellipsis;">${track.artist}</span>
      </div>
      <span style="font-size: 10px; opacity: 0.5;">${track.duration}</span>
    `;
    
    li.addEventListener('click', () => {
      play8BitBeep(520, 0.08);
      loadYtTrack(i);
    });
    ytResultsList.appendChild(li);
  });
}

// 4. Load & Play YouTube Track
function loadYtTrack(index) {
  if (index < 0 || index >= ytPlaylist.length) return;
  
  currentSource = 'youtube';
  ytCurrentIndex = index;
  
  // Pause any local audio playing
  audio.pause();
  
  const track = ytPlaylist[index];
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist.toUpperCase();
  
  // Keep retro pixel GIF animation on cassette screen when playing YT Music
  const retroGifs = ["med1.gif", "med2.gif", "med3.gif", "med4.gif", "med5.gif", "med6.gif", "med7.gif"];
  coverImg.src = retroGifs[index % retroGifs.length];
  
  trackBadge.textContent = `${String(index + 1).padStart(2, '0')}/${String(ytPlaylist.length).padStart(2, '0')}`;
  progressFill.style.width = '0%';
  currentTimeEl.textContent = "00:00";
  totalDurationEl.textContent = track.duration || "00:00";
  
  // Refresh rendering to update highlights
  renderPlaylist();
  renderYtPlaylistUI();
  
  if (ytPlayerReady && ytPlayer) {
    try {
      ytPlayer.loadVideoById(track.id);
      ytPlayer.setVolume(parseFloat(volumeSlider.value) * 100);
      updatePlayState(true);
    } catch(e) {
      console.error(e);
    }
  }
}

// 5. YouTube Iframe API Loader & Controls
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-player', {
    height: '1',
    width: '1',
    videoId: '',
    playerVars: {
      'autoplay': 0,
      'controls': 0,
      'disablekb': 1,
      'fs': 0,
      'rel': 0,
      'modestbranding': 1,
      'origin': window.location.origin
    },
    events: {
      'onReady': () => {
        ytPlayerReady = true;
      },
      'onStateChange': (event) => {
        // YT.PlayerState.ENDED is 0
        if (event.data === 0) {
          if (isLoop) {
            ytPlayer.playVideo();
          } else {
            nextTrack();
          }
        } else if (event.data === 1) { // PLAYING
          updatePlayState(true);
        } else if (event.data === 2) { // PAUSED
          updatePlayState(false);
        }
      }
    }
  });
};

// 6. Polling loop to smoothly update search song time progress bar
setInterval(() => {
  if (currentSource === 'youtube' && ytPlayerReady && ytPlayer) {
    try {
      const state = ytPlayer.getPlayerState();
      if (state === 1) { // PLAYING
        const currentTime = ytPlayer.getCurrentTime();
        const duration = ytPlayer.getDuration();
        if (duration > 0) {
          const percent = (currentTime / duration) * 100;
          progressFill.style.width = `${percent}%`;
          currentTimeEl.textContent = formatTime(currentTime);
          totalDurationEl.textContent = formatTime(duration);
        }
      }
    } catch(e) {}
  }
}, 350);

// 7. Sync volume changes with YouTube Player
volumeSlider.addEventListener('input', (e) => {
  if (currentSource === 'youtube' && ytPlayerReady && ytPlayer) {
    try {
      ytPlayer.setVolume(parseFloat(e.target.value) * 100);
    } catch(e) {}
  }
});

// 8. Run Initial Page Load Setup after all DOM selectors are fully declared
audio.volume = 0.75;
loadTrack(currentIndex);
updateDistanceRadar('jakarta');
loadAllCitiesWeather();