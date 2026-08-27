# The following practice code is intended for educational purposes only. For contact :  audit@korea.ac.kr, Sungryel Lim Ph.D

# This practice code is not a completed commercial version but has been developed for educational purposes; supplementation is required depending on the deployment objective for use as a commercial service.

# 전체 백엔드 기동 순서 (depends_on 기반)
MariaDB / Kafka (인프라)
  → Eureka (서비스 등록)
    → Auth Server (인증)
      → API Gateway + 4개 서비스
        → Recommend Service

# 공통 이미지 파일 로드 (API Gateway, Auth Server)
docker load -i infra-images.tar

# msa-lecture/auth-server:1.0 등 태그 확인
docker images

# Auth Server 로그인 화면 브랜딩 적용
이 저장소의 `auth-server-branding` 디렉터리는 Auth Server의 인증 로직을 변경하지 않고 Spring Security 기본 로그인 화면의 CSS만 덮어씁니다.

Git clone 후에는 CSS가 적용된 Docker 이미지를 한 번 빌드해야 합니다. 먼저 `infra-images.tar`로 제공된 원본 `msa-lecture/auth-server:1.0` 이미지가 로드되어 있어야 합니다.

## 1. 원본 Auth Server 이미지 백업

```bash
docker tag msa-lecture/auth-server:1.0 msa-lecture/auth-server:1.0-orig
```

## 2. 프로젝트 루트에서 브랜딩 이미지 빌드

```bash
docker build -t msa-lecture/auth-server:1.0 ./auth-server-branding
```

## 3. Auth Server와 API Gateway 재시작

```bash
docker compose up -d --force-recreate auth-server api-gateway
```

백엔드를 별도의 Compose 디렉터리에서 실행하는 경우, 1과 2는 이 저장소의 프로젝트 루트에서 실행하고 3은 실제 `docker-compose.yml`이 있는 디렉터리에서 실행합니다.

프론트엔드의 `http://localhost:3000/login`에서 **로그인** 버튼을 누르면 OAuth2 인증을 거쳐 `http://localhost:8080/login`의 브랜딩된 로그인 화면이 표시됩니다. `8080/login`으로 직접 접속하지 마세요.

## 원본 이미지로 되돌리기

```bash
docker tag msa-lecture/auth-server:1.0-orig msa-lecture/auth-server:1.0
docker compose up -d --force-recreate auth-server api-gateway
```

## 프로젝트 루트에서 (초기 트러블슈팅/리빌드 고려, 캐시 없이 빌드, 컨테이너는 묶어서 백그라운드로 실행)
docker compose build --no-cache
docker compose up -d

## 또는 한줄로
docker compose build --no-cache && docker compose up -d

# 로그 확인
## 전체 로그 한번에 보기
docker compose logs -f

## 또는 개별 컨테이너 로그 보기
docker compose logs -f [서비스명]

docker compose logs -f mariadb
docker compose logs -f kafka
docker compose logs -f eureka-server
docker compose logs -f auth-server
docker compose logs -f api-gateway
docker compose logs -f user-service
docker compose logs -f course-service
docker compose logs -f enrollment-service
docker compose logs -f payment-service
docker compose logs -f recommend-service

# 전체 종료 (또는 컨테이너 빌드 중, 실패 시에 기존 컨테이너 정리)
docker compose down

# 서버 기동 상태 확인
http://localhost:8761/

# 프론트엔드 실행
## 로컬 실행 방법
cd vue-frontend
npm install
npm run dev

## 브라우저에서 접속
http://localhost:3000 
