# Передача контекста (feature-developer -> feature-tester & browser-ui-tester)

## Что сделано:
1. **Единый переиспользуемый компонент таблицы «История покупок» (`PurchasesHistoryTable`):**
   - **Где была проблема:** В семейной аналитике (`FamilyAnalyticsWidget`) и в личных тратах (`PersonalAnalyticsWidget`) код таблицы дублировался, при этом было функциональное расхождение: в личной аналитике покупку можно было удалить, а в семейной аналитике колонка и кнопка удаления отсутствовали.
   - **Решение:**
     1. Создан модуль [`src/features/view-purchases-history`](file:///c:/Users/garya/Desktop/smart-budget/src/features/view-purchases-history) с компонентом [`PurchasesHistoryTable.tsx`](file:///c:/Users/garya/Desktop/smart-budget/src/features/view-purchases-history/ui/PurchasesHistoryTable.tsx) на базе TanStack Table v9.
     2. Компонент поддерживает:
        - Адаптивную пагинацию: 5 строк на мобильных устройствах (< 640px) и 10 строк на десктопе с авто-ресайзом.
        - Сортировку по всем колонкам (Дата, Кто купил, Категория, Магазин, Сумма) с индикацией стрелок.
        - Возможность удаления покупок (`onDeleteExpense`, `deletingId`) с подтверждением и спиннером загрузки как в личной, так и в семейной аналитике.
        - Отображение аватара и имени члена семьи, совершившего покупку.
        - Интерактивный бейдж выбранного дня с кнопкой быстрого сброса `(×)`.
     3. Обновлен хук [`useDeleteExpenseMutation`](file:///c:/Users/garya/Desktop/smart-budget/src/entities/expense/api/expenseQueries.ts): теперь он принимает опциональный `familyId` и при удалении покупки автоматически инвалидирует как персональный кэш пользователя, так и кэш семейных расходов `family(familyId)`.
     4. В обоих виджетах (`PersonalAnalyticsWidget` и `FamilyAnalyticsWidget`) удалены сотни строк дублирующегося инлайн-кода таблиц и интегрирован единый `<PurchasesHistoryTable />`.

2. **Скелетон-лоадеры (Skeleton Loaders) при обновлении данных по выбору даты:**
   - Добавлено реактивное состояние `isDateTransitioning` при смене диапазона дат (`filter`) или выборе конкретного дня на графике (`selectedDayDate`).
   - Скелетоны внедрены:
     - В карточках KPI (Мой бюджет / Семейный бюджет, Средний чек в день, Остаток бюджета).
     - В блоке вклада участников семьи в общие траты.
     - В блоке рейтинга супермаркетов.
     - В самой таблице `PurchasesHistoryTable` (5 строк со скелетон-ячейками с плавной пульсирующей анимацией `animate-pulse`).

3. **Синхронизация с интерактивным выбором даты в графике расходов:**
   - В [`DailyBarChart.tsx`](file:///c:/Users/garya/Desktop/smart-budget/src/widgets/personal-analytics/ui/charts/DailyBarChart.tsx) клик по бару или чипу дня фильтрует таблицу и плавно запускает скелетон-переход.

## Точки интеграции:
- [`PurchasesHistoryTable.tsx`](file:///c:/Users/garya/Desktop/smart-budget/src/features/view-purchases-history/ui/PurchasesHistoryTable.tsx)
- [`PersonalAnalyticsWidget.tsx`](file:///c:/Users/garya/Desktop/smart-budget/src/widgets/personal-analytics/ui/PersonalAnalyticsWidget.tsx)
- [`FamilyAnalyticsWidget.tsx`](file:///c:/Users/garya/Desktop/smart-budget/src/widgets/family-analytics/ui/FamilyAnalyticsWidget.tsx)
- [`expenseQueries.ts`](file:///c:/Users/garya/Desktop/smart-budget/src/entities/expense/api/expenseQueries.ts)
- [`DailyBarChart.tsx`](file:///c:/Users/garya/Desktop/smart-budget/src/widgets/personal-analytics/ui/charts/DailyBarChart.tsx)

## Верификация:
- `npm run lint` (`tsc --noEmit`): **0 ошибок (PASS)**.
- `tests/expenseAnalytics.test.ts`: **8/8 PASS**.
- `tests/familyService.test.ts`: **7/7 PASS**.
- Vite Dev Server: запущен и активен на порту 3000 (HMR обновления прошли без ошибок).
