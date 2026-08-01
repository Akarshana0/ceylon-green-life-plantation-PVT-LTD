import { auth, db, storage, firebaseConfig } from './firebase-config.js';
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  EmailAuthProvider, reauthenticateWithCredential,
  getAuth, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, collectionGroup, onSnapshot, query, orderBy, serverTimestamp, getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

/* Best-effort delete of a previously-uploaded employee photo from Storage.
   Never throws — losing an orphaned file is a minor cleanup miss, but a
   failed delete must never block saving/removing the employee record. */
async function deleteStoragePhoto(photoURL){
  if (!photoURL) return;
  try{
    await deleteObject(ref(storage, photoURL));
  }catch(err){ /* file may already be gone, or URL wasn't a Storage ref — ignore */ }
}

/* ============================================================================
   Field schema — single source of truth for the employee form, the table,
   and the Excel export. Matches "WARAKAPOLA CGLP EMPLOYEE Details" columns.
   ============================================================================ */
const FIELD_SCHEMA = [
  { key:'fullName',      si:'සම්පූර්ණ නම',              en:'Full Name',        type:'text',     required:true, span2:true },
  { key:'idNumber',       si:'ජාතික හැඳුනුම්පත් අංකය',    en:'ID Number (NIC)',  type:'text',     required:true },
  { key:'gender',         si:'ස්ත්‍රී/පුරුෂ භාවය',         en:'Gender',           type:'select',   options:['MALE','FEMALE'] },
  { key:'dob',            si:'උපන් දිනය',                en:'Date of Birth',    type:'date' },
  { key:'phone',          si:'දුරකථන අංකය',              en:'Phone Number',     type:'tel',      required:true },
  { key:'email',          si:'විද්‍යුත් තැපෑල',           en:'Email',            type:'email' },
  { key:'address',        si:'ලිපිනය',                   en:'Address',          type:'textarea', span2:true },
  { key:'joinDate',       si:'සේවයට එක්වූ දිනය',         en:'Join Date',        type:'date' },
  { key:'branch',         si:'ශාඛාව',                    en:'Branch',           type:'text',     default:'WARAKAPOLA METRO' },
  { key:'reportingLine',  si:'වාර්තා කරන නිලධාරී',       en:'Reporting Line',   type:'text',     span2:true },
  { key:'designation',    si:'තනතුර',                    en:'Designation',      type:'text',     sensitive:true },
  { key:'bankName',       si:'බැංකුවේ නම',               en:'Bank Name',        type:'text',     sensitive:true },
  { key:'bankBranch',     si:'බැංකු ශාඛාව',              en:'Bank Branch',      type:'text',     sensitive:true },
  { key:'accountNumber',  si:'ගිණුම් අංකය',              en:'Account Number',   type:'text',     sensitive:true },
  { key:'epfNo',          si:'EPF අංකය',                 en:'EPF No.',          type:'text',     sensitive:true },
];

const EXPORT_COLUMNS = [
  ['fullName','FULL NAME'], ['idNumber','ID NUMBER'], ['gender','GENDER'],
  ['dob','DATE OF BIRTH'], ['address','ADDRESS'], ['phone','PHONE NUMBER'],
  ['email','EMAIL'], ['joinDate','JOIN DATE'], ['designation','DESIGNATION'],
  ['branch','BRANCH'], ['reportingLine','REPORTING LINE'], ['bankName','BANK NAME'],
  ['bankBranch','BANK BRANCH'], ['accountNumber','ACCOUNT NUMBER'], ['epfNo','EPF NO.']
];

/* ============================================================================
   Super Admin whitelist
   Only accounts signed in with one of these EXACT email addresses can see or
   use the "User Access" admin page (sign-up approvals, online users, force
   logout, etc). This is separate from the `role: admin` field — someone can
   be promoted to the "admin" role (for employee bank-detail access) without
   ever being able to open the User Access page.
   IMPORTANT: keep this list in sync with the `isSuperAdmin()` allow-list in
   firestore.rules — edit both places, then re-publish firestore.rules.
   ============================================================================ */
const SUPER_ADMIN_EMAILS = [
  'admin@cglp.lk'
];

/* How long (ms) since a user's last heartbeat before we consider them
   "offline" in the admin panel. Heartbeats are sent every 25s, so this
   gives a little buffer for network hiccups. */
const PRESENCE_TIMEOUT_MS = 70 * 1000;
/* How often (ms) a logged-in tab pings its presence doc. */
const HEARTBEAT_INTERVAL_MS = 25 * 1000;

/* ============================================================================
   State
   ============================================================================ */
let currentUser = null;
let currentRole = 'staff';
let currentCanEditProfile = false;
let currentUserProfileData = null; // raw /users/{uid} doc for the signed-in account
let isSuperAdmin = false;
let employees = [];        // live cache from Firestore (non-sensitive fields only)
let employeesLoaded = false; // true once the first Firestore snapshot has arrived
let employeePrivateCache = {}; // empId -> {designation, bankName, ...} — ADMIN ONLY, never populated for Staff
let unsubEmployees = null;
let unsubEmployeePrivate = null;
let unsubUsers = null;
let unsubPresence = null;
let unsubOwnPresence = null;
let unsubOwnUserDoc = null;
let allUsersCache = [];    // live cache of /users docs (super admin only)
let presenceCache = {};    // uid -> presence doc data (super admin only)
let heartbeatInterval = null;
let loginTimestamp = 0;
let editingId = null;      // employee id currently open in modal (null = add mode)
let sensitiveUnlocked = false;
let pendingPhotoFile = null;
let reauthResolve = null;
let justSignedIn = false;

/* ============================================================================
   DOM refs
   ============================================================================ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const screenLogin  = $('#screen-login');
const screenSignup = $('#screen-signup');
const screenApp    = $('#screen-app');

/* ============================================================================
   Decorative leaf background (login screen)
   ============================================================================ */
function buildLeafField(){
  const field = $('#leafField');
  if (!field) return;
  const LEAF_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 3 7 3 12c0 5.2 4.3 9.5 9 10 4.7-.5 9-4.8 9-10 0-5-4-10-9-10zm0 2.2c2.6 2 4.6 4.9 5.4 8-1.4-1-3-1.8-4.6-2.2C11.8 8 10.6 6 9 4.6c1-.4 2-1.4 3-2.4z"/></svg>`;
  const count = 16;
  for (let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'leaf';
    el.style.left = (Math.random()*100) + 'vw';
    el.style.setProperty('--drift', (Math.random()*160-80) + 'px');
    el.style.setProperty('--spin', (Math.random()*360+180) + 'deg');
    el.style.color = i % 2 === 0 ? '#c8a24a' : '#e4f0e8';
    el.style.animationDuration = (14 + Math.random()*14) + 's';
    el.style.animationDelay = (Math.random()*-20) + 's';
    el.style.width = el.style.height = (18 + Math.random()*22) + 'px';
    el.innerHTML = LEAF_SVG;
    field.appendChild(el);
  }
}
buildLeafField();

/* ============================================================================
   Firefly / light-mote canvas (login screen) — soft glowing particles that
   drift upward like fireflies over a tea estate at dusk. Cheap to run,
   respects prefers-reduced-motion, and pauses when the tab isn't visible.
   ============================================================================ */
