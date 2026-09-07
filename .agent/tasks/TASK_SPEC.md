# TASK SPECIFICATION (Gemini 3.8 Flash Optimized)

## 1. Persona & Role
Senior Frontend Engineer / UI Polish (CSS Glow, Micro-interactions).

## 2. Task & Workflow
- Цель: Сделать свечение ползунка кастомного скроллбара при зажатии в разы меньше, чтобы оно было едва заметным и деликатным.
- Шаги реализации:
  1. В `ScrollContainer.tsx` заменить активные классы свечения `shadow-md shadow-emerald-500/50 ring-1 ring-emerald-400/40` на микро-свечение `shadow-[0_0_3px_rgba(16,185,129,0.25)]` без резкого кольца ring.
  2. В `src/index.css` уменьшить системное свечение `box-shadow` при зажатии с `10px (0.6 opacity)` до деликатного `3px (0.25 opacity)`.
  3. Выполнить проверку `tsc --noEmit` и сборку `npm run build`.
  4. Обновить отчеты `handoff.md` и `test-report.md`.

## 3. Context & Guardrails
- Стек: React 19, Tailwind CSS v4.
- thinking_level = "medium".
- Без LaTeX-символов.

## 4. Format & Definition of Done (DoD)
- [x] При зажатии ползунка свечение едва заметно (деликатный фокус вместо яркого гало).
- [x] `tsc --noEmit` и `npm run build` проходят без ошибок.
