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

function formatTime(sec) {
  if (isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Navigasi Tampilan (Music Deck / Weather Radar)
const tabMusicBtn = document.getElementById('tab-music-btn');
const tabWeatherBtn = document.getElementById('tab-weather-btn');
const viewMusic = document.getElementById('view-music');
const viewWeather = document.getElementById('view-weather');
const pageHeroTitle = document.getElementById('page-hero-title');
const pageHeroSubtitle = document.getElementById('page-hero-subtitle');

function switchView(viewName) {
  play8BitBeep(640, 0.08);
  if (viewName === 'music') {
    tabMusicBtn.classList.add('active');
    tabWeatherBtn.classList.remove('active');
    viewMusic.classList.add('view-active');
    viewWeather.classList.remove('view-active');
    pageHeroTitle.textContent = "RETRO//WAVE";
    pageHeroSubtitle.textContent = "FM STEREO CASSETTE // WORKSTATION";
  } else {
    tabWeatherBtn.classList.add('active');
    tabMusicBtn.classList.remove('active');
    viewWeather.classList.add('view-active');
    viewMusic.classList.remove('view-active');
    pageHeroTitle.textContent = "WEATHER//RADAR";
    pageHeroSubtitle.textContent = "ORBITAL TELEMETRY & DISTANCE SCAN";
    setTimeout(() => {
      resizeRadarCanvas();
    }, 50);
  }
}

tabMusicBtn.addEventListener('click', () => switchView('music'));
tabWeatherBtn.addEventListener('click', () => switchView('weather'));

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
  if (audio.paused) {
    audio.play().then(() => updatePlayState(true)).catch(err => console.log(err));
  } else {
    audio.pause();
    updatePlayState(false);
  }
}

function nextTrack() {
  play8BitBeep(580, 0.05);
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * playlist.length);
  } else {
    currentIndex = (currentIndex + 1) % playlist.length;
  }
  loadTrack(currentIndex);
  audio.play();
  updatePlayState(true);
}

function prevTrack() {
  play8BitBeep(390, 0.05);
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentIndex);
  audio.play();
  updatePlayState(true);
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
  totalDurationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.duration)) {
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
  if (!isNaN(audio.duration)) {
    audio.currentTime = clickPos * audio.duration;
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

// Inisialisasi awal
audio.volume = 0.75;
loadTrack(currentIndex);
updateDistanceRadar('jakarta');
loadAllCitiesWeather();