<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">메뉴</div>

          <router-link to="/courses" class="sidebar-item">
            <span class="si-icon">📚</span> 지원사업 목록
          </router-link>

          <router-link
            v-if="!isInstructor"
            to="/enrollments"
            class="sidebar-item"
          >
            <span class="si-icon">✅</span> 신청 현황
          </router-link>

          <router-link to="/mypage" class="sidebar-item active">
            <span class="si-icon">⭐</span> 마이페이지
          </router-link>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-label">계정</div>
          <button class="sidebar-item sidebar-btn" @click="handleLogout">
            <span class="si-icon">🚪</span> 로그아웃
          </button>
        </div>
      </aside>

      <main class="main-content">
        <!-- 프로필 카드 -->
        <div class="profile-card fade-in-up">
          <div class="profile-avatar">{{ auth.user?.name?.charAt(0) || '?' }}</div>
          <div class="profile-info">
            <h2 class="profile-name">{{ auth.user?.name || '사용자' }}</h2>
            <p class="profile-email">{{ auth.user?.email || '-' }}</p>
            <span class="badge" :class="isInstructor ? 'badge-amber' : 'badge-blue'">
              {{ isInstructor ? '지자체·수행기관' : '일반' }}
            </span>
          </div>
        </div>

        <!-- 학생 화면: 신청 현황 -->
        <section v-if="!isInstructor" class="application-section">
          <div class="section-head application-head">
            <div>
              <h3 class="section-title">내 신청 현황</h3>
              <span class="section-subtitle">지원한 강의의 접수 및 진행 상태를 확인할 수 있습니다.</span>
            </div>
            <span v-if="!applicationLoading && applications.length" class="application-count">
              총 {{ applications.length }}건
            </span>
          </div>

          <div v-if="applicationLoading" class="application-skeleton" aria-label="신청 내역을 불러오는 중">
            <div v-for="i in 2" :key="i" class="application-skeleton-row">
              <div class="skeleton-line application-skeleton-title"></div>
              <div class="skeleton-line application-skeleton-meta"></div>
            </div>
          </div>

          <div v-else-if="applicationError" class="application-state error-state">
            <div>
              <strong>신청 내역을 불러오지 못했습니다.</strong>
              <p>{{ applicationError }}</p>
            </div>
            <button type="button" class="retry-btn" @click="loadApplications">다시 시도</button>
          </div>

          <div v-else-if="applications.length" class="application-list fade-in">
            <article v-for="item in applications" :key="item.id" class="application-card">
              <div class="application-main">
                <span class="application-category">{{ item.course?.category || '지원 강의' }}</span>
                <h4 class="application-title">
                  {{ item.course?.title || `강의 #${item.courseId}` }}
                </h4>
                <div class="application-meta">
                  <span>신청일 {{ formatDate(item.createdAt) }}</span>
                  <span v-if="item.course?.instructorName">담당 {{ item.course.instructorName }}</span>
                  <span>신청번호 #{{ item.id }}</span>
                </div>
              </div>

              <div class="application-actions">
                <span class="application-status" :class="statusMeta(item.status).className">
                  <span class="status-dot"></span>
                  {{ statusMeta(item.status).label }}
                </span>
                <router-link :to="`/courses/${item.courseId}`" class="detail-link">
                  상세 보기
                </router-link>
              </div>
            </article>
          </div>

          <div v-else class="application-state empty-application">
            <div>
              <strong>아직 신청한 내역이 없습니다.</strong>
              <p>관심 있는 강의를 찾아 첫 신청을 시작해 보세요.</p>
            </div>
            <router-link to="/courses" class="action-btn action-primary">강의 둘러보기</router-link>
          </div>
        </section>

        <!-- 일반 이용자 화면 -->
        <section v-if="!isInstructor" class="recommend-section">
          <h3 class="section-title">추천 지원사업</h3>

          <p v-if="recommendMessage" class="recommend-message">
            {{ recommendMessage }}
          </p>

          <div v-if="recommendLoading" class="loading-row">
            <div v-for="i in 3" :key="i" class="skeleton-card">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>

          <div v-else-if="recommendations.length" class="recommend-grid fade-in">
            <CourseCard v-for="c in recommendations" :key="c.id" :course="c" />
          </div>

          <p v-else-if="recommendError" class="empty-text">
            {{ recommendError }}
          </p>

          <p v-else class="empty-text">
            아직 추천할 지원사업이 없습니다.
          </p>
        </section>

        <!-- 지자체·수행기관 화면 -->
        <section v-else class="instructor-section">
          <div class="section-head">
            <h3 class="section-title">내가 등록한 지원사업</h3>
            <span class="section-subtitle">등록한 지원사업과 사업별 신청 건수를 확인할 수 있습니다.</span>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-label">등록 사업 수</div>
              <div class="summary-value">{{ myCourses.length }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">총 신청 건수</div>
              <div class="summary-value">{{ totalEnrollmentCount }}</div>
            </div>
          </div>

          <div v-if="instructorLoading" class="loading-row instructor-loading">
            <div v-for="i in 3" :key="i" class="skeleton-card">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>

          <div v-else-if="myCourses.length" class="instructor-course-list fade-in">
            <div
              v-for="course in myCourses"
              :key="course.id"
              class="instructor-course-card"
            >
              <div class="course-card-top">
                <div>
                  <h4 class="course-title">{{ course.title }}</h4>
                  <p class="course-desc">{{ course.description || '설명이 없습니다.' }}</p>
                </div>
                <span
                  class="status-badge"
                  :class="course.status === 'ACTIVE' ? 'status-active' : 'status-inactive'"
                >
                  {{ course.status || 'UNKNOWN' }}
                </span>
              </div>

              <div class="course-meta-grid">
                <div class="meta-box">
                  <div class="meta-label">지원 분야</div>
                  <div class="meta-value">{{ course.category || '-' }}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">지원 한도액</div>
                  <div class="meta-value">{{ formatPrice(course.price) }}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">신청 건수</div>
                  <div class="meta-value">
                    {{ course.enrollment_count ?? course.enrollmentCount ?? 0 }}건
                  </div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">사업 ID</div>
                  <div class="meta-value">#{{ course.id }}</div>
                </div>
              </div>

              <div class="course-card-actions">
                <router-link :to="`/courses/${course.id}`" class="action-btn action-primary">
                  사업 보기
                </router-link>
              </div>
            </div>
          </div>

          <p v-else-if="instructorError" class="empty-text">
            {{ instructorError }}
          </p>

          <p v-else class="empty-text">
            아직 등록한 지원사업이 없습니다.
          </p>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import CourseCard from '@/components/CourseCard.vue'
import { useAuthStore } from '@/store/auth.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { courseApi } from '@/api/course.js'

const router = useRouter()
const auth = useAuthStore()

const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

/* 학생용 */
const recommendations = ref([])
const recommendLoading = ref(true)
const recommendError = ref('')
const recommendMessage = ref('')

/* 학생 신청 내역 */
const applications = ref([])
const applicationLoading = ref(true)
const applicationError = ref('')

/* 강사용 */
const myCourses = ref([])
const instructorLoading = ref(true)
const instructorError = ref('')

const totalEnrollmentCount = computed(() =>
  myCourses.value.reduce((sum, course) => {
    const count = Number(course.enrollment_count ?? course.enrollmentCount ?? 0)
    return sum + (Number.isNaN(count) ? 0 : count)
  }, 0)
)

function handleLogout() {
  auth.logout()
  router.push('/')
}

function formatPrice(price) {
  const value = Number(price ?? 0)
  if (Number.isNaN(value)) return '-'
  return `${value.toLocaleString()}원`
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function statusMeta(status) {
  const statuses = {
    PENDING: { label: '접수·심사 대기', className: 'application-pending' },
    ACTIVE: { label: '신청 완료', className: 'application-active' },
    CANCELLED: { label: '신청 취소', className: 'application-cancelled' }
  }

  return statuses[status] ?? { label: status || '상태 확인 중', className: 'application-unknown' }
}

async function loadApplications() {
  applicationLoading.value = true
  applicationError.value = ''

  try {
    const res = await enrollmentApi.getMyEnrollments()
    const payload = res.data

    if (Array.isArray(payload?.data)) {
      applications.value = payload.data
    } else if (Array.isArray(payload)) {
      applications.value = payload
    } else {
      throw new Error('신청 내역 응답 형식이 올바르지 않습니다.')
    }
  } catch (error) {
    console.error('[MyPage] failed to load applications:', error)
    applications.value = []
    applicationError.value = '잠시 후 다시 시도해 주세요.'
  } finally {
    applicationLoading.value = false
  }
}

/**
 * course 객체에서 강사 식별자 추출
 */
function getCourseInstructorId(course) {
  return (
    course.instructorId ??
    course.instructor_id ??
    course.instructor ??
    course.teacherId ??
    course.teacher_id ??
    null
  )
}

async function loadStudentRecommendations() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] auth.user is missing')
      recommendError.value = '추천 지원사업을 준비 중입니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] auth.user.id is missing:', auth.user)
      recommendError.value = '추천 지원사업을 준비 중입니다.'
      return
    }

    const res = await enrollmentApi.getRecommendations(auth.user.id)
    console.log('[MyPage] recommendation response:', res.data)

    const payload = res.data

    if (Array.isArray(payload?.recommendedCourses)) {
      recommendations.value = payload.recommendedCourses
      recommendMessage.value = payload.message ?? ''
    } else if (Array.isArray(payload?.data)) {
      recommendations.value = payload.data
      recommendMessage.value = payload.message ?? ''
    } else if (Array.isArray(payload)) {
      recommendations.value = payload
      recommendMessage.value = ''
    } else {
      console.warn('[MyPage] unexpected recommendation response shape:', payload)
      recommendations.value = []
      recommendMessage.value = ''
    }
  } catch (error) {
    console.error('[MyPage] failed to load recommendations:', error)
    recommendError.value = '현재 추천 지원사업을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    recommendLoading.value = false
  }
}

