# TASK SPECIFICATION (Gemini 3.8 Flash Optimized)

## 1. Persona & Role
Senior Frontend Engineer (CSS Architecture, UI/UX Polish).

## 2. Task & Workflow
- Цель: Уменьшить визуальную толщину всех скроллбаров (кастомного ScrollContainer и системных webkit-стилей) ровно в два раза.
- Шаги реализации:
  1. В `ScrollContainer.tsx` уменьшить толщину трека и ползунка с 6-8px (`h-1.5`/`w-1.5`) до 3-4px (`h-[3px]`/`w-[3px]`). Сохранить при этом удобную зону захвата курсором (hit-area).
  2. В `src/index.css` уменьшить размеры `::-webkit-scrollbar` с 8px до 4px (по ширине и высоте).
  3. Проверить отсутствие регрессий в `tsc --noEmit` и `npm run build`.
  4. Обновить отчеты `handoff.md` и `test-report.md`.

## 3. Context & Guardrails
- Стек: React 19, Tailwind CSS v4.
- thinking_level = "medium".
- Без LaTeX-символов.

## 4. Format & Definition of Done (DoD)
- [x] Толщина горизонтального и вертикального скроллбара уменьшена в 2 раза.
- [x] Зона клика и перетаскивания курсором мыши осталась удобной и стабильной.
- [x] `tsc --noEmit` и `npm run build` проходят без ошибок.
