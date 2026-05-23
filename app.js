// App: navegação, áudio, transcrição e animações
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const profiles = document.getElementById('profiles');
  const enterProfiles = document.getElementById('enterProfiles');
  const skipProfiles = document.getElementById('skipProfiles');
  const profileCards = document.querySelectorAll('.profile-card');
  const player = document.getElementById('player');
  const chapters = document.getElementById('chapters');
  const audio = document.getElementById('bgAudio');
  const toggleAudio = document.getElementById('toggleAudio');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progress = document.getElementById('progress');
  const transcriptModal = document.getElementById('transcriptModal');
  const openTranscript = document.getElementById('openTranscript');
  const closeTranscript = document.getElementById('closeTranscript');
  const transcriptBody = document.getElementById('transcriptBody');
  const downloadTranscript = document.getElementById('downloadTranscript');

  // Simple animated intro (title reveal)
  setTimeout(() => {
    document.querySelector('.splash-title').classList.add('reveal');
  }, 600);

  enterProfiles.addEventListener('click', () => {
    splash.classList.remove('active');
    splash.setAttribute('aria-hidden','true');
    profiles.classList.add('active');
    profiles.setAttribute('aria-hidden','false');
  });

  skipProfiles.addEventListener('click', () => {
    openPlayer();
  });

  profileCards.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const name = e.currentTarget.dataset.profile || 'Convidado';
      // você pode salvar o perfil no localStorage se quiser
      localStorage.setItem('viewer', name);
      openPlayer();
    });
  });

  function openPlayer(){
    profiles.classList.remove('active');
    profiles.setAttribute('aria-hidden','true');
    player.classList.remove('hidden');
    player.focus();
    // tenta tocar áudio (muitos navegadores exigem interação)
    audio.muted = true;
    audio.play().catch(()=>{ /* autoplay bloqueado */ });
  }

  // Navegação por capítulos
  const chapterEls = document.querySelectorAll('.chapter');
  let current = 0;
  function goTo(index){
    index = Math.max(0, Math.min(chapterEls.length - 1, index));
    current = index;
    chapterEls[index].scrollIntoView({behavior:'smooth', block:'start'});
    updateProgress();
    // animação de título (simples)
    chapterEls[index].querySelector('.chapter-title')?.classList.add('pop');
    setTimeout(()=> {
      chapterEls[index].querySelector('.chapter-title')?.classList.remove('pop');
    }, 900);
  }
  function updateProgress(){
    const pct = ((current+1)/chapterEls.length) * 100;
    progress.style.width = pct + '%';
  }
  prevBtn.addEventListener('click', ()=> goTo(current-1));
  nextBtn.addEventListener('click', ()=> goTo(current+1));

  // Scroll listener para atualizar índice atual
  let ticking = false;
  chapters.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const top = chapters.scrollTop;
        const h = window.innerHeight;
        const idx = Math.round(top / h);
        current = idx;
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (player.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') goTo(current+1);
    if (e.key === 'ArrowLeft') goTo(current-1);
    if (e.key === 'm') toggleAudioFn();
    if (e.key === 't') toggleTranscript();
  });

  // Áudio toggle
  function toggleAudioFn(){
    if (audio.paused){
      audio.muted = false;
      audio.play().catch(()=>{});
      toggleAudio.setAttribute('aria-pressed','true');
      toggleAudio.textContent = '🔊';
    } else {
      audio.muted = !audio.muted;
      toggleAudio.setAttribute('aria-pressed', String(!audio.muted));
      toggleAudio.textContent = audio.muted ? '🔈' : '🔊';
    }
  }
  toggleAudio.addEventListener('click', toggleAudioFn);

  // Transcrição (exemplo simples: texto estático por capítulo)
  const transcripts = [
    `Capítulo 1 - Declínio Avançado\n\nDe 1998 a 2014, o Cartoon Network dominava...`,
    `Capítulo 2 - Absorção Corporativa\n\nNo setor digital, a Cartoon Network deixou de existir...`,
    `Capítulo 3 - Erosão de Identidade\n\nProduções como Adventure Time...`,
    `Capítulo 4 - 2016–2018\n\nO início do declínio estrutural ocorreu...`,
    `Capítulo 5 - 2022\n\nO ponto de ruptura foi 2022...`
  ];

  openTranscript.addEventListener('click', toggleTranscript);
  closeTranscript?.addEventListener('click', toggleTranscript);

  function toggleTranscript(){
    const visible = transcriptModal.getAttribute('aria-hidden') === 'false';
    transcriptModal.setAttribute('aria-hidden', String(visible));
    transcriptModal.style.display = visible ? 'none' : 'flex';
    if (!visible){
      transcriptBody.textContent = transcripts[current] || 'Sem transcrição';
      transcriptModal.setAttribute('aria-hidden','false');
    } else {
      transcriptModal.setAttribute('aria-hidden','true');
    }
  }

  downloadTranscript.addEventListener('click', () => {
    const text = transcripts[current] || '';
    const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao_capitulo_${current+1}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Inicializa progresso
  updateProgress();
});
