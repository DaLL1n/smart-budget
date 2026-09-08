import assert from 'node:assert';

// Mock localStorage for test environment
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, val: string) => storage.set(key, val),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (i: number) => Array.from(storage.keys())[i] || null,
    get length() {
      return storage.size;
    },
  };
}

import { 
  Expense, 
  DateFilterState, 
  formatDateIso, 
  filterExpensesByDate, 
  calculatePersonalKPIs, 
  calculateCategoryBreakdown, 
  calculateDailyBarDistribution, 
  calculateStoreBreakdown,
  getLocalExpenses,
  createPersonalExpense,
  deletePersonalExpense,
  formatDayMonth
} from '../src/entities/expense';

async function runTests() {
  console.log('=== FEATURE-TESTER: ЗАПУСК ТЕСТОВ ЛИЧНОЙ АНАЛИТИКИ И РАСХОДОВ ===\n');

  const now = new Date();
  const todayStr = formatDateIso(now);
  const yesterdayStr = formatDateIso(new Date(Date.now() - 86400000));

  const testExpenses: Expense[] = [
    {
      id: 'e1',
      userId: 'u1',
      amount: 1500,
      category: 'vegetables_fruits',
      storeId: 'vkusvill',
      date: todayStr,
      title: 'Овощи',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e2',
      userId: 'u1',
      amount: 2500,
      category: 'meat_fish',
      storeId: 'pyaterochka',
      date: todayStr,
      title: 'Мясо',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e3',
      userId: 'u1',
      amount: 1000,
      category: 'dairy_cheese',
      storeId: 'samokat',
      date: yesterdayStr,
      title: 'Сыр и молоко',
      createdAt: new Date().toISOString(),
    },
  ];

  // Test 1: Фильтрация за Сегодня
  const todayFilter: DateFilterState = { period: 'today' };
  const todayRes = filterExpensesByDate(testExpenses, todayFilter);
  assert.strictEqual(todayRes.filtered.length, 2, 'За сегодня должно быть 2 расхода');
  assert.strictEqual(todayRes.title, 'Сегодня');
  console.log('[PASS 1/8] Фильтрация расходов за «Сегодня»');

  // Test 2: Фильтрация за Вчера
  const yesterdayFilter: DateFilterState = { period: 'yesterday' };
  const yesterdayRes = filterExpensesByDate(testExpenses, yesterdayFilter);
  assert.strictEqual(yesterdayRes.filtered.length, 1, 'За вчера должен быть 1 расход');
  assert.strictEqual(yesterdayRes.title, 'Вчера');
  console.log('[PASS 2/8] Фильтрация расходов за «Вчера»');

  // Test 3: Расчет KPI показателей
  const kpis = calculatePersonalKPIs(todayRes.filtered, 30000, 1, 'Сегодня');
  assert.strictEqual(kpis.totalSpent, 4000, 'Всего потрачено за сегодня должно быть 4000 руб');
  assert.strictEqual(kpis.remainingBudget, 26000, 'Остаток бюджета: 30000 - 4000 = 26000 руб');
  assert.strictEqual(kpis.percentOfBudget, 13, 'Доля от бюджета: 4000/30000 = 13%');
  console.log('[PASS 3/8] Расчет KPI метрик (Total, Remaining, % Budget)');

  // Test 4: Расчет категорий для Donut Chart
  const categories = calculateCategoryBreakdown(testExpenses);
  assert.strictEqual(categories.length, 3, 'Должно быть 3 категории с расходами');
  const sumPercent = categories.reduce((sum, c) => sum + c.percentage, 0);
  assert.ok(sumPercent >= 99 && sumPercent <= 101, 'Сумма процентов категорий должна быть ~100%');
  assert.strictEqual(categories[0].category.id, 'meat_fish', 'Мясо и рыба должны быть на 1 месте (2500 руб)');
  console.log('[PASS 4/8] Распределение категорий для Donut Chart');

  // Test 5: Распределение по дням и превышение лимита
  const dailyLimit = 2000;
  const dailyBars = calculateDailyBarDistribution(testExpenses, { period: '7days' }, dailyLimit);
  assert.ok(dailyBars.length === 7, 'Для 7 дней должно быть 7 столбиков');
  const todayBar = dailyBars.find(b => b.date === todayStr);
  assert.ok(todayBar, 'Столбик сегодняшнего дня должен присутствовать');
  assert.strictEqual(todayBar.amount, 4000);
  assert.strictEqual(todayBar.isOverLimit, true, '4000 > 2000 => перерасход');
  console.log('[PASS 5/8] Столбчатая динамика по дням с флагом перерасхода лимита');

  // Test 6: Рейтинг магазинов
  const stores = calculateStoreBreakdown(testExpenses);
  assert.strictEqual(stores[0].storeId, 'pyaterochka', 'Пятёрочка на 1 месте с 2500 руб');
  console.log('[PASS 6/8] Рейтинг магазинов');

  // Test 7: CRUD операции в expenseService
  const created = await createPersonalExpense({
    userId: 'u1',
    amount: 500,
    category: 'drinks_snacks',
    storeId: 'vkusvill',
    title: 'Чай и сок',
  });
  assert.strictEqual(created.amount, 500);

  const afterAdd = getLocalExpenses('u1');
  assert.ok(afterAdd.some(e => e.id === created.id), 'Новый расход должен быть в списке');

  await deletePersonalExpense(created.id, 'u1');
  const afterDelete = getLocalExpenses('u1');
  assert.ok(!afterDelete.some(e => e.id === created.id), 'Расход должен быть удален');
  console.log('[PASS 7/8] Добавление и удаление расхода в expenseService');

  // Test 8: Форматирование даты в формат «число и месяц» для графиков
  assert.strictEqual(formatDayMonth('2026-09-01'), '1 сентября');
  assert.strictEqual(formatDayMonth('2026-01-15'), '15 января');
  assert.strictEqual(formatDayMonth('2026-12-31'), '31 декабря');
  console.log('[PASS 8/8] Форматирование даты в формат «число и месяц» (formatDayMonth)');

  console.log('\n✅ РЕЗУЛЬТАТ FEATURE-TESTER: Все 8 тестов аналитики расходов успешно пройдены!');
}

runTests().catch(err => {
  console.error('Ошибка в тестах:', err);
  process.exit(1);
});
