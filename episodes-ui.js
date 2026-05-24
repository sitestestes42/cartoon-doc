// episodes-ui.js - Versão Blindada com Logs de Diagnóstico
(() => {
  console.log("[Cartoon Doc] Script episodes-ui.js foi carregado com sucesso!");

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
      if (!res.ok) throw new Error('Não encontrou o arquivo episodes.json na raiz');
      episodesData = await res.json();
      console.log("[Cartoon Doc] Episódios carregados do JSON:", episodesData.length);
      renderEpisodesList(episodesData);
    } catch (err) {
      console.error("[Cartoon Doc] Erro crítico ao buscar o JSON:", err);
    }
  };

  const injectDocumentaryUI = (playerSection) => {
    if (isDocUiInitialized || !playerSection) return;
    console.log("[Cartoon Doc] Iniciando a injeção da interface do Documentário...");

    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const backBtn = document.getElementById('backToProfilesBtn') || playerSection.querySelector('button');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2') || playerSection.querySelector('h1');

    if (!originalVideoWrapper || !backBtn) {
      console.warn("[Cartoon Doc] Elementos estruturais do player não foram encontrados para a injeção.");
      return;
    }

    // Criar abas
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

    // Criar painel da lista
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

    // Criar seção de transcrição
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

    // Inserir elementos no DOM usando nós vizinhos estáveis
    originalVideoWrapper.parentNode.insertBefore(transcriptSection, originalVideoWrapper.nextSibling);
    backBtn.insertAdjacentElement('afterend', tabsNav);
    tabsNav.insertAdjacentElement('afterend', docPanel);

    // Funções de alternância
    const showDocumentary = () => {
      tabDoc.classList.add('active');
      tabPlayer.classList.remove('active');
      docPanel.hidden = false;
      originalVideoWrapper.hidden = true;
      transcriptSection.hidden = true;
      if (originalTitle) originalTitle.style.display = 'none';
      
      const videoElem = originalVideoWrapper.querySelector('video');
      if (videoElem) videoElem.pause();
      
      renderEpisodesList(episodesData);
    };

    const showClassicPlayer = () => {
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
    console.log("[Cartoon Doc] Interface do Documentário injetada com sucesso!");
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
    console.log("[Cartoon Doc] Episódio selecionado:", ep.title);
    saveProgress(ep.id);
    
    const playerSection = document.getElementById('player');
    const originalVideoWrapper = playerSection.querySelector('.video-wrapper');
    const originalTitle = document.getElementById('playerTitle') || playerSection.querySelector('h2') || playerSection.querySelector('h1');
    const videoElem = originalVideoWrapper.querySelector('video');
    const transcriptSection = document.querySelector('.transcript-section');
    const transcriptText = document.getElementById('transcriptText');

    document.getElementById('documentaryPanel').hidden = true;
    originalVideoWrapper.hidden = false;
    transcriptSection.hidden = true; 
    
    if (originalTitle) {
      originalTitle.style.display = 'block';
      originalTitle.innerHTML = `Apresentando...`;
    }
    
    console.log("[Cartoon Doc] Iniciando reprodução da Intro de segurança...");
    videoElem.src = 'assets/intro.mp4'; 
    videoElem.play().catch(e => console.warn("Autoplay bloqueado na intro:", e));

    videoElem.onended = () => {
      console.log("[Cartoon Doc] Intro finalizada. Carregando conteúdo real do episódio.");
      if (originalTitle) {
        originalTitle.innerHTML = `Documentário: <span>${ep.title}</span>`;
      }
      
      transcriptSection.hidden = false;
      transcriptText.innerText = ep.transcript;
      transcriptText.classList.remove('visible'); 
      
      videoElem.src = ep.video;
      videoElem.play().catch(e => console.warn("Autoplay bloqueado no vídeo do episódio:", e));
      videoElem.onended = null; 
    };
  };

  // --- HOOK DE EXECUÇÃO ULTRA-SEGURO ---
  const checkAndHook = () => {
    const playerSection = document.getElementById('player');
    if (!playerSection) return;

    // Verifica se o player está visível no DOM (por atributo hidden, classe ou estilo computado)
    const isPlayerVisible = !playerSection.hasAttribute('hidden') && 
                            !playerSection.classList.contains('hidden') && 
                            window.getComputedStyle(playerSection).display !== 'none';

    if (isPlayerVisible && !isDocUiInitialized) {
      injectDocumentaryUI(playerSection);
    } else if (!isPlayerVisible && isDocUiInitialized) {
      // Se voltou pra tela de perfis, permite reinicializar depois
      isDocUiInitialized = false;
      const tabs = document.querySelector('.doc-tabs-nav');
      const panel = document.getElementById('documentaryPanel');
      const trans = document.querySelector('.transcript-section');
      if(tabs) tabs.remove();
      if(panel) panel.remove();
      if(trans) trans.remove();
      console.log("[Cartoon Doc] Usuário voltou aos perfis. Interface resetada.");
    }
  };

  // 1. Executa imediatamente e liga o observador de mutação genérico
  checkAndHook();
  const observer = new MutationObserver(checkAndHook);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });

  // 2. Fallback de contingência (Verifica a tela a cada 300ms caso o observer falhe)
  setInterval(checkAndHook, 300);

})();
