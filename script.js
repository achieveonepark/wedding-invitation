  /* =========================================================
  0) 유틸
  ========================================================= */
  const raf = (fn) => requestAnimationFrame(fn);

  /* =========================================================
  1) BGM (원본 로직 유지 + 안전 가드)
  ========================================================= */
  (() => {
  const audio = document.getElementById('weddingBgm');
  const btn   = document.getElementById('bgmToggle');
  const icon  = document.getElementById('bgmIcon');
  const label = document.getElementById('bgmLabel');

  if (!audio || !btn || !icon) return; // 요소 없으면 건너뜀

  const saved = localStorage.getItem('wedding_bgm') ?? 'on';
  let isOn = saved === 'on';
  let userInteracted = false;

  function updateUI() {
  if (isOn) {
  icon.textContent = '🔊';
  btn.classList.add('is-playing');
  btn.setAttribute('aria-pressed', 'true');
  btn.setAttribute('aria-label', '배경음악 끄기');
} else {
  icon.textContent = '🔇';
  btn.classList.remove('is-playing');
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', '배경음악 켜기');
}
}

  function fadeVolume(target, duration = 700) {
  const start = audio.volume;
  const delta = target - start;
  const t0 = performance.now();
  function step(t) {
  const k = Math.min(1, (t - t0) / duration);
  audio.volume = Math.max(0, Math.min(1, start + delta * k));
  if (k < 1) requestAnimationFrame(step);
}
  requestAnimationFrame(step);
}

  async function ensurePlayingMuted() {
  audio.muted = true;
  audio.volume = 0;
  try { if (audio.paused) await audio.play(); }
  catch (e) { console.debug('Muted preplay blocked until interaction:', e); }
}

  async function unmuteWithFade(targetVol = 0.6) {
  try {
  if (audio.paused) await audio.play();
  audio.muted = false;
  fadeVolume(targetVol, 700);
} catch (e) { console.debug('Unmute failed until user interaction:', e); }
}

  async function turnOn() {
  isOn = true;
  localStorage.setItem('wedding_bgm', 'on');
  updateUI();
  await ensurePlayingMuted();
  if (userInteracted) unmuteWithFade(0.6);
}

  function turnOff() {
  isOn = false;
  localStorage.setItem('wedding_bgm', 'off');
  fadeVolume(0, 300);
  setTimeout(() => { audio.pause(); audio.muted = true; }, 330);
  updateUI();
}

  document.addEventListener('DOMContentLoaded', async () => {
  await ensurePlayingMuted();
  const cover = document.getElementById('cover');
  if (cover) {
  cover.addEventListener('animationend', async () => {
  if (isOn) {
  if (userInteracted) await unmuteWithFade(0.6);
  else btn.classList.add('need-tap');
}
}, { once: true });
}
  updateUI();
});

  const markInteracted = async () => {
  if (userInteracted) return;
  userInteracted = true;
  if (isOn) {
  btn.classList.remove('need-tap');
  await unmuteWithFade(0.6);
} else {
  await ensurePlayingMuted();
}
  window.removeEventListener('pointerdown', markInteracted, { capture: true });
  window.removeEventListener('keydown', markInteracted, { capture: true });
  window.removeEventListener('touchstart', markInteracted, { capture: true, passive: true });
};

  window.addEventListener('pointerdown', markInteracted, { capture: true });
  window.addEventListener('keydown',     markInteracted, { capture: true });
  window.addEventListener('touchstart',  markInteracted, { capture: true, passive: true });

  btn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (isOn) turnOff();
  else {
  await turnOn();
  if (userInteracted) await unmuteWithFade(0.6);
}
});

  document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && isOn) {
  await ensurePlayingMuted();
  if (userInteracted) await unmuteWithFade(audio.volume || 0.6);
}
});
})();

  /* =========================================================
  2) 커버 스크롤락 (원본 유지)
  ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
  const cover = document.getElementById('cover');
  if (!cover) return;

  let scrollY = window.scrollY || window.pageYOffset;
  document.documentElement.classList.add('is-cover-open');
  document.body.classList.add('is-cover-open');
  document.body.style.top = `-${scrollY}px`;

  cover.addEventListener('animationend', () => {
  document.documentElement.classList.remove('is-cover-open');
  document.body.classList.remove('is-cover-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
  cover.remove();
}, { once: true });
});

  /* =========================================================
  3) 모달 열기/닫기 (가운데 고정, .is-open)
  ========================================================= */
  (() => {
  const openBtn = document.getElementById('open-contact-modal-btn');
  const modal   = document.getElementById('contact-modal');
  if (!openBtn || !modal) return;

  const closeBtn = modal.querySelector('.close-button');

  function openModal() {
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  // 탭 초기화(모달 열릴 때 한 번)
  Tabs.init(modal);
}
  function closeModal() {
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

  openBtn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
});
})();

  /* =========================================================
  4) Tabs + Accordion (모듈화)
  - 탭별로 아코디언을 독립 초기화
  - 아코디언: slide down/up + single-open
  ========================================================= */
  const Accordion = (() => {
  function panelOf(d){ return d.querySelector('.acc-panel'); }

  function expand(d) {
  const panel = panelOf(d);
  if (!panel) return;
  panel.style.transition = 'none';
  panel.style.maxHeight = '0px';
  raf(() => {
  const h = panel.scrollHeight;
  panel.style.transition = '';         // CSS transition 사용
  panel.style.maxHeight = h + 'px';
  const onEnd = (ev) => {
  if (ev.propertyName !== 'max-height') return;
  panel.removeEventListener('transitionend', onEnd);
  if (d.open) panel.style.maxHeight = 'none'; // 열린 뒤 자연 높이
};
  panel.addEventListener('transitionend', onEnd);
});
}

  function collapse(d) {
  const panel = panelOf(d);
  if (!panel) return;
  if (panel.style.maxHeight === '' || panel.style.maxHeight === 'none') {
  panel.style.maxHeight = panel.scrollHeight + 'px';
}
  // reflow 후 0으로 접기
  // eslint-disable-next-line no-unused-expressions
  panel.offsetHeight;
  panel.style.maxHeight = '0px';
}

  function init(root) {
  if (!root || root.dataset.accInitialized === '1') return;
  root.dataset.accInitialized = '1';

  const items = Array.from(root.querySelectorAll('.acc-item')); // <details>

  // 초기 높이
  items.forEach(d => {
  const p = panelOf(d);
  if (!p) return;
  p.style.maxHeight = d.open ? 'none' : '0px';
});

  // 단일 열림 + 애니메이션
  items.forEach(d => {
  d.addEventListener('toggle', () => {
  if (d.open) {
  items.forEach(other => {
  if (other !== d && other.open) {
  other.open = false;
  collapse(other);
}
});
  expand(d);
} else {
  collapse(d);
}
});
});

  // 리사이즈 시 열린 패널 유지
  window.addEventListener('resize', () => {
  items.forEach(d => {
  const p = panelOf(d);
  if (p && d.open) p.style.maxHeight = 'none';
});
});
}

  return { init };
})();

  const Tabs = (() => {
  let initialized = false;

  function activate(modal, key) {
  const tabG = modal.querySelector('#tab-groom');
  const tabB = modal.querySelector('#tab-bride');
  const panelG = modal.querySelector('#panel-groom');
  const panelB = modal.querySelector('#panel-bride');

  const map = {
  groom: { tab: tabG, panel: panelG },
  bride: { tab: tabB, panel: panelB },
};
  const current = map[key];
  const other   = map[key === 'groom' ? 'bride' : 'groom'];

  if (!current?.tab || !current?.panel || !other?.tab || !other?.panel) return;

  // 탭 ARIA/탭 순서
  current.tab.setAttribute('aria-selected', 'true');  current.tab.tabIndex = 0;
  other.tab.setAttribute('aria-selected', 'false');   other.tab.tabIndex = -1;

  // 패널 표시/숨김
  current.panel.classList.add('active');  current.panel.hidden = false;
  other.panel.classList.remove('active'); other.panel.hidden = true;

  // 보이는 패널의 아코디언만 초기화(중복 방지)
  const acc = current.panel.querySelector('.accordion');
  Accordion.init(acc);
}

  function attachHandlers(modal) {
  const tabsWrap = modal.querySelector('.tabs');
  const tabs = Array.from(modal.querySelectorAll('.tab'));
  if (!tabsWrap || tabs.length < 2) return;

  // 클릭
  tabs.forEach(btn => {
  btn.addEventListener('click', () => {
  const key = btn.id.replace('tab-', '');
  activate(modal, key);
  btn.focus();
});
});

  // 키보드 네비
  tabsWrap.addEventListener('keydown', (e) => {
  const idx = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  if (e.key === 'ArrowRight') {
  const n = (idx + 1) % tabs.length; tabs[n].click(); e.preventDefault();
} else if (e.key === 'ArrowLeft') {
  const n = (idx - 1 + tabs.length) % tabs.length; tabs[n].click(); e.preventDefault();
} else if (e.key === 'Home') {
  tabs[0].click(); e.preventDefault();
} else if (e.key === 'End') {
  tabs[tabs.length - 1].click(); e.preventDefault();
}
});
}

  function init(modal) {
  if (!modal) return;
  if (!initialized) {
  attachHandlers(modal);
  initialized = true;
}
  // 모달 열릴 때마다 기본은 신랑측
  activate(modal, 'groom');
}

  return { init };
})();

  /* =========================================================
  5) (선택) 디버그: 탭 클릭 로그
  ========================================================= */
  // document.getElementById('tab-bride')?.addEventListener('click', () => console.log('bride tab clicked'));

  /* =========================================================
  6) 네이버 맵 / 스크롤 페이드인 (원본 유지)
  ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
  // 네이버 맵 컨테이너가 있을 때만 초기화
  const mapEl = document.getElementById('naver-map');
  if (mapEl && window.naver?.maps) {
  const position = new naver.maps.LatLng(37.5526889, 126.9173249);
  const map = new naver.maps.Map('naver-map', {
  center: position, zoom: 16, minZoom: 7, maxZoom: 20, mapDataControl: false
});
  const marker = new naver.maps.Marker({ position, map, title: '웨딩시그니처' });
  const info = new naver.maps.InfoWindow({
  content: `
        <div style="padding:8px 12px; font-size:13px;">
          <strong>웨딩시그니처</strong><br/>
          서울특별시 마포구 양화로 87<br/>
          (2·6호선 합정역 2번 출구 도보 3분)
        </div>
      `
});
  naver.maps.Event.addListener(marker, 'click', () => {
  if (info.getMap()) info.close(); else info.open(map, marker);
});
}

  // 페이드인
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -80px 0px' };
  const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
  else entry.target.classList.remove('visible');
});
}, observerOptions);
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});