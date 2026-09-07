# HANDOFF CONTRACT
- source_agent: feature-developer
- status: SUCCESS
- artifacts_produced:
  - src/app/router/router.tsx
  - src/shared/ui/index.ts
  - src/index.css
- pending_tasks: []
- blockers_or_notes: Плавный скроллбар через JS полностью отменен: удален компонент MobileScrollIndicator и все связанные с ним глобальные обработчики событий scroll, таймеры и вызовы getBoundingClientRect. Плавность скролла опирается исключительно на чистый нативный CSS (scroll-behavior smooth, -webkit-overflow-scrolling touch). На мобильных устройствах полностью возвращены системные дефолтные скроллбары операционных систем. Нагрузка на процессор и память сведена к нулю.
