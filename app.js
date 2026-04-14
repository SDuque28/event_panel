
/* ═══════════════════════════════════════════════════════════════
   DATOS SIMULADOS (simula llamada a API)
═══════════════════════════════════════════════════════════════ */
const EVENTOS_API = [
  { id:1,  titulo:"Hackathon Nacional 2025",              desc:"48h de programación continua con premios de hasta $5M COP. Equipos de 3-5 personas.",                categoria:"tech",     fecha:"2025-02-10", lugar:"Bogotá",       cupos:120  },
  { id:2,  titulo:"Festival de Jazz en el Parque",        desc:"Noche de jazz con artistas internacionales en un escenario al aire libre.",                          categoria:"musica",   fecha:"2025-02-14", lugar:"Medellín",     cupos:500  },
  { id:3,  titulo:"Expo Arte Latinoamericano",            desc:"Exhibición colectiva de artistas emergentes con piezas únicas en venta.",                            categoria:"arte",     fecha:"2025-02-20", lugar:"Manizales",    cupos:200  },
  { id:4,  titulo:"Maraton Ciudad Verde",                 desc:"Carrera de 10K, 21K y 42K por las calles principales. Premiación en efectivo.",                      categoria:"deporte",  fecha:"2025-02-08", lugar:"Cali",         cupos:1000 },
  { id:5,  titulo:"Foro de Startups & VC",                desc:"Conecta con inversores ángel y fondos de capital de riesgo para tu startup.",                        categoria:"negocios", fecha:"2025-02-22", lugar:"Bogotá",       cupos:80   },
  { id:6,  titulo:"Noche de Cine Clásico",                desc:"Proyección al aire libre de grandes clásicos del cine latinoamericano bajo las estrellas.",          categoria:"cultura",  fecha:"2025-02-12", lugar:"Pereira",      cupos:300  },
  { id:7,  titulo:"Workshop de Machine Learning",         desc:"Taller práctico: implementa tu primer modelo de clasificación con Python y scikit-learn.",           categoria:"tech",     fecha:"2025-02-18", lugar:"Medellín",     cupos:40   },
  { id:8,  titulo:"Cumbia Fest 2025",                     desc:"Celebra la cultura caribeña colombiana con 8 grupos en vivo y gastronomía regional.",                categoria:"musica",   fecha:"2025-02-09", lugar:"Barranquilla", cupos:800  },
  { id:9,  titulo:"Taller de Acuarela Botánica",          desc:"Aprende a pintar flora tropical colombiana con la técnica de acuarela húmedo sobre húmedo.",        categoria:"arte",     fecha:"2025-02-25", lugar:"Manizales",    cupos:25   },
  { id:10, titulo:"Copa Futsal Interuniversitaria",       desc:"Torneo de fútbol sala universitario. Inscripción por equipos de 8 jugadores.",                       categoria:"deporte",  fecha:"2025-02-15", lugar:"Armenia",      cupos:150  },
  { id:11, titulo:"Summit de Sostenibilidad Empresarial", desc:"Líderes corporativos debaten estrategias para reducir huella de carbono.",                           categoria:"negocios", fecha:"2025-03-01", lugar:"Bogotá",       cupos:60   },
  { id:12, titulo:"Semana del Libro Manizales",           desc:"Feria literaria con autores nacionales, lanzamientos y clubes de lectura.",                          categoria:"cultura",  fecha:"2025-02-28", lugar:"Manizales",    cupos:400  },
  { id:13, titulo:"DevFest Andino",                       desc:"Google Developer Group: charlas de Flutter, Firebase, AI y demos en vivo.",                          categoria:"tech",     fecha:"2025-02-19", lugar:"Pereira",      cupos:250  },
  { id:14, titulo:"Concierto Sinfónico Gratuito",         desc:"La Orquesta Filarmónica interpreta Beethoven y Mahler en el Teatro Los Fundadores.",                 categoria:"musica",   fecha:"2025-02-07", lugar:"Manizales",    cupos:600  },
  { id:15, titulo:"Galería Emergente — Fotografía",       desc:"Colectivo de 20 fotógrafos muestran su trabajo documental sobre el Eje Cafetero.",                   categoria:"arte",     fecha:"2025-02-26", lugar:"Manizales",    cupos:150  },
];

/* ═══════════════════════════════════════════════════════════════
   LÓGICA PROPIA: Sistema de score de relevancia
   Score = urgencia_tiempo(40%) + popularidad_cupos(30%) + boost_local(30%)
═══════════════════════════════════════════════════════════════ */
let userCity = null;

function calcularScore(ev) {
  const diasRestantes = Math.ceil((new Date(ev.fecha) - new Date()) / (1000*60*60*24));

  let urgScore = 0;
  if      (diasRestantes <= 0)  urgScore = 0;
  else if (diasRestantes <= 3)  urgScore = 40;
  else if (diasRestantes <= 7)  urgScore = 30;
  else if (diasRestantes <= 14) urgScore = 20;
  else                          urgScore = 10;

  const cupoScore  = ev.cupos <= 30 ? 30 : ev.cupos <= 100 ? 20 : ev.cupos <= 300 ? 12 : 5;
  const localScore = (userCity && ev.lugar.toLowerCase().includes(userCity.toLowerCase())) ? 30 : 5;

  return urgScore + cupoScore + localScore;
}

