// 커버 화면용 눈 내리는 효과 (5초간만)
let snowInterval;

// ===== Naver Map Init =====
document.addEventListener('DOMContentLoaded', () => {
  // 지도의 중심 좌표
  const position = new naver.maps.LatLng(37.5489, 126.9125);

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
        서울시 마포구 양화로 87<br/>
        2·6호선 합정역 2번출구 도보 3분
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
