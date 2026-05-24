// episodes-ui.js - Versão Dashboard Premium (Painel Inicial + Lista de Episódios)
(() => {
  console.log("[Cartoon Doc] Módulo Dashboard Inicial ativado.");

  let episodesData = [];
  let isDocUiInitialized = false;
  
  let currentPlayingEpisode = null;
  let isPlayingIntro = false;
  let blockNativeEnded = false;

  // --- ESTILOS VISUAIS DO PAINEL NETFLIX (Injetados dinamicamente) ---
  const injectDashboardStyles = () => {
    if (document.getElementById('netflix-core-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'netflix-core-styles';
    style.innerHTML = `
      .netflix-dashboard {
        color: #fff;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        padding: 20px;
        animation: fadeIn 0.6s ease-out;
      }
      .nf-banner {
        position: relative;
        min-height: 450px;
        background: linear-gradient(77s, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%), url('painel.jpg') no-repeat center center;
        background-size: cover;
        border-radius: 8px;
        padding: 60px 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
        margin-bottom: 40px;
      }
      .nf-title {
        font-size: 3.5rem;
        font-weight: bold;
        margin: 0 0 10px 0;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      }
      .nf-subtitle {
        font-size: 1.8rem;
        color: #e5e5e5;
        font-weight: 500;
        margin-bottom: 15px;
      }
      .nf-description {
        font-size: 1.1rem;
        max-width: 600px;
        line-height: 1.4;
        color: #d2d2d2;
        margin-bottom: 25px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
      }
      .nf-actions {
        display: flex;
        gap: 15px;
      }
      .nf-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 12px 28px;
        font-size: 1.1rem;
        font-weight: bold;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .nf-btn-primary {
        background-color: #ffffff;
        color: #000000;
      }
      .nf-btn-primary:hover {
        background-color: rgba(255, 255, 255, 0.75);
      }
      .nf-btn-secondary {
        background-color: rgba(109, 109, 110, 0.7);
        color: #ffffff;
      }
      .nf-btn-secondary:hover {
        background-color: rgba(109, 109, 110, 0.4);
      }
      .nf-section-title {
        font-size: 1.4rem;
        font-weight: bold;
        margin-bottom: 15px;
        color: #e5e5e5;
      }
      .nf-row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 15px;
        margin-bottom: 30px;
      }
      .nf-card {
        background: #141414;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
        aspect-ratio: 16/10;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 10px;
        border: 1px solid #222;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      .nf-card-bg-placeholder {
        position: absolute;
        top: 0; left: 0; wight: 100%; height: 100%;
        background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 100%);
        z-index: 1;
      }
      .nf-card-title {
        font-size: 0.9rem;
        font-weight: bold;
        z-index: 2;
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .nf-badge {
        background-color: #e50914;
        color: white;
        font-size: 0.7rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 2px;
        align-self: flex-start;
        z-index: 2;
        text-transform: uppercase;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  };

  const saveProgress = (id) => {
    let progress = JSON.parse(localStorage.getItem('episodes_progress') || '{}');
    progress[id] = true;
    localStorage.setItem('episodes_progress', JSON.stringify(progress));
  };

  const fetchEpisodes = async () => {
    try {
      const res = await fetch('episodes.json');
      if (!res.ok) throw new Error('Não encontrou episodes.json');
      episodesData = await res.json();
      renderEpisodesList(episodesData);
    } catch (err) {
      console.error("[Cartoon Doc] Erro ao carregar JSON:", err);
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

    // Engenharia de Interceptação de Fim de Vídeo
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

    // --- 1. CRIAR O PAINEL NETFLIX COMPLETO ---
    const dashboardPanel = document.createElement('div');
    dashboardPanel.id = 'netflixDashboardPanel';
    dashboardPanel.className = 'netflix-dashboard';
    dashboardPanel.innerHTML = `
      <div class="nf-banner">
        <h1 class="nf-title">Cartoon Network:</h1>
        <div class="nf-subtitle">Declínio e Reinvenção</div>
        <p class="nf-description">Nesta apresentação, exploramos o declínio estrutural e a transição digital da Cartoon Network, abrangendo TV, streaming e cultura.</p>
        <div class="nf-actions">
          <button class="nf-btn nf-btn-primary" id="nfPlayBtn">▶ Assistir</button>
          <button class="nf-btn nf-btn-secondary" id="nfInfoBtn">ⓘ Mais informações</button>
        </div>
      </div>
      
      <div class="nf-section-title">Dicas para você</div>
      <div class="nf-row">
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('assets/chris.jpg') center/cover;">
          <div class="nf-card-title">Todo Mundo Ainda Odeia o Chris</div>
          <span class="nf-badge">Novidade</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('assets/oth.jpg') center/cover;">
          <div class="nf-card-title">One Tree Hill</div>
          <span class="nf-badge">Novidade</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('assets/horimiya.jpg') center/cover;">
          <div class="nf-card-title">Horimiya</div>
          <span class="nf-badge">Novidade</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('assets/dmc.jpg') center/cover;">
          <div class="nf-card-title">Devil May Cry</div>
          <span class="nf-badge">Nova Temporada</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('assets/shangri.jpg') center/cover;">
          <div class="nf-card-title">Shangri-La Frontier</div>
          <span class="nf-badge">Novidade</span>
        </div>
      </div>
    `;

    // --- 2. CRIAR ABAS DE NAVEGAÇÃO ---
    const tabsNav = document.createElement('div');
    tabsNav.className = 'doc-tabs-nav';
    tabsNav.setAttribute('role', 'tablist');
    tabsNav.style.display = 'none'; // Começa oculto até clicar em Assistir

    const tabDoc = document.createElement('button');
    tabDoc.className = 'doc-tab-btn active';
    tabDoc.innerText = 'Lista de Episódios';
    
    const tabBackHome = document.createElement('button');
    tabBackHome.className = 'doc-tab-btn';
    tabBackHome.innerText = '⬅ Voltar ao Início';

    tabsNav.appendChild(tabDoc);
    tabsNav.appendChild(tabBackHome);

    // --- 3. CRIAR PAINEL DA LISTA DE EPISÓDIOS ---
    const docPanel = document.createElement('div');
    docPanel.id = 'documentaryPanel';
    docPanel.setAttribute('role', 'tabpanel');
    docPanel.hidden = true; // Começa oculto

    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.className = 'doc-search-bar';
    searchBar.placeholder = 'Buscar episódio ou transcrição...';
    
    const episodesList = document.createElement('div');
    episodesList.className = 'episodes-list';

    docPanel.appendChild(searchBar);
    docPanel.appendChild(episodesList);

    // --- 4. CRIAR SEÇÃO DE TRANSCRIÇÃO ---
    const transcriptSection = document.createElement('div');
    transcriptSection.className = 'transcript-section';
    transcriptSection.hidden = true;
    transcriptSection.innerHTML = `
      <div class="transcript-header">
        <h3>Transcrição</h3>
        <button id="toggleTranscriptBtn">Mostrar / Ocultar</button>
      </div>
      <div id="transcriptText" class="transcript-content"></div>
    `;

    // Organização de montagem no DOM
    originalVideoWrapper.parentNode.insertBefore(transcriptSection, originalVideoWrapper.nextSibling);
    backBtn.insertAdjacentElement('afterend', dashboardPanel);
    dashboardPanel.insertAdjacentElement('afterend', tabsNav);
    tabsNav.insertAdjacentElement('afterend', docPanel);

    // --- CONFIGURAÇÃO DE TRANSIÇÕES ENTRE TELAS ---
    const showDashboard = () => {
      blockNativeEnded = false;
      dashboardPanel.style.display = 'block';
      tabsNav.style.display = 'none';
      docPanel.hidden = true;
      originalVideoWrapper.hidden = true;
      transcriptSection.hidden = true;
      if (originalTitle) originalTitle.style.display = 'none';
      videoElem.pause();
    };

    const showEpisodesGrid = () => {
      blockNativeEnded = false;
      dashboardPanel.style.display = 'none';
      tabsNav.style.display = 'flex';
      docPanel.hidden = false;
      originalVideoWrapper.hidden = true;
      transcriptSection.hidden = true;
      if (originalTitle) originalTitle.style.display = 'none';
      videoElem.pause();
      renderEpisodesList(episodesData);
    };

    // Listeners dos botões principais
    dashboardPanel.querySelector('#nfPlayBtn').addEventListener('click', showEpisodesGrid);
    dashboardPanel.querySelector('#nfInfoBtn').addEventListener('click', () => {
      alert("Cartoon Network: Declínio e Reinvenção\n\nProdução independente analisando as fases da emissora de animação mais famosa do mundo.");
    });

    tabDoc.addEventListener('click', showEpisodesGrid);
    tabBackHome.addEventListener('click', showDashboard);

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

    // Inicia mostrando a Dashboard estilo Netflix
    showDashboard();
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
      card.setAttribute('tabindex', '0');

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
        }
      });

      listContainer.appendChild(card);
    });
  };

  const playEpisode = (ep) => {
    currentPlayingEpisode = ep;
    isPlayingIntro = true;
    blockNativeEnded = true; 

    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');

    document.getElementById('documentaryPanel').hidden = true;
    document.getElementById('netflixDashboardPanel').style.display = 'none';
    document.querySelector('.doc-tabs-nav').style.display = 'none';
    
    originalVideoWrapper.hidden = false;
    transcriptSection.hidden = true; 

    if (originalTitle) {
      originalTitle.style.display = 'block';
      originalTitle.innerHTML = `Apresentando...`;
    }

    videoElem.src = 'assets/intro.mp4';
    videoElem.play().catch(e => console.warn("Autoplay da intro pendente de clique:", e));
  };

  const handleVideoEnded = () => {
    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');
    const transcriptText = document.getElementById('transcriptText');

    if (isPlayingIntro && currentPlayingEpisode) {
      isPlayingIntro = false;
      saveProgress(currentPlayingEpisode.id);

      if (originalTitle) {
        originalTitle.innerHTML = `Documentário: <span>${currentPlayingEpisode.title}</span>`;
      }

      transcriptSection.hidden = false;
      transcriptText.innerText = currentPlayingEpisode.transcript;
      transcriptText.classList.remove('visible'); 

      videoElem.src = currentPlayingEpisode.video;
      videoElem.play().catch(e => console.warn("Autoplay do episódio pendente de clique:", e));
    } else {
      blockNativeEnded = false;
      currentPlayingEpisode = null;
      
      // Quando o episódio acaba por completo, retorna para a lista de seleção
      const panel = document.getElementById('documentaryPanel');
      if (panel) {
        document.getElementById('netflixDashboardPanel').style.display = 'none';
        document.querySelector('.doc-tabs-nav').style.display = 'flex';
        panel.hidden = false;
        originalVideoWrapper.hidden = true;
        transcriptSection.hidden = true;
        if (originalTitle) originalTitle.style.display = 'none';
      }
    }
  };

  const checkAndHook = () => {
    const playerSection = document.getElementById('player');
    if (!playerSection) return;

    const isPlayerVisible = !playerSection.hasAttribute('hidden') && 
                            !playerSection.classList.contains('hidden') && 
                            window.getComputedStyle(playerSection).display !== 'none';

    if (isPlayerVisible && !isDocUiInitialized) {
      injectDocumentaryUI(playerSection);
    } else if (!isPlayerVisible && isDocUiInitialized) {
      isDocUiInitialized = false;
      blockNativeEnded = false;
      const db = document.getElementById('netflixDashboardPanel');
      const tabs = document.querySelector('.doc-tabs-nav');
      const panel = document.getElementById('documentaryPanel');
      const trans = document.querySelector('.transcript-section');
      if(db) db.remove();
      if(tabs) tabs.remove();
      if(panel) panel.remove();
      if(trans) trans.remove();
    }
  };

  checkAndHook();
  const observer = new MutationObserver(checkAndHook);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  setInterval(checkAndHook, 300);

})();
