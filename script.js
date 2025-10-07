// 커버 화면용 눈 내리는 효과 (5초간만)
let snowInterval;

function createSnowflake(isCover = false) {
  const snowflake = document.createElement('div');
  snowflake.classList.add('snowflake');
  if (isCover) snowflake.classList.add('cover-snow');
  snowflake.innerHTML = '❄';
  snowflake.style.left = Math.random() * window.innerWidth + 'px';
  snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
  snowflake.style.opacity = Math.random() * 0.7 + 0.3;
  snowflake.style.animationDuration = (Math.random() * 3 + 5) + 's';
  snowflake.style.animationDelay = Math.random() * 2 + 's';

  document.body.appendChild(snowflake);

  setTimeout(() => {
    snowflake.remove();
  }, 8000);
}

// 커버 화면에서만 눈 내리기 (5초간)
snowInterval = setInterval(() => createSnowflake(true), 200);

// 5초 후 눈 내리기 중단
setTimeout(() => {
  clearInterval(snowInterval);
}, 5000);

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
