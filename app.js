const introWrap = document.getElementById('introWrap');
const introVideo = document.getElementById('introVideo');
const skipIntro = document.getElementById('skipIntro');
const profilesSection = document.getElementById('profiles');
const grid = document.getElementById('profilesGrid');
const skipProfiles = document.getElementById('skipProfiles');
const player = document.getElementById('player');

let profiles = [];

// Mostrar perfis após intro
function showProfiles(){
  introWrap.style.display = 'none';
  profilesSection.style.display = 'block';
  loadProfiles();
}

// Intro
if(introVideo){
  introVideo.play().then(()=>{
    introVideo.addEventListener('ended', showProfiles, {once:true});
  }).catch(()=>{
    // autoplay bloqueado
    const playBtn = document.createElement('button');
    playBtn.className = 'btn primary';
    playBtn.textContent = 'Iniciar intro';
    playBtn.onclick = ()=>{ introVideo.play(); playBtn.remove(); introVideo.addEventListener('ended', showProfiles,{once:true}); };
    introWrap.appendChild(playBtn);
  });
}
skipIntro?.addEventListener('click', ()=>{ introVideo.pause(); showProfiles(); });

// Carregar perfis
async function loadProfiles(){
  try{
    const res = await fetch('profiles.json',{cache:'no-store'});
    profiles = await res.json();
    renderProfiles();
  }catch(e){
    console.error(e);
    profiles=[{id:'guest',name:'Convidado',avatar:''}];
    renderProfiles();
  }
}

function renderProfiles(){
  grid.innerHTML='';
  profiles.forEach(p=>{
    const btn=document.createElement('button');
    btn.className='profile-card';
    btn.dataset.id=p.id;
    btn.innerHTML=`
      <div class="avatar">${p.avatar?`<img src="${p.avatar}" alt="${p.name}">`:p.name.charAt(0)}</div>
      <div class="profile-name">${p.name}</div>
    `;
    grid.appendChild(btn);
  });
}

// Delegation para clique
grid.addEventListener('click',(e)=>{
  const card=e.target.closest('.profile-card');
  if(!card) return;
  selectProfile(card.dataset.id);
});

function selectProfile(id){
  const p=profiles.find(x=>x.id===id);
  if(!p) return;
  localStorage.setItem('viewer',p.name);
  profilesSection.style.display='none';
  player.classList.remove('hidden');
  player.setAttribute('aria-hidden','false');
  player.focus();
}

// Pular perfis
skipProfiles?.addEventListener('click',()=>{
  profilesSection.style.display='none';
  player.classList.remove('hidden');
});
