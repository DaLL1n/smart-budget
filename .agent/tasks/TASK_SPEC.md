> Context Loaded:
> - Rulebook: references/gemini_3_8_flash_rules.md [OK]
> - Workflow: references/antigravity_prompting.md [OK]
> - Template: templates/task_spec_template.md [OK]

# TASK SPECIFICATION: Автономное создание категорий расходов AI-агентом (Dynamic Expense Categories)

## 1. PERSONA & ROLE
- Роль: Senior Fullstack Engineer & Supabase Architect.
- Стек: React 19, TypeScript (~5.8.2), Vite, Tailwind CSS v4, Motion, Supabase (@supabase/supabase-js), TanStack Query / Store, Gemini 3.8 Flash.
- Задача:
  1. Реализовать динамическую систему категорий расходов: сохранение базовых 7 категорий как дефолтных и поддержка кастомных категорий, создаваемых AI-агентом.
  2. Научить AI-сканер (`receiptAiService.ts`) и Edge Function (`parse-receipt-url`) автономно определять, когда товар не вписывается в существующие категории, и генерировать новую категорию (с уникальным id, понятным русским label, emoji и цветом).
  3. Сохранять новые категории в профиле пользователя (`public.users.profile.custom_categories`) в Supabase и синхронизировать с локальным состоянием/IndexedDB.
  4. Обеспечить корректное отображение динамических категорий во всех компонентах: `ScanReceiptView`, `DashboardOverview` (круговая диаграмма и прогресс-бары), `PurchasesHistoryTable` (бейджи и фильтры), модалка смены категории.

## 2. TASK & WORKFLOW
### Шаги реализации:
1. **Шаг 1 (Модель данных и типы)**:
   - В `src/entities/expense/model/schema.ts`:
     - Сделать `expenseCategorySchema` расширяемым `z.string()`.
     - Зафиксировать базовые 7 категорий как `DEFAULT_EXPENSE_CATEGORIES`.
     - Описать интерфейс `CustomCategory` (`id`, `label`, `icon`, `color`, `badgeBg`).
     - Создать хелпер `getCategoryMeta(categoryId: string, customCategories?: CustomCategory[])`.
   - В `src/entities/expense/model/selectors.ts`: адаптировать аналитические функции для работы с динамическим набором ключей.

2. **Шаг 2 (Слой пользователя и сохранение в Supabase)**:
   - В `src/entities/user`:
     - Добавить чтение и сохранение `custom_categories` в профиле пользователя Supabase.
     - Добавить экшен `saveCustomCategories(newCategories: CustomCategory[])`.

3. **Шаг 3 (AI-сканер чеков и Edge Function)**:
   - В `src/features/scan-receipt/api/receiptAiService.ts`:
     - Передавать актуальный список доступных категорий в системный промпт Gemini.
     - Расширить схему ответа полем `newCategories: Array<{ id: string; label: string; icon: string; color: string }>`.
     - При сохранении чека вызывать сохранение новых категорий в профиль пользователя.
   - В `supabase/functions/parse-receipt-url/index.ts`:
     - Принимать текущий список категорий или возвращать новые категории при распознавании специфических отделов.

4. **Шаг 4 (UI-компоненты и визуализация)**:
   - `ScanReceiptView.tsx`: отрисовка аккордеонов и селектора отделов с учетом всех категорий (базовые + кастомные).
   - `DashboardOverview.tsx`: рендеринг круговой диаграммы и прогресс-баров по категориям без хардкода 7 категорий.
   - `PurchasesHistoryTable.tsx`: кастомные бейджи и фильтрация по любой категории.

5. **Шаг 5 (Тестирование и верификация)**:
   - Запуск `npm run lint` (tsc --noEmit).
   - Верификация распознавания чека с нестандартными товарами (чипсы/корнерсы/зоотовары).
   - Формирование отчетов `.agent/handoff.md` и `.agent/test-report.md`.

## 3. CONTEXT & GUARDRAILS
- Строго Tailwind v4, Slate палитра.
- Запрет LaTeX, strict thinking level medium/high.
- Никаких технических плашек движков («Gemini», «GPT») в UI.
- Полная автономия AI при создании категорий (без блокирующих модалок подтверждения).
- Сохранение принципов GEMINI.md (изоляция личного дашборда, единый AI-агент приложения).