(function fireflyCanvas(){
  const canvas = document.getElementById('fireflyCanvas');
  if (!canvas) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const ctx = canvas.getContext('2d');
  let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let rafId = null;
  let running = true;

  function resize(){
    w = canvas.clientWidth = canvas.parentElement.clientWidth;
    h = canvas.clientHeight = canvas.parentElement.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function makeParticle(){
    return {
      x: Math.random()*w,
      y: h + Math.random()*60,
      r: 1 + Math.random()*2.2,
      speed: .25 + Math.random()*.55,
      drift: (Math.random()-.5)*.4,
      phase: Math.random()*Math.PI*2,
      hue: Math.random() > .5 ? 'gold' : 'green',
      life: 0,
      maxLife: 400 + Math.random()*500
    };
  }

  function init(){
    resize();
    const count = w < 640 ? 22 : 42;
    particles = Array.from({length:count}, () => {
      const p = makeParticle();
      p.y = Math.random()*h; // spread across screen on first paint
      p.life = Math.random()*p.maxLife;
      return p;
    });
  }

  function step(){
    if (!running){ rafId = requestAnimationFrame(step); return; }
    ctx.clearRect(0,0,w,h);
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift + Math.sin((p.life+p.phase)*.02)*.3;
      p.life++;
      if (p.y < -10 || p.life > p.maxLife){
        Object.assign(p, makeParticle());
      }
      const twinkle = .4 + Math.sin(p.life*.05 + p.phase)*.35;
      const color = p.hue === 'gold' ? `rgba(233,210,154,${Math.max(0,twinkle)})` : `rgba(120,220,170,${Math.max(0,twinkle*.8)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*2.4, 0, Math.PI*2);
      ctx.fillStyle = color.replace(/,[\d.]+\)$/, ',0.10)');
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    rafId = requestAnimationFrame(step);
  }

  document.addEventListener('visibilitychange', () => { running = document.visibilityState === 'visible'; });
  window.addEventListener('resize', () => { resize(); });

  init();
  rafId = requestAnimationFrame(step);
})();

/* ============================================================================
   Subtle mouse-parallax tilt on the login card (desktop only, respects
   prefers-reduced-motion). Purely decorative.
   ============================================================================ */
(function loginCardParallax(){
  const card = document.getElementById('loginCard');
  const screen = document.getElementById('screen-login');
  if (!card || !screen) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) return; // skip on touch devices
  screen.addEventListener('mousemove', (e) => {
    const rect = screen.getBoundingClientRect();
    const px = (e.clientX - rect.left)/rect.width - .5;
    const py = (e.clientY - rect.top)/rect.height - .5;
    card.style.transform = `perspective(900px) rotateY(${px*4}deg) rotateX(${-py*4}deg)`;
  });
  screen.addEventListener('mouseleave', () => { card.style.transform = ''; });
})();

/* ============================================================================
   Ripple effect on all buttons — one shared listener, no markup needed.
   ============================================================================ */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.6;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

/* ============================================================================
   Sliding sidebar nav-pill — follows whichever nav-item is active.
   ============================================================================ */
function positionNavPill(activeEl){
  const pill = document.getElementById('navPill');
  if (!pill || !activeEl) return;
  const navRect = pill.parentElement.getBoundingClientRect();
  const rect = activeEl.getBoundingClientRect();
  pill.style.height = rect.height + 'px';
  pill.style.transform = `translateY(${rect.top - navRect.top}px)`;
}
window.addEventListener('resize', () => {
  const active = document.querySelector('.nav-item.active');
  if (active) positionNavPill(active);
});

/* ============================================================================
   Count-up animation for dashboard stat numbers.
   ============================================================================ */
function animateCount(el, target){
  target = Number(target) || 0;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = Number(el.dataset.count) || 0;
  if (reduceMotion || from === target){ el.textContent = target; el.dataset.count = target; return; }
  const duration = 550;
  const start = performance.now();
  function tick(now){
    const p = Math.min(1, (now-start)/duration);
    const eased = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(from + (target-from)*eased);
    if (p < 1) requestAnimationFrame(tick);
    else el.dataset.count = target;
  }
  requestAnimationFrame(tick);
}

/* ============================================================================
   Toasts
   ============================================================================ */
function toast(msg, kind='ok'){
  const stack = $('#toastStack');
  const el = document.createElement('div');
  el.className = 'toast ' + (kind==='err' ? 'err' : 'ok');
  el.textContent = msg;
  stack.appendChild(el);
  const dismiss = () => {
    if (!el.isConnected) return;
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 260);
  };
  setTimeout(dismiss, 4200);
}

/* ============================================================================
   Small helper: toggle a button's disabled + spinner state together, so
   every async action (sign in, save, export, create user...) gets a
   consistent loading affordance without duplicating markup.
   ============================================================================ */
function setBtnLoading(btn, loading){
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('is-loading', loading);
}

/* ============================================================================
   Generic modal open/close with a matching exit animation (see
   .modal-backdrop.closing in style.css) instead of an instant hide.
   ============================================================================ */
function openModalEl(backdropEl){
  if (!backdropEl) return;
  backdropEl.classList.remove('closing');
  backdropEl.classList.remove('hidden');
}
function closeModalEl(backdropEl, onDone){
  if (!backdropEl || backdropEl.classList.contains('hidden')) { if (onDone) onDone(); return; }
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion){
    backdropEl.classList.add('hidden');
    backdropEl.classList.remove('closing');
    if (onDone) onDone();
    return;
  }
  backdropEl.classList.add('closing');
  setTimeout(() => {
    backdropEl.classList.add('hidden');
    backdropEl.classList.remove('closing');
    if (onDone) onDone();
  }, 180);
}

/* ============================================================================
   Skeleton loaders — shown the instant a table starts listening for data,
   swapped out for real rows (or the real empty-state) once the first
   Firestore snapshot actually arrives. Prevents a false "no data" flash.
   ============================================================================ */
function skeletonRows(colCount, rowCount = 4, withAvatar = false){
  return Array.from({ length: rowCount }).map(() => {
    const cells = Array.from({ length: colCount }).map((_, i) => {
      if (withAvatar && i === 0) return `<td><div class="skel-circle"></div></td>`;
      return `<td><div class="skel-bar ${Math.random() > .5 ? 'w-60' : ''}"></div></td>`;
    }).join('');
    return `<tr class="skeleton-row">${cells}</tr>`;
  }).join('');
}

/* ============================================================================
   One-time "ease up into view" reveal for panels, using IntersectionObserver
   so it only plays the first time each panel enters the viewport.
   ============================================================================ */
function initRevealObserver(root){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = (root || document).querySelectorAll('.reveal-up:not(.in)');
  if (!targets.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)){
    targets.forEach(t => t.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  targets.forEach(t => io.observe(t));
}

/* ============================================================================
   SIGN UP (self-service request — requires admin approval before login works)
   ============================================================================ */
function showAuthScreen(which){
  $('#signupError') && $('#signupError').classList.remove('show');
  $('#signupSuccess') && $('#signupSuccess').classList.add('hidden');
  $('#loginError') && $('#loginError').classList.remove('show');
  if (which === 'signup'){
    screenLogin.classList.add('hidden');
    screenSignup.classList.remove('hidden');
  } else {
    screenSignup.classList.add('hidden');
    screenLogin.classList.remove('hidden');
  }
}
['goToSignup','goToSignup2'].forEach(id => {
  $('#'+id) && $('#'+id).addEventListener('click', (e) => { e.preventDefault(); showAuthScreen('signup'); });
});
$('#goToLogin') && $('#goToLogin').addEventListener('click', (e) => { e.preventDefault(); showAuthScreen('login'); });

$('#signupForm') && $('#signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const firstName = $('#suFirstName').value.trim();
  const lastName  = $('#suLastName').value.trim();
  const email     = $('#suEmail').value.trim();
  const phone     = $('#suPhone').value.trim();
  const password  = $('#suPassword').value;
  const confirmPw = $('#suPasswordConfirm').value;
  const errBox = $('#signupError');
  errBox.classList.remove('show');
  $('#signupSuccess').classList.add('hidden');

  if (password !== confirmPw){
    errBox.textContent = 'මුරපද දෙක නොගැලපේ. / The two passwords do not match.';
    errBox.classList.add('show');
    return;
  }
  if (password.length < 6){
    errBox.textContent = 'මුරපදය අවම අකුරු 6 විය යුතුයි. / Password must be at least 6 characters.';
    errBox.classList.add('show');
    return;
  }

  const btn = $('#signupBtn');
  setBtnLoading(btn, true);
  const originalLabel = btn.innerHTML;

  // Sign the new account up on a throwaway *secondary* Firebase app instance
  // so we never touch the primary auth session (nobody should get logged in
  // just by signing up — they have to wait for admin approval). We write the
  // profile doc using the SECONDARY app's own Firestore instance too, because
  // that write must be authenticated as the brand-new account itself (there
  // is no admin signed in on the primary app at the login screen).
  const secondaryApp = initializeApp(firebaseConfig, 'signup-' + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  try{
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    const secondaryDb = getFirestore(secondaryApp);
    await setDoc(doc(secondaryDb, 'users', uid), {
      email,
      firstName, lastName,
      name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
      phone,
      role: 'staff',
      status: 'pending',
      canEditProfile: false,
      createdAt: serverTimestamp()
    });
    await signOut(secondaryAuth);
    $('#signupForm').reset();
    $('#signupSuccess').classList.remove('hidden');
  }catch(err){
    errBox.textContent = friendlyAuthError(err);
    errBox.classList.add('show');
  }finally{
    deleteApp(secondaryApp).catch(()=>{});
    setBtnLoading(btn, false);
    btn.innerHTML = originalLabel;
  }
});

/* ============================================================================
   AUTH
   ============================================================================ */
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const password = $('#loginPassword').value;
  const errBox = $('#loginError');
  errBox.classList.remove('show');
  const btn = $('#loginBtn');
  setBtnLoading(btn, true);
  try{
    justSignedIn = true;
    await signInWithEmailAndPassword(auth, email, password);
  }catch(err){
    justSignedIn = false;
    errBox.textContent = friendlyAuthError(err);
    errBox.classList.add('show');
  }finally{
    setBtnLoading(btn, false);
  }
});

function friendlyAuthError(err){
  const code = err && err.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')){
    return 'ඊමේල් හෝ මුරපදය වැරදිය. / Incorrect email or password.';
  }
  if (code.includes('email-already-in-use')){
    return 'මේ ඊමේල් එකට දැනටමත් ගිණුමක් තිබේ. / An account with this email already exists.';
  }
  if (code.includes('weak-password')){
    return 'මුරපදය ඉතා දුර්වලයි (අවම අකුරු 6). / Password is too weak (min 6 characters).';
  }
  if (code.includes('invalid-email')){
    return 'ඊමේල් ලිපිනය වැරදිය. / Invalid email address.';
  }
  if (code.includes('too-many-requests')){
    return 'උත්සාහයන් වැඩිය. පසුව උත්සාහ කරන්න. / Too many attempts — try again later.';
  }
  if (code.includes('network')){
    return 'ජාල ගැටළුවක්. / Network error — check your connection.';
  }
  return 'නොහැකි විය. / Could not complete this action. ' + (err && err.message ? err.message : '');
}

$('#logoutBtn').addEventListener('click', async () => {
  if (currentUser){
    try{ await setDoc(doc(db, 'presence', currentUser.uid), { online:false }, { merge:true }); }catch(err){ /* best-effort */ }
  }
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user){
    stopPresenceTracking();
    teardownData();
    screenApp.classList.add('hidden');
    screenSignup.classList.add('hidden');
    screenLogin.classList.remove('hidden');
    screenLogin.classList.remove('leaving');
    $('#loginCard') && $('#loginCard').classList.remove('leaving');
    return;
  }

  // Fetch (or create) the profile doc and check whether this account is
  // approved to sign in BEFORE showing any app content.
  const profile = await fetchOrCreateUserProfile(user);
  if (!profile.ok){
    const wasJustSignedIn = justSignedIn;
    justSignedIn = false;
    await signOut(auth);
    if (wasJustSignedIn){
      const errBox = $('#loginError');
      errBox.textContent = profile.message;
      errBox.classList.add('show');
    }
    return;
  }

  applyProfileToUI(profile.data);
  loginTimestamp = Date.now();
  startPresenceTracking(user.uid, profile.data);

  if (justSignedIn){
    justSignedIn = false;
    const overlay = $('#launchOverlay');
    screenLogin.classList.add('leaving');
    $('#loginCard').classList.add('leaving');
    await new Promise(r => setTimeout(r, 260));
    overlay.classList.remove('hidden');
    screenLogin.classList.add('hidden');
    setupData();
    screenApp.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 900));
    overlay.classList.add('hidden');
    screenLogin.classList.remove('leaving');
    $('#loginCard').classList.remove('leaving');
  } else {
    screenLogin.classList.add('hidden');
    screenSignup.classList.add('hidden');
    screenApp.classList.remove('hidden');
    setupData();
  }
});

/* Fetch a user's /users profile doc, auto-creating a legacy-compatible one
   the very first time an account (created directly in the Firebase Console)
   signs in. Returns { ok:true, data } if the account may sign in, or
   { ok:false, message } if it's pending approval / disabled / rejected. */
async function fetchOrCreateUserProfile(user){
  const uRef = doc(db, 'users', user.uid);
  let snap = await getDoc(uRef);
  if (!snap.exists()){
    // No profile doc yet — this account was created directly through the
    // Firebase Console rather than the in-app Sign Up or Add User flows.
    // Auto-approve it for backward compatibility (matches the old first-run
    // behavior described in the README).
    await setDoc(uRef, {
      email: user.email,
      name: user.email.split('@')[0],
      firstName: user.email.split('@')[0],
      lastName: '',
      phone: '',
      role: 'staff',
      status: 'approved',
      canEditProfile: false,
      createdAt: serverTimestamp()
    });
    snap = await getDoc(uRef);
  }
  const data = snap.data();
  const status = data.status || 'approved'; // docs saved before this update have no status field
  if (status === 'pending'){
    return { ok:false, message: 'ඔබගේ ගිණුම admin අනුමත කිරීම එනතුරු රැඳී සිටින්න. / Your account is awaiting admin approval.' };
  }
  if (status === 'disabled' || status === 'rejected'){
    return { ok:false, message: 'ඔබගේ ගිණුමට ප්‍රවේශය අවහිර කර ඇත. Admin අමතන්න. / Access to this account has been disabled. Please contact your administrator.' };
  }
  return { ok:true, data: { ...data, status } };
}

function applyProfileToUI(data){
  currentUserProfileData = data;
  currentRole = data.role === 'admin' ? 'admin' : 'staff';
  currentCanEditProfile = !!data.canEditProfile;
  isSuperAdmin = !!(currentUser && currentUser.email && SUPER_ADMIN_EMAILS.map(e=>e.toLowerCase()).includes(currentUser.email.toLowerCase()));

  const displayName = data.name || [data.firstName, data.lastName].filter(Boolean).join(' ') || currentUser.email;
  $('#userNameLabel').textContent = displayName;
  $('#userRoleLabel').textContent = currentRole === 'admin' ? 'Administrator' : 'Staff';
  $('#userInitial').textContent = (displayName || '?').charAt(0).toUpperCase();
  $$('.admin-only').forEach(el => el.classList.toggle('hidden', currentRole !== 'admin'));
  $$('.super-admin-only').forEach(el => el.classList.toggle('hidden', !isSuperAdmin));
}

/* ============================================================================
   MY PROFILE (self-service edit — only unlocked when an admin has granted
   canEditProfile; otherwise this is a read-only summary). Only name/phone
   are editable here — role/status/canEditProfile can never be changed by
   the user themself, which firestore.rules also enforces server-side.
   ============================================================================ */
function renderMyProfile(){
  const data = currentUserProfileData || {};
  const name = data.name || [data.firstName, data.lastName].filter(Boolean).join(' ') || '';
  $('#myProfileEmail').value = (currentUser && currentUser.email) || '';
  $('#myProfileRole').value = currentRole === 'admin' ? 'Administrator' : 'Staff';
  $('#myProfileName').value = name;
  $('#myProfilePhone').value = data.phone || '';

  const editable = !!currentCanEditProfile;
  $('#myProfileName').disabled = !editable;
  $('#myProfilePhone').disabled = !editable;
  $('#myProfileLockedMsg').classList.toggle('hidden', editable);
  $('#myProfileActions').classList.toggle('hidden', !editable);
}

$('#myProfileSaveBtn') && $('#myProfileSaveBtn').addEventListener('click', async () => {
  if (!currentUser || !currentCanEditProfile) return;
  const name = $('#myProfileName').value.trim();
  const phone = $('#myProfilePhone').value.trim();
  if (!name){ toast('නම හිස් විය නොහැක / Name cannot be empty', 'err'); return; }
  const btn = $('#myProfileSaveBtn');
  setBtnLoading(btn, true);
  try{
    // Only touch name/phone — role, status, and canEditProfile must stay
    // exactly as they were, both because the user shouldn't change them
    // and because firestore.rules will reject the write if they do.
    await updateDoc(doc(db, 'users', currentUser.uid), { name, phone });
    toast('ඔබගේ තොරතුරු සුරකින ලදී / Your details were saved');
  }catch(err){
    toast('දෝෂයක්: ' + err.message, 'err');
  }finally{
    setBtnLoading(btn, false);
  }
});

/* ============================================================================
   PRESENCE (who's currently logged in) + force-logout listener
   Firestore-heartbeat based, since this is a static site with no backend to
   run true server-side session revocation. A signed-in tab pings its own
   /presence/{uid} doc every ~25s; the admin panel treats anyone whose last
   ping is recent as "online". An admin "kicking" a user just stamps
   forceLogoutAt on that doc — every open tab is listening for that stamp
   and will sign itself out within a second or two of it being set.
   ============================================================================ */
async function touchPresence(uid, profileData){
  const displayName = (profileData && (profileData.name || [profileData.firstName, profileData.lastName].filter(Boolean).join(' '))) || (currentUser && currentUser.email) || '';
  try{
    await setDoc(doc(db, 'presence', uid), {
      online: true,
      lastActive: serverTimestamp(),
      email: currentUser ? currentUser.email : '',
      name: displayName
    }, { merge: true });
  }catch(err){ /* best-effort — presence is a UX nicety, not a security boundary */ }
}

function beforeUnloadPresence(){
  if (currentUser){
    // Fire-and-forget; browsers don't reliably wait for async work on unload.
    setDoc(doc(db, 'presence', currentUser.uid), { online:false }, { merge:true }).catch(()=>{});
  }
}

function startPresenceTracking(uid, profileData){
  touchPresence(uid, profileData);
  heartbeatInterval = setInterval(() => touchPresence(uid, profileData), HEARTBEAT_INTERVAL_MS);
  window.addEventListener('beforeunload', beforeUnloadPresence);

  unsubOwnPresence = onSnapshot(doc(db, 'presence', uid), (snap) => {
    if (!snap.exists()) return;
    const d = snap.data();
    if (d.forceLogoutAt && d.forceLogoutAt.toMillis && d.forceLogoutAt.toMillis() > loginTimestamp){
      toast('ඔබව admin විසින් ඉවත් කරන ලදී / You were logged out by an administrator.', 'err');
      signOut(auth);
    }
  });

  unsubOwnUserDoc = onSnapshot(doc(db, 'users', uid), (snap) => {
    if (!snap.exists() || !currentUser) return;
    const d = snap.data();
    if (d.status === 'disabled' || d.status === 'rejected'){
      toast('ඔබගේ ගිණුමට ප්‍රවේශය අවහිර කර ඇත. / Your account access has been revoked.', 'err');
      signOut(auth);
    }
    applyProfileToUI(d);
    if (document.querySelector('.nav-item.active')?.dataset.view === 'my-profile') renderMyProfile();
  });
}

function stopPresenceTracking(){
  if (heartbeatInterval){ clearInterval(heartbeatInterval); heartbeatInterval = null; }
  window.removeEventListener('beforeunload', beforeUnloadPresence);
  if (unsubOwnPresence){ unsubOwnPresence(); unsubOwnPresence = null; }
  if (unsubOwnUserDoc){ unsubOwnUserDoc(); unsubOwnUserDoc = null; }
}

/* ============================================================================
   NAVIGATION
   ============================================================================ */
const VIEW_TITLES = {
  'dashboard':      ['මුල් පිටුව', 'Dashboard overview'],
  'employees':      ['සේවකයන්', 'Manage employee records'],
  'add-employee':   ['නව සේවකයෙක්', 'Add a new employee'],
  'export':         ['Excel Export', 'Download employee data as .xlsx'],
  'my-profile':     ['මගේ ගිණුම', 'Your account details'],
  'users':          ['පරිශීලක පාලනය', 'Manage user access levels'],
};

$$('.nav-item').forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});
$('#menuToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

function switchView(view){
  // Sensitive fields (Designation & Bank Details) must only stay unlocked
  // for the single form session that unlocked them — navigating away to
  // any other page (even briefly) should require re-entering the password
  // again next time. Without this, unlocking on the Add Employee page and
  // then clicking away and back left the fields unlocked with no re-auth.
  sensitiveUnlocked = false;
  $$('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.view === view));
  $$('.view').forEach(v => v.classList.add('hidden'));
  const target = $('#view-' + view);
  if (target){
    target.classList.remove('hidden');
    // restart the view's entrance animation on every switch
    target.style.animation = 'none';
    void target.offsetWidth;
    target.style.animation = '';
  }
  const [titleSi, sub] = VIEW_TITLES[view] || ['', ''];
  $('#viewTitle').textContent = titleSi;
  $('#viewSubtitle').textContent = sub;
  $('#sidebar').classList.remove('open');
  if (view === 'add-employee') renderAddEmployeeForm();
  if (view === 'my-profile') renderMyProfile();
  const activeNav = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (activeNav) positionNavPill(activeNav);
}
// Position the pill once on first load (after layout settles)
requestAnimationFrame(() => {
  const active = document.querySelector('.nav-item.active');
  if (active) positionNavPill(active);
});

/* ============================================================================
   FIRESTORE DATA
   ============================================================================ */
function setupData(){
  employeesLoaded = false;
  const empBody = $('#employeeTableBody');
  if (empBody) empBody.innerHTML = skeletonRows(7, 5, true);
  const breakdownWrap = $('#designationBreakdown');
  if (breakdownWrap) breakdownWrap.innerHTML = `<table><tbody>${skeletonRows(2, 3)}</tbody></table>`;

  const empQuery = query(collection(db, 'employees'), orderBy('fullName'));
  unsubEmployees = onSnapshot(empQuery, (snap) => {
    employees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    employeesLoaded = true;
    renderEmployeeTable();
    renderDashboard();
  }, (err) => toast('දත්ත ලබාගැනීමේ දෝෂයක්: ' + err.message, 'err'));

  // Sensitive fields (designation, bank details, EPF) live in an admin-only
  // subcollection — Staff accounts never subscribe to this at all, so the
  // data never reaches their browser (firestore.rules also blocks the read
  // server-side, this just avoids even attempting it for non-admins).
  if (currentRole === 'admin'){
    unsubEmployeePrivate = onSnapshot(collectionGroup(db, 'private'), (snap) => {
      employeePrivateCache = {};
      snap.docs.forEach(d => {
        const parentId = d.ref.parent.parent.id;
        employeePrivateCache[parentId] = d.data();
      });
      renderEmployeeTable();
      renderDashboard();
    }, (err) => toast('දත්ත ලබාගැනීමේ දෝෂයක්: ' + err.message, 'err'));
  }

  // The User Access page (requests / online users / all users / add user)
  // is only visible to — and only loaded for — the whitelisted super-admin
  // email(s). Everyone else never fetches the users/presence collections.
  if (isSuperAdmin){
    unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      allUsersCache = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderAdminPanels();
    });
    unsubPresence = onSnapshot(collection(db, 'presence'), (snap) => {
      presenceCache = {};
      snap.docs.forEach(d => { presenceCache[d.id] = d.data(); });
      renderAdminPanels();
    });
  }
}
function teardownData(){
  if (unsubEmployees) unsubEmployees();
  if (unsubEmployeePrivate) unsubEmployeePrivate();
  if (unsubUsers) unsubUsers();
  if (unsubPresence) unsubPresence();
  unsubEmployees = unsubEmployeePrivate = unsubUsers = unsubPresence = null;
  employees = [];
  employeePrivateCache = {};
  employeesLoaded = false;
  allUsersCache = [];
  presenceCache = {};
}

/* ============================================================================
   DASHBOARD
   ============================================================================ */
function renderDashboard(){
  animateCount($('#statTotal'), employees.length);
  // Was `branches.size || 1`, which showed "1" whenever every employee's
  // branch field happened to be empty (not just when there were zero
  // employees). The count should just be the number of distinct branches.
  const branches = new Set(employees.map(e => (e.branch||'').trim()).filter(Boolean));
  animateCount($('#statBranches'), branches.size);

  const now = new Date();
  const thisMonth = employees.filter(e => {
    const t = e.createdAt && e.createdAt.toDate ? e.createdAt.toDate() : null;
    return t && t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
  }).length;
  animateCount($('#statNew'), thisMonth);

  animateCount($('#statNoPhoto'), employees.filter(e => !e.photoURL).length);

  // Designation is a sensitive field — only ever present in
  // employeePrivateCache, which is only ever populated for Admins. The
  // panel itself is also hidden for Staff via the admin-only class.
  if (currentRole === 'admin'){
    const byDesignation = {};
    employees.forEach(e => {
      const raw = (employeePrivateCache[e.id] || {}).designation;
      const d = (raw || 'නම් නොකළ / Unassigned').trim() || 'නම් නොකළ / Unassigned';
      byDesignation[d] = (byDesignation[d] || 0) + 1;
    });
    const rows = Object.entries(byDesignation).sort((a,b)=>b[1]-a[1]);
    const wrap = $('#designationBreakdown');
    wrap.innerHTML = !rows.length
      ? `<div class="empty-state"><p>දත්ත නොමැත / No data yet</p></div>`
      : `<table>
          <thead><tr><th>තනතුර / Designation</th><th>සේවක ගණන / Count</th></tr></thead>
          <tbody>
            ${rows.map(([name,count]) => `<tr><td>${escapeHtml(name)}</td><td>${count}</td></tr>`).join('')}
          </tbody>
        </table>`;
  }

  renderCelebrations();
}

/* ============================================================================
   NEW FEATURE: "Celebrations this month" — birthdays and work anniversaries
   falling in the current calendar month, sorted by day. Uses only dob /
   joinDate / fullName / branch, none of which are sensitive fields, so this
   is visible to Staff and Admin alike.
   ============================================================================ */
/* Parses a plain "YYYY-MM-DD" string (as produced by <input type=date>)
   without going through the Date constructor, which treats date-only
   strings as UTC midnight and can shift the day/month by one once
   converted to a timezone behind UTC. Returns null for anything else. */
function parseISODateParts(str){
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function renderCelebrations(){
  const wrap = $('#celebrationsList');
  if (!wrap) return;
  const now = new Date();
  const month = now.getMonth();
  const items = [];

  employees.forEach(e => {
    const dob = parseISODateParts(e.dob);
    if (dob && dob.month === month){
      items.push({ day: dob.day, name: e.fullName, branch: e.branch, kind: 'birthday' });
    }
    const joined = parseISODateParts(e.joinDate);
    if (joined && joined.month === month){
      const years = now.getFullYear() - joined.year;
      if (years > 0){
        items.push({ day: joined.day, name: e.fullName, branch: e.branch, kind: 'anniversary', years });
      }
    }
  });
  items.sort((a,b) => a.day - b.day);

  if (!items.length){
    wrap.innerHTML = `<div class="empty-state"><p>මෙම මාසයේ සැමරුම් නොමැත / No birthdays or anniversaries this month</p></div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>දිනය / Day</th><th>නම / Name</th><th>සිදුවීම / Occasion</th><th>ශාඛාව / Branch</th></tr></thead>
      <tbody>
        ${items.map(it => `
          <tr>
            <td>${it.day}</td>
            <td>${escapeHtml(it.name || '—')}</td>
            <td>${it.kind === 'birthday'
                  ? '🎂 උපන්දිනය <span class="si">/ Birthday</span>'
                  : `🎉 සේවා වර්ෂ ${it.years} <span class="si">/ ${it.years} yr${it.years>1?'s':''} anniversary</span>`}</td>
            <td>${escapeHtml(it.branch || '—')}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ============================================================================
   EMPLOYEE TABLE
   ============================================================================ */
$('#searchInput').addEventListener('input', renderEmployeeTable);
$('#branchFilter') && $('#branchFilter').addEventListener('change', renderEmployeeTable);
$('#designationFilter') && $('#designationFilter').addEventListener('change', renderEmployeeTable);
$('#quickAddBtn').addEventListener('click', () => switchView('add-employee'));

/* Rebuild the Branch / Designation filter dropdowns from the current
   employee list, keeping whatever the user had selected (if that option
   still exists) instead of resetting it back to "All" on every snapshot
   update. Designation is a sensitive field, so that dropdown is only
   populated/shown for Admins — matching how the column itself is masked
   for Staff (see applyProfileToUI, which toggles .admin-only). */
function populateEmployeeFilters(){
  const branchSel = $('#branchFilter');
  if (branchSel){
    const current = branchSel.value;
    const branches = Array.from(new Set(employees.map(e => (e.branch||'').trim()).filter(Boolean))).sort();
    branchSel.innerHTML = `<option value="">සියලුම ශාඛා / All Branches</option>` +
      branches.map(b => `<option value="${escapeHtml(b)}" ${b===current?'selected':''}>${escapeHtml(b)}</option>`).join('');
    if (branches.includes(current)) branchSel.value = current;
  }
  const desigSel = $('#designationFilter');
  if (desigSel && currentRole === 'admin'){
    const current = desigSel.value;
    const designations = Array.from(new Set(employees.map(e => ((employeePrivateCache[e.id]||{}).designation||'').trim()).filter(Boolean))).sort();
    desigSel.innerHTML = `<option value="">සියලුම තනතුරු / All Designations</option>` +
      designations.map(d => `<option value="${escapeHtml(d)}" ${d===current?'selected':''}>${escapeHtml(d)}</option>`).join('');
    if (designations.includes(current)) desigSel.value = current;
  }
}

function renderEmployeeTable(){
  populateEmployeeFilters();
  const term = ($('#searchInput').value || '').toLowerCase().trim();
  const branchTerm = $('#branchFilter') ? $('#branchFilter').value : '';
  const desigTerm = ($('#designationFilter') && currentRole === 'admin') ? $('#designationFilter').value : '';
  const filtered = employees.filter(e => {
    const designation = currentRole === 'admin' ? (employeePrivateCache[e.id]||{}).designation : '';
    if (branchTerm && (e.branch||'').trim() !== branchTerm) return false;
    if (desigTerm && (designation||'').trim() !== desigTerm) return false;
    if (!term) return true;
    return [e.fullName, e.idNumber, designation, e.branch, e.phone]
      .some(v => (v||'').toLowerCase().includes(term));
  });

  const body = $('#employeeTableBody');
  if (!employeesLoaded) return; // skeleton rows already showing — nothing to render yet
  $('#employeesEmpty').classList.toggle('hidden', filtered.length !== 0);

  body.innerHTML = filtered.map((e, i) => `
    <tr style="--i:${Math.min(i,14)}">
      <td>${e.photoURL
        ? `<img src="${e.photoURL}" class="emp-photo" alt="">`
        : `<div class="emp-photo" style="display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--forest-600);">${escapeHtml((e.fullName||'?').charAt(0))}</div>`}</td>
      <td>
        <div class="emp-name">${escapeHtml(e.fullName || '—')}</div>
        <div class="emp-sub">${escapeHtml(e.email || '')}</div>
      </td>
      <td>${escapeHtml(e.idNumber || '—')}</td>
      <td>${currentRole==='admin'
            ? `<span class="badge badge-gold">${escapeHtml((employeePrivateCache[e.id]||{}).designation || '—')}</span>`
            : `<span class="badge badge-lock">🔒 restricted</span>`}</td>
      <td>${escapeHtml(e.branch || '—')}</td>
      <td>${escapeHtml(e.phone || '—')}</td>
      <td>
        <div class="row-actions" style="justify-content:flex-end;">
          <button class="icon-btn" data-view-emp="${e.id}" title="View / Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          ${currentRole==='admin' ? `
          <button class="icon-btn danger" data-del-emp="${e.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  $$('[data-view-emp]').forEach(btn => btn.addEventListener('click', () => openEmployeeModal(btn.dataset.viewEmp)));
  $$('[data-del-emp]').forEach(btn => btn.addEventListener('click', () => deleteEmployee(btn.dataset.delEmp)));
}

/* Merge an employee's public record with its sensitive fields — the
   sensitive fields only ever exist in employeePrivateCache, which is only
   ever populated for Admins (see setupData). For Staff this is a no-op. */
function mergedEmployee(e){
  return currentRole === 'admin' ? { ...e, ...(employeePrivateCache[e.id] || {}) } : e;
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ============================================================================
   FORM BUILDING (shared by Add view + Edit modal)
   ============================================================================ */
function buildFieldHTML(f, value, locked){
  const label = `<label>${f.si} <span class="si">/ ${f.en}</span>${f.required ? ' *' : ''}</label>`;
  const val = value !== undefined && value !== null ? value : (f.default || '');
  let input;
  if (f.type === 'select'){
    input = `<select name="${f.key}" ${locked?'disabled':''} ${f.required?'required':''}>
      <option value="">— Select —</option>
      ${f.options.map(o => `<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('')}
    </select>`;
  } else if (f.type === 'textarea'){
    input = `<textarea name="${f.key}" ${locked?'disabled':''} ${f.required?'required':''}>${escapeHtml(val)}</textarea>`;
  } else {
    input = `<input type="${f.type}" name="${f.key}" value="${escapeHtml(val)}" ${locked?'disabled':''} ${f.required?'required':''}>`;
  }
  return `<div class="field ${f.span2?'span-2':''}">${label}${input}</div>`;
}

function buildEmployeeFormFields(data={}){
  const normal = FIELD_SCHEMA.filter(f => !f.sensitive);
  const sensitive = FIELD_SCHEMA.filter(f => f.sensitive);

  const normalHTML = normal.map(f => buildFieldHTML(f, data[f.key], false)).join('');

  const canSeeSensitive = currentRole === 'admin';
  const locked = canSeeSensitive ? !sensitiveUnlocked : true;

  const sensitiveHTML = `
    <div class="sensitive-box">
      <div class="lock-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
        සංවේදී තොරතුරු — තනතුර සහ බැංකු විස්තර <span class="si">/ Sensitive: Designation &amp; Bank Details</span>
        ${canSeeSensitive
          ? (sensitiveUnlocked
              ? '<span class="badge badge-green" style="margin-left:auto;">Unlocked</span>'
              : `<button type="button" class="btn btn-gold btn-sm" id="unlockSensitiveBtn" style="margin-left:auto;">🔓 Unlock to edit</button>`)
          : '<span class="badge badge-lock" style="margin-left:auto;">Admin only</span>'}
      </div>
      <div class="sensitive-fields ${locked?'locked':''}">
        ${canSeeSensitive
          ? sensitive.map(f => buildFieldHTML(f, data[f.key], locked)).join('')
          : sensitive.map(f => `
            <div class="field">
              <label>${f.si} <span class="si">/ ${f.en}</span></label>
              <input type="text" value="🔒 restricted / Admin only" disabled>
            </div>`).join('')}
      </div>
    </div>`;

  return `
    <div class="section-divider">මූලික තොරතුරු / Basic Information</div>
    ${normalHTML}
    <div class="section-divider">ඡායාරූපය / Photo</div>
    <div class="span-2 photo-picker">
      <img id="photoPreview" class="photo-preview" src="${data.photoURL || placeholderAvatar(data.fullName)}" alt="">
      <div>
        <input type="file" id="photoInput" accept="image/*">
        <div class="help-text">JPG/PNG · max 3MB — ස්වයංක්‍රීයව හැඩගැසේ / auto-resized on save</div>
      </div>
    </div>
    <div class="section-divider">සංවේදී තොරතුරු / Sensitive</div>
    ${sensitiveHTML}
  `;
}

function placeholderAvatar(name){
  const letter = (name || '?').charAt(0).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' rx='50' fill='%23e4f0e8'/><text x='50%' y='58%' font-size='40' text-anchor='middle' fill='%232e8b57' font-family='Arial'>${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* Wire up photo picker + unlock button inside a given form element */
function wireFormExtras(formEl){
  const fileInput = formEl.querySelector('#photoInput');
  if (fileInput){
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (file.size > 3*1024*1024){ toast('ගොනුව ඉතා විශාලයි (max 3MB) / File too large', 'err'); fileInput.value=''; return; }
      pendingPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => { formEl.querySelector('#photoPreview').src = e.target.result; };
      reader.readAsDataURL(file);
    });
  }
  const unlockBtn = formEl.querySelector('#unlockSensitiveBtn');
  if (unlockBtn){
    unlockBtn.addEventListener('click', async () => {
      const ok = await requestReauth();
      if (ok){
        sensitiveUnlocked = true;
        // re-render whichever form is currently active with unlocked fields
        if (formEl.id === 'employeeForm') renderEmployeeModalForm(editingId);
        else renderAddEmployeeForm();
      }
    });
  }
}

/* ============================================================================
   ADD EMPLOYEE VIEW
   ============================================================================ */
function renderAddEmployeeForm(){
  pendingPhotoFile = null;
  const form = $('#addEmployeeForm');
  form.innerHTML = buildEmployeeFormFields({}) + `
    <div class="span-2" style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px;">
      <button type="reset" class="btn btn-ghost btn-sm">මකන්න / Clear</button>
      <button type="submit" class="btn btn-primary">සුරකින්න / Save Employee</button>
    </div>`;
  wireFormExtras(form);
}

$('#addEmployeeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveEmployeeFromForm(e.target, null);
  renderAddEmployeeForm();
  toast('සේවකයා සාර්ථකව එකතු කරන ලදී / Employee added successfully');
  switchView('employees');
});

/* ============================================================================
   EDIT MODAL
   ============================================================================ */
const empModalBackdrop = $('#employeeModalBackdrop');
$('#employeeModalClose').addEventListener('click', closeEmployeeModal);
$('#employeeModalCancel').addEventListener('click', closeEmployeeModal);
$('#employeeModalSave').addEventListener('click', async () => {
  const form = $('#employeeForm');
  if (!form.reportValidity()) return;
  const btn = $('#employeeModalSave');
  setBtnLoading(btn, true);
  try{
    await saveEmployeeFromForm(form, editingId);
    toast('වෙනස්කම් සුරකින ලදී / Changes saved');
    closeEmployeeModal();
  }catch(err){
    /* saveEmployeeFromForm already toasted the error */
  }finally{
    setBtnLoading(btn, false);
  }
});

function openEmployeeModal(id){
  editingId = id;
  sensitiveUnlocked = false;
  $('#employeeModalTitle').textContent = 'සේවක විස්තර සංස්කරණය';
  renderEmployeeModalForm(id);
  openModalEl(empModalBackdrop);
}
function renderEmployeeModalForm(id){
  const base = employees.find(e => e.id === id);
  const data = base ? mergedEmployee(base) : {};
  const form = $('#employeeForm');
  form.innerHTML = buildEmployeeFormFields(data);
  wireFormExtras(form);
}
function closeEmployeeModal(){
  closeModalEl(empModalBackdrop, () => {
    editingId = null;
    sensitiveUnlocked = false;
    pendingPhotoFile = null;
  });
}

/* ============================================================================
   SAVE / DELETE
   ============================================================================ */
async function saveEmployeeFromForm(formEl, id){
  const fd = new FormData(formEl);
  const payload = {};      // non-sensitive fields → employees/{id}
  const sensitivePayload = {}; // sensitive fields → employees/{id}/private/data (admin-only)
  let hasSensitiveEdit = false;
  FIELD_SCHEMA.forEach(f => {
    if (f.sensitive){
      // Only include sensitive fields if the admin actually unlocked them —
      // otherwise the disabled inputs would submit blank values and
      // silently wipe real data.
      if (currentRole === 'admin' && sensitiveUnlocked){
        sensitivePayload[f.key] = fd.get(f.key) || '';
        hasSensitiveEdit = true;
      }
    } else {
      payload[f.key] = fd.get(f.key) || '';
    }
  });

  try{
    let docId = id;
    if (!id){
      payload.createdAt = serverTimestamp();
      payload.updatedAt = serverTimestamp();
      const newRef = await addDoc(collection(db, 'employees'), payload);
      docId = newRef.id;
    } else {
      payload.updatedAt = serverTimestamp();
      await updateDoc(doc(db, 'employees', id), payload);
    }

    if (hasSensitiveEdit){
      sensitivePayload.updatedAt = serverTimestamp();
      await setDoc(doc(db, 'employees', docId, 'private', 'data'), sensitivePayload, { merge: true });
    }

    if (pendingPhotoFile){
      const previous = id ? employees.find(e => e.id === id) : null;
      const path = `employees/${docId}/photo_${Date.now()}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, pendingPhotoFile);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'employees', docId), { photoURL: url });
      if (previous && previous.photoURL) deleteStoragePhoto(previous.photoURL);
    }
    pendingPhotoFile = null;
  }catch(err){
    toast('සුරැකීමේ දෝෂයක්: ' + err.message, 'err');
    throw err;
  }
}

async function deleteEmployee(id){
  if (currentRole !== 'admin'){ toast('ඔබට මකා දැමීමට අවසර නැත / Not authorized', 'err'); return; }
  const emp = employees.find(e => e.id === id);
  if (!confirm(`${emp ? emp.fullName : 'මෙම සේවකයා'} මකා දැමීමට විශ්වාසද?\nDelete this employee record? This cannot be undone.`)) return;
  try{
    await deleteDoc(doc(db, 'employees', id, 'private', 'data')).catch(() => {});
    await deleteDoc(doc(db, 'employees', id));
    if (emp && emp.photoURL) deleteStoragePhoto(emp.photoURL);
    toast('සේවකයා ඉවත් කරන ලදී / Employee removed');
  }catch(err){
    toast('දෝෂයක්: ' + err.message, 'err');
  }
}

/* ============================================================================
   REAUTHENTICATION (unlock sensitive fields)
   ============================================================================ */
const reauthBackdrop = $('#reauthModalBackdrop');
$('#reauthModalClose').addEventListener('click', () => closeReauth(false));
$('#reauthCancel').addEventListener('click', () => closeReauth(false));
$('#reauthConfirm').addEventListener('click', async () => {
  const pw = $('#reauthPassword').value;
  const errBox = $('#reauthError');
  errBox.classList.remove('show');
  if (!pw){ return; }
  try{
    const cred = EmailAuthProvider.credential(currentUser.email, pw);
    await reauthenticateWithCredential(currentUser, cred);
    closeReauth(true);
  }catch(err){
    errBox.textContent = 'මුරපදය වැරදිය / Incorrect password.';
    errBox.classList.add('show');
  }
});

function requestReauth(){
  $('#reauthPassword').value = '';
  $('#reauthError').classList.remove('show');
  openModalEl(reauthBackdrop);
  return new Promise((resolve) => { reauthResolve = resolve; });
}
function closeReauth(success){
  closeModalEl(reauthBackdrop, () => {
    if (reauthResolve){ reauthResolve(success); reauthResolve = null; }
  });
}

/* ============================================================================
   EXPORT TO EXCEL
   ============================================================================ */
const SENSITIVE_KEYS = new Set(FIELD_SCHEMA.filter(f => f.sensitive).map(f => f.key));
$('#exportBtn').addEventListener('click', () => {
  if (typeof XLSX === 'undefined'){ toast('Export library not loaded', 'err'); return; }
  // Staff cannot see designation/bank/EPF details on screen — the export
  // must respect that same restriction instead of silently dumping every
  // sensitive column into the downloaded file.
  const canSeeSensitive = currentRole === 'admin';
  const columns = canSeeSensitive ? EXPORT_COLUMNS : EXPORT_COLUMNS.filter(([key]) => !SENSITIVE_KEYS.has(key));
  const header = columns.map(c => c[1]);
  const rows = employees.map(e => {
    const merged = canSeeSensitive ? mergedEmployee(e) : e;
    return columns.map(([key]) => merged[key] || '');
  });
  const sheetData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = header.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  const stamp = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `WARAKAPOLA_CGLP_EMPLOYEE_Export_${stamp}.xlsx`);
  toast('Excel ගොනුව බාගත විය / Excel file downloaded');
});

