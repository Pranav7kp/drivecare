/* ============================================================
   DriveCare — Complete Application Logic
   ============================================================ */

// ─── CONFIG ──────────────────────────────────────────────────
const ADMIN_ID   = "admindrivecare";
const ADMIN_PASS = "drivecare@123";

const SERVICE_PRICES = {
  "Car Wash":       { base: 299, hatch: 299, sedan: 399, suv: 599, luxury: 899, bike: 149, truck: 799 },
  "Interior Cleaning": { base: 499, hatch: 499, sedan: 699, suv: 999, luxury: 1499, bike: 249, truck: 1199 },
  "Detailing":      { base: 1499, hatch: 1499, sedan: 1999, suv: 2999, luxury: 4999, bike: 799, truck: 3999 },
  "Oil Change":     { base: 799, hatch: 799, sedan: 999, suv: 1299, luxury: 1999, bike: 399, truck: 1599 },
  "Battery Service":{ base: 399, hatch: 399, sedan: 499, suv: 699, luxury: 1299, bike: 299, truck: 799 },
  "Paint Work":     { base: 2999, hatch: 2999, sedan: 4999, suv: 7999, luxury: 14999, bike: 1999, truck: 9999 },
  "General Repair": { base: 599, hatch: 599, sedan: 799, suv: 1199, luxury: 2499, bike: 399, truck: 1499 },
  "Spare Parts":    { base: 199, hatch: 199, sedan: 299, suv: 499, luxury: 999, bike: 149, truck: 699 },
  "Towing Service": { base: 999, hatch: 999, sedan: 1199, suv: 1499, luxury: 2499, bike: 599, truck: 1999 },
};

const STATUSES = ["Pending", "Confirmed", "En Route", "In Progress", "Completed"];
const STATUS_COLORS = {
  "Pending":     "#fef3c7|#d97706",
  "Confirmed":   "#dbeafe|#1d4ed8",
  "En Route":    "#ede9fe|#7c3aed",
  "In Progress": "#d1fae5|#059669",
  "Completed":   "#f3f4f6|#374151",
};

// Tracking steps for live progress
const TRACK_STEPS = [
  { label: "Booking Confirmed",  desc: "Your booking has been received",         icon: "✅" },
  { label: "Mechanic Assigned",  desc: "A certified mechanic is assigned",        icon: "👨‍🔧" },
  { label: "En Route to You",    desc: "Mechanic is on the way to your location", icon: "🏍" },
  { label: "Service In Progress",desc: "Work is currently underway",              icon: "🔧" },
  { label: "Job Completed",      desc: "Service complete — enjoy the ride!",      icon: "🎉" },
];

// ─── UTILS ───────────────────────────────────────────────────
function getUsers()    { return JSON.parse(localStorage.getItem('dc_users') || '[]'); }
function saveUsers(u)  { localStorage.setItem('dc_users', JSON.stringify(u)); }
function getBookings() { return JSON.parse(localStorage.getItem('dc_bookings') || '[]'); }
function saveBookings(b){ localStorage.setItem('dc_bookings', JSON.stringify(b)); }
function getSession()  { return JSON.parse(sessionStorage.getItem('dc_session')); }

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.className = 'toast', 2800);
}

function togglePass(id, btn) {
  const el = document.getElementById(id);
  if (el.type === 'password') { el.type = 'text'; btn.textContent = '🙈'; }
  else                        { el.type = 'password'; btn.textContent = '👁'; }
}

function setMinDate() {
  const el = document.getElementById('bookDate');
  if (el) {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    el.min = today.toISOString().split('T')[0];
    el.value = today.toISOString().split('T')[0];
  }
}

