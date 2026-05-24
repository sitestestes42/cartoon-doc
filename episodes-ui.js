(function(){
  const EPISODES_JSON = 'episodes.json';
  const PLAYER_SELECTOR = '#player';

  async function loadEpisodes(){
    const res = await fetch(EPISODES_JSON,{cache:'no-store'});
    return res.ok ? res.json() : [];
  }

  async function initEpisodesUI(){
    const playerEl = document.querySelector(PLAYER_SELECTOR);
    if(!playerEl) return;

    const episodes = await loadEpisodes();
    const panel = document.createElement('div');
    panel.className = 'episodes-panel';

    const list = document.createElement('div');
    list.className = 'episodes-list';

    const player = document.createElement('div');
    player.className = 'episodes-player';
    player.innerHTML = `
      <div id="epNowTitle">Selecione um episódio</div>
      <video id="epVideo" controls style="display:none"></video>
      <div id="epTranscript" class="transcript-panel" style="display:none"></div>
    `;

    episodes.forEach(ep=>{
      const item = document.createElement('div');
      item.className = 'episode-item';
      item.innerHTML = `
        <div class="ep-thumb">${ep.thumbnail?`<img src="${ep.thumbnail}" alt="${ep.title}">`:ep.title.charAt(0)}</div>
        <div class="ep-meta">
          <div class="ep-title">${ep.title}</div>
          <div class="ep-summary">${ep.summary}</div>
        </div>
      `;
      item.addEventListener('click',()=>{
        document.getElementById('epNowTitle').textContent = ep.title;
        const video = document.getElementById('epVideo');
        video.src = ep.video;
        video.style.display='block';
        video.play();
        const transcript = document.getElementById('epTranscript');
        transcript.textContent = ep.transcript;
        transcript.style.display='block';
      });
      list.appendChild(item);
    });

    panel.appendChild(list);
    panel.appendChild(player);
    playerEl.appendChild(panel);
  }

  document.addEventListener('DOMContentLoaded',initEpisodesUI);
})();
