# TASK SPECIFICATION (Gemini 3.8 Flash Optimized)

## 1. Persona & Role
Senior Frontend Engineer (UI/UX Cleanliness, Table Formatting).

## 2. Task & Workflow
- Цель: Убрать лишнее отображение названия в скобках `({exp.title})` в колонке «Категория» таблицы истории покупок `PurchasesHistoryTable`.
- Шаги реализации:
  1. В `src/features/view-purchases-history/ui/PurchasesHistoryTable.tsx` в колонке категории удалить блок:
     ```tsx
     {exp.title && exp.title.toLowerCase() !== cat.label.toLowerCase() && (
       <span className="text-xs text-slate-400 truncate hidden sm:inline" title={exp.title}>
         ({exp.title})
       </span>
     )}
     ```
  2. Проверить `tsc --noEmit` и `npm run build`.
  3. Обновить `handoff.md` и `test-report.md`.

## 3. Context & Guardrails
- Стек: React 19, TanStack Table v9, Tailwind CSS v4.
- thinking_level = "medium".
- Без LaTeX-символов.

## 4. Format & Definition of Done (DoD)
- [x] Колонка «Категория» отображает только плашку категории без дублирующего названия в скобках.
- [x] `tsc --noEmit` и `npm run build` проходят без ошибок.
