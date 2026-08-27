<template>
  <div class="login-page">
    <div class="login-layout">
      <!-- 좌측 브랜딩 -->
      <div class="login-left">
        <router-link to="/" class="brand">
          <img src="@/assets/images/logo/main_logo.png" :alt="APP_NAME" class="brand-logo" />
          <span class="brand-name">{{ APP_NAME }}</span>
        </router-link>
        <div class="brand-content">
          <span class="brand-badge">정부 지원 대행 종합 서비스</span>
          <h2>다시 만나서<br>반갑습니다</h2>
          <p>{{ APP_TAGLINE }}</p>
          <ul class="feature-list">
            <li v-for="f in features" :key="f">
              <span class="check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {{ f }}
            </li>
          </ul>
        </div>
        <p class="left-footnote">신청 정보는 심사·선정 관리 목적으로만 사용됩니다.</p>
      </div>

      <!-- 우측 -->
      <div class="login-right">
        <div class="login-box fade-in-up">
          <router-link to="/" class="back-link">← 홈으로</router-link>

          <div class="section">
            <h3 class="section-title">로그인</h3>
            <p class="section-desc">{{ APP_NAME }} 계정으로 로그인합니다.</p>
            <button class="btn btn-primary btn-full" @click="handleOAuth">
              로그인
            </button>
            <div class="divider" aria-hidden="true"><span>또는</span></div>
            <router-link to="/register" class="btn btn-outline btn-full">회원가입</router-link>
            <p class="helper-text">
              처음이신가요? 계정을 만들면 바로 지원사업을 신청할 수 있습니다.
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth.js'
import { APP_NAME, APP_TAGLINE } from '@/constants/brand.js'

const auth = useAuthStore()

const features = ['진행 중인 지원사업 한눈에 보기', '맞춤 지원사업 추천', '신청·선정 현황 관리']

function handleOAuth() {
  auth.redirectToLogin()
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
}
.login-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  min-height: 100vh;
}

/* 좌측 브랜딩 패널 */
.login-left {
  background:
    radial-gradient(ellipse 70% 45% at 85% 8%, rgba(255,255,255,0.10), transparent),
    linear-gradient(160deg, #123f70 0%, var(--color-primary) 55%, #1e7bc4 100%);
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}
.brand { display: flex; align-items: center; gap: 10px; width: fit-content; border-radius: 4px; }
.brand:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
.brand-logo { width: 40px; height: 40px; border-radius: 10px; object-fit: contain; }
.brand-name { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }

.brand-content { margin: auto 0; }
.brand-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.12);
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
  margin-bottom: 18px;
}
.brand-content h2 {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1.35;
  letter-spacing: -0.5px;
  margin-bottom: 14px;
}
.brand-content p { font-size: 15px; color: rgba(255,255,255,0.78); margin-bottom: 28px; }

.feature-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255,255,255,0.9);
}
.check {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.16);
  color: #fff;
}
.check svg { width: 11px; height: 11px; }

.left-footnote { font-size: 12px; color: rgba(255,255,255,0.55); }

/* 우측 로그인 영역 */
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: var(--color-bg-primary);
}
.login-box { width: 100%; max-width: 400px; }
.back-link {
  display: inline-block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
  border-radius: 4px;
  transition: var(--transition);
}
.back-link:hover { color: var(--color-primary); }
.back-link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.section { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.4px; margin-bottom: 2px; }
.section-desc { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 4px; }

.btn-full {
  width: 100%;
  padding: 13px;
  font-size: 15px;
  font-weight: 600;
  justify-content: center;
}
.btn-full:focus-visible {
  outline: 2px solid var(--color-primary-dark);
  outline-offset: 2px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 12px;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.helper-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.6;
  margin-top: 4px;
  word-break: keep-all;
}

/* 반응형 */
@media (max-width: 860px) {
  .login-layout {
    grid-template-columns: 1fr;
    min-height: 100vh;
  }
  .login-left {
    padding: 28px 24px;
    gap: 20px;
  }
  .brand-content { margin: 0; }
  .brand-content h2 { font-size: 24px; margin-bottom: 8px; }
  .brand-content p { margin-bottom: 0; }
  .feature-list,
  .left-footnote { display: none; }
  .login-right { padding: 36px 20px; align-items: flex-start; }
}
</style>
