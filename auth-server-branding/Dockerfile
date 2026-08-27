# 지원나침반 브랜딩 오버레이 — 원본 auth-server 이미지 위에 로그인 페이지 CSS만 덧입힘.
# /overlay 디렉터리를 시스템 클래스패스 앞에 두면 ClassLoader 부모 위임(parent-first) 규칙에 따라
# spring-security-web 안의 default-ui.css 대신 이 파일이 먼저 발견된다. jar 원본은 수정하지 않음.
FROM msa-lecture/auth-server:1.0
COPY default-ui.css /overlay/org/springframework/security/default-ui.css
WORKDIR /app
ENTRYPOINT ["java", "-cp", "/overlay:/app/app.jar", "org.springframework.boot.loader.launch.JarLauncher"]
