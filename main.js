/* ============================================================================
   Ceylon Green Life Plantation (Pvt) Ltd — Employee Management System
   Design tokens
   - Display type : Fraunces (warm, organic serif — estate/heritage feel)
   - Body / UI type: Inter (clean, highly legible for data-entry staff)
   - Palette: deep tea-estate green + antique gold + warm cream
   ============================================================================ */

@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  /* Greens — from deep canopy shade to fresh new-leaf */
  --forest-950:#0a2a1f;
  --forest-900:#0e3826;
  --forest-800:#144a33;
  --forest-700:#1c5f41;
  --forest-600:#237450;
  --forest-500:#2e8b57;
  --forest-100:#e4f0e8;

  /* Gold — antique, not neon */
  --gold-700:#8a6a1f;
  --gold-500:#c8a24a;
  --gold-400:#d9b968;
  --gold-300:#e9d29a;
  --gold-100:#f6ecd2;

  /* Cream / paper */
  --cream-50:#fffdf8;
  --cream-100:#faf6ec;
  --cream-200:#f2ecdc;

  --ink-900:#142018;
  --ink-700:#33422f;
  --ink-500:#5c6b56;
  --ink-300:#93a08c;

  --danger:#a13d2e;
  --danger-bg:#fbe9e5;
  --ok:#2e8b57;
  --ok-bg:#e4f0e8;

  --radius-sm:8px;
  --radius-md:14px;
  --radius-lg:22px;

  --shadow-card: 0 1px 2px rgba(10,42,31,.06), 0 8px 24px -8px rgba(10,42,31,.18);
  --shadow-pop:  0 12px 40px -12px rgba(10,42,31,.35);

  --font-display:'Fraunces', ui-serif, Georgia, serif;
  --font-body:'Inter', system-ui, -apple-system, sans-serif;
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  font-family:var(--font-body);
  color:var(--ink-900);
  background:var(--cream-100);
  -webkit-font-smoothing:antialiased;
}
img{ max-width:100%; display:block; }
button{ font-family:inherit; }
a{ color:inherit; }
::selection{ background:var(--gold-300); color:var(--ink-900); }

:focus-visible{
  outline:3px solid var(--gold-500);
  outline-offset:2px;
  border-radius:4px;
}

.hidden{ display:none !important; }

/* ============================================================================
   LOGIN SCREEN
   Signature element: a slow-drifting "canopy" of tea-leaf silhouettes and soft
   gold light shafts over a deep-green gradient, with the plug-and-leaf mark
   glowing gently — evokes dawn mist over a tea estate. Reduced-motion safe.
   ============================================================================ */
.login-screen{
  position:relative;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  background:
    radial-gradient(1100px 700px at 18% -10%, rgba(200,162,74,.16), transparent 60%),
    radial-gradient(900px 900px at 100% 100%, rgba(46,139,87,.25), transparent 55%),
    linear-gradient(160deg, var(--forest-950) 0%, var(--forest-900) 45%, var(--forest-800) 100%);
  background-size:100% 100%, 100% 100%, 220% 220%;
  animation:bgPan 22s ease-in-out infinite;
  padding:24px;
  transition:opacity .5s ease, transform .5s ease;
}
@keyframes bgPan{
  0%,100%{ background-position:0 0, 0 0, 0% 50%; }
  50%{ background-position:0 0, 0 0, 100% 50%; }
}
.login-screen.leaving{ opacity:0; transform:scale(1.03); }

.login-canopy{ position:absolute; inset:0; z-index:0; pointer-events:none; }
.firefly-canvas{ position:absolute; inset:0; width:100%; height:100%; z-index:1; }
.ground-glow{
  position:absolute; left:50%; bottom:-10%; width:900px; height:340px; transform:translateX(-50%);
  background:radial-gradient(closest-side, rgba(46,139,87,.35), transparent 70%);
  filter:blur(20px); z-index:1;
  animation:groundPulse 6s ease-in-out infinite;
}
@keyframes groundPulse{ 0%,100%{ opacity:.6; } 50%{ opacity:1; } }

