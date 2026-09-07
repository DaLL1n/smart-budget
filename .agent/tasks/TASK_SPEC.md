# TASK SPECIFICATION (Gemini 3.8 Flash Optimized)

## 1. Persona & Role
Senior Frontend Engineer (React 19, CSS Animations, UI/UX Consistency).

## 2. Task & Workflow
- Цель: Добавить плавную анимацию появления (`animate-fade-in`), идентичную странице аналитики, для страниц «Дашборд» и «Семья».
- Шаги реализации:
  1. В `src/pages/dashboard/ui/DashboardPage.tsx` и `src/widgets/dashboard-overview/ui/DashboardOverview.tsx` применить класс `animate-fade-in`.
  2. В `src/pages/family/ui/FamilyPage.tsx` и `src/widgets/family-space/ui/FamilySpaceWidget.tsx` заменить устаревшие классы анимации на актуальный `animate-fade-in`.
  3. Провести статический анализ `tsc --noEmit` и тестовую сборку `npm run build`.
  4. Сформировать отчеты `handoff.md` и `test-report.md`.

## 3. Context & Guardrails
- Стек: React 19, Tailwind CSS v4, `animate-fade-in` из `src/index.css`.
- thinking_level = "medium".
- Без LaTeX-символов.
- Плавность и отсутствие скачков/мерцания при переключении табов.

## 4. Format & Definition of Done (DoD)
- [x] Страница Дашборд открывается с плавной анимацией `animate-fade-in`.
- [x] Страница Семья открывается с плавной анимацией `animate-fade-in`.
- [x] `tsc --noEmit` и `npm run build` проходят без ошибок.
