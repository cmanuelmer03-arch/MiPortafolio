document.addEventListener('DOMContentLoaded', () => {
  initCursorGlow();
  initScrollSpy();
  initSuitSwitch();
  initVinylPlayer();
});

/* Luz que sigue al cursor */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  window.addEventListener('mousemove', (e) => {
    glow.style.background =
      `radial-gradient(650px at ${e.clientX}px ${e.clientY}px, rgba(226, 54, 54, 0.09), transparent 80%)`;
  });
}

/* Marca en el menú la sección visible */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((s) => {
      const top = s.offsetTop - 140;
      if (window.scrollY >= top && window.scrollY < top + s.offsetHeight) current = s.id;
    });
    links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
  });
}

/* Cambio de traje: Peter / Miles */
function initSuitSwitch() {
  const btn = document.getElementById('suit-toggle-btn');
  const badge = document.getElementById('suit-mode-badge');
  const action = document.getElementById('suit-switch-action');
  const desc = document.getElementById('suit-desc-label');
  let miles = false;

  btn.addEventListener('click', () => {
    miles = !miles;
    document.body.classList.toggle('miles-suit', miles);
    btn.classList.toggle('border-red-500/60', miles);
    btn.classList.toggle('text-red-400', miles);
    badge.textContent = miles ? 'Protocolo sigilo activo' : 'Identidad en espera';
    action.textContent = miles ? 'Reiniciar' : 'Cambiar';
    desc.textContent = miles ? 'Tierra-1610' : 'Tierra-616';
  });
}

/* Reproductor de vinilo.
   1) Intenta YouTube (API oficial de iframe).
   2) Si YouTube no deja reproducir el video, usa un archivo local como respaldo.
   Para cambiar de canción edita las dos constantes de abajo. */
const YOUTUBE_VIDEO_ID = 'ApXoWvfEYVU';       // Post Malone, Swae Lee - Sunflower (Spider-Verse)
const LOCAL_AUDIO_SRC = 'audio/sunflower.mp3'; // Tu propio archivo de respaldo (opcional)

/* Mensajes según el código de error de YouTube */
const YT_ERRORS = {
  2: 'ID de video inválido',
  5: 'Error del reproductor HTML5',
  100: 'Video no encontrado o privado',
  101: 'El dueño bloqueó el uso incrustado',
  150: 'El dueño bloqueó el uso incrustado',
  153: 'Falta origen: abre con servidor local'
};

function initVinylPlayer() {
  const deck = document.getElementById('turntable-deck');
  const playBtn = document.getElementById('play-toggle-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const status = document.getElementById('player-status-badge');
  const bar = document.getElementById('track-progress');
  const current = document.getElementById('current-time');
  const total = document.getElementById('total-time');
  const barBox = document.getElementById('progress-bar-container');
  const disc = document.getElementById('vinyl-disc');
  const ytLink = document.getElementById('yt-link');

  let engine = null; // { play, pause, isPlaying, seek(ratio), time(), duration() }
  let timer = null;

  const format = (sec) => {
    sec = Math.max(0, Math.floor(sec || 0));
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  };

  function updateProgress() {
    if (!engine) return;
    const duration = engine.duration();
    if (!duration) return;
    bar.style.width = (engine.time() / duration) * 100 + '%';
    current.textContent = format(engine.time());
    total.textContent = format(duration);
  }

  function showPlaying(playing) {
    deck.classList.toggle('is-playing', playing);
    playIcon.classList.toggle('hidden', playing);
    pauseIcon.classList.toggle('hidden', !playing);
    status.textContent = playing ? 'Sonando' : 'En pausa';
    clearInterval(timer);
    if (playing) timer = setInterval(updateProgress, 500);
  }

  function setEngine(newEngine) {
    engine = newEngine;
    status.textContent = 'En pausa';
    updateProgress();
  }

  /* ----- Motor 2: archivo de audio local (respaldo) ----- */
  function useLocalAudio(reason) {
    console.warn('Reproductor: usando audio local. Motivo:', reason);
    const audio = new Audio(LOCAL_AUDIO_SRC);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => setEngine({
      play: () => audio.play(),
      pause: () => audio.pause(),
      isPlaying: () => !audio.paused,
      seek: (ratio) => { audio.currentTime = ratio * audio.duration; },
      time: () => audio.currentTime,
      duration: () => audio.duration
    }));
    audio.addEventListener('play', () => showPlaying(true));
    audio.addEventListener('pause', () => showPlaying(false));
    audio.addEventListener('ended', () => { showPlaying(false); bar.style.width = '0%'; current.textContent = '00:00'; });
    audio.addEventListener('error', () => {
      status.textContent = reason; // no hay respaldo: mostramos el motivo de YouTube
      ytLink.classList.remove('hidden');
    });
  }

  /* ----- Motor 1: YouTube ----- */
  window.onYouTubeIframeAPIReady = () => {
    const vars = { controls: 0, playsinline: 1, rel: 0 };
    if (location.protocol.startsWith('http')) vars.origin = location.origin;

    const yt = new YT.Player('yt-player', {
      videoId: YOUTUBE_VIDEO_ID,
      width: '200',
      height: '200',
      playerVars: vars,
      events: {
        onReady: () => setEngine({
          play: () => yt.playVideo(),
          pause: () => yt.pauseVideo(),
          isPlaying: () => yt.getPlayerState() === YT.PlayerState.PLAYING,
          seek: (ratio) => yt.seekTo(ratio * yt.getDuration(), true),
          time: () => yt.getCurrentTime(),
          duration: () => yt.getDuration()
        }),
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) showPlaying(true);
          if (e.data === YT.PlayerState.PAUSED) showPlaying(false);
          if (e.data === YT.PlayerState.ENDED) { showPlaying(false); bar.style.width = '0%'; current.textContent = '00:00'; }
        },
        onError: (e) => {
          const reason = YT_ERRORS[e.data] || `Error de YouTube (${e.data})`;
          console.warn('YouTube error', e.data, reason);
          engine = null;
          useLocalAudio(reason);
        }
      }
    });
  };

  const toggle = () => {
    if (!engine) { return; }
    engine.isPlaying() ? engine.pause() : engine.play();
  };
  playBtn.addEventListener('click', toggle);
  disc.addEventListener('click', toggle);
  barBox.addEventListener('click', (e) => {
    if (!engine) return;
    const rect = barBox.getBoundingClientRect();
    engine.seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
    updateProgress();
  });

  /* Si la API de YouTube nunca carga (sin internet o bloqueada), usamos el respaldo */
  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  api.onerror = () => useLocalAudio('No se pudo cargar YouTube');
  document.head.appendChild(api);
}