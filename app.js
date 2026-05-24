// app.js (module)
const PROFILES_JSON = 'profiles.json';
const STORAGE_KEY = 'cn_profiles_v1';
const VIEWER_KEY = 'cn_viewer';
const grid = document.getElementById('profilesGrid');
const manageBtn = document.getElementById('manageBtn');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const profileForm = document.getElementById('profileForm');
const profileIdInput = document.getElementById('profileId');
const profileNameInput = document.getElementById('profileName');
const profileAvatarInput = document.getElementById('profileAvatar');
const addNewBtn = document.getElementById('addNew');
const deleteBtn = document.getElementById('deleteProfile');
const skipBtn = document.getElementById('skipBtn');

let profiles = [];

// Utility: generate id
const uid = (s='p') => s + Math.random().toString(36).slice(2,9);

// Load profiles: prefer localStorage, else fetch JSON
async function loadProfiles(){
  const local = localStorage.getItem(STORAGE_KEY);
  if(local){
    try { profiles = JSON.parse(local); renderProfiles(); return; } catch(e){}
  }
  try {
    const res = await fetch(PROFILES_JSON, {cache: 'no-store'});
    if(!res.ok) throw new Error('profiles.json not found');
    profiles = await res.json();
    // normalize ids if missing
    profiles = profiles.map(p => ({ id: p.id || uid('p'), name: p.name || 'Convidado', avatar: p.avatar || '' }));
    persist();
    renderProfiles();
  } catch (err) {
    console.error(err);
    // fallback minimal
    profiles = [{id:'guest',name:'Convidado',avatar:''}];
    renderProfiles();
  }
}

// Persist to localStorage
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); }

// Render grid
function renderProfiles(){
  grid.innerHTML = '';
  profiles.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'profile-card';
    btn.setAttribute('role','listitem');
    btn.setAttribute('data-id', p.id);
    btn.setAttribute('tabindex','0');
    btn.innerHTML = `
      <div class="avatar" aria-hidden="true">
        ${p.avatar ? `<img src="${p.avatar}" alt="${p.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ''}
        <span class="initial" aria-hidden="true">${!p.avatar ? p.name.charAt(0).toUpperCase() : ''}</span>
      </div>
      <div class="profile-name">${p.name}</div>
    `;
    // click selects
    btn.addEventListener('click', () => selectProfile(p.id));
    // keyboard support
    btn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectProfile(p.id); }
      if(e.key === 'ArrowLeft') focusNeighbor(i-1);
      if(e.key === 'ArrowRight') focusNeighbor(i+1);
    });
    // context menu: open edit modal
    btn.addEventListener('contextmenu', (e) => { e.preventDefault(); openModalFor(p.id); });
    // drag
    btn.draggable = true;
    btn.addEventListener('dragstart', dragStart);
    btn.addEventListener('dragover', dragOver);
    btn.addEventListener('drop', drop);
    btn.addEventListener('dragend', dragEnd);
    grid.appendChild(btn);

    // staggered animation
    requestAnimationFrame(() => setTimeout(()=>btn.classList.add('card-enter'), i * 90));
  });
}

// focus helper
function focusNeighbor(idx){
  const items = Array.from(grid.children);
  if(idx < 0) idx = items.length -1;
  if(idx >= items.length) idx = 0;
  items[idx]?.focus();
}

// selection
function selectProfile(id){
  const p = profiles.find(x=>x.id===id);
  if(!p) return;
  localStorage.setItem(VIEWER_KEY, p.name);
  // transition to player (simple)
  document.body.classList.add('selected');
  // here you can redirect or open player UI
  alert(`Perfil selecionado: ${p.name}`);
}

// Drag and drop handlers
let dragSrcId = null;
function dragStart(e){
  dragSrcId = this.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
}
function dragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('dragover');
}
function drop(e){
  e.preventDefault();
  const targetId = this.dataset.id;
  if(!dragSrcId || dragSrcId === targetId) return;
  const srcIdx = profiles.findIndex(p=>p.id===dragSrcId);
  const tgtIdx = profiles.findIndex(p=>p.id===targetId);
  const [moved] = profiles.splice(srcIdx,1);
  profiles.splice(tgtIdx,0,moved);
  persist();
  renderProfiles();
}
function dragEnd(){
  dragSrcId = null;
  document.querySelectorAll('.profile-card').forEach(el => el.classList.remove('dragging','dragover'));
}

// Modal management
manageBtn.addEventListener('click', () => openModalFor());
closeModal.addEventListener('click', closeModalFn);
modal.addEventListener('click', (e) => { if(e.target === modal) closeModalFn(); });

function openModalFor(id){
  modal.setAttribute('aria-hidden','false');
  modal.style.display = 'flex';
  profileForm.reset();
  profileIdInput.value = id || '';
  deleteBtn.style.display = id ? 'inline-block' : 'none';
  if(id){
    const p = profiles.find(x=>x.id===id);
    profileNameInput.value = p.name;
    profileAvatarInput.value = p.avatar;
  } else {
    profileNameInput.value = '';
    profileAvatarInput.value = '';
  }
  profileNameInput.focus();
}

function closeModalFn(){
  modal.setAttribute('aria-hidden','true');
  modal.style.display = 'none';
}

// Add new
addNewBtn.addEventListener('click', (e) => {
  e.preventDefault();
  profileIdInput.value = '';
  profileNameInput.value = '';
  profileAvatarInput.value = '';
  profileNameInput.focus();
});

// Delete
deleteBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const id = profileIdInput.value;
  if(!id) return;
  if(!confirm('Remover este perfil?')) return;
  profiles = profiles.filter(p => p.id !== id);
  persist();
  renderProfiles();
  closeModalFn();
});

// Save form
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = profileIdInput.value || uid('p');
  const name = profileNameInput.value.trim() || 'Convidado';
  const avatar = profileAvatarInput.value.trim();
  const existing = profiles.find(p=>p.id===id);
  if(existing){
    existing.name = name;
    existing.avatar = avatar;
  } else {
    profiles.push({id,name,avatar});
  }
  persist();
  renderProfiles();
  closeModalFn();
});

// Skip
skipBtn.addEventListener('click', () => {
  localStorage.removeItem(VIEWER_KEY);
  alert('Pulou seleção. Abrir player...');
});

// Register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(console.error);
}

// init
loadProfiles();
