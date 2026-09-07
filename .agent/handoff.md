# HANDOFF CONTRACT
- source_agent: feature-developer
- status: SUCCESS
- artifacts_produced:
  - src/shared/ui/mobile-scroll-indicator/MobileScrollIndicator.tsx
  - src/shared/ui/index.ts
  - src/app/router/router.tsx
  - src/index.css
- pending_tasks: []
- blockers_or_notes: На всех мобильных устройствах дефолтные браузерные скроллбары страницы полностью скрыты (scrollbar-width: none, -webkit-scrollbar display: none). Внедрен кастомный ультра-легкий компонент MobileScrollIndicator, прижатый к правому краю экрана телефона (right: 1.5px) с учетом Safe Area Inset. Индикатор полностью скрыт в покое (opacity: 0), мгновенно появляется при скролле (opacity: 1), плавно перемещается по высоте через аппаратный GPU translate3d и плавно затухает через 850 мс после завершения прокрутки, точно повторяя нативную физику мобильных ОС (iOS/Android).
