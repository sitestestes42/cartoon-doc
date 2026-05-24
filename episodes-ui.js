// episodes-ui.js - Versão com Interceptador de Evento Nativo (Anti-Reset)
(() => {
  console.log("[Cartoon Doc] Módulo carregado com interceptador de segurança.");

  let episodesData = [];
  let isDocUiInitialized = false;
  
  // Controle de estados do reprodutor
  let currentPlayingEpisode = null;
  let isPlayingIntro = false;
  let blockNativeEnded = false;

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

    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const backBtn = document.getElementById('backToProfilesBtn') || playerSection.querySelector('button');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper ? originalVideoWrapper.querySelector('video') : null;

    if (!originalVideoWrapper || !backBtn || !videoElem) return;

    // --- ENGENHARIA DE INTERCEPTAÇÃO DO EVENTO ENDED ---
    if (!videoElem.dataset.hooked) {
      videoElem.dataset.hooked = "true";
      
      // Captura o evento antes que ele se propague para o app.js original
      videoElem.addEventListener('ended', (e) => {
        if (blockNativeEnded) {
          e.stopImmediatePropagation(); // Cancela o evento para o app.js nativo
          e.preventDefault();
          console.log("[Cartoon Doc] Fim do vídeo interceptado com sucesso. Bloqueando reset do app.js.");
          handleVideoEnded();
        }
      }, { capture: true }); // O segredo está no true (fase de captura)
    }

    // Criar abas de navegação
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

    // Criar painel do documentário
    const docPanel = document.createElement('div');
    docPanel.id = 'documentaryPanel';
    docPanel.setAttribute('role', 'tabpanel');

    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.className = 'doc-search-bar';
    searchBar.placeholder = 'Buscar episódio ou transcrição...';
    
    const episodesList = document.createElement('div');
    episodesList.className = 'episodes-list';
    episodesList.setAttribute('role', 'list');

    docPanel.appendChild(searchBar);
    docPanel.appendChild(episodesList);

    // Criar container de transcrição
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

    // Injeção limpa no DOM
    originalVideoWrapper.parentNode.insertBefore(transcriptSection, originalVideoWrapper.nextSibling);
    backBtn.insertAdjacentElement('afterend', tabsNav);
    tabsNav.insertAdjacentElement('afterend', docPanel);

    const showDocumentary = () => {
      blockNativeEnded = false; 
      tabDoc.classList.add('active');
      tabPlayer.classList.remove('active');
      docPanel.hidden = false;
      originalVideoWrapper.hidden = true;
      transcriptSection.hidden = true;
      if (originalTitle) originalTitle.style.display = 'none';
      videoElem.pause();
      renderEpisodesList(episodesData);
    };

    const showClassicPlayer = () => {
      blockNativeEnded = false; 
      tabPlayer.classList.add('active');
      tabDoc.classList.remove('active');
      docPanel.hidden = true;
      originalVideoWrapper.hidden = false;
      if (originalTitle) originalTitle.style.display = 'block';
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

  // Executado ao clicar no card: Inicia a Intro (Vinheta)
  const playEpisode = (ep) => {
    currentPlayingEpisode = ep;
    isPlayingIntro = true;
    blockNativeEnded = true; // Ativa o escudo de interceptação

    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');

    document.getElementById('documentaryPanel').hidden = true;
    originalVideoWrapper.hidden = false;
    transcriptSection.hidden = true; 

    if (originalTitle) {
      originalTitle.style.display = 'block';
      originalTitle.innerHTML = `Apresentando...`;
    }

    // Toca a vinheta/intro primeiro
    videoElem.src = 'assets/intro.mp4';
    videoElem.play().catch(e => console.warn("Autoplay bloqueado na vinheta:", e));
  };

  // Gerenciador interno de fim de vídeo (Acionado após nossa interceptação)
  const handleVideoEnded = () => {
    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');
    const transcriptText = document.getElementById('transcriptText');

    if (isPlayingIntro && currentPlayingEpisode) {
      // 1. A INTRO TERMINOU -> Carrega o Episódio Escolhido
      isPlayingIntro = false;
      saveProgress(currentPlayingEpisode.id);

      if (originalTitle) {
        originalTitle.innerHTML = `Documentário: <span>${currentPlayingEpisode.title}</span>`;
      }

      transcriptSection.hidden = false;
      transcriptText.innerText = currentPlayingEpisode.transcript;
      transcriptText.classList.remove('visible'); 

      // Muda o source para o vídeo definitivo do episódio
      videoElem.src = currentPlayingEpisode.video;
      videoElem.play().catch(e => console.warn("Autoplay bloqueado no vídeo real:", e));
    } else {
      // 2. O EPISÓDIO REAL TERMINOU -> Volta para a lista de episódios sem fechar o player
      console.log("[Cartoon Doc] Fim do episódio completo. Retornando ao painel.");
      blockNativeEnded = false;
      currentPlayingEpisode = null;
      
      const tabDoc = document.querySelector('.doc-tab-btn');
      if (tabDoc) tabDoc.click(); // Força o retorno suave para a aba documentário
    }
  };

  // Monitoramento ativo e polivalente do estado da tela
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
      const tabs = document.querySelector('.doc-tabs-nav');
      const panel = document.getElementById('documentaryPanel');
      const trans = document.querySelector('.transcript-section');
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
