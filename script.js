// 커버 화면용 눈 내리는 효과 (5초간만)
let snowInterval;

// ===== Naver Map Init =====
// ===== NAVER MAP: address geocoding + click-to-adjust =====
document.addEventListener('DOMContentLoaded', () => {
  const address = '서울특별시 마포구 양화로 87'; // 웨딩시그니처 도로명 주소

  // 1) 주소를 좌표로 변환
  naver.maps.Service.geocode({ query: address }, (status, response) => {
    if (status !== naver.maps.Service.Status.OK || !response.v2?.addresses?.length) {
      console.warn('Geocode 실패. 임시 중심으로 표시합니다.');
      initMap(new naver.maps.LatLng(37.5492, 126.9143)); // 합정역 인근 임시값
      return;
    }

    // 첫 번째 결과 사용 (도로명 우선)
    const a = response.v2.addresses[0];
    const lat = parseFloat(a.y);
    const lng = parseFloat(a.x);
    initMap(new naver.maps.LatLng(lat, lng));
  });

  // 2) 지도/마커/인포윈도우 초기화 + 클릭으로 보정 가능
  function initMap(position) {
    const map = new naver.maps.Map('naver-map', {
      center: position,
      zoom: 17,
      minZoom: 7,
      maxZoom: 20,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.RIGHT_CENTER }
    });

    const marker = new naver.maps.Marker({
      position,
      map,
      title: '웨딩시그니처'
    });

    const info = new naver.maps.InfoWindow({
      content: `
        <div style="padding:8px 12px; font-size:13px; line-height:1.5">
          <strong>웨딩시그니처</strong><br/>
          서울 마포구 양화로 87<br/>
          (2·6호선 합정역 2번 출구 도보 3분)
        </div>
      `
    });
    info.open(map, marker);

    // 지도 클릭으로 위치 미세 보정 (콘솔에 좌표 표시)
    naver.maps.Event.addListener(map, 'click', (e) => {
      marker.setPosition(e.coord);
      info.open(map, marker);
      console.log('조정 좌표:', e.coord.lat(), e.coord.lng());
    });
  }
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