/* ============================================================================
   USERS (super admin only) — tabs: Requests / Online Now / All Users / Add User
   ============================================================================ */
function displayName(u){
  return u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—';
}
function filterUsers(list, term){
  term = (term || '').toLowerCase().trim();
  if (!term) return list;
  return list.filter(u => [displayName(u), u.email, u.phone].some(v => (v || '').toLowerCase().includes(term)));
}
function formatDate(ts){
  if (!ts || !ts.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function formatRelative(ts){
  if (!ts || !ts.toDate) return '—';
  const diffSec = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
  if (diffSec < 60) return 'දැන් / just now';
  if (diffSec < 3600) return Math.floor(diffSec / 60) + ' min ago';
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + ' hr ago';
  return ts.toDate().toLocaleDateString('en-GB');
}
function isOnline(uid){
  const p = presenceCache[uid];
  if (!p || p.online === false) return false;
  if (!p.lastActive || !p.lastActive.toDate) return false;
  return (Date.now() - p.lastActive.toDate().getTime()) < PRESENCE_TIMEOUT_MS;
}

/* Admin tab switching */
$$('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.admin-tab').forEach(t => t.classList.toggle('active', t === tab));
    $$('.admin-tab-panel').forEach(p => p.classList.add('hidden'));
    const panel = $('#tab-' + tab.dataset.tab);
    if (panel) panel.classList.remove('hidden');
  });
});
$('#onlineSearchInput') && $('#onlineSearchInput').addEventListener('input', renderAdminPanels);
$('#allUsersSearchInput') && $('#allUsersSearchInput').addEventListener('input', renderAdminPanels);

