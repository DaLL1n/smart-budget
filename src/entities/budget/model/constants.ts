import { Currency, DietaryPreference } from './types';

export const CURRENCIES: Record<string, Currency> = {
  RUB: {
    code: 'RUB',
    symbol: '₽',
    label: 'Российский рубль',
    flag: '🇷🇺',
    format: (val: number) => `${Math.round(val).toLocaleString('ru-RU')} ₽`,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'Доллар США',
    flag: '🇺🇸',
    format: (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Евро',
    flag: '🇪🇺',
    format: (val: number) => `€${val.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
  },
  KZT: {
    code: 'KZT',
    symbol: '₸',
    label: 'Казахстанский тенге',
    flag: '🇰🇿',
    format: (val: number) => `${Math.round(val).toLocaleString('ru-RU')} ₸`,
  },
  BYN: {
    code: 'BYN',
    symbol: 'Br',
    label: 'Белорусский рубль',
    flag: '🇧🇾',
    format: (val: number) => `${val.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Br`,
  },
  UAH: {
    code: 'UAH',
    symbol: '₴',
    label: 'Украинская гривна',
    flag: '🇺🇦',
    format: (val: number) => `${Math.round(val).toLocaleString('uk-UA')} ₴`,
  },
};

export const DIETARY_OPTIONS: DietaryPreference[] = [
  { id: 'standard', label: 'Традиционное питание', icon: '🍽️', description: 'Без строгих ограничений, мясо, рыба, птица' },
  { id: 'healthy', label: 'Здоровое / Правильное', icon: '🥗', description: 'Больше овощей, клетчатки, цельнозерновых продуктов' },
  { id: 'vegetarian', label: 'Вегетарианство', icon: '🥑', description: 'Без мяса и птицы, растительный рацион' },
  { id: 'fitness', label: 'Спорт / Высокий белок', icon: '🥩', description: 'Акцент на творог, мясо, яйца, протеин' },
  { id: 'keto', label: 'Кето / Low Carb', icon: '🧀', description: 'Много полезных жиров, минимум углеводов' },
  { id: 'halal', label: 'Халяль', icon: '✨', description: 'Только сертифицированные халяль продукты' },
  { id: 'gluten_free', label: 'Без глютена', icon: '🌾', description: 'Без пшеницы, ржи и ячменя' },
  { id: 'lactose_free', label: 'Без лактозы', icon: '🥛', description: 'Растительное или безлактозное молоко' },
];

export const BUDGET_GOALS = [
  {
    id: 'save_money',
    title: 'Максимальная экономия',
    desc: 'Оптимизировать расходы, искать акции и не покупать лишнего',
    icon: '💰',
    badge: 'Экономия до 30%',
  },
  {
    id: 'eat_healthier',
    title: 'Баланс и польза',
    desc: 'Покупать свежие овощи, фрукты и качественный белок в рамках бюджета',
    icon: '🥦',
    badge: 'ЗОЖ',
  },
  {
    id: 'strict_budget',
    title: 'Строгий лимит',
    desc: 'Четко укладываться в заданную сумму в месяц и неделю',
    icon: '🎯',
    badge: 'Контроль',
  },
  {
    id: 'smart_planning',
    title: 'Умные списки покупок',
    desc: 'Планировать меню на неделю и брать только по списку',
    icon: '📝',
    badge: 'Организация',
  },
  {
    id: 'reduce_waste',
    title: 'Меньше списаний',
    desc: 'Не выбрасывать испорченную еду и оптимизировать запасы',
    icon: '♻️',
    badge: 'Осознанность',
  },
];

export const BUDGET_PRESETS = [15000, 25000, 35000, 50000, 75000, 100000];
