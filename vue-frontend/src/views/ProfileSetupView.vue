<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <main class="setup-main">
        <div class="setup-card fade-in-up">
          <h1 class="page-title">프로필 등록</h1>
          <p class="page-subtitle">
            유형과 관심 분야를 등록하면 AI가 딱 맞는 지원사업을 추천해 드립니다.
          </p>

          <div class="account-summary">
            <div class="account-avatar">{{ auth.user?.name?.charAt(0) || '?' }}</div>
            <div>
              <div class="account-name">{{ auth.user?.name || '사용자' }}</div>
              <div class="account-email">{{ auth.user?.email || '-' }}</div>
            </div>
          </div>

          <!-- 사용자 유형 -->
          <section class="form-section">
            <h2 class="section-label">사용자 유형</h2>
            <div class="type-toggle">
              <button
                type="button"
                class="type-btn"
                :class="{ active: form.userType === 'COMPANY' }"
                @click="form.userType = 'COMPANY'"
              >
                🏢 관내 중소기업
              </button>
              <button
                type="button"
                class="type-btn"
                :class="{ active: form.userType === 'YOUTH' }"
                @click="form.userType = 'YOUTH'"
              >
                🧑 관내 청년
              </button>
            </div>
          </section>

          <!-- 기업 세부정보 -->
          <section v-if="form.userType === 'COMPANY'" class="form-section fade-in">
            <h2 class="section-label">기업 세부정보</h2>
            <div class="field-grid">
              <label class="field">
                <span class="field-label">업종</span>
                <select v-model="form.company.industry" class="field-input">
                  <option value="">선택하세요</option>
                  <option v-for="opt in industryOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </label>
              <label class="field">
                <span class="field-label">상시 근로자 수</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="form.company.employeeCount"
                  class="field-input"
                  placeholder="예: 12"
                />
              </label>
            </div>
          </section>

          <!-- 청년 세부정보 -->
          <section v-if="form.userType === 'YOUTH'" class="form-section fade-in">
            <h2 class="section-label">청년 세부정보</h2>
            <div class="field-grid">
              <label class="field">
                <span class="field-label">연령</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="form.youth.age"
                  class="field-input"
                  placeholder="예: 29"
                />
              </label>
              <label class="field checkbox-field">
                <input type="checkbox" v-model="form.youth.isLocalResident" />
                <span>관내 거주</span>
              </label>
            </div>
          </section>

          <!-- 관심 분야 -->
          <section class="form-section">
            <h2 class="section-label">주 관심 지원 분야</h2>
            <div class="category-grid">
              <label
                v-for="opt in categoryOptions"
                :key="opt.value"
                class="category-chip"
                :class="{ active: form.categories.includes(opt.value) }"
              >
                <input
                  type="checkbox"
                  :value="opt.value"
                  v-model="form.categories"
                  class="chip-checkbox"
                />
                {{ opt.label }}
              </label>
            </div>
          </section>

          <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>

          <button type="button" class="btn btn-primary btn-full save-btn" @click="handleSave">
            프로필 저장 및 AI 매칭 바로가기
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/store/auth.js'

const PROFILE_STORAGE_KEY = 'user_profile'

const router = useRouter()
const auth = useAuthStore()

const errorMessage = ref('')

const industryOptions = ['제조', 'IT/SW', '바이오', '유통/서비스', '기타']

const categoryOptions = [
  { value: 'EMPLOYMENT', label: '고용' },
  { value: 'RND', label: 'R&D' },
  { value: 'EXPORT', label: '수출' },
  { value: 'FACILITY', label: '설비' },
  { value: 'HOUSING', label: '주거' },
  { value: 'YOUTH', label: '청년' },
  { value: 'STARTUP', label: '창업' },
  { value: 'OTHER', label: '기타' }
]

const form = reactive({
  userType: 'COMPANY',
  company: { industry: '', employeeCount: null },
  youth: { age: null, isLocalResident: false },
  categories: []
})

function loadStoredProfile() {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!raw) return

  try {
    const stored = JSON.parse(raw)
    form.userType = stored.userType || 'COMPANY'
    form.company.industry = stored.company?.industry || ''
    form.company.employeeCount = stored.company?.employeeCount ?? null
    form.youth.age = stored.youth?.age ?? null
    form.youth.isLocalResident = !!stored.youth?.isLocalResident
    form.categories = Array.isArray(stored.categories) ? [...stored.categories] : []
  } catch (e) {
    console.error('[ProfileSetup] 저장된 프로필 파싱 실패:', e)
  }
}

function handleSave() {
  if (!form.categories.length) {
    errorMessage.value = '관심 지원 분야를 1개 이상 선택해 주세요.'
    return
  }
  errorMessage.value = ''

  const profileData = {
    userId: auth.user?.id ?? null,
    name: auth.user?.name ?? '',
    email: auth.user?.email ?? '',
    userType: form.userType,
    company: form.userType === 'COMPANY' ? { ...form.company } : null,
    youth: form.userType === 'YOUTH' ? { ...form.youth } : null,
    categories: [...form.categories]
  }

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData))
  router.push('/recommend-list')
}

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchUser()
  }
  loadStoredProfile()
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.setup-main {
  min-width: 0;
}

.setup-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-size: 22px;
  font-weight: 700;
}

.page-subtitle {
  margin-top: 6px;
  margin-bottom: 24px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 28px;
}

.account-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.account-name {
  font-size: 14px;
  font-weight: 600;
}

.account-email {
  font-size: 12px;
  color: var(--color-text-muted);
}

.form-section {
  margin-bottom: 28px;
}

.section-label {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.type-btn {
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
}

.type-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.type-btn.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.field-input {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--color-border);
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.category-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 20px;
  border: 1.5px solid var(--color-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.category-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.category-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.chip-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.error-msg {
  color: var(--color-danger);
  font-size: 13px;
  margin-bottom: 16px;
}

.btn-full {
  width: 100%;
  justify-content: center;
}

.save-btn {
  padding: 14px;
  font-size: 15px;
}

@media (max-width: 640px) {
  .field-grid,
  .type-toggle {
    grid-template-columns: 1fr;
  }
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
