import assert from 'node:assert/strict';
import test from 'node:test';
import { 
  receiptAiService, 
  classifyItemCategory, 
  calculateTotals 
} from '../src/features/scan-receipt/api/receiptAiService';
import { 
  calculateCategoryBreakdown,
  getCategoryConfig,
  DEFAULT_EXPENSE_CATEGORIES
} from '../src/entities/expense';

test('Snacks, nuts and corn crackers category classification', () => {
  // Test user query specifics:
  // "а нутсы, корнерсы и чипсы к какой категории продуктов относится?"
  assert.equal(classifyItemCategory('Нутсы хрустящие соленые'), 'snacks_chips');
  assert.equal(classifyItemCategory('Нутсы ЛЕНТА LIFE Сметана и Зелень 50г'), 'snacks_chips');
  assert.equal(classifyItemCategory('Корнерсы сырные Dr. Korner 50г'), 'snacks_chips');
  assert.equal(classifyItemCategory('Чипсы Lays с солью 140г'), 'snacks_chips');
  assert.equal(classifyItemCategory('Арахис жареный соленый'), 'snacks_chips');
  assert.equal(classifyItemCategory('Кешью жареный'), 'snacks_chips');
  assert.equal(classifyItemCategory('Сухарики Хрусteam 60г'), 'snacks_chips');

  // Confectionery with nuts belongs to drinks_snacks, not snacks_chips
  assert.equal(classifyItemCategory('Шоколад SNAQ FABRIQ с мол-орех пастой 55'), 'drinks_snacks');
  assert.equal(classifyItemCategory('Батончик SNAQFABRIQ глазир кокос 40г'), 'drinks_snacks');
  assert.equal(classifyItemCategory('Напиток овсяный NEMOLOKO шоколадн 1000мл'), 'drinks_snacks');
});

test('Pet food classification', () => {
  assert.equal(classifyItemCategory('Корм Felix сухой для кошек 750г'), 'pet_supplies');
  assert.equal(classifyItemCategory('Whiskas паштет для котят'), 'pet_supplies');
  assert.equal(classifyItemCategory('Наполнитель древесный для кошачьего туалета'), 'pet_supplies');
});

test('Standard categories classification preserves integrity without false matches', () => {
  assert.equal(classifyItemCategory('Молоко цельное 3.2% 900мл'), 'dairy_cheese');
  assert.equal(classifyItemCategory('Йогурт клубничный'), 'dairy_cheese'); // Does not false match 'огур' in vegetables
  assert.equal(classifyItemCategory('Огурцы гладкие короткоплодные'), 'vegetables_fruits');
  assert.equal(classifyItemCategory('Филе куриной грудки охл'), 'meat_fish');
  assert.equal(classifyItemCategory('Хлеб Бородинский нарезка'), 'grocery_bread');
  assert.equal(classifyItemCategory('Пакет фасовочный майка'), 'other');
});

test('Non-food hygiene and household items classification preserves "other" category even with food scent keywords', () => {
  // Scented soap with peach/almond should not be classified into snacks or fruits
  assert.equal(classifyItemCategory('Ж/мыло Я САМАЯ Персик и миндаль 500мл'), 'other');
  assert.equal(classifyItemCategory('Мыло туалетное Palmolive с экстрактом оливы'), 'other');
  assert.equal(classifyItemCategory('Гель для душа с маслом миндаля 250мл'), 'other');
  assert.equal(classifyItemCategory('Шампунь яблочный 400мл'), 'other');
  assert.equal(classifyItemCategory('Крем для рук кокос и ваниль'), 'other');
  assert.equal(classifyItemCategory('Рукав д/запекания HOMECLUB 5м х 30см'), 'other');
  assert.equal(classifyItemCategory('Набор PL.CHOICЕ ковриков д/гриля 3шт'), 'other');
  assert.equal(classifyItemCategory('Пакет ЛЕНТА Супер, 9кг'), 'other');
});

test('Spices and seasonings autonomous category classification', () => {
  assert.equal(classifyItemCategory('Паприка KOTANYI красный сладкий 25г'), 'spices_seasonings');
  assert.equal(classifyItemCategory('Специи KOTANYI смесь перцев'), 'spices_seasonings');
  assert.equal(classifyItemCategory('Хмели-сунели 50г'), 'spices_seasonings');
  assert.equal(classifyItemCategory('Приправа Kamis для курицы'), 'spices_seasonings');
  assert.equal(classifyItemCategory('Куркума молотая 20г'), 'spices_seasonings');
  assert.equal(classifyItemCategory('Перец черный молотый Приправыч'), 'spices_seasonings');
});

test('receiptAiService.parseTextLocally creates new categories autonomously', () => {
  const receiptText = `
Пятёрочка
08.09.2026
Молоко Проквашино 89.90
Корнерсы сырные 95.00
Чипсы Lays 120.00
Корм Felix для кошек 45.00
  `.trim();

  const parsed = receiptAiService.parseTextLocally(receiptText);

  assert.equal(parsed.items.length, 4);
  assert.ok(parsed.newCategories, 'Should return newCategories');
  assert.equal(parsed.newCategories.length, 2, 'Should create snacks_chips and pet_supplies');

  const snackCat = parsed.newCategories.find(c => c.id === 'snacks_chips');
  assert.ok(snackCat);
  assert.equal(snackCat.label, 'Чипсы и снеки');
  assert.equal(snackCat.icon, '🍿');

  const petCat = parsed.newCategories.find(c => c.id === 'pet_supplies');
  assert.ok(petCat);
  assert.equal(petCat.label, 'Зоотовары');
  assert.equal(petCat.icon, '🐾');

  // Verify category totals
  assert.equal(parsed.categoryTotals['dairy_cheese'], 89.9);
  assert.equal(parsed.categoryTotals['snacks_chips'], 215.0);
  assert.equal(parsed.categoryTotals['pet_supplies'], 45.0);
  assert.equal(parsed.totalAmount, 349.9);
});

test('calculateCategoryBreakdown supports custom and dynamic categories', () => {
  const expenses = [
    {
      id: 'e1',
      userId: 'u1',
      amount: 215,
      category: 'snacks_chips',
      storeId: 'pyaterochka',
      date: '2026-09-08',
      createdAt: '2026-09-08T10:00:00Z',
      updatedAt: '2026-09-08T10:00:00Z',
    },
    {
      id: 'e2',
      userId: 'u1',
      amount: 45,
      category: 'pet_supplies',
      storeId: 'pyaterochka',
      date: '2026-09-08',
      createdAt: '2026-09-08T10:00:00Z',
      updatedAt: '2026-09-08T10:00:00Z',
    },
  ];

  const customCats = [
    {
      id: 'snacks_chips',
      label: 'Чипсы и снеки',
      icon: '🍿',
      color: '#f59e0b',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      isCustom: true,
    },
    {
      id: 'pet_supplies',
      label: 'Зоотовары',
      icon: '🐾',
      color: '#f43f5e',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      isCustom: true,
    },
  ];

  const breakdown = calculateCategoryBreakdown(expenses as any, customCats);
  assert.equal(breakdown.length, 2);

  const snacksItem = breakdown.find(b => b.category.id === 'snacks_chips');
  assert.ok(snacksItem);
  assert.equal(snacksItem.category.label, 'Чипсы и снеки');
  assert.equal(snacksItem.amount, 215);

  const petItem = breakdown.find(b => b.category.id === 'pet_supplies');
  assert.ok(petItem);
  assert.equal(petItem.category.label, 'Зоотовары');
  assert.equal(petItem.amount, 45);
});

console.log('All autonomous category tests passed!');
