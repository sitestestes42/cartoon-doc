// episodes-ui.js - Versão Forçada (Anti-Trava de Skeleton e Exibição Garantida)
(() => {
  console.log("[Cartoon Doc] Módulo Dashboard Inicial ativado com força total de CSS.");

  let episodesData = [];
  let isDocUiInitialized = false;
  
  let currentPlayingEpisode = null;
  let isPlayingIntro = false;
  let blockNativeEnded = false;

  // Estilos visuais robustos injetados diretamente
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
      .nf-banner {
        position: relative !important;
        min-height: 400px !important;
        background: linear-gradient(77deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%), url('assets/painel.jpg') no-repeat center center !important;
        background-size: cover !important;
        border-radius: 8px !important;
        padding: 60px 40px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        box-shadow: inset 0 0 100px rgba(0,0,0,0.8) !important;
        margin-bottom: 40px !important;
      }
      .nf-title {
        font-size: 3.2rem !important;
        font-weight: bold !important;
        margin: 0 0 5px 0 !important;
        color: #fff !important;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
      }
      .nf-subtitle {
        font-size: 1.8rem !important;
        color: #f1c40f !important;
        font-weight: bold !important;
        margin-bottom: 15px !important;
      }
      .nf-description {
        font-size: 1.1rem !important;
        max-width: 550px !important;
        line-height: 1.5 !important;
        color: #e5e5e5 !important;
        margin-bottom: 25px !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
      }
      .nf-actions {
        display: flex !important;
        gap: 15px !important;
      }
      .nf-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 12px 30px !important;
        font-size: 1.1rem !important;
        font-weight: bold !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        transition: transform 0.2s ease, background 0.2s !important;
      }
      .nf-btn:hover {
        transform: scale(1.03) !important;
      }
      .nf-btn-primary {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      .nf-btn-secondary {
        background-color: rgba(109, 109, 110, 0.7) !important;
        color: #ffffff !important;
      }
      .nf-section-title {
        font-size: 1.5rem !important;
        font-weight: bold !important;
        margin-bottom: 20px !important;
        color: #fff !important;
      }
      .nf-row {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
        gap: 20px !important;
        margin-bottom: 40px !important;
      }
      .nf-card {
        background: #141414 !important;
        border-radius: 4px !important;
        overflow: hidden !important;
        position: relative !important;
        aspect-ratio: 16/10 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        padding: 12px !important;
        border: 1px solid #222 !important;
        cursor: pointer !important;
        transition: transform 0.3s ease !important;
      }
      .nf-card:hover {
        transform: scale(1.05) !important;
        z-index: 10 !important;
      }
      .nf-card-title {
        font-size: 0.95rem !important;
        font-weight: bold !important;
        color: #fff !important;
        z-index: 5 !important;
        margin-bottom: 6px !important;
        text-shadow: 1px 1px 3px rgba(0,0,0,1) !important;
      }
      .nf-badge {
        background-color: #e50914 !important;
        color: white !important;
        font-size: 0.7rem !important;
        font-weight: bold !important;
        padding: 3px 8px !important;
        border-radius: 2px !important;
        align-self: flex-start !important;
        z-index: 5 !important;
        text-transform: uppercase !important;
      }

      /* Sobrescrita agressiva para destruir animações de esqueleto antigas */
      .episodes-list .episode-card {
        background: #1f1f1f !important;
        animation: none !important;
        background-image: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: flex !important;
        gap: 15px !important;
        padding: 15px !important;
        border-bottom: 1px solid #333 !important;
        margin-bottom: 10px !important;
        cursor: pointer !important;
      }
      .episode-thumb-wrapper {
        width: 150px !important;
        height: 90px !important;
        background-color: #333 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
      }
      .episode-info {
        display: flex !important;
        flex-direction: column !important;
        gap: 5px !important;
        width: 100% !important;
      }
      .episode-title {
        color: #ffffff !important;
        font-size: 1.1rem !important;
        margin: 0 !important;
        display: block !important;
      }
      .episode-meta {
        color: #aaa !important;
        font-size: 0.85rem !important;
        display: block !important;
      }
      .episode-summary {
        color: #ccc !important;
        font-size: 0.9rem !important;
        margin: 0 !important;
        display: block !important;
      }

      @keyframes fadeInDoc {
        from { opacity: 0; transform: translateY(15px); }
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
      const res = await fetch('episodes.json', { cache: 'no-store' });
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
        <div class="nf-subtitle">Declínio e Reinvenção</div>
        <p class="nf-description">Nesta apresentação, exploramos o declínio estrutural e a transição digital da Cartoon Network, abrangendo TV, streaming e cultura.</p>
        <div class="nf-actions">
          <button class="nf-btn nf-btn-primary" id="nfPlayBtn">▶ Assistir</button>
          <button class="nf-btn nf-btn-secondary" id="nfInfoBtn">ⓘ Mais informações</button>
        </div>
      </div>
      
      <div class="nf-section-title">Dicas para você</div>
      <div class="nf-row">
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('assets/chris.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">Todo Mundo Ainda Odeia o Chris</div>
          <span class="nf-badge">Novidade</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('assets/oth.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">One Tree Hill</div>
          <span class="nf-badge">Novidade</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('assets/horimiya.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">Horimiya</div>
          <span class="nf-badge">Novidade</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('assets/dmc.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">Devil May Cry</div>
          <span class="nf-badge">Nova Temporada</span>
        </div>
        <div class="nf-card" style="background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('assets/shangri.jpg') center/cover no-repeat !important;">
          <div class="nf-card-title">Shangri-La Frontier</div>
          <span class="nf-badge">Novidade</span>
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
        <h3>Transcrição</h3>
        <button id="toggleTranscriptBtn">Mostrar / Ocultar</button>
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
      renderEpisodesList(episodesData);
    };

    dashboardPanel.querySelector('#nfPlayBtn').addEventListener('click', showEpisodesGrid);
    dashboardPanel.querySelector('#nfInfoBtn').addEventListener('click', () => {
      alert("Cartoon Network: Declínio e Reinvenção\n\nUma análise profunda sobre as transformações, eras de ouro e os desafios digitais.");
    });

    tabDoc.addEventListener('click', showEpisodesGrid);
    tabBackHome.addEventListener('click', showDashboard);

    searchBar.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = episodesData.filter(ep => 
        ep.title.toLowerCase().includes(term)
      );
      renderEpisodesList(filtered);
    });

    document.getElementById('toggleTranscriptBtn').addEventListener('click', () => {
      document.getElementById('transcriptText').classList.toggle('visible');
    });

    showDashboard();
    fetchEpisodes();
    isDocUiInitialized = true;
  };

  // --- RENDERING INTEGRAL REMOVENDO QUALQUER TRAVA DE CLASSE EXTERNA ---
  const renderEpisodesList = (data) => {
    const listContainer = document.querySelector('.episodes-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const progressMap = JSON.parse(localStorage.getItem('episodes_progress') || '{}');

    data.forEach((ep) => {
      const isWatched = progressMap[ep.id] ? 'Visto' : '';
      const card = document.createElement('div');
      
      // Força a remoção manual de estados antigos limpando classes intrusas
      card.className = 'episode-card';
      card.className = 'episode-card'; 
      card.style.cssText = "display: flex !important; visibility: visible !important; opacity: 1 !important; background: #1f1f1f !important;";
      card.setAttribute('tabindex', '0');

      card.innerHTML = `
        <div class="episode-thumb-wrapper">
          <span style="color: #666; font-size: 0.8rem; position: absolute;">Sem Foto</span>
          <img src="${ep.thumbnail}" alt="Thumb" class="episode-thumb" style="width:100%; height:100%; object-fit:cover; z-index:2; position:relative;" onerror="this.style.display='none'">
        </div>
        <div class="episode-info">
          <h3 class="episode-title">${ep.order}. ${ep.title}</h3>
          <span class="episode-meta">Duração: ${ep.duration}</span>
          <p class="episode-summary">${ep.summary}</p>
          ${isWatched ? `<span class="episode-progress" style="color: #2ecc71; font-size: 0.8rem;">✓ Assistido</span>` : ''}
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

    document.getElementById('documentaryPanel').style.setProperty('display', 'none', 'important');
    document.getElementById('netflixDashboardPanel').style.setProperty('display', 'none', 'important');
    document.querySelector('.doc-tabs-nav').style.setProperty('display', 'none', 'important');
    
    originalVideoWrapper.style.setProperty('display', 'block', 'important');
    transcriptSection.style.setProperty('display', 'none', 'important'); 

    if (originalTitle) {
      originalTitle.style.setProperty('display', 'block', 'important');
      originalTitle.innerHTML = `Apresentando...`;
    }

    videoElem.src = 'assets/intro.mp4';
    videoElem.play().catch(e => console.warn("Autoplay impedido, aguardando clique:", e));
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

      // É aqui que a transcrição é ativada e preenchida!
      transcriptSection.style.setProperty('display', 'block', 'important');
      transcriptText.innerText = currentPlayingEpisode.transcript;
      transcriptText.classList.remove('visible'); 

      videoElem.src = currentPlayingEpisode.video;
      videoElem.play().catch(e => console.warn("Autoplay do episódio aguardando clique:", e));
    } else {
      blockNativeEnded = false;
      currentPlayingEpisode = null;
      
      document.getElementById('netflixDashboardPanel').style.setProperty('display', 'none', 'important');
      document.querySelector('.doc-tabs-nav').style.setProperty('display', 'flex', 'important');
      document.getElementById('documentaryPanel').style.setProperty('display', 'block', 'important');
      originalVideoWrapper.style.setProperty('display', 'none', 'important');
      transcriptSection.style.setProperty('display', 'none', 'important');
      if (originalTitle) originalTitle.style.setProperty('display', 'none', 'important');
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
  setInterval(checkAndHook, 400);

})();
