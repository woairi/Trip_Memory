# 🧳 Trip Memory — 유럽 여행 기록

유럽 여행 중 **매일 사진과 함께 느낌·감상·기억에 남는 일**을 기록하는 반응형 웹 앱입니다.
서버나 계정 없이, 모든 데이터를 **브라우저에 로컬 저장**(IndexedDB)합니다.

## 주요 기능

- 📜 **타임라인** — 모든 기록을 날짜순 카드로 한눈에
- 🗓️ **달력 보기** — 월별 달력에서 기록한 날을 확인하고 날짜별로 탐색
- ✏️ **날짜별 일기** — 제목 + 느낌·감상·기억에 남는 일 작성
- 📷 **사진 첨부** — 여러 장 업로드(자동 리사이즈로 용량 절약), 사진별 설명
- 📍 **여행지/위치** — 장소명 입력 및 지도에서 위치 핀 지정(OpenStreetMap)
- 🔍 **검색** — 제목·내용·장소·태그를 한 번에 검색
- 🏷️ **태그** — 기록에 태그를 달고, 태그 칩으로 빠르게 필터링
- 🗺️ **여행 지도** — 위치를 번호 핀(방문 순서)과 경로로 표시하고, 나라·도시별로 필터
  - 핀 위치로 도시·나라 자동 채우기(역지오코딩, 네트워크 가능 시)

## 기술 스택

- Vite + React + TypeScript
- Tailwind CSS (모바일 우선 반응형)
- Dexie.js (IndexedDB) — 일기·사진 Blob 저장
- React Router, date-fns, Leaflet / react-leaflet

## 실행 방법

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 타입 체크 + 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 배포 (Vercel)

순수 정적 SPA이므로 정적 호스팅에 그대로 올리면 됩니다. GitHub 저장소가 있으니 Vercel 연결이 가장 간단합니다.

1. [vercel.com](https://vercel.com)에서 GitHub로 로그인 → **Add New… → Project**
2. `doosanrndaitft-collab/trip_memory` 저장소를 **Import**
3. 프레임워크는 **Vite**로 자동 감지됨 (Build: `npm run build`, Output: `dist`) — 그대로 **Deploy**
4. 발급된 URL로 접속. 이후 브랜치에 push하면 자동 재배포됩니다.

`vercel.json`에 SPA fallback(`/* → /index.html`)이 들어 있어 `/map`, `/entry/3` 같은 경로를 새로고침·직접 열기 해도 404가 나지 않습니다.

> Cloudflare Pages / Netlify를 쓸 경우 `public/_redirects`에 `/* /index.html 200` 한 줄을 추가하면 동일하게 동작합니다.

## 데이터 보관 안내

모든 기록과 사진은 **사용 중인 브라우저 안에만** 저장됩니다.
브라우저 데이터를 삭제하거나 다른 기기/브라우저에서 열면 기록이 보이지 않습니다.
(추후 클라우드 동기화/백업 기능으로 확장 가능합니다.)
