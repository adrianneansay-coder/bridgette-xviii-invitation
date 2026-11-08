(() => {
  'use strict';
  const c = window.INVITATION || {};
  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const opened = () => {
    if ($('intro').classList.contains('animating') || $('intro').classList.contains('opened')) return;
    $('intro').classList.add('animating');
    setTimeout(() => {
      $('intro').classList.add('opened');
      document.body.classList.remove('unopened');
      $('openEnvelope').setAttribute('aria-expanded','true');
    }, 1400);
  };
  $('openEnvelope').addEventListener('click', opened);
  $('openText').addEventListener('click', opened);
  const formatDate = (val, opts) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val || '')) return null;
    const [y,m,d] = val.split('-').map(Number);
    const date = new Date(y,m-1,d);
    if (date.getFullYear()!==y || date.getMonth()!==m-1 || date.getDate()!==d) return null;
    return date.toLocaleDateString('en-PH', opts || {month:'long',day:'numeric',year:'numeric'});
  };
  text('dateDisplay', formatDate(c.date, {weekday:'long',month:'long',day:'numeric',year:'numeric'}) || 'Date to be announced');
  text('timeDisplay', c.time || 'Time to be announced');
  text('venueDisplay', c.venue || 'Venue to be announced');
  text('addressDisplay', c.address || 'Location details coming soon');
  if (/^https:\/\//i.test(c.mapsUrl || '')) {
    const el = $('mapsButton'); el.href = c.mapsUrl; el.classList.remove('hidden');
  }
  text('dressType', c.dressCode || 'Semi-formal attire');
  text('dressNote', c.dressNote || 'Please dress elegantly and comfortably in pastel yellow, pastel pink, pastel blue, or pastel green.');
  const deadline = formatDate(c.rsvpDeadline);
  if (deadline) { $('rsvpDeadlineDisplay').classList.remove('hidden'); text('rsvpDeadlineDisplay', 'PLEASE RSVP BY ' + deadline.toUpperCase()); }
  if (/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/i.test(c.rsvpUrl || '')) {
    $('rsvpButton').href = c.rsvpUrl; $('rsvpButton').target='_self'; $('rsvpButton').removeAttribute('rel');
    text('rsvpHint','Find your name, view pre-approved companions, and confirm each person’s attendance.');
  } else {
    $('rsvpButton').href = '#rsvp'; text('rsvpHint','The RSVP link has not been configured yet.');
  }
  const traditionIds = [['roses','roses'],['candles','candles'],['treasures','treasures'],['gifts','gifts'],['blueBills','bluebills']];
  traditionIds.forEach(([key,id]) => {if (c[key] === false && $(id)) $(id).hidden = true; });
  if (formatDate(c.date)) {
    const [year,month,day] = c.date.split('-').map(Number);
    const m = String(c.time || '').match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    let hour = 0, minute = 0;
    if (m) {hour = Number(m[1]) % 12 + (m[3].toUpperCase()==='PM'?12:0);minute = Number(m[2]||0);}
    const target = new Date(`${c.date}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+08:00`); // Asia/Manila, same deadline for every visitor
    $('countdownWrap').hidden = false;
    if (!c.time) { $('countdownWrap').querySelector('.eyebrow').textContent='DAYS UNTIL THE CELEBRATION · START TIME TO BE ANNOUNCED'; ['hours','minutes','seconds'].forEach(id => $(id).parentElement.hidden=true); }
    const tick = () => {
      const ms = Math.max(0, target.getTime()-Date.now());
      const seconds = Math.floor(ms/1000);
      text('days',String(Math.floor(seconds/86400)).padStart(2,'0'));
      text('hours',String(Math.floor(seconds%86400/3600)).padStart(2,'0'));
      text('minutes',String(Math.floor(seconds%3600/60)).padStart(2,'0'));
      text('seconds',String(seconds%60).padStart(2,'0'));
    };
    tick();setInterval(tick,1000);
  }
  const gallery = $('galleryGrid'), images = Array.from({length:15}, (_,i)=>`images/photo-${String(i+1).padStart(2,'0')}.webp`);
  let current=0;
  const openLightbox = i => { current=i; $('lightboxImage').src=images[i];text('lightboxCount',`${i+1} / 15`);$('lightbox').classList.remove('hidden');document.body.style.overflow='hidden';};
  const closeLightbox=()=>{$('lightbox').classList.add('hidden');document.body.style.overflow='';};
  const move=(n)=>openLightbox((current+n+images.length)%images.length);
  images.forEach((src,i)=>{
    const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Open debut photo ${i+1}`);
    const img=document.createElement('img');img.src=src;img.loading='lazy';img.alt=`Bridgette Andrea debut photo ${i+1}`;
    b.append(img);b.addEventListener('click',()=>openLightbox(i));gallery.append(b);
  });
  $('closeLightbox').addEventListener('click',closeLightbox);
  $('prevPhoto').addEventListener('click',()=>move(-1));$('nextPhoto').addEventListener('click',()=>move(1));
  $('lightbox').addEventListener('click',e=>{if(e.target===$('lightbox'))closeLightbox();});
  document.addEventListener('keydown',e=>{if($('lightbox').classList.contains('hidden'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1);});
  let touchX=0;
  $('lightbox').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
  $('lightbox').addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>60)move(delta<0?1:-1);},{passive:true});
  // Click-to-open tradition lists, ordered 1 upward by original participant number.
  const traditionSets = Array.isArray(window.TRADITIONS) ? window.TRADITIONS : [];
  const grid = $('traditionGrid');
  const icons = ['✧','✿','✦','♡','❀','✧'];
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  let priorFocus = null;
  const modal = $('traditionModal');
  const openTradition = i => {
    const group = traditionSets[i]; if (!group) return;
    priorFocus = document.activeElement;
    text('traditionTitle',group.title);
    text('traditionTotal', group.entries.length + ' listed participants' + (group.entries.length!==18 ? ' · all submitted names included' : ''));
    const list = $('traditionNames'); list.replaceChildren();
    group.entries.forEach(({number,name}) => {
      const li = document.createElement('li');
      const num=document.createElement('span');num.className='participant-number';num.textContent=number+'.';
      const n=document.createElement('span');n.textContent=name;
      li.append(num,n);list.append(li);
    });
    modal.classList.remove('hidden');document.body.classList.add('modal-open');$('closeTradition').focus();
  };
  const closeTradition = () => {modal.classList.add('hidden');document.body.classList.remove('modal-open');if(priorFocus) priorFocus.focus();};
  $('closeTradition').addEventListener('click',closeTradition);
  modal.addEventListener('click',event=>{if(event.target===modal)closeTradition();});
  traditionSets.forEach((item,i)=>{
    const b=document.createElement('button');b.type='button';b.className='tradition reveal';
    b.innerHTML='<span class="tradition-order">'+String(i+1).padStart(2,'0')+'</span><div class="trad-icon">'+icons[i]+'</div>';
    const heading=document.createElement('h3');heading.textContent=item.title;
    const hint=document.createElement('p');hint.textContent='View names & roles';
    b.append(heading,hint);b.addEventListener('click',()=>openTradition(i));grid.append(b);
  });
  // Search across all six lists; show multiple roles for repeated names.
  const roleInput=$('roleName'), roleResults=$('roleResults');
  const names = new Map();
  traditionSets.forEach((set,i)=>set.entries.forEach(({number,name})=>{
    const key=norm(name);if(!names.has(key))names.set(key,{name,roles:[]});
    names.get(key).roles.push({title:set.title,number,index:i});
  }));
  const renderRoles=()=>{
    roleResults.replaceChildren();
    const q=norm(roleInput.value);if(q.length<2){return;}
    const matches=Array.from(names.values()).filter(x=>norm(x.name).includes(q)).slice(0,25);
    if(!matches.length){const p=document.createElement('p');p.className='no-role';p.textContent='No matching tradition participant found. This search only checks the six traditions, not the private RSVP guest list.';roleResults.append(p);return;}
    matches.forEach(person=>{
      const card=document.createElement('article');card.className='role-result';
      const title=document.createElement('strong');title.textContent=person.name;card.append(title);
      const ul=document.createElement('ul');
      person.roles.forEach(role=>{
        const li=document.createElement('li');const b=document.createElement('button');b.type='button';
        b.textContent=role.title+' · No. '+role.number+' ↗';b.addEventListener('click',()=>openTradition(role.index));
        li.append(b);ul.append(li);
      });
      card.append(ul);roleResults.append(card);
    });
  };
  roleInput.addEventListener('input',renderRoles);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))closeTradition();});
  // Make all editorial photos clickable in the same large viewer as the gallery.
  document.querySelectorAll('.event-photo img,.editorial-grid img,.memory-grid img,.garden-layout img,.attire-photo img,.photo-arch img,.feature-quote>img').forEach(img=>{
    const match=(img.getAttribute('src')||'').match(/photo-(\d+)\.webp/);
    if(!match)return;
    img.setAttribute('tabindex','0');img.setAttribute('role','button');img.setAttribute('aria-label','Enlarge photo, close with X');
    const launch=()=>openLightbox(Number(match[1])-1);
    img.addEventListener('click',launch);
    img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();launch();}});
  });
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}}),{threshold:.08});
    reveals.forEach(el=>io.observe(el));
  } else reveals.forEach(el=>el.classList.add('visible'));
})();
