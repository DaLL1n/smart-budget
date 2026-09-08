import { StoreOption } from '../model/types';
import { NATIONWIDE_STORES } from '../model/constants';

/**
 * City-specific stores and local grocery networks
 */
export const CITY_STORE_DATABASE: Record<string, StoreOption[]> = {
  moscow: [
    { id: 'coolclever', name: 'КуулКлевер / МясновЪ', category: 'organic', color: '#ea580c' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'samokat', name: 'Самокат (быстрая доставка)', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'yandex_lavka', name: 'Яндекс Лавка', category: 'delivery', color: '#f59e0b' },
    { id: 'azbuka_vkusa', name: 'Азбука Вкуса', category: 'organic', color: '#15803d' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'dixy', name: 'Дикси', category: 'supermarket', color: '#f97316' },
    { id: 'miratorg', name: 'Мираторг Супермаркет', category: 'supermarket', color: '#84cc16' },
    { id: 'globus', name: 'Глобус (Hypermarket Globus)', category: 'hypermarket', color: '#e11d48' },
    { id: 'spar', name: 'SPAR / Eurospar', category: 'supermarket', color: '#16a34a' },
    { id: 'okey', name: 'О’КЕЙ', category: 'hypermarket', color: '#d97706' },
    { id: 'da_market', name: 'ДА!', category: 'discount', color: '#0284c7' },
  ],
  spb: [
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'yandex_lavka', name: 'Яндекс Лавка', category: 'delivery', color: '#f59e0b' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'lenta', name: 'Лента (Гипер и Супер)', category: 'hypermarket', color: '#2563eb' },
    { id: 'okey', name: 'О’КЕЙ', category: 'hypermarket', color: '#d97706' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'dixy', name: 'Дикси', category: 'supermarket', color: '#f97316' },
    { id: 'azbuka_vkusa', name: 'Азбука Вкуса', category: 'organic', color: '#15803d' },
    { id: 'semya', name: '7Я Семья / 7шагоff', category: 'discount', color: '#ea580c' },
    { id: 'spar', name: 'SPAR / Eurospar', category: 'supermarket', color: '#16a34a' },
    { id: 'remi', name: 'Сезон', category: 'supermarket', color: '#10b981' },
  ],
  kazan: [
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'bahetle', name: 'Бахетле (Супермаркет домашней еды)', category: 'organic', color: '#047857' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'edelweis', name: 'Эдельвейс', category: 'supermarket', color: '#0284c7' },
    { id: 'agropark', name: 'Агропромпарк Казань', category: 'organic', color: '#16a34a' },
    { id: 'selpo', name: 'Победа / Продслава', category: 'discount', color: '#dc2626' },
    { id: 'spar', name: 'Eurospar Казань', category: 'supermarket', color: '#16a34a' },
  ],
  ekb: [
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'yabloko', name: 'Торговая сеть «Яблоко»', category: 'supermarket', color: '#84cc16' },
    { id: 'kirovsky', name: 'Супермаркет «Кировский»', category: 'supermarket', color: '#2563eb' },
    { id: 'megamart', name: 'Мегамарт', category: 'hypermarket', color: '#dc2626' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'zhiznmart', name: 'Жизньмарт', category: 'organic', color: '#10b981' },
    { id: 'monetka', name: 'Монетка', category: 'discount', color: '#f59e0b' },
    { id: 'verny', name: 'Верный', category: 'supermarket', color: '#dc2626' },
  ],
  novosibirsk: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'yarche', name: 'Ярче!', category: 'supermarket', color: '#f97316' },
    { id: 'bystronorm', name: 'Быстроном', category: 'supermarket', color: '#0284c7' },
    { id: 'maria_ra', name: 'Мария-Ра', category: 'supermarket', color: '#eab308' },
    { id: 'bahitla_nsk', name: 'Бахетле Новосибирск', category: 'organic', color: '#047857' },
    { id: 'dobryanka', name: 'Добрянка (Русская кухня)', category: 'organic', color: '#b91c1c' },
    { id: 'prodSib', name: 'ПродСиб', category: 'supermarket', color: '#16a34a' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл (Доставка)', category: 'organic', color: '#059669' },
  ],
  nn: [
    { id: 'coolclever', name: 'КуулКлевер / МясновЪ', category: 'organic', color: '#ea580c' },
    { id: 'spar', name: 'SPAR / Eurospar (Нижний Новгород)', category: 'supermarket', color: '#16a34a' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'smart', name: 'Smart (Смарт дискаунтер)', category: 'discount', color: '#f59e0b' },
    { id: 'sladkaya_zhizn', name: 'Сладкая Жизнь', category: 'supermarket', color: '#e11d48' },
    { id: 'dixy', name: 'Дикси', category: 'supermarket', color: '#f97316' },
  ],
  krasnodar: [
    { id: 'magnit_family', name: 'Магнит Семейный / Экстра (Флагман)', category: 'hypermarket', color: '#dc2626' },
    { id: 'tabris', name: 'Табрис (Премиум супермаркет)', category: 'organic', color: '#047857' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'okey', name: 'О’КЕЙ Краснодар', category: 'hypermarket', color: '#d97706' },
    { id: 'agrokomplex', name: 'Агрокомплекс им. Ткачева', category: 'supermarket', color: '#16a34a' },
    { id: 'solnechny_krug', name: 'Солнечный круг', category: 'supermarket', color: '#eab308' },
  ],
  samara: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'mindal', name: 'Миндаль', category: 'supermarket', color: '#84cc16' },
    { id: 'pyaterochka_max', name: 'Пятёрочка Доставка', category: 'supermarket', color: '#16a34a' },
    { id: 'pobeda', name: 'Победа продсклад', category: 'discount', color: '#dc2626' },
  ],
  chelyabinsk: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'spravka_chel', name: 'SPAR / Молния', category: 'supermarket', color: '#16a34a' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'monetka', name: 'Монетка', category: 'discount', color: '#f59e0b' },
    { id: 'prospect', name: 'Проспект', category: 'supermarket', color: '#0284c7' },
    { id: 'zhiznmart', name: 'Жизньмарт', category: 'organic', color: '#10b981' },
  ],
  rostov: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'okey', name: 'О’КЕЙ', category: 'hypermarket', color: '#d97706' },
    { id: 'agrokomplex', name: 'Агрокомплекс', category: 'supermarket', color: '#16a34a' },
    { id: 'solnechny_krug', name: 'Солнечный круг', category: 'supermarket', color: '#eab308' },
  ],
  ufa: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'bahetle_ufa', name: 'Бахетле Уфа', category: 'organic', color: '#047857' },
    { id: 'everyday', name: 'Каждый день / Байрам', category: 'supermarket', color: '#16a34a' },
    { id: 'polushka', name: 'Полушка', category: 'discount', color: '#ea580c' },
    { id: 'yarche', name: 'Ярче!', category: 'supermarket', color: '#f97316' },
  ],
  voronezh: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'centrtorg', name: 'Центрторг', category: 'supermarket', color: '#0284c7' },
    { id: 'evropa', name: 'Европа (Hypermarket)', category: 'hypermarket', color: '#15803d' },
    { id: 'liniya', name: 'Линия (Гипермаркет)', category: 'hypermarket', color: '#dc2626' },
    { id: 'poryadok', name: 'Семь Дней', category: 'discount', color: '#eab308' },
  ],
  perm: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'semya_perm', name: 'Семья Пермь', category: 'supermarket', color: '#0284c7' },
    { id: 'monetka', name: 'Монетка', category: 'discount', color: '#f59e0b' },
    { id: 'bereg', name: 'Берег / Лион', category: 'discount', color: '#dc2626' },
    { id: 'zhiznmart', name: 'Жизньмарт', category: 'organic', color: '#10b981' },
  ],
  krasnoyarsk: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'krasny_yar', name: 'Красный Яр (Гастрономы)', category: 'supermarket', color: '#dc2626' },
    { id: 'komandor', name: 'Командор / Аллея', category: 'hypermarket', color: '#2563eb' },
    { id: 'yarche', name: 'Ярче!', category: 'supermarket', color: '#f97316' },
    { id: 'baton', name: 'Батон (Дискаунтер)', category: 'discount', color: '#eab308' },
    { id: 'horoshiy', name: 'Хороший', category: 'discount', color: '#047857' },
  ],
  volgograd: [
    { id: 'samokat', name: 'Самокат', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'auchan', name: 'Ашан', category: 'hypermarket', color: '#ea580c' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'pokupochka', name: 'Покупочка / ПокупАЛКО', category: 'discount', color: '#16a34a' },
    { id: 'raduga', name: 'Радеж', category: 'supermarket', color: '#0284c7' },
    { id: 'man', name: 'МАН', category: 'supermarket', color: '#dc2626' },
  ],
};