// ─── AUTH ─────────────────────────────────────────────────────
function login() {
  const phone = document.getElementById('loginPhone').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');

  if (!phone || !pass) { showErr(errEl, 'Please fill in all fields'); return; }

  // Admin check
  if (phone === ADMIN_ID && pass === ADMIN_PASS) {
    sessionStorage.setItem('dc_session', JSON.stringify({ name: 'Admin', role: 'admin' }));
    window.location.href = 'admin.html';
    return;
  }

  const users = getUsers();
  const user  = users.find(u => u.phone === phone && u.password === btoa(pass));
  if (user) {
    sessionStorage.setItem('dc_session', JSON.stringify({ ...user, role: 'user' }));
    // Redirect back if there was a pending service
    const pending = sessionStorage.getItem('pendingService');
    if (pending) {
      window.location.href = 'index.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } else {
    showErr(errEl, 'Invalid phone number or password');
  }
}

function signup() {
  const name  = document.getElementById('fname').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const pass  = document.getElementById('pass').value;
  const errEl = document.getElementById('signupError');

  if (!name)            { showErr(errEl, 'Please enter your full name'); return; }
  if (!/^\d{10}$/.test(phone)) { showErr(errEl, 'Enter a valid 10-digit phone number'); return; }
  if (pass.length < 6)  { showErr(errEl, 'Password must be at least 6 characters'); return; }

  const users = getUsers();
  if (users.find(u => u.phone === phone)) { showErr(errEl, 'Phone number already registered'); return; }

  const newUser = { name, phone, password: btoa(pass), joined: new Date().toISOString() };
  users.push(newUser);
  saveUsers(users);

  sessionStorage.setItem('dc_session', JSON.stringify({ ...newUser, role: 'user' }));
  showToast('Account created! Welcome to DriveCare 🎉', 'success');
  setTimeout(() => window.location.href = 'index.html', 800);
}

function logout() {
  sessionStorage.removeItem('dc_session');
  sessionStorage.removeItem('pendingService');
  window.location.href = 'index.html';
}

function showErr(el, msg) {
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3500);
}

// ─── BOOKING MODAL ────────────────────────────────────────────
let currentService = '';
let currentPriceRange = '';
let currentStep = 1;

function openBooking(serviceName, priceRange) {
  const session = getSession();
  if (!session) {
    sessionStorage.setItem('pendingService', JSON.stringify({ serviceName, priceRange }));
    showToast('Please login to book a service', 'error');
    setTimeout(() => window.location.href = 'login.html', 1200);
    return;
  }

  currentService = serviceName;
  currentPriceRange = priceRange;
  currentStep = 1;

  document.getElementById('modalTitle').textContent = '📋 Book ' + serviceName;
  showStep(1);
  updateEstimate();
  setMinDate();

  // Check for pending service from login redirect
  sessionStorage.removeItem('pendingService');

  const overlay = document.getElementById('bookingModal');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('bookingModal')) closeModal();
}

function showStep(n) {
  currentStep = n;
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('step' + i);
    if (el) el.style.display = i === n ? 'block' : 'none';
    const s = document.getElementById('s' + i);
    if (s) s.className = 'step' + (i < n ? ' done' : i === n ? ' active' : '');
  });
}

function goStep(n) {
  if (n === 2) {
    // Validate step 1
    const loc = (document.getElementById('bookLocation')?.value || '').trim();
    const vn  = (document.getElementById('vehicleNum')?.value || '').trim();
    const vt  = document.getElementById('vehicleType')?.value;
    if (!loc) { showToast('Please enter your service location', 'error'); return; }
    if (!vn)  { showToast('Please enter your vehicle number', 'error'); return; }
    if (!vt)  { showToast('Please select vehicle type', 'error'); return; }
    updateEstimate();
  }
  if (n === 3) {
    // Validate step 2
    const date = document.getElementById('bookDate')?.value;
    const time = document.getElementById('bookTime')?.value;
    if (!date) { showToast('Please select a date', 'error'); return; }
    if (!time) { showToast('Please select a time slot', 'error'); return; }
    fillConfirmation();
  }
  showStep(n);
}

function updateEstimate() {
  const vt  = document.getElementById('vehicleType')?.value || '';
  const prices = SERVICE_PRICES[currentService] || {};
  const price = prices[vt] || prices['base'] || 0;

  const display = document.getElementById('estimateDisplay');
  if (display) {
    display.textContent = price ? '₹' + price.toLocaleString() : 'Select vehicle type';
  }
  const note = document.getElementById('estimateNote');
  if (note) {
    note.textContent = price
      ? 'Estimated for your ' + (vt || 'vehicle') + '. Final price after inspection.'
      : 'Price varies by vehicle type';
  }
}

