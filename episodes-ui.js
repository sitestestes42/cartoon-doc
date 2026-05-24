// episodes-ui.js - Lógica e injeção do módulo Documentário
document.addEventListener('DOMContentLoaded', () => {
  const playerSection = document.getElementById('player');
  if (!playerSection) return;

  let episodesData = [];
  let isDocUiInitialized = false;

  // Função utilitária: Salvar progresso
  const saveProgress = (id) => {
    let progress = JSON.parse(localStorage.getItem('episodes_progress') || '{}');
    progress[id] = true; // Marca como assistido/iniciado
    localStorage.setItem('episodes_progress', JSON.stringify(progress));
  };

  // Carregar dados
  const fetchEpisodes = async () => {
    try {
      const res = await fetch('episodes.json');
      episodesData = await res.json();
      renderEpisodesList(episodesData);
    } catch (err) {
      console.error("Erro ao carregar episódios:", err);
    }
  };

  // Injetar UI dinamicamente no #player
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

    // Barra de Busca
    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.className = 'doc-search-bar';
    searchBar.placeholder = 'Buscar episódio ou transcrição...';
    searchBar.setAttribute('aria-label', 'Buscar episódios');
    
    // Lista de Episódios
    const episodesList = document.createElement('div');
    episodesList.className = 'episodes-list';
    episodesList.setAttribute('role', 'list');
    episodesList.setAttribute('aria-live', 'polite');

    docPanel.appendChild(searchBar);
    docPanel.appendChild(episodesList);

    // Elementos nativos do Player
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle');

    // Injetar Área de Transcrição logo após o vídeo
    const transcriptSection = document.createElement('div');
    transcriptSection.className = 'transcript-section';
    transcriptSection.hidden = true; // Escondido inicialmente
    transcriptSection.innerHTML = `
      <div class="transcript-header">
        <h3>Transcrição</h3>
        <button id="toggleTranscriptBtn">Mostrar / Ocultar</button>
      </div>
      <div id="transcriptText" class="transcript-content" aria-live="polite"></div>
    `;
    originalVideoWrapper.parentNode.insertBefore(transcriptSection, originalVideoWrapper.nextSibling);

    // Inserir Abas e Painel logo após o botão de Voltar
    const backBtn = document.getElementById('backToProfilesBtn');
    backBtn.insertAdjacentElement('afterend', tabsNav);
    tabsNav.insertAdjacentElement('afterend', docPanel);

    // Lógica de Alternância de Abas
    const showDocumentary = () => {
      tabDoc.classList.add('active');
      tabPlayer.classList.remove('active');
      docPanel.hidden = false;
      originalVideoWrapper.hidden = true;
      transcriptSection.hidden = true;
      originalTitle.style.display = 'none';
      renderEpisodesList(episodesData); // Força atualização de progresso
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

    // Lógica da Barra de Busca
    searchBar.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = episodesData.filter(ep => 
        ep.title.toLowerCase().includes(term) || 
        ep.transcript.toLowerCase().includes(term)
      );
      renderEpisodesList(filtered);
    });

    // Lógica da Transcrição
    document.getElementById('toggleTranscriptBtn').addEventListener('click', () => {
      document.getElementById('transcriptText').classList.toggle('visible');
    });

    // Estado inicial: Forçar aba Documentário
    showDocumentary();
    fetchEpisodes();
    isDocUiInitialized = true;
  };

  // Renderizar Lista
  const renderEpisodesList = (data) => {
    const listContainer = document.querySelector('.episodes-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const progressMap = JSON.parse(localStorage.getItem('episodes_progress') || '{}');

    data.forEach((ep, index) => {
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

      // Eventos de seleção
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

  // Tocar Episódio (Player Embutido)
  const playEpisode = (ep) => {
    saveProgress(ep.id);
    
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');
    const transcriptText = document.getElementById('transcriptText');

    // Ocultar lista e mostrar player
    document.getElementById('documentaryPanel').hidden = true;
    originalVideoWrapper.hidden = false;
    
    // Atualizar Metadados
    originalTitle.style.display = 'block';
    originalTitle.innerHTML = `Documentário: <span>${ep.title}</span>`;
    
    // Atualizar Vídeo
    videoElem.src = ep.video;
    videoElem.play().catch(e => console.warn("Autoplay bloqueado", e));

    // Mostrar Transcrição
    transcriptSection.hidden = false;
    transcriptText.innerText = ep.transcript;
    transcriptText.classList.remove('visible'); // Começa fechada
  };

  // Hook via MutationObserver: Aguarda a remoção do atributo 'hidden' de #player
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
        if (!playerSection.hidden) {
          injectDocumentaryUI();
        } else {
          // Resetar quando voltar pros perfis
          isDocUiInitialized = false;
          const tabs = document.querySelector('.doc-tabs-nav');
          const panel = document.getElementById('documentaryPanel');
          const trans = document.querySelector('.transcript-section');
          if(tabs) tabs.remove();
          if(panel) panel.remove();
          if(trans) trans.remove();
        }
      }
    });
  });

  observer.observe(playerSection, { attributes: true });
});
