🌏 [English](./README.md)

# 환스코드(HWANSCORD) — 프론트엔드

친구들끼리 쓰는 디스코드 같은 채팅 앱입니다. 채팅 채널, 다이렉트 메시지, 음성 채널, 화면 공유를 지원합니다.
이 저장소는 웹 클라이언트(Vue 3)이고, API 는 [hwanscord-backend](https://github.com/akon47/hwanscord-backend) 에 있습니다.

**접속:** https://hwanscord.kimhwan.kr/

## 기능

- **채팅** — 메시지 묶음 표시, 날짜·새 메시지 구분선, 위로 무한 스크롤, 맨 아래로 이동, 답장, 반응(이모지),
  바로 수정(빈 입력창에서 ↑ 키), 미리보기가 있는 삭제 확인, 메시지 고정, 전체 검색.
- **서식** — 안전한 마크다운: 굵게, 기울임, 밑줄, 취소선, 인라인 코드, 코드 블록, 스포일러, 인용, 링크 자동 변환,
  `@멘션`·`@everyone`, 이모지만 보내면 크게 표시.
- **입력창** — 멘션·`:이모지:` 자동 완성, 최근 사용이 있는 이모지 선택기, 버튼·드래그 앤 드롭·붙여넣기로 파일 첨부(진행률 표시),
  즉시 표시 후 실패하면 다시 보내기, 채널별 임시 저장, 입력 중 표시.
- **미디어** — 이미지 미리보기(크게 보기), 동영상·오디오 플레이어, 파일 카드.
- **상태** — 온라인 / 자리 비움 / 다른 용무 중 / 오프라인 표시, 사용자 지정 상태, 멤버 목록, 프로필 팝업.
- **안 읽음 표시** — 채널별 안 읽음·멘션 배지, 탭 제목 숫자, 알림 소리와 데스크톱 알림(선택).
- **다이렉트 메시지** — 홈 화면, 멤버 목록, 프로필에서 바로 1:1 대화.
- **음성** — WebRTC 메시 음성, 말하는 중 표시, 마이크·헤드셋 음소거, 사용자별 음량(0–200 %), 입력 장치 선택,
  에코 제거·소음 억제 설정, 입장·퇴장 효과음.
- **화면 공유** — 음성 채널에서 화면이나 창을 공유하고, 다른 사람은 *시청하기* 로 봅니다.
  TURN 중계는 백엔드가 Cloudflare Realtime 에서 받아 오며, 월 예산을 넘으면 자동으로 멈춰 무료 한도 안에서만 씁니다.
- **설정** — 내 계정(아바타, 별명, 소개, 비밀번호), 상태, 음성, 알림, 모양(다크/라이트, 간단히 보기, 글꼴 크기),
  관리자용 TURN 사용량 화면.
- 휴대폰에서는 아래 탭 바로 채널·채팅·멤버를 전환합니다.

## 기술

Vue 3.5 (`<script setup>`, TypeScript strict) · Vite 6 · Pinia · Vue Router 4 · socket.io-client 4 · Lucide 아이콘 ·
디자인 토큰 기반 직접 작성한 CSS · Web Audio 효과음 · Vitest + Vue Test Utils.

## 개발

Node.js 22 가 필요합니다.

```sh
npm install
npm run dev          # http://localhost:5173 — /api, /socket.io, /uploads, /healthz 를 http://localhost:8080 으로 프록시
```

백엔드를 8080 포트로 같이 띄웁니다(백엔드 README 참고, `SEED=1 npm run dev:mem` 은 메모리 MongoDB 와 데모 계정으로 시작).
다른 백엔드를 쓰려면 `VITE_DEV_BACKEND` 를 지정합니다.

```sh
npm run lint         # eslint
npm run typecheck    # vue-tsc
npm test -- --run    # vitest
npm run build        # dist/ 로 운영 빌드
```

## 배포

```
master 에 push → Jenkins(build.kimhwan.kr, 잡 hwanscord-frontend)
  → docker build --target test     (lint + 타입 검사 + 테스트)
  → docker build --target runtime  (빌드된 SPA 를 담은 nginx 이미지)
  → Docker Hub akon47/hwanscord-frontend:<빌드 번호>
  → ssh deploy@10.10.10.75: deploy/ 를 /srv/hwanscord/frontend 로 복사, deploy.sh 실행(compose pull + up)
  → 확인: 웹 200, version.txt == 빌드 번호, 프록시를 거친 /healthz
```

컨테이너 안의 nginx 가 SPA 를 제공하고 `/api/`, `/socket.io/`(WebSocket), `/uploads/`, `/healthz` 를 같은 `hwanscord`
도커 네트워크의 `hwanscord-api:8080` 으로 넘깁니다. 그래서 브라우저는 한 주소만 씁니다.
TLS 는 앞단의 홈랩 nginx 관문이 처리하고, 이미지에는 비밀값이 없습니다.

## 라이선스

MIT