function fillConfirmation() {
  const vn    = document.getElementById('vehicleNum')?.value || '';
  const vb    = document.getElementById('vehicleBrand')?.value || '';
  const vm    = document.getElementById('vehicleModel')?.value || '';
  const vt    = document.getElementById('vehicleType')?.value || '';
  const loc   = document.getElementById('bookLocation')?.value || '';
  const date  = document.getElementById('bookDate')?.value || '';
  const time  = document.getElementById('bookTime')?.value || '';
  const prices = SERVICE_PRICES[currentService] || {};
  const price = prices[vt] || prices['base'] || 0;

  const vehicleStr = [vn, vb, vm].filter(Boolean).join(' · ') || 'Not specified';
  const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' }) : '';

  document.getElementById('confirmService').textContent  = currentService;
  document.getElementById('confirmVehicle').textContent  = vehicleStr;
  document.getElementById('confirmLocation').textContent = loc || 'Not specified';
  document.getElementById('confirmDateTime').textContent = dateStr + (time ? ', ' + time : '');
  document.getElementById('confirmTotal').textContent    = price ? '₹' + price.toLocaleString() : 'To be quoted';
}

function confirmBooking() {
  const session = getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const vt    = document.getElementById('vehicleType')?.value || '';
  const prices = SERVICE_PRICES[currentService] || {};
  const price  = prices[vt] || prices['base'] || 0;

  const booking = {
    id:          'DC' + Date.now(),
    userId:      session.phone,
    userName:    session.name,
    service:     currentService,
    location:    document.getElementById('bookLocation')?.value || '',
    vehicleNum:  document.getElementById('vehicleNum')?.value || '',
    vehicleType: vt,
    vehicleBrand:document.getElementById('vehicleBrand')?.value || '',
    vehicleModel:document.getElementById('vehicleModel')?.value || '',
    date:        document.getElementById('bookDate')?.value || '',
    time:        document.getElementById('bookTime')?.value || '',
    notes:       document.getElementById('bookNotes')?.value || '',
    estimate:    price,
    status:      'Pending',
    trackStep:   0, // 0=Confirmed,1=Assigned,2=EnRoute,3=InProgress,4=Done
    created:     new Date().toISOString(),
  };

  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);

  closeModal();
  showToast('✅ Booking confirmed! ID: ' + booking.id, 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1500);
}

// ─── GPS ─────────────────────────────────────────────────────
function useGPS() {
  if (!navigator.geolocation) { showToast('GPS not available on this device', 'error'); return; }

  const mapPrev = document.getElementById('mapPreview');
  if (mapPrev) {
    mapPrev.innerHTML = '<div style="text-align:center;"><div style="font-size:24px; animation:spin 1s linear infinite; display:inline-block;">⚙️</div><p style="font-size:13px;color:#3b82f6;margin-top:8px;">Detecting location...</p></div>';
    mapPrev.style.cssText += '; animation: none;';
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(5);
      const lng = pos.coords.longitude.toFixed(5);
      const locStr = `Lat ${lat}, Lng ${lng} (GPS Detected)`;
      const inp = document.getElementById('bookLocation');
      if (inp) inp.value = locStr;

      if (mapPrev) {
        mapPrev.innerHTML = `
          <div style="text-align:center;">
            <div style="font-size:32px;">📍</div>
            <p style="font-size:13px;color:#059669;font-weight:700;margin-top:8px;">Location Detected!</p>
            <p style="font-size:11px;color:#6b7280;">${lat}, ${lng}</p>
          </div>`;
        mapPrev.style.background = '#d1fae5';
        mapPrev.style.borderColor = '#6ee7b7';
      }
      showToast('📍 Location detected!', 'success');
    },
    () => {
      showToast('Could not get location. Please enter manually.', 'error');
      if (mapPrev) {
        mapPrev.innerHTML = '<div style="text-align:center;"><div class="map-pin-anim" style="font-size:32px;">📍</div><p style="font-size:13px;color:#3b82f6;">Tap to detect location</p></div>';
      }
    }
  );
}

function focusSearch() { document.getElementById('serviceSearch')?.focus(); }

