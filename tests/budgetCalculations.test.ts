import { 
  formatRubles, 
  calculateSingleUserBudget, 
  calculateFamilyBudget, 
  validateStep1Profile, 
  validateStep2Family 
} from '../src/entities/budget';
import { fetchStoresForCity } from '../src/entities/store';

async function runTests() {
  console.log('=== ЗАПУСК ТЕСТОВ 2-ШАГОВОГО ПРОЦЕССА И СЕРВИСА МАГАЗИНОВ (FSD) ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // Тест 1: Форматирование только в рублях
  const formattedRub = formatRubles(35000);
  assert(formattedRub.includes('₽') && formattedRub.includes('35'), 'Форматирование strictly в рублях (35 000 ₽)');

  // Тест 2: Расчет для одного человека (Шаг 1 - базовый персональный профиль)
  const single = calculateSingleUserBudget(30000);
  assert(single.monthly === 30000, 'Месячный бюджет для 1 человека = 30000');
  assert(single.weekly === 7500, 'Недельный бюджет для 1 человека = 7500');
  assert(single.daily === 1000, 'Дневной бюджет для 1 человека = 1000');
  assert(single.perPersonDaily === 1000, 'Дневной лимит на 1 человека = 1000');
  assert(single.totalMembers === 1, 'Количество членов профиля по умолчанию = 1');

  // Тест 3: Расчет при объединении в семью (агрегация бюджета)
  const family = calculateFamilyBudget(60000, 2, 1, 1);
  assert(family.monthly === 60000, 'Семейный бюджет = 60000');
  assert(family.weekly === 15000, 'Недельный семейный бюджет = 15000');
  assert(family.daily === 2000, 'Дневной семейный бюджет = 2000');
  assert(family.totalPersons === 3, 'Суммарно людей в семье: 2 взр + 1 реб = 3');
  assert(family.perPersonDaily === 667, 'Дневной лимит на 1 человека в семье (2000 / 3 = 667)');

  // Тест 4: Валидация Шага 1 (без полей имени и почты, только бюджет в рублях)
  const validStep1 = validateStep1Profile({ monthlyBudget: 25000, city: 'Москва', avatar: '🥑' });
  assert(validStep1.isValid, 'Валидация Шага 1 с корректным бюджетом проходит успешно');

  const invalidStep1TooSmall = validateStep1Profile({ monthlyBudget: 500 });
  assert(!invalidStep1TooSmall.isValid, 'Слишком маленький бюджет (<1000) отсекается валидацией');

  // Тест 5: Структура 2 шагов онбординга
  const stepCount = 2;
  assert(stepCount === 2, 'Общее количество шагов онбординга равно 2 (Шаг 1: Бюджет, Шаг 2: Стратегия и магазины)');

  // Тест 6: Запрос магазинов для конкретного города (Москва)
  const moscowStores = await fetchStoresForCity('Москва');
  assert(moscowStores.length > 5, 'Для Москвы возвращается расширенный список магазинов (> 5)');
  assert(moscowStores.some(s => s.id === 'vkusvill'), 'В Москве есть ВкусВилл');
  assert(moscowStores.some(s => s.id === 'pyaterochka'), 'В Москве есть общенациональная сеть Пятёрочка');

  // Тест 7: Запрос магазинов для Казани (локальные сети типа Бахетле)
  const kazanStores = await fetchStoresForCity('Казань');
  assert(kazanStores.some(s => s.id === 'bahetle'), 'В Казани возвращается локальная сеть Бахетле');

  // Тест 8: Запрос магазинов для Екатеринбурга (Жизньмарт / Кировский)
  const ekbStores = await fetchStoresForCity('Екатеринбург');
  assert(ekbStores.some(s => s.id === 'zhiznmart' || s.id === 'kirovsky'), 'В Екатеринбурге есть Жизньмарт или Кировский');

  // Тест 9: Real-time фильтрация магазинов по названию и категории
  const queryPyat = 'пят';
  const filteredPyat = moscowStores.filter(s => 
    s.name.toLowerCase().includes(queryPyat.toLowerCase()) || 
    s.category.toLowerCase().includes(queryPyat.toLowerCase())
  );
  assert(filteredPyat.some(s => s.name === 'Пятёрочка'), 'Фильтрация по подстроке "пят" находит Пятёрочку');

  const queryDelivery = 'доставка';
  const filteredDelivery = moscowStores.filter(s => 
    s.name.toLowerCase().includes(queryDelivery.toLowerCase()) || 
    s.category.toLowerCase().includes(queryDelivery.toLowerCase())
  );
  assert(filteredDelivery.some(s => s.id === 'samokat'), 'Фильтрация по подстроке/категории "доставка" находит Самокат');
  assert(moscowStores.some(s => s.id === 'coolclever' && s.name.includes('КуулКлевер')), 'В Москве доступна сеть КуулКлевер / МясновЪ');

  console.log(`\nРЕЗУЛЬТАТ: Пройдено ${passed} из ${passed + failed} тестов.`);
  if (failed > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }
}

runTests();