function getUrgencia(ev) {
  const dias = Math.ceil((new Date(ev.fecha) - new Date()) / (1000*60*60*24));
  if (dias <= 0) return { label: "Pasado",      cls: "time-normal"  };
  if (dias <= 3) return { label: `${dias}d`, cls: "time-urgente" };
  if (dias <= 7) return { label: `${dias}d`,    cls: "time-pronto"  };
  return           { label: `${dias}d`,          cls: "time-normal"  };
}

/* ═══════════════════════════════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════════════════════════════ */
let interesados  = JSON.parse(localStorage.getItem('eventRadar_interesados') || '[]');
let filtroActivo = 'todos';
let sortActivo   = 'score';
let dragId       = null;

/* ═══════════════════════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════════════════════ */
function eventosDisponibles() {
  return EVENTOS_API.filter(e => !interesados.includes(e.id));
}

function filtrarEventos(arr) {
  return filtroActivo === 'todos' ? arr : arr.filter(e => e.categoria === filtroActivo);
}

function sortEventos(arr) {
  const scored = arr.map(e => ({ ...e, score: calcularScore(e) }));
  if (sortActivo === 'score')  return scored.sort((a,b) => b.score - a.score);
  if (sortActivo === 'fecha')  return scored.sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  if (sortActivo === 'nombre') return scored.sort((a,b) => a.titulo.localeCompare(b.titulo));
  return scored;
}

function renderCard(ev, enInteresa = false) {
  const score = calcularScore(ev);
  const urg   = getUrgencia(ev);
  const div   = document.createElement('div');
  div.className  = `event-card cat-${ev.categoria}`;
  div.draggable  = true;
  div.dataset.id = ev.id;

  const fecha = new Date(ev.fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'short' });

  div.innerHTML = `
    <div class="card-drag-hint">☰ arrastrar</div>
    <div class="card-top">
      <span class="card-category">${ev.categoria}</span>
      <span class="card-score">Score: <span>${score}</span></span>
    </div>
    <div class="card-title">${ev.titulo}</div>
    <div class="card-desc">${ev.desc}</div>
    <div class="card-footer">
      <span>📍 ${ev.lugar} · ${fecha}</span>
      <span class="time-badge ${urg.cls}">${urg.label}</span>
      ${enInteresa ? `<button class="btn-remove" title="Quitar" onclick="quitarInteres(${ev.id})">✕</button>` : ''}
    </div>
  `;

  div.addEventListener('dragstart', e => {
    dragId = ev.id;
    setTimeout(() => div.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });
  div.addEventListener('dragend', () => {
    div.classList.remove('dragging');
    dragId = null;
  });

  return div;
}