async function loadInstructorCourses() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] instructor auth.user is missing')
      instructorError.value = '지원사업 정보를 불러오지 못했습니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] instructor auth.user.id is missing:', auth.user)
      instructorError.value = '지원사업 정보를 불러오지 못했습니다.'
      return
    }

    const res = await courseApi.getCourses()
    console.log('[MyPage] course list response:', res.data)

    let courses = []

    if (Array.isArray(res.data?.data)) {
      courses = res.data.data
    } else if (Array.isArray(res.data)) {
      courses = res.data
    } else {
      console.warn('[MyPage] unexpected course response shape:', res.data)
    }

    console.log('[MyPage] auth.user =', auth.user)
    console.log('[MyPage] courses =', courses)
    console.log('[MyPage] first course =', courses[0])

    courses.forEach(course => {
      console.log('[MyPage] instructor fields check:', {
        courseId: course.id,
        instructorId: course.instructorId,
        instructor_id: course.instructor_id,
        instructor: course.instructor,
        teacherId: course.teacherId,
        teacher_id: course.teacher_id,
        rawCourse: course
      })
    })

    const instructorId = Number(auth.user.id)

    myCourses.value = courses.filter(course => {
      const courseInstructorId = Number(getCourseInstructorId(course))
      return !Number.isNaN(courseInstructorId) && courseInstructorId === instructorId
    })

    console.log('[MyPage] filtered myCourses =', myCourses.value)
  } catch (error) {
    console.error('[MyPage] failed to load instructor courses:', error)
    instructorError.value = '현재 지원사업 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    instructorLoading.value = false
  }
}

