# TASK SPECIFICATION (Gemini 3.8 Flash Optimized)

## 1. Persona & Role
Senior Frontend Engineer (React 19, Tailwind CSS v4, TypeScript).

## 2. Task & Workflow
- Цель: Заменить начертание font-weight 900 (`font-black`) на font-weight 700 (`font-bold`) для всех числовых показателей в приложении.
- Шаги реализации:
  1. Найти все вхождения `font-black` у чисел в компонентах аналитики и семейного пространства.
  2. Заменить класс `font-black` на `font-bold` в `PersonalAnalyticsWidget.tsx`, `FamilyAnalyticsWidget.tsx`, `FamilySpaceWidget.tsx`.
  3. Провести статический анализ типов через `tsc --noEmit`.
  4. Сформировать манифест передачи `handoff.md` и отчет о тестировании.

## 3. Context & Guardrails
- Стек: React 19, Tailwind CSS v4, Montserrat (для цифр), Inter (для текста).
- thinking_level = "medium".
- Строгий запрет LaTeX-разметки. Только ASCII-нотация.
- Сохранять адаптивность и отсутствие layout shift.

## 4. Format & Definition of Done (DoD)
- [x] Все числовые блоки с `font-black` переведены на `font-bold` (font-weight: 700).
- [x] `tsc --noEmit` завершается без ошибок.
- [x] Создан файл `.agent/handoff.md`.
