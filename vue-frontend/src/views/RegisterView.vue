<template>
  <div class="register-page">
    <div class="register-card fade-in-up">
      <!-- 브랜드 -->
      <router-link to="/" class="brand">
        <img src="@/assets/images/logo/main_logo.png" :alt="APP_NAME" class="brand-logo" />
        <span class="brand-name">{{ APP_NAME }}</span>
      </router-link>

      <div class="card-head">
        <h1 class="card-title">회원가입</h1>
        <p class="card-desc">{{ APP_NAME }} 계정을 만들고 지원사업을 신청하세요.</p>
      </div>

      <form @submit.prevent="handleRegister" class="form" novalidate>
        <div class="form-group">
          <label class="form-label" for="reg-name">이름 <span class="required" aria-hidden="true">*</span></label>
          <input
            id="reg-name"
            v-model.trim="form.name"
            type="text"
            class="form-input"
            :class="{ invalid: fieldErrors.name }"
            placeholder="홍길동"
            autocomplete="name"
            :aria-invalid="!!fieldErrors.name"
            aria-describedby="err-name"
            @input="fieldErrors.name = ''"
          />
          <p v-if="fieldErrors.name" id="err-name" class="field-error">{{ fieldErrors.name }}</p>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-email">이메일 <span class="required" aria-hidden="true">*</span></label>
          <input
            id="reg-email"
            v-model.trim="form.email"
            type="email"
            class="form-input"
            :class="{ invalid: fieldErrors.email }"
            placeholder="user@example.com"
            autocomplete="email"
            :aria-invalid="!!fieldErrors.email"
            aria-describedby="err-email"
            @input="fieldErrors.email = ''"
          />
          <p v-if="fieldErrors.email" id="err-email" class="field-error">{{ fieldErrors.email }}</p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="reg-password">비밀번호 <span class="required" aria-hidden="true">*</span></label>
            <input
              id="reg-password"
              v-model="form.password"
              type="password"
              class="form-input"
              :class="{ invalid: fieldErrors.password }"
              placeholder="8자 이상"
              autocomplete="new-password"
              :aria-invalid="!!fieldErrors.password"
              aria-describedby="err-password hint-password"
              @input="fieldErrors.password = ''"
            />
            <p v-if="fieldErrors.password" id="err-password" class="field-error">{{ fieldErrors.password }}</p>
            <p v-else id="hint-password" class="field-hint">8자 이상 입력해주세요.</p>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password-confirm">비밀번호 확인 <span class="required" aria-hidden="true">*</span></label>
            <input
              id="reg-password-confirm"
              v-model="form.passwordConfirm"
              type="password"
              class="form-input"
              :class="{ invalid: fieldErrors.passwordConfirm }"
              placeholder="비밀번호 재입력"
              autocomplete="new-password"
              :aria-invalid="!!fieldErrors.passwordConfirm"
              aria-describedby="err-password-confirm"
              @input="fieldErrors.passwordConfirm = ''"
            />
            <p v-if="fieldErrors.passwordConfirm" id="err-password-confirm" class="field-error">{{ fieldErrors.passwordConfirm }}</p>
          </div>
        </div>

        <fieldset class="form-group role-group">
          <legend class="form-label">가입 유형 <span class="required" aria-hidden="true">*</span></legend>
          <div class="role-options">
            <label class="role-option" :class="{ selected: form.role === 'STUDENT' }">
              <input type="radio" v-model="form.role" value="STUDENT" name="role" />
              <span class="role-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span class="role-body">
                <span class="role-name">{{ ROLE_LABELS.STUDENT }}</span>
                <span class="role-desc">지원사업을 찾아 신청합니다</span>
              </span>
              <span class="role-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </label>

            <label class="role-option" :class="{ selected: form.role === 'INSTRUCTOR' }">
              <input type="radio" v-model="form.role" value="INSTRUCTOR" name="role" />
              <span class="role-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /><path d="M9 11h.01M15 11h.01M12 11h.01" />
                </svg>
              </span>
              <span class="role-body">
                <span class="role-name">{{ ROLE_LABELS.INSTRUCTOR }}</span>
                <span class="role-desc">지원사업을 등록·운영합니다</span>
              </span>
              <span class="role-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </label>
          </div>
        </fieldset>

        <div v-if="error" class="alert alert-error" role="alert">
          <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ error }}</span>
        </div>
        <div v-if="success" class="alert alert-success" role="status">
          <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{{ success }}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading || !!success">
          <span v-if="loading" class="btn-spinner" aria-hidden="true"></span>
          <span>{{ loading ? '가입 처리 중...' : '가입하기' }}</span>
        </button>
      </form>

      <div class="switch-link">
        이미 계정이 있으신가요?
        <router-link to="/login" class="text-link">로그인</router-link>
      </div>
    </div>

    <p class="page-footnote">가입 정보는 지원사업 신청·선정 관리 목적으로만 사용됩니다.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth.js'
