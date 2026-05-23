document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro');
  const introVideo = document.getElementById('introVideo');
  const splash = document.getElementById('splash');
  const profiles = document.getElementById('profiles');
  const enterProfiles = document.getElementById('enterProfiles');
  const skipProfiles = document.getElementById('skipProfiles');
  const profileCards = document.querySelectorAll('.profile-card');
  const player = document.getElementById('player');
  const audio = document.getElementById('bgAudio');

  // Tenta tocar vídeo (autoplay muted geralmente permitido)
  introVideo.play().catch(()=>{ /* se bloqueado, permanece poster */ });

  // Quando o vídeo terminar (ou após Xs), fecha intro e abre splash/perfis
  // Preferível: usar evento ended se vídeo não for loop; aqui usamos timeout como fallback
  const INTRO_DURATION = 9500; // 9.5s — ajuste conforme seu vídeo
  setTimeout(() => {
    if (intro) {
      intro.classList.add('fade-out');
      intro.setAttribute('aria-hidden','true');
      // pequena espera para transição
      setTimeout(() => {
        intro.style.display = 'none';
        // mostra splash (ou pula direto para perfis)
        splash.classList.add('active');
      }, 800);
    }
  }, INTRO_DURATION);

  // Fluxo de perfis
  enterProfiles?.addEventListener('click', () => {
    splash.classList.remove('active');
    splash.setAttribute('aria-hidden','true');
    profiles.classList.add('active');
    profiles.setAttribute('aria-hidden','false');
  });

  skipProfiles?.addEventListener('click', openPlayer);
  profileCards.forEach(btn => btn.addEventListener('click', () => {
    localStorage.setItem('viewer', btn.dataset.profile || 'Convidado');
    openPlayer();
  }));

  function openPlayer(){
    profiles.classList.remove('active');
    profiles.setAttribute('aria-hidden','true');
    player.classList.remove('hidden');
    player.focus();
    // áudio começa mudo para evitar bloqueio; usuário ativa
    audio.muted = true;
    audio.play().catch(()=>{});
  }

  // restante do seu código: navegação por capítulos, transcrição, controles etc.
});
