// episodes-ui.js - Versão Cinematic Decay com Navegação de Episódios
(() => {
  console.log("[Cartoon Network] Módulo de Episódios ativado com sucesso.");

  let episodesData = [];
  let isDocUiInitialized = false;
  let currentEpisodeIndex = 0;
  
  let currentPlayingEpisode = null;
  let isPlayingIntro = false;
  let blockNativeEnded = false;

  const injectDashboardStyles = () => {
    if (document.getElementById('netflix-core-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'netflix-core-styles';
    style.innerHTML = `
      .netflix-dashboard {
        color: #fff !important;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        padding: 20px !important;
        animation: fadeInDoc 0.6s ease-out !important;
        display: none;
      }
      @keyframes fadeInDoc { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
  };

  const saveProgress = (id) => {
    let progress = JSON.parse(localStorage.getItem('episodes_progress') || '{}');
    progress[id] = true;
    localStorage.setItem('episodes_progress', JSON.stringify(progress));
  };

  const fetchEpisodes = async () => {
    const listContainer = document.querySelector('.episodes-list');
    try {
      const res = await fetch('episodes.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao requisitar o arquivo JSON.');
      episodesData = await res.json();
      renderEpisodesList(episodesData);
    } catch (err) {
      console.error("[Cartoon Network] Erro crítico no carregamento:", err);
      if (listContainer) {
        listContainer.removeAttribute('style'); 
        listContainer.innerHTML = `
          <div style="padding: 20px; background: #2c1416; border: 1px solid #d4a574; color: #ff9e9e; border-radius: 6px; font-family: sans-serif; margin-top: 15px;">
            <h4 style="margin-top:0; color:#d4a574;">⚠️ Erro ao carregar episódios</h4>
            <p style="font-size:0.9rem; margin: 5px 0;">O arquivo de episódios possui uma quebra de sintaxe.</p>
            <small style="color:#ccc; display:block; background:rgba(0,0,0,0.3); padding:6px; border-radius:4px;">${err.message}</small>
          </div>
        `;
      }
    }
  };

  const injectDocumentaryUI = (playerSection) => {
    if (isDocUiInitialized || !playerSection) return;

    injectDashboardStyles();

    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const backBtn = document.getElementById('backToProfilesBtn') || playerSection.querySelector('button');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper ? originalVideoWrapper.querySelector('video') : null;

    if (!originalVideoWrapper || !backBtn || !videoElem) return;

    if (!videoElem.dataset.hooked) {
      videoElem.dataset.hooked = "true";
      videoElem.addEventListener('ended', (e) => {
        if (blockNativeEnded) {
          e.stopImmediatePropagation();
          e.preventDefault();
          handleVideoEnded();
        }
      }, { capture: true });
    }

    const dashboardPanel = document.createElement('div');
    dashboardPanel.id = 'netflixDashboardPanel';
    dashboardPanel.className = 'netflix-dashboard';
    dashboardPanel.innerHTML = `
      <div class="nf-banner">
        <h1 class="nf-title">Cartoon Network:</h1>
        <div class="nf-subtitle">O Declínio de Uma Era</div>
        <p class="nf-description">Nesta apresentação, exploramos o declínio estrutural e a transição digital da Cartoon Network, abrangendo TV, streaming e cultura em 22 episódios.</p>
        <div class="nf-actions">
          <button class="nf-btn nf-btn-primary" id="nfPlayBtn">▶ Assistir Episódios</button>
          <button class="nf-btn nf-btn-secondary" id="nfInfoBtn">ⓘ Mais informações</button>
        </div>
      </div>
      
      <div class="nf-section-title">Dicas para você</div>
      <div class="nf-row">
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.9)), url('assets/painel.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">Episódio 1: Origem</div>
          <span class="nf-badge">Início</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.9)), url('assets/painel.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">Episódio 6: Erros</div>
          <span class="nf-badge">Destaque</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.9)), url('assets/painel.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">Episódio 22: Resultados</div>
          <span class="nf-badge">Final</span>
        </div>
      </div>
    `;

    const tabsNav = document.createElement('div');
    tabsNav.className = 'doc-tabs-nav';
    tabsNav.style.setProperty('display', 'none', 'important');

    const tabDoc = document.createElement('button');
    tabDoc.className = 'doc-tab-btn active';
    tabDoc.innerText = 'Lista de Episódios';
    
    const tabBackHome = document.createElement('button');
    tabBackHome.className = 'doc-tab-btn';
    tabBackHome.innerText = '⬅ Voltar ao Início';

    tabsNav.appendChild(tabDoc);
    tabsNav.appendChild(tabBackHome);

    const docPanel = document.createElement('div');
    docPanel.id = 'documentaryPanel';
    docPanel.style.setProperty('display', 'none', 'important');

    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.className = 'doc-search-bar';
    searchBar.placeholder = 'Buscar episódio...';
    
    const episodesList = document.createElement('div');
    episodesList.className = 'episodes-list';

    docPanel.appendChild(searchBar);
    docPanel.appendChild(episodesList);

    const transcriptSection = document.createElement('div');
    transcriptSection.className = 'transcript-section';
    transcriptSection.style.setProperty('display', 'none', 'important');
    transcriptSection.innerHTML = `
      <div class="transcript-header">
        <h3 style="margin:0; font-size:1.2rem;">Transcrição</h3>
        <button id="toggleTranscriptBtn" class="doc-tab-btn" style="font-size:1rem; border:1px solid #444; border-radius:4px; padding:4px 12px;">Mostrar / Ocultar</button>
      </div>
      <div id="transcriptText" class="transcript-content"></div>
    `;

    originalVideoWrapper.parentNode.insertBefore(transcriptSection, originalVideoWrapper.nextSibling);
    backBtn.insertAdjacentElement('afterend', dashboardPanel);
    dashboardPanel.insertAdjacentElement('afterend', tabsNav);
    tabsNav.insertAdjacentElement('afterend', docPanel);

    const showDashboard = () => {
      blockNativeEnded = false;
      dashboardPanel.style.setProperty('display', 'block', 'important');
      tabsNav.style.setProperty('display', 'none', 'important');
      docPanel.style.setProperty('display', 'none', 'important');
      originalVideoWrapper.style.setProperty('display', 'none', 'important');
      transcriptSection.style.setProperty('display', 'none', 'important');
      if (originalTitle) originalTitle.style.setProperty('display', 'none', 'important');
      videoElem.pause();
    };

    const showEpisodesGrid = () => {
      blockNativeEnded = false;
      dashboardPanel.style.setProperty('display', 'none', 'important');
      tabsNav.style.setProperty('display', 'flex', 'important');
      docPanel.style.setProperty('display', 'block', 'important');
      originalVideoWrapper.style.setProperty('display', 'none', 'important');
      transcriptSection.style.setProperty('display', 'none', 'important');
      if (originalTitle) originalTitle.style.setProperty('display', 'none', 'important');
      videoElem.pause();
      fetchEpisodes();
    };

    dashboardPanel.querySelector('#nfPlayBtn').addEventListener('click', showEpisodesGrid);
    dashboardPanel.querySelector('#nfInfoBtn').addEventListener('click', () => {
      alert("Cartoon Network: O Declínio de Uma Era\n\nUma análise profunda dividida em 22 episódios sobre a trajetória, declínio e possível reinvenção da Cartoon Network.");
    });

    tabDoc.addEventListener('click', showEpisodesGrid);
    tabBackHome.addEventListener('click', showDashboard);

    searchBar.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = episodesData.filter(ep => ep.title.toLowerCase().includes(term));
      renderEpisodesList(filtered);
    });

    document.getElementById('toggleTranscriptBtn').addEventListener('click', () => {
      document.getElementById('transcriptText').classList.toggle('visible');
    });

    showDashboard();
    isDocUiInitialized = true;
  };

  const renderEpisodesList = (data) => {
    const listContainer = document.querySelector('.episodes-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const progressMap = JSON.parse(localStorage.getItem('episodes_progress') || '{}');

    if(data.length === 0) {
      listContainer.innerHTML = '<p style="color:#aaa; padding:20px;">Nenhum episódio encontrado.</p>';
      return;
    }

    data.forEach((ep, index) => {
      const isWatched = progressMap[ep.id];
      const card = document.createElement('div');
      card.className = 'episode-card';
      card.setAttribute('tabindex', '0');

      card.innerHTML = `
        <div class="episode-thumb-wrapper">
          <img class="episode-thumb" src="${ep.thumbnail}" alt="Thumbnail ${ep.order}" onerror="this.style.opacity='0.3';">
        </div>
        <div class="episode-info">
          <h3 class="episode-title">${ep.order}. ${ep.title}</h3>
          <span class="episode-meta">Duração: ${ep.duration}</span>
          <p class="episode-summary">${ep.summary}</p>
          ${isWatched ? `<span class="episode-progress">✓ Assistido</span>` : ''}
        </div>
      `;

      card.addEventListener('click', () => playEpisode(ep, index));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playEpisode(ep, index);
        }
      });
      listContainer.appendChild(card);
    });
  };

  const playEpisode = (ep, index) => {
    currentPlayingEpisode = ep;
    currentEpisodeIndex = index;
    isPlayingIntro = true;
    blockNativeEnded = true;

    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');

    document.getElementById('documentaryPanel').style.setProperty('display', 'none', 'important');
    document.getElementById('netflixDashboardPanel').style.setProperty('display', 'none', 'important');
    document.querySelector('.doc-tabs-nav').style.setProperty('display', 'none', 'important');
    
    originalVideoWrapper.style.setProperty('display', 'block', 'important');
    transcriptSection.style.setProperty('display', 'none', 'important');

    if (originalTitle) {
      originalTitle.style.setProperty('display', 'block', 'important');
      originalTitle.innerHTML = `<span>${ep.title}</span>`;
    }

    // Aplicar background com imagem do episódio
    if (ep.thumbnail) {
      originalVideoWrapper.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${ep.thumbnail}')`;
      originalVideoWrapper.style.backgroundSize = 'cover';
      originalVideoWrapper.style.backgroundPosition = 'center';
    }

    videoElem.src = ep.video;
    videoElem.play().catch(e => console.warn("Autoplay suspenso:", e));

    // Salvar progresso
    saveProgress(ep.id);
  };

  const handleVideoEnded = () => {
    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const videoElem = originalVideoWrapper.querySelector('video');

    // Ir para próximo episódio automaticamente
    if (currentEpisodeIndex < episodesData.length - 1) {
      const nextEpisode = episodesData[currentEpisodeIndex + 1];
      playEpisode(nextEpisode, currentEpisodeIndex + 1);
    } else {
      // Voltar ao dashboard se for o último episódio
      showDashboard();
    }
  };

  const showDashboard = () => {
    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');

    blockNativeEnded = false;
    document.getElementById('netflixDashboardPanel').style.setProperty('display', 'block', 'important');
    document.querySelector('.doc-tabs-nav').style.setProperty('display', 'none', 'important');
    document.getElementById('documentaryPanel').style.setProperty('display', 'none', 'important');
    originalVideoWrapper.style.setProperty('display', 'none', 'important');
    transcriptSection.style.setProperty('display', 'none', 'important');
    if (originalTitle) originalTitle.style.setProperty('display', 'none', 'important');
    videoElem.pause();
  };

  // Inicializar quando o player estiver pronto
  const initializeWhenReady = () => {
    const playerSection = document.getElementById('player');
    if (playerSection && !isDocUiInitialized) {
      injectDocumentaryUI(playerSection);
    } else if (!playerSection) {
      setTimeout(initializeWhenReady, 100);
    }
  };

  // Iniciar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
  } else {
    initializeWhenReady();
  }
})();
