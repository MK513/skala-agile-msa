당신은 Vue.js 및 Vanilla HTML/JS 기반 프론트엔드 개발자입니다.
정부 지원 대행 종합 서비스의 [프로필 등록 페이지]와 [AI 맞춤 매칭 페이지]를 구현하는 코드를 작성해주세요.

[공통 연동 규칙 및 제약사항]
1. Gateway URL: 모든 API 요청은 `http://localhost:8080`을 통해 전송합니다.
2. 인증 헤더: 인증이 필요한 요청은 `sessionStorage.getItem("token")`의 토큰을 `Authorization: Bearer ${token}` 헤더에 포함합니다.
3. 백엔드 DB 무수정 원칙:
   - 프로필 저장 API가 백엔드에 없으므로, 프로필 정보(유형, 관심분야, 업종, 기업규모/연령 등)는 브라우저 `localStorage`에 영구 저장 및 관리합니다.
   - 사용자 ID는 `GET /api/users/me` 호출 응답에서 추출하거나 토큰 디코딩/기본 저장값을 활용합니다.

---

### 1. 프로필 등록/관리 페이지 (`profile-setup.html`)
- **API 연동**:
  - 내 기본 계정 정보 조회: `GET http://localhost:8080/api/users/me` (토큰 필요)
- **화면 구성**:
  - 사용자 유형 선택: [관내 중소기업 / 관내 청년]
  - 기업 세부정보 (기업 선택 시 노출):
    - 업종 (제조, IT/SW, 바이오, 유통/서비스, 기타)
    - 상시 근로자 수 (숫자 입력)
  - 청년 세부정보 (청년 선택 시 노출):
    - 연령 (숫자 입력)
    - 거주 지역 (관내 거주 여부 체크박스)
  - 주 관심 지원 분야 (다중 체크박스):
    - EMPLOYMENT(고용), RND(R&D), EXPORT(수출), FACILITY(설비), HOUSING(주거), YOUTH(청년), STARTUP(창업), OTHER(기타)
- **동작 흐름**:
  1. 페이지 진입 시 `GET /api/users/me`로 기본 사용자명/이메일 바인딩
  2. 기존에 `localStorage.getItem("user_profile")`에 저장된 값이 있다면 인풋 필드에 자동 세팅
  3. [프로필 저장 및 AI 매칭 바로가기] 버튼 클릭 시:
     - 입력 데이터를 JSON 객체로 `localStorage.setItem("user_profile", JSON.stringify(profileData))`에 저장
     - 저장 완료 후 AI 맞춤 매칭 페이지(`recommend-list.html`)로 자동 이동

---

### 2. AI 맞춤 매칭 & 서류 초안 가이드 페이지 (`recommend-list.html`)
- **API 연동**:
  - 추천 지원사업 목록 조회: `GET http://localhost:8080/api/recommend/{user_id}` (토큰 필요)
  - 보조/대체 목록 조회 (추천 결과가 비어있거나 필터링 확장 시): `GET http://localhost:8080/api/courses`
- **화면 구성**:
  - 상단: 사용자 프로필 요약 카드 ("OO 기업 / 선호: 고용, R&D" 또는 "청년 신청자 / 선호: 주거, 청년") + [프로필 수정] 링크
  - 본문: AI 맞춤 추천 사업 카드 리스트
    - 사업명, 카테고리 태그, 지원 한도액(price), 신청 건수(enrollmentCount)
    - AI 매칭 태그 뱃지: 프로필의 관심 분야와 일치할 경우 `[적합도 95% AI 추천]` 강조 뱃지 표시
    - 카드 내 액션 버튼: [사업 상세 보기], [AI 서류 자동 작성]
- **데이터 처리 및 필터링 로직**:
  1. `GET /api/recommend/{user_id}` 호출하여 추천 사업 목록 수신
  2. `localStorage.getItem("user_profile")`에서 관심 카테고리 목록(`categories`) 로드
  3. 1차 정렬/필터링:
     - 추천 목록 중 사용자의 관심 카테고리에 해당하는 사업을 최상단에 배치
     - 추천 목록이 비어있는 신규 사용자(Cold Start)일 경우, `GET /api/courses`로 전체 목록을 받아와 관심 카테고리 기준으로 프론트에서 필터링
  4. [AI 서류 자동 작성] 버튼 클릭 시:
     - `localStorage`의 프로필 데이터와 해당 사업 정보를 조합한 간단한 모달(Modal) 팝업 렌더링
     - 팝업 내에 "지원 기업/신청자 정보"와 "사업명"이 자동 채워진 '신청 서류 초안' 텍스트박스 노출
     - 모달 내 [이 내용으로 신청 접수] 버튼 클릭 시 `POST http://localhost:8080/api/enrollments` (`{"courseId": id}`) 호출 및 접수 처리

---

위 요구사항을 충족하는 클린하고 직관적인 HTML/JS (또는 Vue 컴포넌트) 코드를 작성해주세요.