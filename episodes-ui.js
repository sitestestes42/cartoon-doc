// episodes-ui.js - Versão Anti-Falhas com Verificação Imediata
document.addEventListener('DOMContentLoaded', () => {
  const playerSection = document.getElementById('player');
  if (!playerSection) return;

  let episodesData = [];
  let isDocUiInitialized = false;

  const saveProgress = (id) => {
    let progress = JSON.parse(localStorage.getItem('episodes_progress') || '{}');
    progress[id] = true;
    localStorage.setItem('episodes_progress', JSON.stringify(progress));
  };

  const fetchEpisodes = async () => {
    try {
      const res = await fetch('episodes.json');
      if (!res.ok) throw new Error('Erro ao buscar episodes.json');
      episodesData = await res.json();
      renderEpisodesList(episodesData);
    } catch (err) {
      console.error("Erro ao carregar episódios:", err);
    }
  };

  const injectDocumentaryUI = () => {
    if (isDocUiInitialized) return;

    // Criar Navegação de Abas
    const tabsNav = document.createElement('div');
    tabsNav.className = 'doc-tabs-nav';
    tabsNav.setAttribute('role', 'tablist');

    const tabDoc = document.createElement('button');
    tabDoc.className = 'doc-tab-btn active';
    tabDoc.innerText = 'Documentário';
    tabDoc.setAttribute('role', 'tab');
    
    const tabPlayer = document.createElement('button');
    tabPlayer.className = 'doc-tab-btn';
    tabPlayer.innerText = 'Player Clássico';
    tabPlayer.setAttribute('role', 'tab');

    tabsNav.appendChild(tabDoc);
    tabsNav.appendChild(tabPlayer);

    // Criar Painel do Documentário
    const docPanel = document.createElement('div');
    docPanel.id = 'documentaryPanel';
    docPanel.setAttribute('role', 'tabpanel');

    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.className = 'doc-search-bar';
    searchBar.placeholder = 'Buscar episódio ou transcrição...';
    searchBar.setAttribute('aria-label', 'Buscar episódios');
    
    const episodesList = document.createElement('div');
    episodesList.className = 'episodes-list';
    episodesList.setAttribute('role', 'list');
    episodesList.setAttribute('aria-live', 'polite');

    docPanel.appendChild(searchBar);
    docPanel.appendChild(episodesList);

    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle');

    // Injetar Área de Transcrição
    const transcriptSection = document.createElement('div');
    transcriptSection.className = 'transcript-section';
    transcriptSection.hidden = true;
    transcriptSection.innerHTML = `
      <div class="transcript-header">
        <h3>Transcrição</h3>
        <button id="toggleTranscriptBtn">Mostrar / Ocultar</button>
      </div>
      <div id="transcriptText" class="transcript-content" aria-live="polite"></div>
    `;
    originalVideoWrapper.parentNode.insertBefore(transcriptSection, originalVideoWrapper.nextSibling);

    const backBtn = document.getElementById('backToProfilesBtn');
    backBtn.insertAdjacentElement('afterend', tabsNav);
    tabsNav.insertAdjacentElement('afterend', docPanel);

    const showDocumentary = () => {
      tabDoc.classList.add('active');
      tabPlayer.classList.remove('active');
      docPanel.hidden = false;
      originalVideoWrapper.hidden = true;
      transcriptSection.hidden = true;
      originalTitle.style.display = 'none';
      renderEpisodesList(episodesData);
    };

    const showClassicPlayer = () => {
      tabPlayer.classList.add('active');
      tabDoc.classList.remove('active');
      docPanel.hidden = true;
      originalVideoWrapper.hidden = false;
      originalTitle.style.display = 'block';
      transcriptSection.hidden = true;
    };

    tabDoc.addEventListener('click', showDocumentary);
    tabPlayer.addEventListener('click', showClassicPlayer);

    searchBar.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = episodesData.filter(ep => 
        ep.title.toLowerCase().includes(term) || 
        ep.transcript.toLowerCase().includes(term)
      );
      renderEpisodesList(filtered);
    });

    document.getElementById('toggleTranscriptBtn').addEventListener('click', () => {
      document.getElementById('transcriptText').classList.toggle('visible');
    });

    showDocumentary();
    fetchEpisodes();
    isDocUiInitialized = true;
  };

  const renderEpisodesList = (data) => {
    const listContainer = document.querySelector('.episodes-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const progressMap = JSON.parse(localStorage.getItem('episodes_progress') || '{}');

    data.forEach((ep) => {
      const isWatched = progressMap[ep.id] ? 'Visto' : '';
      const card = document.createElement('div');
      card.className = 'episode-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('data-episode-id', ep.id);

      card.innerHTML = `
        <div class="episode-thumb-wrapper">
          <img src="${ep.thumbnail}" alt="Thumb" class="episode-thumb" onerror="this.style.display='none'">
        </div>
        <div class="episode-info">
          <h3 class="episode-title">${ep.order}. ${ep.title}</h3>
          <span class="episode-meta">Duração: ${ep.duration}</span>
          <p class="episode-summary">${ep.summary}</p>
          ${isWatched ? `<span class="episode-progress">✓ Assistido</span>` : ''}
        </div>
      `;

      card.addEventListener('click', () => playEpisode(ep));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playEpisode(ep);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (card.nextElementSibling) card.nextElementSibling.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (card.previousElementSibling) card.previousElementSibling.focus();
        }
      });

      listContainer.appendChild(card);
    });
  };

  const playEpisode = (ep) => {
    saveProgress(ep.id);
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');
    const transcriptText = document.getElementById('transcriptText');

    document.getElementById('documentaryPanel').hidden = true;
    originalVideoWrapper.hidden = false;
    
    originalTitle.style.display = 'block';
    originalTitle.innerHTML = `Documentário: <span>${ep.title}</span>`;
    
    videoElem.src = ep.video;
    videoElem.play().catch(e => console.warn("Autoplay bloqueado", e));

    transcriptSection.hidden = false;
    transcriptText.innerText = ep.transcript;
    transcriptText.classList.remove('visible');
  };

  // --- GARANTIA DE INJEÇÃO ---
  // 1. Se o player já estiver visível no momento que este script rodar:
  if (!playerSection.hidden) {
    injectDocumentaryUI();
  }

  // 2. Se ele abrir depois (fluxo normal), o Observer garante a ativação:
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
        if (!playerSection.hidden) {
          injectDocumentaryUI();
        }
      }
    });
  });

  observer.observe(playerSection, { attributes: true });
});
