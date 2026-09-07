# Передача контекста (feature-developer -> feature-tester)

## Что сделано:
1. **Устранение неактуальных данных и очистка от синтетических сидов**:
   - Полностью удалена функция `generateSeedExpenses` в `src/entities/expense/api/expenseService.ts`.
   - Добавлена очистка кэша от любых записей с префиксом `seed_exp_*`. При первоначальной загрузке загружаются и отображаются строго реальные данные из Supabase (486 ₽, 5 покупок вместо 33 696 ₽ и 29 покупок).
2. **Скелетон-прелоадер при загрузке компонентов и запросах**:
   - Создан компонент `AnalyticsDashboardSkeleton` в `src/shared/ui/analytics-skeleton/AnalyticsDashboardSkeleton.tsx`, визуально повторяющий дашборд (3 KPI карточки, сетка участников, 2 графика и таблица покупок с анимацией `animate-pulse`).
   - Подключен в `FamilyAnalyticsWidget` и `PersonalAnalyticsWidget` на период, пока активен `isLoading` и нет готовых данных.
   - В `expenseQueries.ts` скорректирован `initialData`: если в кэше нет реальных данных, возвращается `undefined`, благодаря чему TanStack Query активирует `isLoading: true` и отображает скелетон-прелоадер.
3. **Модель Soft Delete и ролевые права удаления**:
   - В схему `expenseSchema` и типы Supabase добавлены поля `deletedAt` (`deleted_at`) и `deletedBy` (`deleted_by`).
   - В `deletePersonalExpense` и `restorePersonalExpense` внедрена строгая валидация владельца: пользователь может удалять и восстанавливать **только те товары, которые он добавил сам** (`exp.userId === userId`).
   - При удалении выставляется `deleted_at` и `deleted_by` в базе Supabase и локальном кэше.
4. **Разделение корзин (Личная vs Семейная)**:
   - В семейной аналитике добавлены запросы `useFamilyDeletedExpensesQuery` и `fetchFamilyDeletedExpenses`: в корзине отображаются удаленные товары **всех** участников семьи.
   - В личной аналитике добавлены `usePersonalDeletedExpensesQuery` и `fetchPersonalDeletedExpenses`: в корзине отображаются **только свои** удаленные товары.
   - В `PurchasesHistoryTable`: для чужих покупок кнопка удаления и кнопка восстановления скрыта (отображается нейтральный прочерк `—` с подсказкой).
5. **Двусторонняя синхронизация**:
   - При удалении/восстановлении своего товара в семейной аналитике он удаляется/восстанавливается и в личной аналитике.
   - При удалении/восстановлении в личной аналитике он удаляется/восстанавливается и в семейной аналитике.
6. **Supabase Realtime**:
   - Добавлен хук `useExpensesRealtimeSubscription`: слушает события таблицы `expenses` и инвалидирует TanStack Query кэш для моментального обновления данных у всех членов семьи на всех вкладках и устройствах.

## Точки интеграции:
- `src/entities/expense/model/schema.ts`: `deletedAt`, `deletedBy`.
- `src/shared/api/supabaseTypes.ts`: синхронизация колонок `deleted_at`, `deleted_by`.
- `src/entities/expense/api/expenseService.ts`: очистка сидов, `fetchPersonalDeletedExpenses`, `fetchFamilyDeletedExpenses`, soft-delete и soft-restore с проверкой прав.
- `src/entities/expense/api/expenseQueries.ts`: `usePersonalDeletedExpensesQuery`, `useFamilyDeletedExpensesQuery`, `useExpensesRealtimeSubscription`.
- `src/shared/ui/analytics-skeleton/AnalyticsDashboardSkeleton.tsx`: переиспользуемый скелетон дашборда.
- `src/features/view-purchases-history/ui/PurchasesHistoryTable.tsx`: поддержка внешнего списка `deletedExpenses` и проверка `isOwner`.
- `src/widgets/family-analytics/ui/FamilyAnalyticsWidget.tsx`: скелетон, семейная корзина, Realtime подписка.
- `src/widgets/personal-analytics/ui/PersonalAnalyticsWidget.tsx`: скелетон, личная корзина, Realtime подписка.

## Критерии успеха для тестирования:
- [TEST 1] Защита прав: попытка удаления чужого товара в семейной аналитике вызывает ошибку прав.
- [TEST 2] Успешное удаление своего товара: статус товара переходит в удаленный (`deletedAt`, `deletedBy`).
- [TEST 3] Двусторонняя синхронизация: удаление своего товара в семейной аналитике исключает его из активных трат личной аналитики и добавляет в личную корзину.
- [TEST 4] Двусторонняя синхронизация: удаление в личной аналитике исключает товар из активных трат семейной аналитики и добавляет в семейную корзину.
- [TEST 5] Семейная корзина: отображает удаленные товары всех участников семьи.
- [TEST 6] Личная корзина: отображает ТОЛЬКО удаленные товары текущего пользователя.
- [TEST 7] Восстановление своего товара: возвращает товар в активные списки обеих аналитик.
- [TEST 8] Защита восстановления: попытка восстановить чужой товар вызывает ошибку прав.
- [TEST 9] Отсутствие сидов: кэш не содержит синтетических mock-записей `seed_exp_*`.