.leaf-field{ position:absolute; inset:0; overflow:hidden; }
.leaf{
  position:absolute;
  top:-12%;
  width:34px; height:34px;
  opacity:.55;
  filter:drop-shadow(0 6px 10px rgba(0,0,0,.25));
  animation:leafFall linear infinite;
}
.leaf svg{ width:100%; height:100%; }

@keyframes leafFall{
  0%   { transform:translate3d(0,-10vh,0) rotate(0deg); }
  100% { transform:translate3d(var(--drift,40px), 115vh,0) rotate(var(--spin,220deg)); }
}

.light-shaft{
  position:absolute; top:-20%; width:140px; height:140%;
  background:linear-gradient(180deg, rgba(233,210,154,.16), transparent 70%);
  transform:rotate(12deg);
  filter:blur(6px);
  animation:shaftGlow 7s ease-in-out infinite;
}
.light-shaft.s1{ left:8%; animation-delay:0s; }
.light-shaft.s2{ left:46%; animation-delay:2.3s; }
.light-shaft.s3{ left:78%; animation-delay:4.6s; }
@keyframes shaftGlow{
  0%,100%{ opacity:.35; }
  50%{ opacity:.7; }
}

@media (prefers-reduced-motion: reduce){
  .leaf, .light-shaft, .login-screen, .login-card-border, .login-logo,
  .ground-glow, .reveal-word, .btn, .stat-value, .nav-pill{ animation:none !important; }
  .firefly-canvas{ display:none; }
}

.login-card{
  position:relative;
  z-index:2;
  width:100%;
  max-width:420px;
  background:rgba(255,253,248,.97);
  border-radius:var(--radius-lg);
  box-shadow:var(--shadow-pop);
  padding:40px 36px 32px;
  border:1px solid rgba(200,162,74,.35);
  animation:cardRise .8s cubic-bezier(.2,.8,.2,1) both;
  transition:opacity .4s ease, transform .4s ease;
  will-change:transform;
}
.login-card.leaving{ opacity:0; transform:translateY(-10px) scale(.97); }
@keyframes cardRise{
  from{ opacity:0; transform:translateY(24px) scale(.96); }
  to{ opacity:1; transform:translateY(0) scale(1); }
}
.login-card-border{
  position:absolute; inset:-1px; border-radius:inherit; padding:1px;
  background:conic-gradient(from var(--ang,0deg), rgba(200,162,74,0) 0%, var(--gold-400) 12%, rgba(200,162,74,0) 26%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude;
  animation:borderSpin 5s linear infinite;
  pointer-events:none; z-index:0;
}
@keyframes borderSpin{ to{ --ang:360deg; } }
@property --ang{ syntax:'<angle>'; inherits:false; initial-value:0deg; }

.login-logo{
  width:88px; height:88px; margin:0 auto 14px;
  display:flex; align-items:center; justify-content:center;
  animation:logoPop .8s cubic-bezier(.2,.8,.2,1) .1s both, logoGlow 3.2s ease-in-out 1s infinite;
  filter:drop-shadow(0 0 0 rgba(200,162,74,0));
  position:relative; z-index:1;
}
.login-logo img{ width:100%; height:100%; object-fit:contain; }
@keyframes logoPop{
  from{ opacity:0; transform:scale(.6) rotate(-8deg); }
  to{ opacity:1; transform:scale(1) rotate(0); }
}
@keyframes logoGlow{
  0%,100%{ filter:drop-shadow(0 0 4px rgba(233,210,154,.15)); }
  50%{ filter:drop-shadow(0 0 18px rgba(233,210,154,.55)); }
}

.login-titles{ text-align:center; margin-bottom:26px; position:relative; z-index:1; }
.login-titles .brand-en{
  font-family:var(--font-display);
  font-size:22px; font-weight:600; letter-spacing:.2px;
  color:var(--forest-800); margin:0;
}
.reveal-word{
  display:inline-block;
  opacity:0;
  animation:wordUp .55s cubic-bezier(.2,.8,.2,1) both;
  animation-delay:calc(.3s + var(--d) * .08s);
}
@keyframes wordUp{
  from{ opacity:0; transform:translateY(10px); }
  to{ opacity:1; transform:translateY(0); }
}
.login-titles .brand-si{
  font-size:14px; color:var(--ink-500); margin:4px 0 0;
}
.login-titles .brand-sub{
  margin-top:10px; font-size:12.5px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--gold-700); font-weight:700;
}

