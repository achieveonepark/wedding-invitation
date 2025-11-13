/* =========================================================
  0) 유틸
  ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    /* 마우스 드래그(이미지/링크) 차단 */
    document.addEventListener('dragstart', e => e.preventDefault());

    /* 우클릭 메뉴 차단 (이미지 저장/컨텍스트 메뉴 방지) */
    document.addEventListener('contextmenu', e => e.preventDefault());

    /* Ctrl/⌘ + 휠 확대 차단 (데스크톱 크롬/엣지) */
    document.addEventListener('wheel', e => {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    /* Ctrl/⌘ + (+,-,=,0) 확대/축소/초기화 키 차단 */
    document.addEventListener('keydown', e => {
      const key = e.key;
      if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(key)) {
        e.preventDefault();
      }
    });
    
    // 라이트박스가 열렸을 때만 핀치 차단
    const isLightboxOpen = () => !!document.querySelector('.lightbox:target');
    const onGesture = (e) => { if (isLightboxOpen()) e.preventDefault(); };
    ['gesturestart','gesturechange','gestureend'].forEach(type => {
      document.addEventListener(type, onGesture, { passive: false });
    });
    
    // 라이트박스가 열렸을 때만 멀티터치/핀치 차단
    document.addEventListener('touchmove', e => {
      if (!isLightboxOpen()) return;
      if (e.touches && e.touches.length > 1) e.preventDefault();
      if (typeof e.scale === 'number' && e.scale !== 1) e.preventDefault();
    }, { passive: false });

    // 라이트박스가 열렸을 때만 더블탭 확대 차단
    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
      if (!isLightboxOpen()) return;
      const now = Date.now();
      if (now - lastTouchEnd < 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  });