function renderAdminPanels(){
  if (!isSuperAdmin) return;
  const pending = allUsersCache.filter(u => u.status === 'pending');
  const online  = allUsersCache.filter(u => isOnline(u.id));
  renderRequestsTable(pending);
  renderOnlineTable(online, $('#onlineSearchInput') ? $('#onlineSearchInput').value : '');
  renderAllUsersTable(allUsersCache, $('#allUsersSearchInput') ? $('#allUsersSearchInput').value : '');
}

function renderRequestsTable(list){
  const body = $('#requestsTableBody');
  $('#requestsEmpty').classList.toggle('hidden', list.length !== 0);
  const countEl = $('#tabCountRequests');
  countEl.textContent = list.length;
  countEl.classList.toggle('hidden', list.length === 0);
  const badge = $('#pendingBadge');
  if (badge){ badge.textContent = list.length; badge.classList.toggle('hidden', list.length === 0); }

  body.innerHTML = list.map(u => `
    <tr>
      <td>${escapeHtml(displayName(u))}</td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${escapeHtml(u.phone || '—')}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td style="text-align:right;">
        <div class="row-actions" style="justify-content:flex-end;">
          <button class="btn btn-gold btn-sm" data-approve="${u.id}">✅ අනුමත / Approve</button>
          <button class="btn btn-ghost btn-sm" data-reject="${u.id}">✕ ප්‍රතික්ෂේප / Reject</button>
        </div>
      </td>
    </tr>`).join('');

  // Scoped to THIS table's body only — see note above renderOnlineTable for why.
  Array.from(body.querySelectorAll('[data-approve]')).forEach(btn => btn.addEventListener('click', () => approveUser(btn.dataset.approve)));
  Array.from(body.querySelectorAll('[data-reject]')).forEach(btn => btn.addEventListener('click', () => rejectUser(btn.dataset.reject)));
}