function filterServices(query) {
  const cards = document.querySelectorAll('.service-card');
  const q = query.toLowerCase();
  cards.forEach(card => {
    const name = card.dataset.service?.toLowerCase() || '';
    card.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
}

// ─── DASHBOARD ────────────────────────────────────────────────
function loadDashboard() {
  const session = getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  document.getElementById('dashName').textContent  = session.name;
  document.getElementById('navUserName').textContent = session.name;

  const all       = getBookings().filter(b => b.userId === session.phone);
  const active    = all.filter(b => b.status !== 'Completed');
  const completed = all.filter(b => b.status === 'Completed');

  document.getElementById('totalBookings').textContent     = all.length;
  document.getElementById('activeBookings').textContent    = active.length;
  document.getElementById('completedBookings').textContent = completed.length;
  document.getElementById('bookingSubtitle').textContent   = all.length + ' total bookings';

  const list = document.getElementById('bookingList');
  if (!all.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚗</div>
        <h3>No bookings yet</h3>
        <p>Book your first service and keep your car in top shape!</p>
        <a href="index.html" class="btn-add">+ Book a Service</a>
      </div>`;
    return;
  }

  list.innerHTML = all.reverse().map(b => {
    const [bg, color] = (STATUS_COLORS[b.status] || '#f3f4f6|#374151').split('|');
    const stepPct = [0, 25, 50, 75, 100][b.trackStep] || 0;
    const dateStr = b.date ? new Date(b.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'N/A';

    return `
    <div class="booking-card">
      <div class="booking-top">
        <div>
          <div class="booking-service-name">${b.service}</div>
          <div style="font-size:12px; color:var(--muted); margin-top:3px;">📋 ${b.id}</div>
        </div>
        <span class="status-pill" style="background:${bg}; color:${color};">${b.status}</span>
      </div>
      <div class="booking-details">
        <div class="booking-detail">🚗 <strong>${b.vehicleNum || 'N/A'}</strong></div>
        <div class="booking-detail">🗓 <strong>${dateStr}</strong></div>
        <div class="booking-detail">💰 <strong>₹${(b.estimate || 0).toLocaleString()}</strong></div>
        <div class="booking-detail">📍 <strong style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${b.location || 'N/A'}</strong></div>
      </div>
      <div class="progress-track" style="margin-top:12px;">
        <div class="progress-bar" style="width:${stepPct}%;"></div>
      </div>
      <div style="font-size:11px; color:var(--muted); margin-top:5px;">Progress: ${stepPct}% — ${TRACK_STEPS[b.trackStep]?.label || 'Pending'}</div>
      <div class="track-btn">
        <button class="btn-track primary" onclick="openTracking('${b.id}')">📍 Live Track</button>
        ${b.status !== 'Completed' ? `<button class="btn-track outline" onclick="cancelBooking('${b.id}')">Cancel</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function cancelBooking(id) {
  if (!confirm('Cancel this booking?')) return;
  const bookings = getBookings();
  const i = bookings.findIndex(b => b.id === id);
  if (i !== -1) {
    bookings[i].status = 'Cancelled';
    bookings[i].trackStep = 0;
    saveBookings(bookings);
    showToast('Booking cancelled', 'error');
    setTimeout(() => loadDashboard(), 500);
  }
}

// ─── LIVE TRACKING ────────────────────────────────────────────
function openTracking(bookingId) {
  const booking = getBookings().find(b => b.id === bookingId);
  if (!booking) return;

  const step = booking.trackStep || 0;
  const [bg, color] = (STATUS_COLORS[booking.status] || '#f3f4f6|#374151').split('|');

  // Simulate worker position (random within 5km)
  const workerLat = 55 + Math.random() * 30;
  const workerLng = 25 + Math.random() * 30;
  const homeLat   = workerLat + 8 + Math.random() * 12;
  const homeLng   = workerLng + 8 + Math.random() * 12;

  const stepsHtml = TRACK_STEPS.map((s, i) => {
    const isDone   = i < step;
    const isActive = i === step;
    const isPend   = i > step;
    const dotClass = isDone ? 'done' : isActive ? 'active' : 'pending';
    const connClass= isDone ? 'done' : '';
    const times    = ['Just now', '5 mins ago', 'In progress', 'Ongoing', ''];
    return `
      <div class="progress-step">
        <div class="step-dot-wrap">
          <div class="step-dot ${dotClass}">${isDone ? '✓' : s.icon}</div>
          ${i < TRACK_STEPS.length - 1 ? `<div class="step-connector ${connClass}"></div>` : ''}
        </div>
        <div class="step-info">
          <h4 style="${isPend ? 'color:var(--muted);' : ''}">${s.label}</h4>
          <p>${s.desc}</p>
          ${isActive ? `<div class="time">● Now</div>` : isDone ? `<div class="time" style="color:var(--success);">✓ Done</div>` : ''}
        </div>
      </div>`;
  }).join('');

  const eta = step >= 4 ? 'Service complete' : step === 2 ? 'ETA: ~' + (Math.floor(Math.random()*15)+5) + ' mins' : 'Awaiting departure';

  document.getElementById('trackingModalContent').innerHTML = `
    <div style="margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-size:14px; font-weight:700;">${booking.service}</div>
        <span class="status-pill" style="background:${bg}; color:${color};">${booking.status}</span>
      </div>

      <!-- MAP SIMULATION -->
      <div class="tracker-map">
        <svg viewBox="0 0 400 280" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15;">
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#fff" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="400" height="280" fill="url(#grid)"/>
          <path d="M 60 240 Q 120 200 200 180 Q 260 165 300 130" stroke="#4ade80" stroke-width="2" fill="none" stroke-dasharray="6 4"/>
          <path d="M 300 130 Q 320 90 340 60" stroke="#f87171" stroke-width="2" fill="none" stroke-dasharray="6 4"/>
          <rect x="55" y="130" width="60" height="30" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <rect x="200" y="80" width="70" height="30" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <rect x="280" y="50" width="50" height="25" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
        </svg>
        <!-- Worker dot -->
        <div class="worker-dot" style="top:${workerLat}%; left:${workerLng}%;"></div>
        <!-- Home dot -->
        <div class="home-dot" style="top:${homeLat}%; left:${homeLng}%;"></div>
        <div class="tracker-overlay">
          <div style="color:white; font-size:13px; font-weight:700;">🔴 LIVE — Mechanic Location</div>
          <div style="color:rgba(255,255,255,0.7); font-size:12px; margin-top:2px;">${eta}</div>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-bottom:16px; font-size:13px;">
        <div style="flex:1; background:var(--bg); border-radius:10px; padding:10px; text-align:center;">
          <div style="font-size:20px;">🏍</div>
          <div style="font-weight:700; margin-top:4px;">Mechanic</div>
          <div style="color:var(--muted); font-size:11px;">Rajesh K.</div>
        </div>
        <div style="flex:1; background:var(--bg); border-radius:10px; padding:10px; text-align:center;">
          <div style="font-size:20px;">⏱</div>
          <div style="font-weight:700; margin-top:4px;">${step < 4 ? (step === 0 ? 'Awaiting' : step === 1 ? 'Assigned' : step === 2 ? '~' + (Math.floor(Math.random()*15)+5) + 'm' : 'Ongoing') : 'Done'}</div>
          <div style="color:var(--muted); font-size:11px;">${step < 2 ? 'Confirmation' : step < 4 ? 'ETA' : 'Status'}</div>
        </div>
        <div style="flex:1; background:var(--bg); border-radius:10px; padding:10px; text-align:center;">
          <div style="font-size:20px;">⭐</div>
          <div style="font-weight:700; margin-top:4px;">4.9</div>
          <div style="color:var(--muted); font-size:11px;">Mechanic Rating</div>
        </div>
      </div>

      <!-- STEPS -->
      <div style="font-family:'Syne',sans-serif; font-size:15px; font-weight:700; margin-bottom:12px;">Job Progress</div>
      <div class="progress-steps">${stepsHtml}</div>

      <button onclick="closeTrackModal()" style="width:100%; margin-top:16px; padding:13px; background:var(--primary); color:white; border:none; border-radius:10px; font-family:'DM Sans',sans-serif; font-weight:700; font-size:14px; cursor:pointer;">
        Close Tracker
      </button>
    </div>`;

  document.getElementById('trackModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Simulate live movement
  simulateLiveMovement(booking, step);
}

function simulateLiveMovement(booking, currentStep) {
  if (currentStep >= 2 && currentStep < 4) {
    const dot = document.querySelector('.worker-dot');
    if (!dot) return;
    let pos = 0;
    const interval = setInterval(() => {
      if (!document.getElementById('trackModal').classList.contains('open')) {
        clearInterval(interval); return;
      }
      pos += 0.5;
      const newTop  = parseFloat(dot.style.top)  + (Math.random() - 0.5) * 0.8;
      const newLeft = parseFloat(dot.style.left) + 0.3;
      dot.style.top  = Math.min(Math.max(newTop, 10), 80) + '%';
      dot.style.left = Math.min(Math.max(newLeft, 10), 80) + '%';
    }, 800);
  }
}

function closeTrackModal() {
  document.getElementById('trackModal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeTrackModalOutside(e) {
  if (e.target === document.getElementById('trackModal')) closeTrackModal();
}

// ─── ADMIN PANEL ──────────────────────────────────────────────
function loadAdminPanel() {
  const session = getSession();
  if (!session || session.role !== 'admin') { window.location.href = 'login.html'; return; }
  renderAdminTable();
}

function renderAdminTable() {
  const all = getBookings();
  const filter = document.getElementById('adminFilter')?.value || 'all';
  const filtered = filter === 'all' ? all : all.filter(b => b.status === filter);

  const active    = all.filter(b => ['Confirmed','En Route','In Progress'].includes(b.status)).length;
  const pending   = all.filter(b => b.status === 'Pending').length;
  const revenue   = all.reduce((s, b) => s + (b.estimate || 0), 0);

  const totalEl = document.getElementById('adminTotal');
  if (totalEl) totalEl.textContent = all.length;
  const activeEl = document.getElementById('adminActive');
  if (activeEl) activeEl.textContent = active;
  const pendEl = document.getElementById('adminPending');
  if (pendEl) pendEl.textContent = pending;
  const revEl = document.getElementById('adminRevenue');
  if (revEl) revEl.textContent = '₹' + revenue.toLocaleString();

  const tbody = document.getElementById('adminTableBody');
  const emptyEl = document.getElementById('adminEmpty');

  if (!filtered.length) {
    if (tbody) tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = filtered.reverse().map((b, idx) => {
    const [bg, color] = (STATUS_COLORS[b.status] || '#f3f4f6|#374151').split('|');
    const dateStr = b.date ? new Date(b.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : 'N/A';
    const vehicleInfo = [b.vehicleNum, b.vehicleBrand, b.vehicleModel].filter(Boolean).join(' ');

    return `
      <tr>
        <td style="font-weight:700; color:var(--muted); font-size:12px;">${idx + 1}</td>
        <td>
          <div style="font-weight:700; font-size:14px;">${b.userName || 'Unknown'}</div>
          <div style="font-size:12px; color:var(--muted);">${b.userId || ''}</div>
        </td>
        <td style="font-weight:600;">${b.service}</td>
        <td style="font-size:13px;">${vehicleInfo || 'N/A'}</td>
        <td style="font-size:12px; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${b.location || 'N/A'}</td>
        <td style="font-size:13px;">${dateStr}</td>
        <td style="font-weight:700; color:var(--accent);">₹${(b.estimate || 0).toLocaleString()}</td>
        <td>
          <select onchange="updateStatus('${b.id}', this.value)" style="border:1.5px solid ${bg}; color:${color}; background:${bg}; border-radius:8px; padding:5px 10px; font-size:12px; font-weight:700; cursor:pointer; outline:none;">
            ${STATUSES.map(s => `<option value="${s}" ${b.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`;
  }).join('');
}

function updateStatus(bookingId, newStatus) {
  const bookings = getBookings();
  const i = bookings.findIndex(b => b.id === bookingId);
  if (i === -1) return;

  bookings[i].status = newStatus;
  bookings[i].trackStep = STATUSES.indexOf(newStatus);
  saveBookings(bookings);
  showToast('Status updated: ' + newStatus, 'success');
  setTimeout(() => renderAdminTable(), 300);
}

// ─── PAGE INIT ────────────────────────────────────────────────
(function init() {
  // Auto-open booking if user just logged in with a pending service
  const pending = sessionStorage.getItem('pendingService');
  if (pending && document.getElementById('bookingModal')) {
    try {
      const { serviceName, priceRange } = JSON.parse(pending);
      sessionStorage.removeItem('pendingService');
      setTimeout(() => openBooking(serviceName, priceRange), 300);
    } catch(e) {}
  }

  // Auto-check session for login redirect on dashboard
  const page = window.location.pathname;
  if (page.includes('dashboard') || page.includes('admin')) {
    const session = getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    if (page.includes('admin') && session.role !== 'admin') { window.location.href = 'dashboard.html'; }
  }
})();