function normalizeCityKey(cityName: string): string {
  const clean = cityName.trim().toLowerCase();
  if (clean.includes('москв') || clean.includes('moscow')) return 'moscow';
  if (clean.includes('петербург') || clean.includes('питер') || clean.includes('спб') || clean.includes('spb')) return 'spb';
  if (clean.includes('казан') || clean.includes('kazan')) return 'kazan';
  if (clean.includes('екатеринбург') || clean.includes('екб') || clean.includes('ekaterinburg')) return 'ekb';
  if (clean.includes('новосибирск') || clean.includes('нск') || clean.includes('novosibirsk')) return 'novosibirsk';
  if (clean.includes('нижн') || clean.includes('новгород') || clean.includes('nizhny')) return 'nn';
  if (clean.includes('краснодар') || clean.includes('krasnodar')) return 'krasnodar';
  if (clean.includes('самар') || clean.includes('samara')) return 'samara';
  if (clean.includes('челябинск') || clean.includes('chelyabinsk')) return 'chelyabinsk';
  if (clean.includes('ростов') || clean.includes('rostov')) return 'rostov';
  if (clean.includes('уфа') || clean.includes('ufa')) return 'ufa';
  if (clean.includes('воронеж') || clean.includes('voronezh')) return 'voronezh';
  if (clean.includes('перм') || clean.includes('perm')) return 'perm';
  if (clean.includes('красноярск') || clean.includes('krasnoyarsk')) return 'krasnoyarsk';
  if (clean.includes('волгоград') || clean.includes('volgograd')) return 'volgograd';
  return 'general';
}

