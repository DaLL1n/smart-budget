# TASK SPECIFICATION (Gemini 3.8 Flash Optimized)

## 1. Persona & Role
Senior Frontend Engineer (UI/UX Cleanliness, Component Synchronization).

## 2. Task & Workflow
- Цель: Удалить подпись периода («за N дней») из шапки второй KPI-карточки («Средний чек в день»).
- Шаги реализации:
  1. В `src/widgets/personal-analytics/ui/PersonalAnalyticsWidget.tsx` удалить `<span className="text-[10px] font-mono text-slate-400">за {daysInRange} ...</span>`.
  2. В `src/widgets/family-analytics/ui/FamilyAnalyticsWidget.tsx` аналогично удалить эту подпись периода.
  3. В `src/shared/ui/analytics-skeleton/AnalyticsDashboardSkeleton.tsx` удалить соответствующий серый плейсхолдер `<div className="h-3 w-16 bg-slate-800/50 rounded" />` для сохранения соответствия 1:1.
  4. Выполнить проверку `tsc --noEmit` и сборку `npm run build`.
  5. Обновить отчеты `handoff.md` и `test-report.md`.

## 3. Context & Guardrails
- Стек: React 19, TypeScript, Tailwind CSS v4.
- thinking_level = "medium".
- Без LaTeX-символов.

## 4. Format & Definition of Done (DoD)
- [x] Подпись «за N дней» удалена из карточки среднего чека в личном и семейном режимах.
- [x] Скелетон синхронизирован.
- [x] `tsc --noEmit` и `npm run build` проходят без ошибок.
