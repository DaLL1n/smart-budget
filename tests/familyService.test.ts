import assert from 'node:assert';

// Mock localStorage for test environment
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, val: string) => storage.set(key, val),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  };
}

if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    location: { origin: 'http://localhost:3000' }
  };
}

import { 
  fetchFamily, 
  addFamilyMember, 
  leaveFamily, 
  removeFamilyMember,
  updateFamilyPreferences 
} from '../src/entities/family';
import { User } from '../src/entities/user';

const mockUserA: User = {
  id: 'user-a-1',
  name: 'Иван Иванов',
  email: 'ivan@family.ru',
  avatar: '👨‍🍳',
  avatarColor: 'from-amber-400 to-orange-500',
  isOnboarded: true,
  createdAt: '2026-08-01',
  profile: {
    currency: 'RUB',
    monthlyBudget: 50000,
    weeklyTarget: 12500,
    dailyTarget: 1667,
    adultsCount: 2,
    childrenCount: 1,
    petsCount: 0,
    dietaryPreferences: ['standard'],
    favoriteStores: ['pyaterochka', 'samokat'],
    budgetGoal: 'smart_planning',
    budgetGoals: ['smart_planning', 'save_money'],
    budgetAlertThreshold: 80,
    notificationSettings: { budgetAlerts: true, weeklyDigest: true, savingTips: true },
    updatedAt: new Date().toISOString(),
  },
};

const mockUserB: User = {
  id: 'user-b-2',
  name: 'Анна Иванова',
  email: 'anna@family.ru',
  avatar: '🥑',
  avatarColor: 'from-emerald-400 to-teal-500',
  isOnboarded: true,
  createdAt: '2026-08-05',
  profile: {
    currency: 'RUB',
    monthlyBudget: 30000,
    weeklyTarget: 7500,
    dailyTarget: 1000,
    adultsCount: 1,
    childrenCount: 0,
    petsCount: 0,
    dietaryPreferences: ['healthy'],
    favoriteStores: ['vkusvill'],
    budgetGoal: 'eat_healthier',
    budgetGoals: ['eat_healthier'],
    budgetAlertThreshold: 80,
    notificationSettings: { budgetAlerts: true, weeklyDigest: true, savingTips: true },
    updatedAt: new Date().toISOString(),
  },
};

async function runTests() {
  console.log('=== FEATURE-TESTER: ЗАПУСК ТЕСТОВ ПРЯМОГО СЕМЕЙНОГО ДОСТУПА (БЕЗ ИНВАЙТОВ) ===\n');

  // Register mock users in local registry
  localStorage.setItem(
    'smart_budget_registered_users_v1', 
    JSON.stringify({
      [mockUserA.id]: mockUserA,
      [mockUserB.id]: mockUserB,
    })
  );

  // Test 1: Прямое добавление пользователя по Email (создание семьи для двоих)
  const family = await addFamilyMember(mockUserA, 'anna@family.ru');
  assert.ok(family.id, 'Семья должна иметь сгенерированный ID');
  assert.strictEqual(family.memberIds.length, 2, 'В семье должно быть 2 участника');
  assert.ok(family.memberIds.includes(mockUserA.id), 'Участник А должен быть в семье');
  assert.ok(family.memberIds.includes(mockUserB.id), 'Участник Б должен быть в семье');
  console.log('[PASS 1/5] Прямое добавление по Email без инвайтов и создание семьи');

  // Test 2: Запрет добавления собственного Email
  await assert.rejects(
    async () => {
      await addFamilyMember(mockUserA, 'ivan@family.ru');
    },
    /Вы не можете добавить свой собственный адрес/,
    'Система должна блокировать добавление самого себя'
  );
  console.log('[PASS 2/5] Защита от добавления собственного Email');

  // Test 3: Запрет повторного добавления участника
  mockUserA.familyId = family.id;
  await assert.rejects(
    async () => {
      await addFamilyMember(mockUserA, 'anna@family.ru');
    },
    /уже состоит в/,
    'Система должна блокировать повторное добавление'
  );
  console.log('[PASS 3/5] Защита от повторного добавления существующего участника');

  // Test 4: Удаление участника из семьи (равноправие)
  const familyAfterRemove = await removeFamilyMember(mockUserA, mockUserB.id);
  assert.strictEqual(familyAfterRemove, null, 'После удаления второго участника семья из 1 человека должна быть распущена');
  console.log('[PASS 4/5] Удаление участника и автоматический роспуск при 1 человеке');

  // Test 5: Выход из семьи
  mockUserA.familyId = null;
  mockUserB.familyId = null;
  const family2 = await addFamilyMember(mockUserA, 'anna@family.ru');
  mockUserA.familyId = family2.id;

  // Test 6: Синхронизация стратегий семьи через updateFamilyPreferences
  const updatedFamilyWithGoals = await updateFamilyPreferences(family2.id, {
    budgetGoals: ['eat_healthier', 'smart_planning', 'save_money', 'strict_budget'],
    dietaryPreferences: ['standard', 'healthy', 'vegetarian'],
  });
  assert.ok(updatedFamilyWithGoals, 'Семья должна вернуться после обновления');
  assert.strictEqual(updatedFamilyWithGoals.budgetGoals.length, 4, 'У семьи должно быть 4 обновленные стратегии');
  assert.ok(updatedFamilyWithGoals.budgetGoals.includes('strict_budget'), 'Стратегия strict_budget должна присутствовать');
  assert.ok(updatedFamilyWithGoals.dietaryPreferences.includes('vegetarian'), 'Диета vegetarian должна присутствовать');
  console.log('[PASS 6/7] Синхронизация стратегий бюджета и предпочтений семьи');

  // Test 7: Проверка повторного чтения семьи с актуальными стратегиями
  const refetchedFamily = await fetchFamily(family2.id);
  assert.ok(refetchedFamily, 'Семья должна успешно загружаться');
  assert.deepStrictEqual(
    refetchedFamily.budgetGoals, 
    ['eat_healthier', 'smart_planning', 'save_money', 'strict_budget'],
    'Сохраненные стратегии должны точно совпадать'
  );
  console.log('[PASS 7/7] Персистентность и согласованность стратегий семьи при повторной выборке');

  await leaveFamily(mockUserA);
  assert.strictEqual(mockUserA.familyId, null, 'После выхода familyId у пользователя должен быть null');

  console.log('\n✅ РЕЗУЛЬТАТ FEATURE-TESTER: Все 7 сценариев семейного доступа и синхронизации стратегий успешно пройдены!');
}

runTests().catch(err => {
  console.error('Ошибка в тестах:', err);
  process.exit(1);
});