onMounted(async () => {
  if (isInstructor.value) {
    recommendLoading.value = false
    applicationLoading.value = false
    await loadInstructorCourses()
  } else {
    instructorLoading.value = false
    await Promise.allSettled([
      loadApplications(),
      loadStudentRecommendations()
    ])
  }
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.sidebar-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: var(--transition);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-sans);
  text-decoration: none;
}

.sidebar-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.sidebar-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

.si-icon {
  font-size: 15px;
}

.main-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
}

.profile-email {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge-blue {
  background: #e8f1ff;
  color: #2563eb;
}

.badge-amber {
  background: #f7edd8;
  color: #9a6700;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
}

.section-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.application-head {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.application-count {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.application-list {
  display: grid;
  gap: 12px;
}

.application-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 22px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.application-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.application-main {
  min-width: 0;
}

.application-category {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
}

.application-title {
  overflow: hidden;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.application-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.application-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.application-pending {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.application-active {
  background: var(--color-success-light);
  color: var(--color-success);
}

.application-cancelled,
.application-unknown {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.detail-link {
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.detail-link:hover {
  text-decoration: underline;
}

.application-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 112px;
  padding: 22px;
  background: var(--color-bg-primary);
  border: 1px dashed var(--color-border-hover);
  border-radius: var(--radius-lg);
}

.application-state strong {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.application-state p {
  font-size: 13px;
  color: var(--color-text-muted);
}

.error-state {
  border-color: #fecaca;
  background: #fffafa;
}

.retry-btn {
  flex-shrink: 0;
  padding: 8px 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.retry-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.application-skeleton {
  display: grid;
  gap: 12px;
}

.application-skeleton-row {
  padding: 22px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.application-skeleton-title {
  width: 48%;
  margin-bottom: 12px;
}

.application-skeleton-meta {
  width: 68%;
}

.recommend-message {
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.loading-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.instructor-loading {
  margin-bottom: 20px;
}

.skeleton-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.skeleton-thumb {
  height: 110px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-line.short {
  width: 40%;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 220px));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}

.summary-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.instructor-course-list {
  display: grid;
  gap: 18px;
}

.instructor-course-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 22px;
  box-shadow: var(--shadow-sm);
}

.course-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.course-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.course-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  white-space: pre-line;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #eaf8ef;
  color: #0f8a3b;
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.course-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.meta-box {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 14px;
}

.meta-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.meta-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.course-card-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
}

.action-primary {
  background: var(--color-primary);
  color: white;
}

.action-primary:hover {
  opacity: 0.92;
}

.empty-text {
  color: var(--color-text-muted);
  font-size: 14px;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .recommend-grid,
  .loading-row,
  .course-meta-grid {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .profile-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-card-top {
    flex-direction: column;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .application-card,
  .application-state {
    align-items: flex-start;
    flex-direction: column;
  }

  .application-actions {
    width: 100%;
    justify-content: space-between;
  }

  .application-title {
    white-space: normal;
  }
}
</style>
