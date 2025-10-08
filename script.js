(() => {
  const audio = document.getElementById('weddingBgm');
  const btn   = document.getElementById('bgmToggle');
  const icon  = document.getElementById('bgmIcon');
  const label = document.getElementById('bgmLabel');

  // 저장된 사용자 설정 복원 (기본 on)
  const saved = localStorage.getItem('wedding_bgm') ?? 'on';
  let isOn = saved === 'on';

  // 사용자가 한 번이라도 상호작용했는지(모바일 자동재생 해제용)
  let userInteracted = false;

  // ===== 공용 유틸 =====
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
    // iOS/모바일 정책 회피: 먼저 무음으로 재생해둔다.
    audio.muted = true;
    audio.volume = 0;
    try {
      if (audio.paused) await audio.play();
    } catch (e) {
      // 일부 브라우저는 사용자 제스처 전에는 재생 거부 → 첫 상호작용 때 다시 시도
      // 콘솔만 조용히 남기고 흐름 유지
      console.debug('Muted preplay blocked until interaction:', e);
    }
  }

  async function unmuteWithFade(targetVol = 0.6) {
    try {
      if (audio.paused) await audio.play(); // 혹시 일시정지되어 있으면 재시도
      audio.muted = false;
      fadeVolume(targetVol, 700);
    } catch (e) {
      console.debug('Unmute failed until user interaction:', e);
    }
  }

  async function turnOn() {
    isOn = true;
    localStorage.setItem('wedding_bgm', 'on');
    updateUI();

    // 이미 무음 재생 중이어야 안전. 아니라면 무음 재생부터.
    await ensurePlayingMuted();
    // 사용자 상호작용이 있으면 바로 볼륨업, 아니면 최초 상호작용을 기다린다.
    if (userInteracted) {
      unmuteWithFade(0.6);
    }
  }

  function turnOff() {
    isOn = false;
    localStorage.setItem('wedding_bgm', 'off');
    fadeVolume(0, 300);
    // 살짝 늦춰서 완전 정지
    setTimeout(() => { audio.pause(); audio.muted = true; }, 330);
    updateUI();
  }

  // ===== 최초 진입: 커버 표시 동안 무음으로 미리 재생 =====
  document.addEventListener('DOMContentLoaded', async () => {
    // 1) 무음으로 선재생(실패해도 OK, 이후 제스처 시 재시도)
    await ensurePlayingMuted();

    // 2) 커버 애니메이션 종료 시점에 로직 실행
    const cover = document.getElementById('cover');
    if (cover) {
      cover.addEventListener('animationend', async () => {
        // 커버 닫힐 때: on 설정이면 바로 켜기 시도
        if (isOn) {
          if (userInteracted) {
            await unmuteWithFade(0.6);
          } else {
            // 아직 상호작용이 없다면, 버튼에 미묘한 힌트를 주고 첫 제스처에 맞춰 켠다.
            btn.classList.add('need-tap'); // 필요하면 CSS로 살짝 튀게
          }
        }
      }, { once: true });
    }

    updateUI();
  });

  // ===== 사용자 상호작용 감지(최초 한 번) =====
  const markInteracted = async () => {
    if (userInteracted) return;
    userInteracted = true;

    // 사용자가 터치/클릭/키보드 등 상호작용을 하면,
    // on 상태라면 즉시 볼륨업+음소거 해제
    if (isOn) {
      btn.classList.remove('need-tap');
      await unmuteWithFade(0.6);
    } else {
      // off 상태면 무음으로만 재생 대기
      await ensurePlayingMuted();
    }

    // 리스너는 한 번만
    window.removeEventListener('pointerdown', markInteracted, { capture: true });
    window.removeEventListener('keydown', markInteracted, { capture: true });
    window.removeEventListener('touchstart', markInteracted, { capture: true, passive: true });
  };

  window.addEventListener('pointerdown', markInteracted, { capture: true });
  window.addEventListener('keydown',     markInteracted, { capture: true });
  window.addEventListener('touchstart',  markInteracted, { capture: true, passive: true });

  // ===== 토글 버튼 =====
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (isOn) {
      turnOff();
    } else {
      await turnOn();
      if (userInteracted) {
        await unmuteWithFade(0.6);
      }
    }
  });

  // ===== 탭 전환/복귀 시 안정성 보강 =====
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      // on이면 무음이라도 재개 → 상호작용 되어 있으면 자동으로 소리 복원
      if (isOn) {
        await ensurePlayingMuted();
        if (userInteracted) await unmuteWithFade(audio.volume || 0.6);
      }
    }
  });
})();


// ====== 커버 스크롤락 유지/해제(기존 코드 보강: once 옵션) ======
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


// ====== 네이버 맵/페이드인(네 기존 코드 그대로) ======
document.addEventListener('DOMContentLoaded', () => {
  const position = new naver.maps.LatLng(37.5526889, 126.9173249);
  const map = new naver.maps.Map('naver-map', {
    center: position,
    zoom: 16,
    minZoom: 7,
    maxZoom: 20,
    mapDataControl: false
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
    if (info.getMap()) info.close();
    else info.open(map, marker);
  });
});

// 페이드인 관찰자
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -80px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
    else entry.target.classList.remove('visible');
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});