/* =========================================================
1) BGM: SoundCloud 단순 ON/OFF 토글 (초기 상태 ON, 첫 입력 후 재생)
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const iframe = document.getElementById('scPlayer');
  const btn    = document.getElementById('bgmToggle');
  const icon   = document.getElementById('bgmIcon');

  // 필수 요소나 SoundCloud API가 없으면 종료
  if (!iframe || !btn || !icon || typeof SC === 'undefined') return;

  const widget       = SC.Widget(iframe);
  let isReady        = false; // 위젯 로드 완료 여부
  let wantPlay       = true;  // "논리상" ON 상태 (처음부터 ON)
  let hasInteracted  = false; // 브라우저가 "사용자 입력 있었다"고 인정했는지

  function updateUI() {
    if (wantPlay) {
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

  // 위젯 준비 완료
  widget.bind(SC.Widget.Events.READY, () => {
    isReady = true;
    widget.setVolume(60);

    // 처음부터 "ON 상태"로 UI 세팅
    wantPlay = true;
    updateUI();

    // autoplay 시도 (성공 여부는 브라우저에 따라 다름)
    widget.play();

    // 버튼 서서히 보이게 (기존 CSS .show 활용)
    btn.classList.add('show');
  });

  // 실제 재생/일시정지를 호출하는 헬퍼
  function applyPlayState() {
    if (!isReady) return;

    if (wantPlay) {
      // 소리 ON을 원하는 상태
      if (hasInteracted) {
        widget.play();
      }
      // 아직 사용자 입력 없으면, 브라우저 정책 때문에 여기서 막힐 수 있음
    } else {
      // 소리 OFF 상태
      widget.pause();
    }
  }

  // 페이지 어디든 "첫 입력"이 들어오면 hasInteracted = true 로 바꾸고 재생 시도
  const markInteracted = () => {
    if (hasInteracted) return;
    hasInteracted = true;

    // 논리상 ON 상태라면, 이제 진짜 재생 시도
    applyPlayState();

    // 더 이상 필요 없으니 리스너 제거
    window.removeEventListener('pointerdown', markInteracted, true);
    window.removeEventListener('touchstart', markInteracted, true);
    window.removeEventListener('keydown', markInteracted, true);
  };

  window.addEventListener('pointerdown', markInteracted, true);
  window.addEventListener('touchstart',  markInteracted, true);
  window.addEventListener('keydown',     markInteracted, true);

  // 버튼 클릭으로 ON/OFF 토글
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    wantPlay = !wantPlay;
    updateUI();
    applyPlayState();
  });
});


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
  
// ===== Wedding D-Day (1초 단위) =====
    (() => {
      const elRoot = document.getElementById('dDay');
      if (!elRoot) return;

      const elDays = elRoot.querySelector('.dday-days');
      const elHH   = elRoot.querySelector('.dday-hh');
      const elMM   = elRoot.querySelector('.dday-mm');
      const elSS   = elRoot.querySelector('.dday-ss');
      const label  = elRoot.querySelector('.dday-label');
      const sep    = elRoot.querySelector('.dday-sep');
      const time   = elRoot.querySelector('.dday-time');

      // 결혼식 정확 시간 (한국 표준시)
      const target = new Date('2026-02-08T12:20:00+09:00');

      const SECOND = 1000;
      const MINUTE = 60 * SECOND;
      const HOUR   = 60 * MINUTE;
      const DAY    = 24 * HOUR;

      const pad2 = (n) => (n < 10 ? '0' + n : '' + n);

      function render(diffMs) {
        // 남은 시간 → 음수면 이미 시작/지남
        if (diffMs <= 0) {
          // 시작~끝 구간이 필요하면 여기서 “진행중” 로직도 가능
          label.textContent = 'D+';
          const passed = Math.abs(diffMs);

          const days = Math.floor(passed / DAY);
          const rem  = passed % DAY;
          const hh   = Math.floor(rem / HOUR);
          const mm   = Math.floor((rem % HOUR) / MINUTE);
          const ss   = Math.floor((rem % MINUTE) / SECOND);

          elDays.textContent = String(days).padStart(3, '0');
          elHH.textContent   = pad2(hh);
          elMM.textContent   = pad2(mm);
          elSS.textContent   = pad2(ss);
          sep.textContent    = '일 지난 지';
          time.setAttribute('aria-label', '지나간 시간');
          return;
        }

        // D-카운트
        label.textContent = '성일 ❤️ 채린 결혼식까지 ';

        const days = Math.floor(diffMs / DAY);
        const rem  = diffMs % DAY;
        const hh   = Math.floor(rem / HOUR);
        const mm   = Math.floor((rem % HOUR) / MINUTE);
        const ss   = Math.floor((rem % MINUTE) / SECOND);

        elDays.textContent = String(days).padStart(2, '0'); // 3자리 고정
        elHH.textContent   = pad2(hh);
        elMM.textContent   = pad2(mm);
        elSS.textContent   = pad2(ss);
        sep.textContent    = '일';
        time.setAttribute('aria-label', '남은 시간');
      }

      function tick() {
        const now = new Date();
        const diff = target - now;
        render(diff);

        // 다음 '정확한 초 경계'에 맞춰 호출 (드리프트 최소화)
        const ms = now.getMilliseconds();
        const wait = 1000 - ms;
        setTimeout(tick, wait);
      }

      // 첫 렌더링 후 시작
      tick();
    })();
  
  // 페이드인
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -80px 0px' };
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible'); // 보이게 만들고
          obs.unobserve(entry.target);           // 관측 해제 → 다시는 숨기지 않음
        }
        // else 분기(visible 제거)는 없습니다.
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});

  // ===== 계좌 복사 & 토스트 =====
  (function(){
    const toast = document.getElementById('toast');
    let toastTimer = null;

    function showToast(msg){
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
    }

    async function copyText(text){
      try{
        await navigator.clipboard.writeText(text);
        showToast('계좌 정보를 복사했어요.');
      }catch(e){
        // clipboard 실패 시 fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try{
          document.execCommand('copy');
          showToast('계좌 정보를 복사했어요.');
        }catch(_){}
        ta.remove();
      }
    }

    // 이벤트 위임
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-copy');
      if (!btn) return;
      const str = btn.getAttribute('data-copy');
      if (str) copyText(str);
    });

    // 페이지에 새로 추가한 아코디언들도 초기화
    document.addEventListener('DOMContentLoaded', () => {
      const acc1 = document.getElementById('acc-groom-side');
      const acc2 = document.getElementById('acc-bride-side');
      if (window.Accordion){
        Accordion.init(acc1);
        Accordion.init(acc2);
      }
    });
  })();
  
  // 모든 .accordion을 한 번에 초기화 (페이지 어디에 있어도)
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.Accordion) return;
    document.querySelectorAll('.accordion').forEach((root) => {
      Accordion.init(root);
    });
  });

  // 푸터 텍스트형 버튼으로 공유 실행
  document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('kakaoShareFooter');
    const copyBtn  = document.getElementById('copyUrlButton');

    // 카카오 JavaScript 키로 초기화
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
      Kakao.init('0233600f7ae1cf9a5ca201c5d9f2ea17'); // 여기에 본인의 JavaScript 키 입력
      console.log('Kakao SDK 초기화 완료:', Kakao.isInitialized());
    }
    
    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        shareKakao();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const url = window.location.href;
        try {
          await navigator.clipboard.writeText(url);
          alert('링크가 복사되었습니다! 📋');
        } catch (err) {
          console.error('클립보드 복사 실패:', err);
          alert('복사에 실패했습니다. 직접 복사해주세요 😢');
        }
      });
    }
  });

  (() => {
    let lbScrollY = 0;

    // 라이트박스 열 때 현재 스크롤 저장 (갤러리 썸네일이 #lb- 로 연결된 앵커)
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('a[href^="#lb-"]');
      if (opener) {
        lbScrollY = window.scrollY || window.pageYOffset;
      }
    }, { passive: true });

    // X 버튼으로 닫을 때: 기본 동작 허용 -> :target 해제 -> 스크롤 복원 + URL 정리
    document.addEventListener('click', (e) => {
      const close = e.target.closest('.lightbox__close');
      if (!close) return; // 기본 동작 막지 않음!

      // 다음 틱에 스크롤 복원 + # 제거
      setTimeout(() => {
        // 주소 끝의 # 제거 (라이트박스는 이미 닫힌 상태)
        const cleanUrl = window.location.pathname + window.location.search;
        if (history.replaceState) history.replaceState(null, '', cleanUrl);

        // 스크롤 복원
        window.scrollTo(0, lbScrollY);
      }, 0);
    });
  })();

  (() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    ['resize', 'orientationchange', 'visibilitychange'].forEach(evt =>
        window.addEventListener(evt, setVh, { passive: true })
    );
    setVh();
  })();

// 카카오톡 공유 함수
function shareKakao() {
  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    alert('카카오톡 공유 기능을 사용할 수 없습니다.');
    return;
  }

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '박성일 ❤️ 김채린 결혼합니다',
      description: '2026년 02월 08일 일요일 오후 12시 20분\n웨딩 시그니처 2층 트리니티홀',
      imageUrl: 'https://somchae.wedding/images/gallary/01.jpg',
      link: {
        mobileWebUrl: 'https://somchae.wedding',
        webUrl: 'https://somchae.wedding',
      },
    },
    buttons: [
      {
        title: '청첩장 보기',
        link: {
          mobileWebUrl: 'https://somchae.wedding',
          webUrl: 'https://somchae.wedding',
        },
      },
    ],
    success: function(response) {
      console.log('카카오톡 공유 성공:', response);
    },
    fail: function(error) {
      console.error('카카오톡 공유 실패:', error);
      alert('카카오톡 공유에 실패했습니다.');
    },
  });
}