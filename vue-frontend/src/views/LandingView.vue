<template>
  <div class="landing">
    <AppHeader />

    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content fade-in-up">
          <span class="hero-badge">MSA 기반 정부 지원 대행 서비스</span>
          <h1 class="hero-title">놓치기 쉬운 지원사업,<br>한곳에서 찾고 신청하세요</h1>
          <p class="hero-desc">고용, R&D, 수출, 설비 등 분야별 정부·지자체 지원사업을 확인하고 온라인으로 간편하게 신청하세요.</p>
          <div class="hero-actions">
            <router-link to="/login" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
            <router-link to="/courses" class="btn btn-outline btn-lg">지원사업 둘러보기</router-link>
          </div>
          <div class="hero-stats">
            <div class="stat"><span class="stat-num">1,200+</span><span class="stat-label">지원사업</span></div>
            <div class="stat"><span class="stat-num">340+</span><span class="stat-label">등록기관</span></div>
            <div class="stat"><span class="stat-num">28,000+</span><span class="stat-label">신청 건수</span></div>
          </div>
        </div>
        <div class="hero-visual fade-in">
          <img src="@/assets/images/logo/main_logo.png" alt="LearnNexus" class="hero-logo" />
        </div>
      </div>
    </section>

    <!-- 테스트용 바로가기 -->
    <section class="quicklinks-section">
      <div class="section-inner">
        <h2 class="section-title center">지원사업 화면 바로가기 (테스트용)</h2>
        <div class="quicklinks-row">
          <router-link to="/courses" class="btn btn-outline btn-lg">지원사업 목록 보기</router-link>
          <router-link to="/courses/new" class="btn btn-outline btn-lg">지원사업 등록하기</router-link>
          <router-link to="/enrollments" class="btn btn-outline btn-lg">신청 현황 보기</router-link>
        </div>
      </div>
    </section>

    <!-- 인기 지원사업 -->
    <section class="popular-section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">인기 지원사업</h2>
          <router-link to="/courses" class="section-link">전체 보기 →</router-link>
        </div>
        <div class="course-grid">
          <div v-for="course in featuredCourses" :key="course.id" class="course-card-landing">
            <div class="card-thumb" :class="course.thumbBg">
              <span class="thumb-placeholder">{{ course.category.charAt(0) }}</span>
            </div>
            <div class="card-body">
              <span class="badge" :class="course.badgeClass">{{ course.category }}</span>
              <h3 class="card-title">{{ course.title }}</h3>
              <div class="card-meta">
                <span class="price">{{ course.price }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 특징 섹션 -->
    <section class="features-section">
      <div class="section-inner">
        <h2 class="section-title center">왜 LearnNexus인가요?</h2>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon">{{ f.icon }}</div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2>지금 바로 시작하세요</h2>
        <p>수천 개의 지원사업이 LearnNexus에 등록되어 있습니다.</p>
        <router-link to="/login" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
      </div>
    </section>

    <!-- 푸터 -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <img src="@/assets/images/logo/main_logo.png" alt="LearnNexus" />
          <span>LearnNexus</span>
        </div>
        <p class="footer-copy">© 2026 LearnNexus. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'

const featuredCourses = [
  { id:1, title:'청년 창업 지원사업',       category:'창업', price:'한도 ₩50,000,000', thumbBg:'thumb-blue',   badgeClass:'badge-blue'   },
  { id:2, title:'중소기업 고용 장려금',     category:'고용', price:'한도 ₩20,000,000', thumbBg:'thumb-teal',   badgeClass:'badge-teal'   },
  { id:3, title:'수출 바우처 지원사업',     category:'수출', price:'한도 ₩30,000,000', thumbBg:'thumb-purple', badgeClass:'badge-purple' },
  { id:4, title:'스마트공장 설비 지원사업', category:'설비', price:'한도 ₩100,000,000',thumbBg:'thumb-amber',  badgeClass:'badge-amber'  },
  { id:5, title:'청년 월세 지원사업',       category:'주거', price:'한도 ₩2,400,000',  thumbBg:'thumb-pink',   badgeClass:'badge-pink'   },
  { id:6, title:'R&D 기술개발 지원사업',    category:'R&D',  price:'한도 ₩80,000,000', thumbBg:'thumb-blue',   badgeClass:'badge-blue'   },
]

const features = [
  { icon:'🚀', title:'다양한 지원사업', desc:'고용, R&D, 수출, 설비 등 분야별 정부·지자체 지원사업을 한곳에서 확인하세요.' },
  { icon:'🎯', title:'맞춤 지원사업 추천', desc:'AI 기반 추천 시스템이 신청 이력을 분석해 딱 맞는 지원사업을 추천합니다.' },
  { icon:'📝', title:'간편한 온라인 신청', desc:'복잡한 서류 없이 온라인으로 빠르게 지원 신청을 접수하세요.' },
  { icon:'📱', title:'언제 어디서나', desc:'PC, 태블릿, 모바일 어디서든 신청 현황을 확인하세요.' },
]
</script>

<style scoped>
.landing { background: var(--color-bg-secondary); }

/* 히어로 */
.hero {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f9ff 100%);
  border-bottom: 1px solid var(--color-border);
  padding: 80px 0 64px;
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: center;
}
.hero-badge {
  display: inline-block;
  padding: 5px 14px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}
.hero-title {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}
.hero-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 460px;
  margin-bottom: 28px;
}
.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 40px;
}
.btn-lg { padding: 12px 28px; font-size: 15px; }
.hero-stats {
  display: flex;
  gap: 36px;
}
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat-num { font-size: 22px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-logo {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
}

/* 테스트용 바로가기 */
.quicklinks-section { padding: 48px 0 0; }
.quicklinks-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 강의 섹션 */
.popular-section { padding: 64px 0; }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.section-title.center { text-align: center; margin-bottom: 40px; }
.section-link { font-size: 14px; color: var(--color-primary); font-weight: 500; }
.section-link:hover { text-decoration: underline; }

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.course-card-landing {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}
.course-card-landing:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.card-thumb {
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-teal   { background: #E1F5EE; }
.thumb-blue   { background: #E6F1FB; }
.thumb-amber  { background: #FAEEDA; }
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-placeholder { font-size: 32px; font-weight: 700; color: var(--color-text-muted); }
.card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; }
.card-meta { display: flex; justify-content: flex-end; align-items: center; }
.price { font-size: 14px; font-weight: 600; color: var(--color-primary); }

/* 특징 */
.features-section { padding: 64px 0; background: var(--color-bg-primary); }
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.feature-card {
  padding: 28px 24px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: var(--transition);
}
.feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.feature-icon { font-size: 32px; margin-bottom: 12px; }
.feature-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.feature-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

/* CTA */
.cta-section {
  padding: 80px 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  text-align: center;
}
.cta-inner { max-width: 600px; margin: 0 auto; padding: 0 24px; }
.cta-inner h2 { font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 12px; }
.cta-inner p { font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 32px; }
.cta-inner .btn-primary {
  background: #fff;
  color: var(--color-primary);
  border-color: #fff;
  font-weight: 600;
}
.cta-inner .btn-primary:hover { background: #f0f7ff; }

/* 푸터 */
.footer {
  background: var(--color-text-primary);
  padding: 32px 0;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.footer-logo img { width: 28px; height: 28px; border-radius: 6px; }
.footer-copy { font-size: 13px; color: rgba(255,255,255,0.5); }
</style>
