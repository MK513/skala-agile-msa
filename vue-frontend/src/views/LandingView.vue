<template>
  <div class="landing">
    <AppHeader />

    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content fade-in-up">
          <span class="hero-badge">정부 지원 대행 종합 서비스</span>
          <h1 class="hero-title">받을 수 있는 지원사업,<br>더는 놓치지 마세요</h1>
          <p class="hero-desc">흩어져 있는 정부·지자체 지원사업을 프로필 기반으로 매칭하고, 신청부터 선정 확정까지 한 곳에서 관리합니다.</p>
          <div class="hero-actions">
            <router-link to="/login" class="btn btn-primary btn-lg">지원 신청 시작하기</router-link>
            <router-link to="/courses" class="btn btn-outline btn-lg">지원사업 둘러보기</router-link>
          </div>
          <div class="hero-stats">
            <div class="stat"><span class="stat-num">1,200+</span><span class="stat-label">등록 지원사업</span></div>
            <div class="stat"><span class="stat-num">340+</span><span class="stat-label">참여 기관</span></div>
            <div class="stat"><span class="stat-num">28,000+</span><span class="stat-label">누적 신청</span></div>
          </div>
        </div>
        <div class="hero-visual fade-in">
          <div class="hero-card" aria-hidden="true">
            <svg class="compass" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="44" stroke="currentColor" stroke-width="3" opacity="0.35" />
              <circle cx="50" cy="50" r="34" stroke="currentColor" stroke-width="1.5" opacity="0.2" />
              <path d="M50 14v8M50 78v8M14 50h8M78 50h8" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5" />
              <path d="M62 38 54 54 38 62l8-16z" fill="currentColor" />
              <circle cx="50" cy="50" r="4" fill="#fff" />
            </svg>
            <span class="hero-card-text">{{ APP_NAME }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 주요 지원사업 (DB 연동) -->
    <section class="popular-section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">주요 지원사업</h2>
          <router-link to="/courses" class="section-link">전체 보기 →</router-link>
        </div>

        <!-- 비로그인: 목록 API가 인증을 요구하므로 로그인 유도 -->
        <div v-if="!auth.isAuthenticated" class="programs-placeholder">
          <p>로그인하면 현재 접수 중인 지원사업을 확인할 수 있습니다.</p>
          <router-link to="/login" class="btn btn-primary">로그인하고 확인하기</router-link>
        </div>

        <div v-else-if="loading" class="programs-placeholder">
          <p>지원사업을 불러오는 중입니다...</p>
        </div>

        <div v-else-if="loadFailed" class="programs-placeholder">
          <p>지원사업 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
        </div>

        <div v-else class="course-grid">
          <router-link
            v-for="program in programs"
            :key="program.id"
            :to="`/courses/${program.id}`"
            class="course-card-landing"
          >
            <div class="card-thumb" :class="categoryMeta(program.category).thumbBg">
              <span class="thumb-emoji" aria-hidden="true">{{ categoryMeta(program.category).emoji }}</span>
            </div>
            <div class="card-body">
              <span class="badge" :class="categoryMeta(program.category).badgeClass">{{ categoryMeta(program.category).label }}</span>
              <h3 class="card-title">{{ program.title }}</h3>
              <div class="card-meta">
                <span class="apply-count">신청 {{ program.enrollmentCount ?? 0 }}건</span>
                <span class="limit">{{ formatLimit(program.price) }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 특징 섹션 -->
    <section class="features-section">
      <div class="section-inner">
        <h2 class="section-title center">왜 {{ APP_NAME }}인가요?</h2>
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
        <h2>받을 수 있는 지원금, 지금 확인하세요</h2>
        <p>기업과 주민의 신청 완주가 지자체의 집행률로 이어집니다. {{ APP_NAME }}이 그 사이를 잇습니다.</p>
        <router-link to="/login" class="btn btn-primary btn-lg">지원 신청 시작하기</router-link>
      </div>
    </section>

    <!-- 푸터 -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <img src="@/assets/images/logo/main_logo.png" :alt="APP_NAME" />
          <span>{{ APP_NAME }}</span>
        </div>
        <p class="footer-copy">© 2026 {{ APP_NAME }}. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/store/auth.js'
import { courseApi } from '@/api/course.js'
import { APP_NAME } from '@/constants/brand.js'

const auth = useAuthStore()

const programs = ref([])
const loading = ref(false)
const loadFailed = ref(false)

// 카테고리 enum → 화면 표기 (enum 값 자체는 백엔드 원본 유지)
const CATEGORY_META = {
  EMPLOYMENT: { label: '고용',  emoji: '💼', thumbBg: 'thumb-teal',   badgeClass: 'badge-teal'   },
  RND:        { label: 'R&D',   emoji: '🔬', thumbBg: 'thumb-purple', badgeClass: 'badge-purple' },
  EXPORT:     { label: '수출',  emoji: '🚢', thumbBg: 'thumb-blue',   badgeClass: 'badge-blue'   },
  FACILITY:   { label: '설비',  emoji: '🏭', thumbBg: 'thumb-amber',  badgeClass: 'badge-amber'  },
  HOUSING:    { label: '주거',  emoji: '🏠', thumbBg: 'thumb-blue',   badgeClass: 'badge-blue'   },
  YOUTH:      { label: '청년',  emoji: '🎓', thumbBg: 'thumb-teal',   badgeClass: 'badge-teal'   },
  STARTUP:    { label: '창업',  emoji: '🌱', thumbBg: 'thumb-pink',   badgeClass: 'badge-pink'   },
  OTHER:      { label: '기타',  emoji: '📋', thumbBg: 'thumb-gray',   badgeClass: 'badge-gray'   }
}

function categoryMeta(category) {
  return CATEGORY_META[category] ?? CATEGORY_META.OTHER
}

function formatLimit(price) {
  const won = Number(price)
  if (!Number.isFinite(won) || won <= 0) return ''
  return `최대 ${(won / 10000).toLocaleString()}만원`
}

onMounted(async () => {
  if (!auth.isAuthenticated) return
  loading.value = true
  try {
    const res = await courseApi.getCourses()
    const list = res?.data?.data ?? res?.data ?? []
    programs.value = [...list]
      .sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0))
      .slice(0, 6)
  } catch (e) {
    console.error('[Landing] 지원사업 목록 조회 실패:', e)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
})

const features = [
  { icon:'🧭', title:'AI 맞춤 매칭', desc:'업종·인원·나이·소득 프로필을 분석해 수급 가능한 지원사업만 골라 보여줍니다.' },
  { icon:'📝', title:'서류 초안 자동 생성', desc:'사업계획서·증빙 서류의 초안을 AI가 만들어 서류 장벽을 낮춥니다.' },
  { icon:'✅', title:'신청 완주 관리', desc:'접수부터 심사 대기, 선정 확정까지 신청 상태를 한 화면에서 추적합니다.' },
  { icon:'📊', title:'집행률 관리', desc:'기관은 신청 건수와 교부 실적을 실시간으로 확인해 예산 집행을 관리합니다.' },
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
  word-break: keep-all;
}
.hero-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 460px;
  margin-bottom: 28px;
  word-break: keep-all;
}
.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 40px;
  flex-wrap: wrap;
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
.hero-card {
  width: 200px;
  height: 200px;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  background: linear-gradient(160deg, #123f70 0%, var(--color-primary) 55%, #1e7bc4 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.compass { width: 96px; height: 96px; }
.hero-card-text { font-size: 16px; font-weight: 700; letter-spacing: 1px; }

/* 지원사업 섹션 */
.popular-section { padding: 64px 0; }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.section-title.center { text-align: center; margin-bottom: 24px; }
.section-link { font-size: 14px; color: var(--color-primary); font-weight: 500; }
.section-link:hover { text-decoration: underline; }

.programs-placeholder {
  padding: 48px 24px;
  background: var(--color-bg-primary);
  border: 1px dashed var(--color-border-hover);
  border-radius: var(--radius-lg);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.programs-placeholder p { font-size: 14px; color: var(--color-text-secondary); word-break: keep-all; }

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
.course-card-landing:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
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
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-amber  { background: #FAEEDA; }
.thumb-gray   { background: #F1EFE8; }
.thumb-emoji { font-size: 44px; line-height: 1; }
.card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; word-break: keep-all; }
.card-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.apply-count { font-size: 12px; color: var(--color-text-secondary); }
.limit { font-size: 13px; font-weight: 600; color: var(--color-primary); white-space: nowrap; }

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
.feature-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; word-break: keep-all; }

/* CTA */
.cta-section {
  padding: 80px 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  text-align: center;
}
.cta-inner { max-width: 640px; margin: 0 auto; padding: 0 24px; }
.cta-inner h2 { font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 12px; word-break: keep-all; }
.cta-inner p { font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 32px; word-break: keep-all; }
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

/* 반응형 */
@media (max-width: 960px) {
  .course-grid { grid-template-columns: repeat(2, 1fr); }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .hero { padding: 48px 0 40px; }
  .hero-inner { grid-template-columns: 1fr; gap: 32px; }
  .hero-visual { order: -1; }
  .hero-card { width: 140px; height: 140px; }
  .compass { width: 64px; height: 64px; }
  .hero-title { font-size: 30px; }
  .hero-stats { gap: 24px; flex-wrap: wrap; }
}
@media (max-width: 520px) {
  .course-grid { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: 1fr; }
  .cta-inner h2 { font-size: 24px; }
}
</style>