/* NOTE on scoping: "Online Now" and "All Users" both render rows with
   data-kick / data-toggle-edit buttons (a user can be online AND appear
   in both tables at once). renderAdminPanels() re-runs on every /users or
   /presence snapshot (e.g. every ~25s heartbeat while this page is open).
   Using the global $$ helper here previously re-queried the WHOLE document
   each render, so re-rendering one table also re-attached a fresh listener
   to the OTHER table's still-on-screen buttons — causing "Force logout" /
   "Allow self-edit" to silently fire twice (double toast, wasted writes)
   after the page had been open a little while. Scoping queries to each
   table's own <tbody> fixes this. */
function renderOnlineTable(list, searchTerm){
  const filtered = filterUsers(list, searchTerm);
  const body = $('#onlineTableBody');
  $('#onlineEmpty').classList.toggle('hidden', filtered.length !== 0);
  const countEl = $('#tabCountOnline');
  countEl.textContent = list.length;
  countEl.classList.toggle('hidden', list.length === 0);

  body.innerHTML = filtered.map(u => {
    const p = presenceCache[u.id];
    const isSelf = currentUser && u.id === currentUser.uid;
    return `
    <tr>
      <td><span class="online-dot" title="Online"></span></td>
      <td>${escapeHtml(displayName(u))} ${isSelf ? '<span class="si" style="color:var(--ink-500);">(ඔබම / you)</span>' : ''}</td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${formatRelative(p && p.lastActive)}</td>
      <td style="text-align:right;">
        ${isSelf ? '' : `
        <div class="row-actions" style="justify-content:flex-end; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" data-toggle-edit="${u.id}" data-can-edit="${u.canEditProfile ? '1' : '0'}">
            ${u.canEditProfile ? '🔒 Revoke self-edit' : '🔓 Allow self-edit'}
          </button>
          <button class="btn btn-danger btn-sm" data-kick="${u.id}">ඉවත් කරන්න / Force logout</button>
        </div>`}
      </td>
    </tr>`;
  }).join('');

  Array.from(body.querySelectorAll('[data-kick]')).forEach(btn => btn.addEventListener('click', () => forceLogoutUser(btn.dataset.kick)));
  Array.from(body.querySelectorAll('[data-toggle-edit]')).forEach(btn => btn.addEventListener('click', () => toggleCanEditProfile(btn.dataset.toggleEdit, btn.dataset.canEdit === '1')));
}

