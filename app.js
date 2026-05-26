document.addEventListener('DOMContentLoaded', () => {
  const introContainer = document.getElementById('introContainer');
  const introVideo = document.getElementById('introVideo');
  const startIntroBtn = document.getElementById('startIntroBtn');
  const skipIntroBtn = document.getElementById('skipIntroBtn');
  
  const profilesSection = document.getElementById('profiles');
  const profilesGrid = document.getElementById('profilesGrid');
  
  const playerSection = document.getElementById('player');
  const playerTitleSpan = document.querySelector('#playerTitle span');
  const backToProfilesBtn = document.getElementById('backToProfilesBtn');

  // --- Intro Logic ---
  const showProfiles = () => {
    introContainer.style.display = 'none';
    profilesSection.hidden = false;
    introVideo.pause();
    loadProfiles();
  };

  const playIntro = async () => {
    try {
      await introVideo.play();
    } catch (err) {
      console.warn("Autoplay bloqueado pelo navegador:", err);
      startIntroBtn.hidden = false; // Mostra botão de fallback
    }
  };

  startIntroBtn.addEventListener('click', () => {
    startIntroBtn.hidden = true;
    introVideo.play();
  });

  skipIntroBtn.addEventListener('click', showProfiles);
  introVideo.addEventListener('ended', showProfiles);

  // Inicia tentando tocar
  playIntro();

  // --- Profiles Logic ---
  async function loadProfiles() {
    try {
      const response = await fetch('profiles.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Falha ao carregar profiles.json');
      const profiles = await response.json();
      renderProfiles(profiles);
    } catch (error) {
      console.error(error);
      profilesGrid.innerHTML = '<p>Erro ao carregar perfis. Verifique sua conexão.</p>';
    }
  }

  function renderProfiles(profiles) {
    profilesGrid.innerHTML = '';
    profiles.forEach((profile, index) => {
      // Evitar execução de código via JSON escapando IDs
      const safeId = encodeURIComponent(profile.id);
      const initial = profile.name ? profile.name.charAt(0).toUpperCase() : '?';

      const card = document.createElement('div');
      card.className = 'profile-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('data-id', safeId);
      card.setAttribute('data-name', profile.name);

      card.innerHTML = `
        <div class="avatar-wrapper">
          <img src="${profile.avatar}" alt="Avatar de ${profile.name}" class="avatar-img" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="avatar-fallback">${initial}</div>
        </div>
        <span class="profile-name">${profile.name}</span>
      `;
      profilesGrid.appendChild(card);
    });

    // Focar no primeiro card se existir
    if(profilesGrid.firstElementChild) {
      profilesGrid.firstElementChild.focus();
    }
  }

  // --- Delegation e Navegação por Teclado ---
  profilesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.profile-card');
    if (card) handleProfileSelection(card);
  });

  profilesGrid.addEventListener('keydown', (e) => {
    const card = e.target.closest('.profile-card');
    if (!card) return;

    const cards = Array.from(profilesGrid.querySelectorAll('.profile-card'));
    const index = cards.indexOf(card);

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleProfileSelection(card);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = cards[(index + 1) % cards.length];
      if (next) next.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = cards[(index - 1 + cards.length) % cards.length];
      if (prev) prev.focus();
    }
  });

  function handleProfileSelection(card) {
    const id = card.getAttribute('data-id');
    const name = card.getAttribute('data-name');
    
    // Salvar no localStorage
    localStorage.setItem('viewer', JSON.stringify({ id, name }));
    
    // Transição para o player
    profilesSection.hidden = true;
    playerSection.hidden = false;
    playerTitleSpan.textContent = name;
  }

  // --- Voltar aos perfis ---
  backToProfilesBtn.addEventListener('click', () => {
    playerSection.hidden = true;
    profilesSection.hidden = false;
    localStorage.removeItem('viewer');
  });

  // --- Service Worker Desativado para Atualizar o Cache ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
      console.log("[Cartoon Doc] Service Worker e Caches limpos com sucesso.");
    });
  }
});