function render() {
  const zEvt = document.getElementById('zone-eventos');
  const zInt = document.getElementById('zone-interesa');
  zEvt.innerHTML = '';
  zInt.innerHTML = '';

  const disp = sortEventos(filtrarEventos(eventosDisponibles()));
  if (!disp.length) {
    zEvt.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><span>Todos los eventos fueron guardados</span></div>`;
  } else {
    disp.forEach(e => zEvt.appendChild(renderCard(e, false)));
  }

  const intData = EVENTOS_API.filter(e => interesados.includes(e.id));
  if (!intData.length) {
    zInt.innerHTML = `<div class="empty-state"><span>Arrastra eventos que te interesen</span></div>`;
  } else {
    intData.forEach(e => zInt.appendChild(renderCard(e, true)));
  }

  document.getElementById('badge-eventos').textContent  = disp.length;
  document.getElementById('badge-interesa').textContent = intData.length;
  document.getElementById('stat-total').textContent     = EVENTOS_API.length;
  document.getElementById('stat-int').textContent       = interesados.length;

  const urgentes = EVENTOS_API.filter(e => {
    const d = Math.ceil((new Date(e.fecha) - new Date()) / 86400000);
    return d > 0 && d <= 3;
  });
  document.getElementById('stat-urg').textContent = urgentes.length;

  const cats = {};
  intData.forEach(e => { cats[e.categoria] = (cats[e.categoria] || 0) + 1; });
  const topCat = Object.entries(cats).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('stat-top').textContent = topCat ? topCat[0] : '—';

  drawCanvas();
}

/* ═══════════════════════════════════════════════════════════════
   DRAG & DROP
═══════════════════════════════════════════════════════════════ */
function setupDrop(zone, onDrop) {
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
  });
  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (dragId !== null) onDrop(dragId);
  });
}

setupDrop(document.getElementById('zone-interesa'), id => {
  if (!interesados.includes(id)) {
    interesados.push(id);
    guardar();
    render();
    const ev = EVENTOS_API.find(e => e.id === id);
    showToast(`"${ev.titulo}" guardado en Me interesa`);
  }
});

setupDrop(document.getElementById('zone-eventos'), id => {
  interesados = interesados.filter(x => x !== id);
  guardar();
  render();
  const ev = EVENTOS_API.find(e => e.id === id);
  showToast(`↩ "${ev.titulo}" devuelto a eventos`);
});

function quitarInteres(id) {
  interesados = interesados.filter(x => x !== id);
  guardar();
  render();
}

/* ═══════════════════════════════════════════════════════════════
   CANVAS — Radar de categorías de interesados
═══════════════════════════════════════════════════════════════ */
function drawCanvas() {
  const canvas = document.getElementById('radar-canvas');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#080c14';
  ctx.roundRect(0, 0, W, H, 8);
  ctx.fill();

  const intData = EVENTOS_API.filter(e => interesados.includes(e.id));
  const cats    = {};
  intData.forEach(e => cats[e.categoria] = (cats[e.categoria] || 0) + 1);
  const entries = Object.entries(cats);

  if (!entries.length) {
    ctx.fillStyle = '#334155';
    ctx.font      = '12px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos aún', W/2, H/2 - 8);
    ctx.fillStyle = '#1e293b';
    ctx.font      = '10px Space Mono, monospace';
    ctx.fillText('Agrega eventos a Me interesa', W/2, H/2 + 12);
    return;
  }

  const COLORS = {
    tech:'#3b82f6', musica:'#f43f5e', arte:'#fb923c',
    deporte:'#10b981', negocios:'#facc15', cultura:'#a78bfa'
  };

  const total  = entries.reduce((s, [,v]) => s + v, 0);
  const maxVal = Math.max(...entries.map(([,v]) => v));
  const barH = 24, gap = 10, padL = 70, padR = 46, padT = 16;
  const maxW = W - padL - padR;

  entries.sort((a,b) => b[1]-a[1]).forEach(([cat, val], i) => {
    const y     = padT + i * (barH + gap);
    const bw    = (val / maxVal) * maxW;
    const color = COLORS[cat] || '#64748b';

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(padL, y, maxW, barH, 4); ctx.fill();

    const grad = ctx.createLinearGradient(padL, 0, padL + bw, 0);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(1, color);
    ctx.fillStyle   = grad;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8;
    ctx.beginPath(); ctx.roundRect(padL, y, bw, barH, 4); ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.fillStyle = '#94a3b8';
    ctx.font      = '10px Syne, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(cat, padL - 6, y + barH/2 + 4);

    ctx.fillStyle = '#e2e8f0';
    ctx.font      = 'bold 11px Space Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(val, padL + bw + 6, y + barH/2 + 4);

    ctx.fillStyle = '#475569';
    ctx.font      = '9px Space Mono, monospace';
    ctx.fillText(`${Math.round(val/total*100)}%`, padL + bw + 6, y + barH/2 + 15);
  });

  ctx.fillStyle = '#f97316';
  ctx.font      = 'bold 13px Space Mono, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Total: ${total}`, W - 10, H - 10);
}

/* ═══════════════════════════════════════════════════════════════
   FILTROS
═══════════════════════════════════════════════════════════════ */
function buildFilters() {
  const cats = ['todos', ...new Set(EVENTOS_API.map(e => e.categoria))];
  const cont = document.getElementById('filter-tags');
  cats.forEach(cat => {
    const btn       = document.createElement('button');
    btn.className   = 'filter-tag' + (cat === 'todos' ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      filtroActivo = cat;
      document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
    cont.appendChild(btn);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SORT
═══════════════════════════════════════════════════════════════ */
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sortActivo = btn.dataset.sort;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

/* ═══════════════════════════════════════════════════════════════
   GEOLOCALIZACIÓN
═══════════════════════════════════════════════════════════════ */
function obtenerUbicacion() {
  if (!navigator.geolocation) {
    document.getElementById('loc-text').textContent = 'Geolocalización no disponible';
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    document.getElementById('loc-dot').classList.add('active');
    document.getElementById('loc-text').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const r    = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const d    = await r.json();
      const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
      const country = d.address?.country_code?.toUpperCase() || '';
      if (city) {
        userCity = city;
        document.getElementById('loc-text').textContent = `${city}, ${country} · ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
        render();
        showToast(`📍 Boost local activo para eventos en ${city}`);
      }
    } catch { /* sin conexión: sigue con coords */ }
  }, () => {
    document.getElementById('loc-text').textContent = 'Permiso de ubicación denegado';
    showToast('⚠ Ubicación no disponible — score sin boost local');
  });
}

/* ═══════════════════════════════════════════════════════════════
   ACCIONES
═══════════════════════════════════════════════════════════════ */
function recargarEventos() {
  showToast('Eventos recargados desde fuente simulada');
  render();
}

function limpiarInteresados() {
  if (!interesados.length) { showToast('Ya está vacío'); return; }
  interesados = [];
  guardar();
  render();
  showToast('Lista "Me interesa" limpiada');
}

function guardar() {
  localStorage.setItem('eventRadar_interesados', JSON.stringify(interesados));
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
let toastTimeout;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
buildFilters();
render();
obtenerUbicacion();