.field{ margin-bottom:16px; }
.field label{
  display:block; font-size:12.5px; font-weight:700; color:var(--ink-700);
  margin-bottom:6px; letter-spacing:.02em;
}
.field .si{ font-weight:500; color:var(--ink-500); }

.input-wrap{ position:relative; }
.input-wrap svg{
  position:absolute; left:12px; top:50%; transform:translateY(-50%);
  width:18px; height:18px; color:var(--ink-300);
}
input[type=text], input[type=email], input[type=password], input[type=tel], input[type=date], input[type=number], select, textarea{
  width:100%;
  padding:11px 14px 11px 40px;
  border-radius:var(--radius-sm);
  border:1.5px solid var(--cream-200);
  background:var(--cream-50);
  font-size:14.5px;
  color:var(--ink-900);
  transition:border-color .15s, box-shadow .15s;
}
input:not(.input-wrap input), select:not(.input-wrap select), textarea{
  padding-left:14px;
}
input:focus, select:focus, textarea:focus{
  border-color:var(--forest-500);
  box-shadow:0 0 0 3px rgba(46,139,87,.14);
  outline:none;
}
textarea{ resize:vertical; min-height:64px; }

.btn{
  position:relative; overflow:hidden;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  border:none; cursor:pointer;
  padding:11px 20px;
  border-radius:var(--radius-sm);
  font-weight:700; font-size:14px;
  transition:transform .1s ease, box-shadow .2s ease, background .15s ease;
}
.btn:active{ transform:translateY(1px) scale(.99); }
.btn:not([disabled]):hover{ box-shadow:0 4px 14px -4px rgba(10,42,31,.35); }
.ripple{
  position:absolute; border-radius:50%; pointer-events:none;
  background:rgba(255,255,255,.55); transform:scale(0); opacity:.9;
  animation:rippleOut .55s ease-out forwards;
}
.btn-ghost .ripple{ background:rgba(35,116,80,.25); }
@keyframes rippleOut{ to{ transform:scale(1); opacity:0; } }
@media (prefers-reduced-motion: reduce){ .ripple{ animation:none !important; display:none; } }
.btn-block{ width:100%; }
.btn-primary{
  background:linear-gradient(180deg, var(--forest-600), var(--forest-700));
  color:#fff;
  box-shadow:0 8px 20px -8px rgba(20,74,51,.6);
}
.btn-primary:hover{ background:linear-gradient(180deg, var(--forest-500), var(--forest-600)); }
.btn-gold{
  background:linear-gradient(180deg, var(--gold-400), var(--gold-500));
  color:var(--ink-900);
  box-shadow:0 8px 20px -8px rgba(138,106,31,.5);
}
.btn-gold:hover{ background:linear-gradient(180deg, var(--gold-300), var(--gold-400)); }
.btn-ghost{
  background:transparent; color:var(--forest-700);
  border:1.5px solid var(--forest-600);
}
.btn-ghost:hover{ background:var(--forest-100); }
.btn-danger{ background:var(--danger); color:#fff; }
.btn-danger:hover{ filter:brightness(1.06); }
.btn-sm{ padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn[disabled]{ opacity:.5; cursor:not-allowed; }

.login-error{
  background:var(--danger-bg); color:var(--danger);
  border:1px solid rgba(161,61,46,.25);
  padding:10px 12px; border-radius:10px; font-size:13px;
  margin-bottom:14px; display:none;
}
.login-error.show{ display:block; }

.login-foot{
  text-align:center; margin-top:18px; font-size:12px; color:var(--ink-500);
}

/* Launch transition — brief "sprout growing" moment between login and dashboard */
.launch-overlay{
  position:fixed; inset:0; z-index:200;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;
  background:linear-gradient(160deg, var(--forest-950) 0%, var(--forest-900) 45%, var(--forest-800) 100%);
  animation:fadeIn .3s ease both;
}
.launch-overlay.hidden{ display:none; }
.launch-sprout{ width:120px; height:120px; }
#sproutStem{ stroke-dasharray:60; stroke-dashoffset:60; animation:drawStem .7s ease .1s forwards; }
#sproutLeafL{ opacity:0; transform-origin:50px 46px; animation:unfurl .5s ease .55s forwards; }
#sproutLeafR{ opacity:0; transform-origin:50px 40px; animation:unfurl .5s ease .8s forwards; }
@keyframes drawStem{ to{ stroke-dashoffset:0; } }
@keyframes unfurl{ from{ opacity:0; transform:scale(.3) rotate(-12deg); } to{ opacity:1; transform:scale(1) rotate(0); } }
@keyframes fadeIn{ from{ opacity:0; } to{ opacity:1; } }
.launch-text{ color:var(--gold-200,#f6ecd2); font-size:13px; letter-spacing:.03em; animation:fadeIn .4s ease .3s both; }

@media (prefers-reduced-motion: reduce){
  .launch-overlay, #sproutStem, #sproutLeafL, #sproutLeafR, .launch-text{ animation:none !important; }
  #sproutStem{ stroke-dashoffset:0; } #sproutLeafL, #sproutLeafR{ opacity:1; }
}

/* ============================================================================
   APP SHELL
   ============================================================================ */
.app-shell{ min-height:100vh; display:flex; }

.sidebar{
  width:252px; flex:none;
  background:linear-gradient(180deg, var(--forest-900), var(--forest-950));
  color:var(--cream-100);
  display:flex; flex-direction:column;
  position:sticky; top:0; height:100vh;
}
.sidebar-brand{
  display:flex; align-items:center; gap:10px;
  padding:20px 18px 16px;
  border-bottom:1px solid rgba(233,210,154,.14);
}
.sidebar-brand img{ width:38px; height:38px; object-fit:contain; }
.sidebar-brand .name-en{ font-family:var(--font-display); font-size:15px; font-weight:600; line-height:1.25; }
.sidebar-brand .name-si{ font-size:11px; color:var(--gold-300); }

.nav{ padding:14px 10px; flex:1; overflow-y:auto; position:relative; }
.nav-pill{
  position:absolute; left:10px; right:10px; height:0; border-radius:10px;
  background:rgba(200,162,74,.18); border:1px solid rgba(200,162,74,.4);
  transition:transform .28s cubic-bezier(.2,.8,.2,1), height .28s ease;
  z-index:0; pointer-events:none;
}
.nav-item{
  position:relative; z-index:1;
  display:flex; align-items:center; gap:10px;
  padding:11px 12px; border-radius:10px; margin-bottom:3px;
  font-size:14px; font-weight:600; color:rgba(250,246,236,.82);
  cursor:pointer; border:1px solid transparent;
  transition:background .15s ease, color .15s ease, transform .15s ease;
}
.nav-item svg{ width:18px; height:18px; flex:none; transition:transform .2s ease; }
.nav-item .si{ font-weight:400; font-size:11.5px; color:rgba(250,246,236,.5); display:block; }
.nav-item:hover{ background:rgba(255,255,255,.06); transform:translateX(2px); }
.nav-item:hover svg{ transform:scale(1.1); }
.nav-item.active{ color:#fff; }

.sidebar-foot{ padding:14px 14px 18px; border-top:1px solid rgba(233,210,154,.14); }
.user-chip{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.user-avatar{
  width:34px; height:34px; border-radius:50%; background:var(--gold-500);
  display:flex; align-items:center; justify-content:center;
  font-weight:800; color:var(--ink-900); font-size:13px; flex:none;
}
.user-meta{ min-width:0; }
.user-meta .u-name{ font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.user-meta .u-role{ font-size:11px; color:var(--gold-300); }

.main{ flex:1; min-width:0; display:flex; flex-direction:column; }
.topbar{
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 26px; background:var(--cream-50);
  border-bottom:1px solid var(--cream-200);
  position:sticky; top:0; z-index:5;
}
.topbar h1{
  font-family:var(--font-display); font-size:21px; margin:0; color:var(--forest-800);
}
.topbar .sub{ font-size:12.5px; color:var(--ink-500); margin-top:2px; }
.menu-toggle{ display:none; }

.content{ padding:24px 26px 60px; }

.view{ animation:viewIn .35s cubic-bezier(.2,.8,.2,1) both; }
@keyframes viewIn{
  from{ opacity:0; transform:translateY(10px); }
  to{ opacity:1; transform:translateY(0); }
}
@media (prefers-reduced-motion: reduce){ .view{ animation:none !important; } }

/* Stat cards */
.stats-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:16px; margin-bottom:26px; }
.stat-card{
  background:var(--cream-50); border-radius:var(--radius-md); padding:18px 20px;
  box-shadow:var(--shadow-card); border:1px solid var(--cream-200);
  transition:transform .18s ease, box-shadow .18s ease;
  animation:cardRise .5s cubic-bezier(.2,.8,.2,1) both;
}
.stat-card:hover{ transform:translateY(-3px); box-shadow:0 14px 30px -12px rgba(10,42,31,.28); }
.stat-card .stat-label{ font-size:12px; color:var(--ink-500); font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
.stat-card .stat-value{ font-family:var(--font-display); font-size:32px; color:var(--forest-800); margin-top:6px; font-variant-numeric:tabular-nums; }
.stat-card.gold{ border-color:var(--gold-300); }
.stat-card.gold .stat-value{ color:var(--gold-700); }
@media (prefers-reduced-motion: reduce){ .stat-card{ animation:none !important; } }

/* Cards / panels */
.panel{
  background:var(--cream-50); border-radius:var(--radius-md);
  box-shadow:var(--shadow-card); border:1px solid var(--cream-200);
  padding:22px;
}
.panel + .panel{ margin-top:18px; }
.panel-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; gap:12px; flex-wrap:wrap; }
.panel-head h2{ font-family:var(--font-display); font-size:18px; margin:0; color:var(--forest-800); }
.panel-head .si{ display:block; font-size:11.5px; font-weight:500; color:var(--ink-500); }

.toolbar{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.search-box{ position:relative; min-width:220px; flex:1; }
.search-box svg{ position:absolute; left:11px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--ink-300); }
.search-box input{ padding-left:36px; }
.filter-select{ min-width:150px; width:auto; }

/* Table */
.table-wrap{ overflow-x:auto; border-radius:var(--radius-sm); border:1px solid var(--cream-200); }
table{ width:100%; border-collapse:collapse; font-size:13.5px; min-width:760px; }
thead th{
  text-align:left; background:var(--forest-100); color:var(--forest-800);
  padding:11px 14px; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:.04em;
  white-space:nowrap; position:sticky; top:0;
}
tbody td{ padding:11px 14px; border-top:1px solid var(--cream-200); vertical-align:middle; }
tbody tr{ animation:rowIn .3s ease both; animation-delay:calc(var(--i,0) * 0.035s); transition:background .12s ease; }
tbody tr:hover{ background:var(--cream-100); }
@keyframes rowIn{ from{ opacity:0; transform:translateX(-6px); } to{ opacity:1; transform:translateX(0); } }
@media (prefers-reduced-motion: reduce){ tbody tr{ animation:none !important; } }
.emp-photo{ width:34px; height:34px; border-radius:50%; object-fit:cover; background:var(--forest-100); border:1px solid var(--cream-200); transition:transform .15s ease; }
tbody tr:hover .emp-photo{ transform:scale(1.08); }
.emp-name{ font-weight:700; color:var(--ink-900); }
.emp-sub{ font-size:11.5px; color:var(--ink-500); }

.badge{ display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700; }
.badge-green{ background:var(--ok-bg); color:var(--forest-700); }
.badge-gold{ background:var(--gold-100); color:var(--gold-700); }
.badge-lock{ background:#fdf2e3; color:#8a5a1f; }

.row-actions{ display:flex; gap:6px; }
.icon-btn{
  width:30px; height:30px; border-radius:8px; border:1px solid var(--cream-200); background:#fff;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
}
.icon-btn svg{ width:15px; height:15px; color:var(--ink-700); }
.icon-btn:hover{ background:var(--forest-100); }
.icon-btn.danger:hover{ background:var(--danger-bg); }

.empty-state{ text-align:center; padding:50px 20px; color:var(--ink-500); }
.empty-state svg{ width:52px; height:52px; margin:0 auto 12px; color:var(--gold-400); }

/* Modal */
.modal-backdrop{
  position:fixed; inset:0; background:rgba(10,42,31,.55);
  display:flex; align-items:flex-start; justify-content:center;
  padding:40px 16px; overflow-y:auto; z-index:50;
  backdrop-filter:blur(2px);
}
.modal{
  background:var(--cream-50); border-radius:var(--radius-lg); width:100%; max-width:720px;
  box-shadow:var(--shadow-pop); animation:cardRise .35s ease both;
}
.modal-head{
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 22px; border-bottom:1px solid var(--cream-200);
}
.modal-head h3{ font-family:var(--font-display); margin:0; font-size:18px; color:var(--forest-800); }
.modal-head .si{ font-size:11.5px; color:var(--ink-500); font-weight:500; }
.modal-close{ background:none; border:none; cursor:pointer; color:var(--ink-500); padding:4px; }
.modal-body{ padding:22px; max-height:70vh; overflow-y:auto; }
.modal-foot{ padding:16px 22px; border-top:1px solid var(--cream-200); display:flex; justify-content:flex-end; gap:10px; }

.form-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px 16px; }

/* ============================================================================
   SIGN UP SCREEN + misc auth additions
   ============================================================================ */
.link-accent{ color:var(--gold-300); font-weight:600; text-decoration:underline; text-underline-offset:2px; }
.link-accent:hover{ color:var(--gold-100); }
.login-success{
  display:none; background:rgba(46,139,87,.16); border:1px solid rgba(46,139,87,.4);
  color:#d9f0e2; padding:12px 14px; border-radius:var(--radius-sm); font-size:13px; margin-bottom:14px; line-height:1.5;
}
.login-success.show, .login-success:not(.hidden){ display:block; }
.two-col{ display:grid; grid-template-columns:1fr 1fr; gap:0 12px; }
.two-col .field{ margin-bottom:16px; }
@media (max-width:420px){ .two-col{ grid-template-columns:1fr; } }

/* ============================================================================
   Nav pending-count badge
   ============================================================================ */
.nav-item{ position:relative; }
.nav-badge{
  margin-left:auto; background:var(--gold-400); color:var(--forest-950);
  font-size:10.5px; font-weight:800; padding:1px 7px; border-radius:999px; line-height:1.6;
}

/* ============================================================================
   Admin tabs (User Access page)
   ============================================================================ */
.admin-tabs{ display:flex; flex-wrap:wrap; gap:6px; margin-bottom:18px; border-bottom:1px solid var(--cream-200); padding-bottom:0; }
.admin-tab{
  font-family:inherit; font-size:13px; font-weight:600; color:var(--ink-500);
  background:none; border:none; border-bottom:2px solid transparent; padding:10px 6px 12px;
  cursor:pointer; display:flex; align-items:center; gap:6px; transition:color .15s ease, border-color .15s ease;
}
.admin-tab .si{ font-weight:500; }
.admin-tab:hover{ color:var(--forest-700); }
.admin-tab.active{ color:var(--forest-800); border-bottom-color:var(--gold-500); }
.tab-count{
  background:var(--gold-100); color:var(--gold-700); font-size:10.5px; font-weight:800;
  padding:1px 7px; border-radius:999px;
}
.admin-tab-panel.hidden{ display:none; }

/* ============================================================================
   Presence / status indicators
   ============================================================================ */
.online-dot{
  width:9px; height:9px; border-radius:50%; background:var(--ok); display:inline-block;
  box-shadow:0 0 0 3px var(--ok-bg); flex:none;
}
.offline-dot{
  width:9px; height:9px; border-radius:50%; background:var(--ink-300); display:inline-block;
  box-shadow:0 0 0 3px var(--cream-200); flex:none;
}
.badge-pending{ background:#fdf2e3; color:#8a5a1f; }
.badge-disabled{ background:var(--danger-bg); color:var(--danger); }
.badge-rejected{ background:var(--danger-bg); color:var(--danger); }
.badge-online{ background:var(--ok-bg); color:var(--forest-700); }
.form-grid .span-2{ grid-column:1/-1; }
@media (max-width:640px){ .form-grid{ grid-template-columns:1fr; } }

.section-divider{
  grid-column:1/-1; display:flex; align-items:center; gap:10px;
  margin:6px 0 2px; color:var(--ink-500); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
}
.section-divider::after{ content:""; flex:1; height:1px; background:var(--cream-200); }

.sensitive-box{
  grid-column:1/-1; border:1.5px dashed var(--gold-400); background:var(--gold-100);
  border-radius:var(--radius-sm); padding:14px 16px; display:flex; flex-direction:column; gap:10px;
}
.sensitive-box .lock-row{ display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:700; color:var(--gold-700); }
.sensitive-box .lock-row svg{ width:16px; height:16px; }
.sensitive-fields{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.sensitive-fields.locked input, .sensitive-fields.locked select{ background:var(--cream-200); color:var(--ink-500); }

.photo-picker{ display:flex; align-items:center; gap:14px; }
.photo-preview{
  width:76px; height:76px; border-radius:50%; object-fit:cover; background:var(--forest-100);
  border:2px solid var(--gold-300);
}

/* Toast */
.toast-stack{ position:fixed; right:20px; bottom:20px; z-index:80; display:flex; flex-direction:column; gap:10px; }
.toast{
  background:var(--forest-800); color:#fff; padding:12px 16px; border-radius:10px;
  box-shadow:var(--shadow-pop); font-size:13.5px; min-width:220px;
  display:flex; align-items:center; gap:9px;
  animation:toastIn .35s cubic-bezier(.2,.8,.2,1) both;
}
.toast.leaving{ animation:toastOut .25s ease forwards; }
.toast.err{ background:var(--danger); }
.toast.ok{ background:var(--forest-700); }
.toast::before{ content:""; width:8px; height:8px; border-radius:50%; flex:none; background:var(--gold-400); }
.toast.err::before{ background:#fff; }
@keyframes toastIn{ from{ opacity:0; transform:translateX(24px) scale(.96);} to{ opacity:1; transform:none; } }
@keyframes toastOut{ to{ opacity:0; transform:translateX(24px) scale(.96); } }
@media (prefers-reduced-motion: reduce){ .toast{ animation:none !important; } }

.help-text{ font-size:11.5px; color:var(--ink-500); margin-top:4px; }

/* ============================================================================
   Button loading spinner — add/remove `.is-loading` alongside `disabled`.
   Text stays in the DOM (for layout width) but is masked; a spinner overlays.
   ============================================================================ */
.btn.is-loading{ color:transparent !important; pointer-events:none; position:relative; }
.btn.is-loading svg{ opacity:0; }
.btn.is-loading::after{
  content:""; position:absolute; left:50%; top:50%; width:16px; height:16px; margin:-8px 0 0 -8px;
  border-radius:50%; border:2px solid rgba(255,255,255,.45); border-top-color:#fff;
  animation:btnSpin .65s linear infinite;
}
.btn-ghost.is-loading::after, .btn-gold.is-loading::after{
  border-color:rgba(20,74,51,.25); border-top-color:var(--forest-700);
}
@keyframes btnSpin{ to{ transform:rotate(360deg); } }
@media (prefers-reduced-motion: reduce){ .btn.is-loading::after{ animation-duration:1.1s; } }

/* ============================================================================
   Modal open / close transitions
   ============================================================================ */
.modal-backdrop:not(.hidden){ animation:backdropIn .22s ease both; }
@keyframes backdropIn{ from{ opacity:0; } to{ opacity:1; } }
.modal-backdrop.closing{ animation:backdropOut .18s ease forwards !important; }
.modal-backdrop.closing .modal{ animation:modalOut .18s cubic-bezier(.4,0,1,1) forwards !important; }
@keyframes backdropOut{ to{ opacity:0; } }
@keyframes modalOut{ to{ opacity:0; transform:translateY(8px) scale(.96); } }
@media (prefers-reduced-motion: reduce){
  .modal-backdrop:not(.hidden), .modal-backdrop.closing, .modal-backdrop.closing .modal{ animation:none !important; }
}

/* ============================================================================
   Skeleton loading placeholders (shown briefly while Firestore's first
   snapshot is still in flight, so tables never flash a false "empty" state)
   ============================================================================ */
.skel-bar{
  height:12px; border-radius:6px; width:100%;
  background:linear-gradient(90deg, var(--cream-200) 25%, var(--cream-100) 45%, var(--cream-200) 65%);
  background-size:300% 100%;
  animation:skelShine 1.3s ease-in-out infinite;
}
.skel-bar.w-60{ width:60%; }
.skel-bar.w-40{ width:40%; }
.skel-circle{
  width:34px; height:34px; border-radius:50%; flex:none;
  background:linear-gradient(90deg, var(--cream-200) 25%, var(--cream-100) 45%, var(--cream-200) 65%);
  background-size:300% 100%; animation:skelShine 1.3s ease-in-out infinite;
}
@keyframes skelShine{ 0%{ background-position:200% 0; } 100%{ background-position:-100% 0; } }
.skeleton-row td{ padding:13px 14px; }
@media (prefers-reduced-motion: reduce){ .skel-bar, .skel-circle{ animation:none !important; opacity:.7; } }

/* ============================================================================
   Panel scroll-reveal (dashboard / list panels ease up into view once, the
   first time they enter the viewport — subtle, not repeated on every scroll)
   ============================================================================ */
.reveal-up{ opacity:0; transform:translateY(16px); transition:opacity .5s cubic-bezier(.2,.8,.2,1), transform .5s cubic-bezier(.2,.8,.2,1); }
.reveal-up.in{ opacity:1; transform:translateY(0); }
@media (prefers-reduced-motion: reduce){ .reveal-up{ opacity:1; transform:none; transition:none; } }

/* Table sort header affordance */
th.sortable{ cursor:pointer; user-select:none; transition:color .15s ease; }
th.sortable:hover{ color:var(--gold-700); }
th.sortable .sort-arrow{ display:inline-block; margin-left:4px; font-size:10px; transition:transform .18s ease; opacity:.55; }
th.sortable.desc .sort-arrow{ transform:rotate(180deg); }
th.sortable.active .sort-arrow{ opacity:1; }

/* Reauth mini-modal */
.reauth-note{ font-size:12.5px; color:var(--ink-700); background:var(--forest-100); padding:10px 12px; border-radius:8px; margin-bottom:12px; }

@media (max-width:900px){
  .sidebar{ position:fixed; left:0; top:0; height:100vh; transform:translateX(-100%); transition:transform .2s ease; z-index:60; box-shadow:var(--shadow-pop); }
  .sidebar.open{ transform:translateX(0); }
  .menu-toggle{ display:flex; }
  .content{ padding:18px; }
}
