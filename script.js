(() => {
  const audio = document.getElementById('weddingBgm');
  const btn   = document.getElementById('bgmToggle');
  const icon  = document.getElementById('bgmIcon');
  const label = document.getElementById('bgmLabel');

  const saved = localStorage.getItem('wedding_bgm') ?? 'on';
  let isOn = saved === 'on';

  audio.volume = 0;
  audio.muted = true;
  audio.play().catch(() => {});

  function updateUI() {
    if (isOn) {
      icon.textContent = '🔊';
      // label.textContent = 'BGM ON';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', '배경음악 끄기');
    } else {
      icon.textContent = '🔇';
      // label.textContent = 'BGM OFF';
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
      audio.volume = start + delta * k;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  async function turnOn() {
    try {
      audio.muted = false;
      if (audio.paused) await audio.play();
      fadeVolume(0.6);
      isOn = true;
      localStorage.setItem('wedding_bgm', 'on');
      updateUI();
    } catch (e) {
      console.debug('Autoplay blocked until further interaction:', e);
    }
  }

  function turnOff() {
    fadeVolume(0, 300);
    setTimeout(() => { audio.pause(); }, 320);
    isOn = false;
    localStorage.setItem('wedding_bgm', 'off');
    updateUI();
  }

  const unlock = () => {
    if (isOn) turnOn();
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock, {passive:true});
  };
  document.addEventListener('click', unlock);
  document.addEventListener('touchstart', unlock, {passive:true});

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (isOn) {
      turnOff();
    } else {
      turnOn();
    }
  });

  updateUI();
})();


document.addEventListener('DOMContentLoaded', () => {
  const cover = document.getElementById('cover');
  if (!cover) return;

  // 현재 스크롤 위치 기억 + 잠금
  let scrollY = window.scrollY || window.pageYOffset;
  document.documentElement.classList.add('is-cover-open');
  document.body.classList.add('is-cover-open');
  document.body.style.top = `-${scrollY}px`; // 고정된 상태에서 위치 유지

  // 커버 애니메이션이 끝나면 잠금 해제 + 복원
  cover.addEventListener('animationend', () => {
    document.documentElement.classList.remove('is-cover-open');
    document.body.classList.remove('is-cover-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);  // 원래 위치로 복귀
    cover.remove();               // 커버 제거(선택)
  });
});

// ===== Naver Map Init =====
document.addEventListener('DOMContentLoaded', () => {
  // 웨딩시그니처(서울 마포구 양화로 87)의 실제 좌표
  const position = new naver.maps.LatLng(37.5526889, 126.9173249);

  // 지도 생성
  const map = new naver.maps.Map('naver-map', {
    center: position,
    zoom: 16,             // 16~17 정도가 예식장 주변 보기 좋아요
    minZoom: 7,
    maxZoom: 20,
    mapDataControl: false // 우측 하단 로고/제어 일부 최소화
  });

  // 마커 추가
  const marker = new naver.maps.Marker({
    position,
    map,
    title: '웨딩시그니처'
  });

  // 인포윈도우(선택)
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

// 스크롤 애니메이션 관찰자
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -80px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // 화면에 들어오면 visible 추가, 나가면 제거
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, observerOptions);

// 모든 fade-in 요소 관찰
document.addEventListener('DOMContentLoaded', () => {
  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach(el => observer.observe(el));
});
