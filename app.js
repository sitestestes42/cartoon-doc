document.addEventListener('DOMContentLoaded', () => {
  const enterProfiles = document.getElementById('enterProfiles');
  const profilesSection = document.getElementById('profiles');
  const splash = document.getElementById('splash');
  const profileCards = document.querySelectorAll('.profile-card');
  const skipProfiles = document.getElementById('skipProfiles');
  const player = document.getElementById('player');

  // abrir tela de perfis
  enterProfiles?.addEventListener('click', () => {
    splash.style.display = 'none';
    profilesSection.setAttribute('aria-hidden','false');
    profilesSection.style.display = 'flex';
  });

  // selecionar perfil
  profileCards.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.profile || 'Convidado';
      localStorage.setItem('viewer', name);
      openPlayer();
    });
  });

  // pular perfis
  skipProfiles?.addEventListener('click', openPlayer);

  function openPlayer(){
    profilesSection.style.display = 'none';
    player.classList.remove('hidden');
    player.setAttribute('aria-hidden','false');
    player.focus();
    // aqui você pode iniciar áudio ou outras ações
  }

  // se já tiver perfil salvo, pula direto
  const saved = localStorage.getItem('viewer');
  if(saved){
    splash.style.display = 'none';
    profilesSection.style.display = 'none';
    player.classList.remove('hidden');
    player.setAttribute('aria-hidden','false');
  }
});