function renderAllUsersTable(list, searchTerm){
  const filtered = filterUsers(list, searchTerm);
  const body = $('#usersTableBody');
  body.innerHTML = filtered.map(u => {
    const online = isOnline(u.id);
    const isSelf = currentUser && u.id === currentUser.uid;
    const statusBadge = u.status === 'pending'  ? '<span class="badge badge-pending">Pending</span>'
                       : u.status === 'disabled' ? '<span class="badge badge-disabled">Disabled</span>'
                       : u.status === 'rejected' ? '<span class="badge badge-rejected">Rejected</span>'
                       : '<span class="badge badge-online">Approved</span>';
    return `
    <tr>
      <td>${online ? '<span class="online-dot" title="Online"></span>' : '<span class="offline-dot" title="Offline"></span>'}</td>
      <td>${escapeHtml(displayName(u))}${isSelf ? ' <span class="si" style="color:var(--ink-500);">(ඔබම / you)</span>' : ''}
        <div class="emp-sub">${escapeHtml(u.phone || '')}</div></td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${statusBadge}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-gold' : 'badge-green'}">${u.role || 'staff'}</span></td>
      <td style="text-align:right;">
        ${isSelf ? '<span class="si" style="font-size:11.5px; color:var(--ink-500);">(ඔබම / you)</span>' : `
        <div class="row-actions" style="justify-content:flex-end; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" data-toggle-role="${u.id}" data-current-role="${u.role || 'staff'}">
            ${u.role === 'admin' ? 'Make Staff' : 'Make Admin'}
          </button>
          <button class="btn btn-ghost btn-sm" data-toggle-edit="${u.id}" data-can-edit="${u.canEditProfile ? '1' : '0'}">
            ${u.canEditProfile ? '🔒 Revoke edit' : '🔓 Allow edit'}
          </button>
          <button class="btn btn-ghost btn-sm" data-toggle-status="${u.id}" data-current-status="${u.status || 'approved'}">
            ${u.status === 'disabled' ? '✅ Enable' : '🚫 Disable'}
          </button>
          ${online ? `<button class="btn btn-danger btn-sm" data-kick="${u.id}">Force logout</button>` : ''}
          <button class="icon-btn danger" data-delete-user="${u.id}" title="Delete account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>`}
      </td>
    </tr>`;
  }).join('');

  Array.from(body.querySelectorAll('[data-toggle-role]')).forEach(btn => btn.addEventListener('click', async () => {
    const uid = btn.dataset.toggleRole;
    const nextRole = btn.dataset.currentRole === 'admin' ? 'staff' : 'admin';
    try{
      await updateDoc(doc(db, 'users', uid), { role: nextRole });
      toast(nextRole === 'admin' ? 'Admin බලය ලබාදෙන ලදී / Promoted to Admin' : 'Staff බලයට වෙනස් කරන ලදී / Changed to Staff');
    }catch(err){ toast('දෝෂයක්: ' + err.message, 'err'); }
  }));
  Array.from(body.querySelectorAll('[data-toggle-status]')).forEach(btn => btn.addEventListener('click', async () => {
    const uid = btn.dataset.toggleStatus;
    const next = btn.dataset.currentStatus === 'disabled' ? 'approved' : 'disabled';
    try{
      await updateDoc(doc(db, 'users', uid), { status: next });
      toast(next === 'disabled' ? 'ගිණුම අක්‍රීය කරන ලදී / Account disabled' : 'ගිණුම සක්‍රීය කරන ලදී / Account re-enabled');
    }catch(err){ toast('දෝෂයක්: ' + err.message, 'err'); }
  }));
  Array.from(body.querySelectorAll('[data-toggle-edit]')).forEach(btn => btn.addEventListener('click', () => toggleCanEditProfile(btn.dataset.toggleEdit, btn.dataset.canEdit === '1')));
  Array.from(body.querySelectorAll('[data-kick]')).forEach(btn => btn.addEventListener('click', () => forceLogoutUser(btn.dataset.kick)));
  Array.from(body.querySelectorAll('[data-delete-user]')).forEach(btn => btn.addEventListener('click', async () => {
    const uid = btn.dataset.deleteUser;
    if (!confirm('මෙම ගිණුමේ ප්‍රවේශය සම්පූර්ණයෙන් ඉවත් කරන්නද?\nRemove this account\'s access to the site completely? This cannot be undone from here.')) return;
    try{
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'presence', uid)).catch(() => {});
      toast('ගිණුම ඉවත් කරන ලදී / Account removed');
    }catch(err){ toast('දෝෂයක්: ' + err.message, 'err'); }
  }));
}

async function approveUser(uid){
  try{
    await updateDoc(doc(db, 'users', uid), { status:'approved', approvedAt: serverTimestamp(), approvedBy: currentUser.uid });
    toast('ගිණුම අනුමත කරන ලදී / Account approved — they can now sign in');
  }catch(err){ toast('දෝෂයක්: ' + err.message, 'err'); }
}
async function rejectUser(uid){
  if (!confirm('මෙම ඉල්ලීම ප්‍රතික්ෂේප කරන්නද? / Reject this sign-up request?')) return;
  try{
    await updateDoc(doc(db, 'users', uid), { status:'rejected', rejectedAt: serverTimestamp(), rejectedBy: currentUser.uid });
    toast('ඉල්ලීම ප්‍රතික්ෂේප කරන ලදී / Request rejected');
  }catch(err){ toast('දෝෂයක්: ' + err.message, 'err'); }
}
async function forceLogoutUser(uid){
  try{
    await setDoc(doc(db, 'presence', uid), { forceLogoutAt: serverTimestamp() }, { merge:true });
    toast('පරිශීලකයා ඉවත් කරනු ලැබේ / They will be signed out shortly');
  }catch(err){ toast('දෝෂයක්: ' + err.message, 'err'); }
}
async function toggleCanEditProfile(uid, current){
  try{
    await updateDoc(doc(db, 'users', uid), { canEditProfile: !current });
    toast(!current ? 'තමන්ගේ තොරතුරු වෙනස් කිරීමට අවසර දෙන ලදී / Self-edit allowed' : 'තමන්ගේ තොරතුරු වෙනස් කිරීමේ අවසරය ඉවත් කරන ලදී / Self-edit revoked');
  }catch(err){ toast('දෝෂයක්: ' + err.message, 'err'); }
}

/* Generate a readable-but-strong random password */
function genPassword(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i=0;i<10;i++) pw += chars[Math.floor(Math.random()*chars.length)];
  return pw;
}
$('#genPasswordBtn') && $('#genPasswordBtn').addEventListener('click', () => {
  $('#newUserPassword').value = genPassword();
});

/* Create a brand-new login account without disturbing the currently signed-in
   admin's own session. Trick: sign the new user up on a throwaway *secondary*
   Firebase app instance (its own isolated auth state), write their profile
   doc from the main (admin) session, then tear the secondary instance down.
   The admin is never signed out. */
async function createUserAccount({ name, email, password, role }){
  const secondaryApp = initializeApp(firebaseConfig, 'secondary-' + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  try{
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, 'users', uid), {
      email, name: name || email.split('@')[0],
      role: role === 'admin' ? 'admin' : 'staff',
      status: 'approved',
      canEditProfile: false,
      createdAt: serverTimestamp(),
      createdBy: currentUser ? currentUser.uid : null
    });
    await signOut(secondaryAuth);
    return { ok:true };
  }catch(err){
    return { ok:false, err };
  }finally{
    deleteApp(secondaryApp).catch(()=>{});
  }
}

const addUserForm = $('#addUserForm');
if (addUserForm){
  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#newUserName').value.trim();
    const email = $('#newUserEmail').value.trim();
    const password = $('#newUserPassword').value;
    const role = $('#newUserRole').value;
    const btn = $('#addUserBtn');
    setBtnLoading(btn, true);
    const result = await createUserAccount({ name, email, password, role });
    setBtnLoading(btn, false);
    if (result.ok){
      toast(`ගිණුම හදන ලදී / Account created — share ${email} + password with them`);
      addUserForm.reset();
    } else {
      toast(friendlyAuthError(result.err), 'err');
    }
  });
}