export async function fetchStoresForCity(cityName: string): Promise<StoreOption[]> {
  await new Promise(resolve => setTimeout(resolve, 150));

  const key = normalizeCityKey(cityName);
  const citySpecific = CITY_STORE_DATABASE[key] || [
    { id: 'coolclever', name: 'КуулКлевер / МясновЪ', category: 'organic', color: '#ea580c' },
    { id: 'perekrestok', name: 'Перекрёсток', category: 'supermarket', color: '#0284c7' },
    { id: 'vkusvill', name: 'ВкусВилл', category: 'organic', color: '#059669' },
    { id: 'samokat', name: 'Самокат (Доставка)', category: 'delivery', color: '#f43f5e' },
    { id: 'kuper', name: 'Купер / СберМаркет', category: 'delivery', color: '#10b981' },
    { id: 'lenta', name: 'Лента', category: 'hypermarket', color: '#2563eb' },
    { id: 'metro', name: 'Metro Cash&Carry', category: 'hypermarket', color: '#3b82f6' },
    { id: 'spar', name: 'SPAR / Eurospar', category: 'supermarket', color: '#16a34a' },
    { id: 'dixy', name: 'Дикси', category: 'supermarket', color: '#f97316' },
    { id: 'monetka', name: 'Монетка', category: 'discount', color: '#f59e0b' },
    { id: 'yarche', name: 'Ярче!', category: 'supermarket', color: '#f97316' },
  ];

  const distances = ['0.4 км', '0.8 км', '1.2 км', '1.7 км', '2.3 км', '3.1 км', '3.8 км', '4.5 км', '5.2 км', '6.0 км'];

  const storeMap = new Map<string, StoreOption>();
  [...citySpecific, ...NATIONWIDE_STORES].forEach(store => {
    if (!storeMap.has(store.id)) {
      const idx = storeMap.size;
      storeMap.set(store.id, {
        ...store,
        distance: store.distance || distances[idx] || `${(3 + idx * 0.4).toFixed(1)} км`,
      });
    }
  });

  return Array.from(storeMap.values());
}