import { APP_NAME, ROLE_LABELS } from '@/constants/brand.js'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  role: 'STUDENT'
})

const fieldErrors = ref({ name: '', email: '', password: '', passwordConfirm: '' })

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  const errors = { name: '', email: '', password: '', passwordConfirm: '' }
  if (!form.value.name) errors.name = '이름을 입력해주세요.'
  if (!form.value.email) errors.email = '이메일을 입력해주세요.'
  else if (!EMAIL_PATTERN.test(form.value.email)) errors.email = '올바른 이메일 형식이 아닙니다.'
  if (form.value.password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.'
  if (form.value.password !== form.value.passwordConfirm) errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  fieldErrors.value = errors
  return !Object.values(errors).some(Boolean)
}

async function handleRegister() {
  error.value = ''
  success.value = ''

  if (!validate()) return

  loading.value = true
  try {
    await authApi.register({
      email: form.value.email,
      password: form.value.password,
      name: form.value.name,
      role: form.value.role
    })
    success.value = '가입이 완료되었습니다. 로그인 페이지로 이동합니다.'
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    error.value = e.response?.data?.message || '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 20px;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, var(--color-primary-light), transparent),
    var(--color-bg-secondary);
}

.register-card {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 40px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}
.brand-logo { width: 36px; height: 36px; border-radius: 8px; object-fit: contain; }
.brand-name { font-size: 16px; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.3px; }

.card-head { margin-bottom: 24px; }
.card-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.4px; margin-bottom: 6px; }
.card-desc { font-size: 14px; color: var(--color-text-secondary); }

.form { display: flex; flex-direction: column; gap: 18px; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: start;
}

.form-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.required { color: var(--color-danger); }

.form-input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  transition: var(--transition);
  outline: none;
}
.form-input::placeholder { color: var(--color-text-muted); }
.form-input:hover { border-color: var(--color-border-hover); }
.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.form-input.invalid { border-color: var(--color-danger); }
.form-input.invalid:focus { box-shadow: 0 0 0 3px #fee2e2; }

.field-error { font-size: 12px; color: var(--color-danger); line-height: 1.4; }
.field-hint { font-size: 12px; color: var(--color-text-muted); line-height: 1.4; }

/* 역할 선택 카드 */
.role-group { border: none; }
.role-group > .form-label { margin-bottom: 6px; display: block; }
.role-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.role-option {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--color-bg-primary);
  transition: var(--transition);
}
.role-option:hover { border-color: var(--color-border-hover); background: var(--color-bg-secondary); }
.role-option input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
/* 키보드 포커스 링 */
.role-option:has(input:focus-visible) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.role-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.role-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.role-icon svg { width: 18px; height: 18px; }
.role-option.selected .role-icon { background: var(--color-primary); color: #fff; }

.role-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.role-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; word-break: keep-all; }
.role-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.4; word-break: keep-all; }

.role-check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: #fff;
  opacity: 0;
  transform: scale(0.6);
  transition: var(--transition);
}
.role-check svg { width: 10px; height: 10px; }
.role-option.selected .role-check { opacity: 1; transform: scale(1); }

/* 알림 배너 */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.5;
}
.alert-icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; }
.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--color-danger);
}
.alert-success {
  background: var(--color-success-light);
  border: 1px solid #a7e3cf;
  color: var(--color-success);
}

/* 제출 버튼 */
.btn-full {
  width: 100%;
  padding: 13px;
  font-size: 15px;
  font-weight: 600;
  justify-content: center;
  margin-top: 2px;
}
.btn-full:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.btn-full:focus-visible {
  outline: 2px solid var(--color-primary-dark);
  outline-offset: 2px;
}
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.switch-link {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 20px;
}
.text-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0 2px;
  border-radius: 2px;
}
.text-link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.page-footnote {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

/* 반응형 */
@media (max-width: 560px) {
  .register-page { padding: 24px 16px; }
  .register-card { padding: 28px 20px; }
  .form-row { grid-template-columns: 1fr; gap: 18px; }
  .role-options { grid-template-columns: 1fr; }
}
</style>
