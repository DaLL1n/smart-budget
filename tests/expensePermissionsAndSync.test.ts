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
  createPersonalExpense,
  deletePersonalExpense,
  restorePersonalExpense,
  getLocalExpenses,
  getLocalDeletedExpenses,
  getLocalFamilyExpenses,
  getLocalFamilyDeletedExpenses,
  saveLocalExpenses,
  LOCAL_EXPENSES_KEY,
  LOCAL_DELETED_EXPENSES_KEY
} from '../src/entities/expense';

async function runTests() {
  console.log('=== FEATURE-TESTER: ЗАПУСК ТЕСТОВ ПРАВ УДАЛЕНИЯ И СИНХРОНИЗАЦИИ ===\n');

  localStorage.clear();

  const userA = 'usr_alice';
  const userB = 'usr_bob';
  const familyId = 'fam_test_123';
  const memberIds = [userA, userB];

  // 1. Initial State: Create expenses for both users in the family
  const expAlice = await createPersonalExpense({
    userId: userA,
    amount: 1500,
    category: 'vegetables_fruits',
    storeId: 'vkusvill',
    title: 'Покупка Алисы',
    familyId,
  });

  const expBob = await createPersonalExpense({
    userId: userB,
    amount: 2500,
    category: 'meat_fish',
    storeId: 'pyaterochka',
    title: 'Покупка Боба',
    familyId,
  });

  // [TEST 1]: Protection from deleting another user's expense
  console.log('[RUNNING 1/9] Защита от удаления чужого товара');
  let deleteBlocked = false;
  try {
    // Alice tries to delete Bob's expense
    await deletePersonalExpense(expBob.id, userA);
  } catch (err: any) {
    deleteBlocked = true;
    assert.ok(
      err.message.includes('Пользователь может удалять только те товары, которые он добавил сам'),
      'Ошибка должна содержать сообщение о запрете удаления чужих покупок'
    );
  }
  assert.strictEqual(deleteBlocked, true, 'Попытка удалить чужой товар должна быть заблокирована');
  console.log('  [PASS 1/9] Защита от удаления чужого товара работает корректно.');

  // [TEST 2]: Creator can successfully delete own expense
  console.log('[RUNNING 2/9] Успешное удаление своего товара');
  await deletePersonalExpense(expAlice.id, userA);
  const aliceActiveAfterDelete = getLocalExpenses(userA);
  assert.ok(!aliceActiveAfterDelete.some(e => e.id === expAlice.id), 'Товар Алисы должен быть удален из ее активных трат');

  const aliceDeletedAfterDelete = getLocalDeletedExpenses(userA);
  const deletedItem = aliceDeletedAfterDelete.find(e => e.id === expAlice.id);
  assert.ok(deletedItem, 'Удаленный товар должен появиться в корзине Алисы');
  assert.strictEqual(deletedItem?.deletedBy, userA, 'deletedBy должен быть равен ID создателя Алисы');
  assert.ok(deletedItem?.deletedAt, 'deletedAt должен быть установлен');
  console.log('  [PASS 2/9] Создатель успешно удалил свой товар, выставлены deletedAt и deletedBy.');

  // [TEST 3]: Bidirectional sync: family delete removes from personal active and adds to personal trash
  console.log('[RUNNING 3/9] Двусторонняя синхронизация: удаление в семье удаляет из личной аналитики');
  const familyActiveAfterAliceDelete = getLocalFamilyExpenses(familyId, memberIds);
  assert.ok(!familyActiveAfterAliceDelete.some(e => e.id === expAlice.id), 'Товар Алисы должен исчезнуть из активных семейных трат');
  assert.ok(familyActiveAfterAliceDelete.some(e => e.id === expBob.id), 'Товар Боба должен остаться в активных семейных тратах');
  console.log('  [PASS 3/9] Товар удалился из семейной аналитики и из личной аналитики Алисы.');

  // [TEST 4]: Bob deletes his own item in personal analytics
  console.log('[RUNNING 4/9] Удаление в личной аналитике исключает товар из семейных трат');
  await deletePersonalExpense(expBob.id, userB);
  const familyActiveAfterBobDelete = getLocalFamilyExpenses(familyId, memberIds);
  assert.ok(!familyActiveAfterBobDelete.some(e => e.id === expBob.id), 'Товар Боба должен исчезнуть из активных семейных трат');
  console.log('  [PASS 4/9] Удаление в личной аналитике исключило покупку из семейной аналитики.');

  // [TEST 5]: Family deleted list contains ALL family members deleted items
  console.log('[RUNNING 5/9] В семейной корзине отображаются удаленные товары всех членов семьи');
  const familyDeletedList = getLocalFamilyDeletedExpenses(familyId, memberIds);
  assert.ok(familyDeletedList.some(e => e.id === expAlice.id), 'В семейной корзине должен быть товар Алисы');
  assert.ok(familyDeletedList.some(e => e.id === expBob.id), 'В семейной корзине должен быть товар Боба');
  assert.strictEqual(familyDeletedList.length, 2, 'В семейной корзине ровно 2 товара (Алисы и Боба)');
  console.log('  [PASS 5/9] Семейная корзина содержит удаленные товары всех участников семьи.');

  // [TEST 6]: Personal deleted list contains ONLY current user's items
  console.log('[RUNNING 6/9] В личной корзине отображаются ТОЛЬКО свои удаленные товары');
  const alicePersonalDeleted = getLocalDeletedExpenses(userA);
  assert.ok(alicePersonalDeleted.some(e => e.id === expAlice.id), 'В личной корзине Алисы есть товар Алисы');
  assert.ok(!alicePersonalDeleted.some(e => e.id === expBob.id), 'В личной корзине Алисы НЕ ДОЛЖНО БЫТЬ товара Боба');

  const bobPersonalDeleted = getLocalDeletedExpenses(userB);
  assert.ok(bobPersonalDeleted.some(e => e.id === expBob.id), 'В личной корзине Боба есть товар Боба');
  assert.ok(!bobPersonalDeleted.some(e => e.id === expAlice.id), 'В личной корзине Боба НЕ ДОЛЖНО БЫТЬ товара Алисы');
  console.log('  [PASS 6/9] Личные корзины строго изолированы и содержат только свои удаленные товары.');

  // [TEST 7]: Protection from restoring another user's item
  console.log('[RUNNING 7/9] Защита от восстановления чужого товара');
  let restoreBlocked = false;
  try {
    // Alice tries to restore Bob's item
    await restorePersonalExpense(expBob.id, userA);
  } catch (err: any) {
    restoreBlocked = true;
    assert.ok(
      err.message.includes('Пользователь может восстанавливать только те товары, которые он добавил сам'),
      'Ошибка должна содержать сообщение о запрете восстановления чужого товара'
    );
  }
  assert.strictEqual(restoreBlocked, true, 'Восстановление чужого товара должно быть заблокировано');
  console.log('  [PASS 7/9] Защита от восстановления чужого товара работает корректно.');

  // [TEST 8]: Creator can restore own item and it reappears in active personal & family lists
  console.log('[RUNNING 8/9] Восстановление своего товара возвращает его в обе аналитики');
  const restoredAlice = await restorePersonalExpense(expAlice.id, userA);
  assert.ok(restoredAlice, 'Товар Алисы должен быть успешно восстановлен');
  assert.strictEqual(restoredAlice?.deletedAt, null, 'deletedAt должен быть сброшен в null');

  const aliceActiveAfterRestore = getLocalExpenses(userA);
  assert.ok(aliceActiveAfterRestore.some(e => e.id === expAlice.id), 'Восстановленный товар вернулся в личные активные траты Алисы');

  const familyActiveAfterRestore = getLocalFamilyExpenses(familyId, memberIds);
  assert.ok(familyActiveAfterRestore.some(e => e.id === expAlice.id), 'Восстановленный товар вернулся в семейные активные траты');

  const aliceDeletedAfterRestore = getLocalDeletedExpenses(userA);
  assert.ok(!aliceDeletedAfterRestore.some(e => e.id === expAlice.id), 'Товар должен исчезнуть из корзины Алисы после восстановления');
  console.log('  [PASS 8/9] Восстановленный товар корректно вернулся в активные списки обеих аналитик.');

  // [TEST 9]: Legacy fake seed expenses are completely purged
  console.log('[RUNNING 9/9] Проверка очистки от синтетических сидов seed_exp_*');
  localStorage.setItem(
    `${LOCAL_EXPENSES_KEY}_test_user`,
    JSON.stringify([
      { id: 'seed_exp_1_test_user', amount: 9999, userId: 'test_user', date: '2026-09-07' },
      { id: 'exp_real_123', amount: 486, userId: 'test_user', date: '2026-09-07' },
    ])
  );
  const cleanedList = getLocalExpenses('test_user');
  assert.strictEqual(cleanedList.length, 1, 'Должен остаться только реальный расход');
  assert.strictEqual(cleanedList[0].id, 'exp_real_123', 'Синтетический сид seed_exp_* должен быть полностью удален');
  console.log('  [PASS 9/9] Синтетические сиды seed_exp_* успешно фильтруются и очищаются.');

  console.log('\n✅ РЕЗУЛЬТАТ FEATURE-TESTER: Все 9 тестов прав, корзины, синхронизации и очистки сидов успешно пройдены!');
}

runTests().catch((err) => {
  console.error('\n❌ Ошибка в тестах:', err);
  process.exit(1);
});
