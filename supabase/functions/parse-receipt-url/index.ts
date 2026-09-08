import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Ambient declaration for IDE type checking in mixed Node/Deno environments
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  [key: string]: any;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

function classifyCategory(name: string, customCategories: CategoryConfig[] = []): string {
  const n = name.toLowerCase();

  // 0. Check existing user custom categories
  for (const cat of customCategories) {
    const labelLower = cat.label.toLowerCase();
    if (labelLower && n.includes(labelLower)) {
      return cat.id;
    }
  }

  // 1. Non-food / Hygiene / Household goods / Cleaning / Packages (checked FIRST so scented soap/shampoo with almond, peach, etc. won't match food)
  const isNonFood =
    n.includes('мыло') || n.includes('ж/мыло') || n.includes('шампунь') ||
    n.includes('гель для душа') || n.includes('гель д/душа') || n.includes('бальзам д/волос') ||
    n.includes('бальзам для волос') || n.includes('кондиционер для волос') ||
    n.includes('зубн') || n.includes('ополаскиватель') || n.includes('дезодорант') ||
    n.includes('станок') || n.includes('бритв') || n.includes('прокладк') ||
    n.includes('тампон') || n.includes('диски ватн') || n.includes('палочки ватн') ||
    n.includes('салфетк') || n.includes('туалетная бумага') || n.includes('бумага туалет') ||
    n.includes('порошок стирал') || n.includes('стиральный порошок') || n.includes('капсулы для стирки') ||
    n.includes('гель для стирки') || n.includes('д/стирки') || n.includes('д/посуды') ||
    n.includes('для мытья посуды') || n.includes('таблетки д/пмм') || n.includes('чистящ') ||
    n.includes('моющее') || n.includes('освежитель') || n.includes('белизна') ||
    n.includes('пакет') || n.includes('рукав д/запек') || n.includes('рукав для запек') ||
    n.includes('коврик д/гриля') || n.includes('коврик для гриля') || n.includes('фольга') ||
    n.includes('пергамент') || n.includes('губк') || n.includes('тряпк') ||
    n.includes('химия') || n.includes('батарейк') || n.includes('domestos') ||
    n.includes('fairy') || (n.includes('крем') && (n.includes('рук') || n.includes('лиц') || n.includes('ног') || n.includes('тела') || n.includes('д/рук') || n.includes('д/лиц') || n.includes('д/ног')));

  if (isNonFood) {
    return 'other';
  }

  // 2. Autonomous Pet Supplies detection
  if (
    n.includes('корм для') || n.includes('вискас') || n.includes('whiskas') ||
    n.includes('kitekat') || n.includes('феликс') || n.includes('felix') ||
    n.includes('purina') || n.includes('pedigree') || n.includes('royal canin') ||
    n.includes('sheba') || n.includes('наполнитель') || n.includes('для кошек') ||
    n.includes('для собак') || n.includes('д/кош') || n.includes('д/соб') ||
    n.includes('лакомство для') || n.includes('pro plan') || n.includes('chappi')
  ) {
    return 'pet_supplies';
  }

  // 3. Autonomous Spices & Seasonings detection
  if (
    n.includes('паприк') || n.includes('приправ') || n.includes('специ') ||
    n.includes('куркум') || n.includes('карри') || n.includes('хмели-сунели') ||
    n.includes('лавровый лист') || n.includes('кориц') || n.includes('ванилин') ||
    n.includes('базилик сушен') || n.includes('орегано') || n.includes('чеснок сушен') ||
    n.includes('зелень сушен') || n.includes('перец молот') || n.includes('перец черн') ||
    n.includes('перец душист') || n.includes('смесь перцев') || n.includes('гвоздик') ||
    n.includes('кориандр') || n.includes('тмин') || n.includes('зира') ||
    n.includes('kotanyi') || n.includes('kamis') || n.includes('приправыч')
  ) {
    return 'spices_seasonings';
  }

  // Sweet confectionery check: chocolates, sweets, cookies, cakes with nuts belong to drinks_snacks
  const isSweetConfectionery = 
    n.includes('шоколад') || n.includes('конфет') || n.includes('торт') ||
    n.includes('пирожн') || n.includes('батончик') || n.includes('бат-к') ||
    n.includes('печень') || n.includes('вафл') || n.includes('зефир') ||
    n.includes('пряник');

  // 4. Autonomous Snacks & Chips detection (nuts, corn crackers, chips, seeds, crunchy snacks)
  if (!isSweetConfectionery && (
    n.includes('чипс') || n.includes('lays') || n.includes('pringles') ||
    n.includes('начос') || n.includes('nachos') || n.includes('корнерс') ||
    n.includes('dr. korner') || n.includes('хлебцы') || n.includes('сухарик') ||
    n.includes('нутс') || n.includes('хруст') || n.includes('doritos') ||
    n.includes('фисташк') || n.includes('арахис') || n.includes('кешью') ||
    n.includes('миндал') || n.includes('фундук') || n.includes('орех') ||
    n.includes('попкорн') || n.includes('крекер') || n.includes('снек') ||
    n.includes('семечк')
  )) {
    return 'snacks_chips';
  }

  // 5. Dairy & Cheese (checked before vegetables so "йогурт" won't match "огур")
  if (
    n.includes('молок') || n.includes('сыр') || n.includes('творог') ||
    n.includes('сметан') || n.includes('масло сливоч') || n.includes('йогурт') ||
    n.includes('кефир') || n.includes('сливк') || n.includes('ряженк') ||
    n.includes('снежок') || n.includes('брынз') || n.includes('сулугуни') ||
    n.includes('моцарелл') || n.includes('пармезан') || n.includes('гауда')
  ) {
    return 'dairy_cheese';
  }

  // 6. Meat & Fish
  if (
    n.includes('мясо') || n.includes('говядин') || n.includes('свинин') ||
    n.includes('куриц') || n.includes('цыплен') || n.includes('индейк') ||
    n.includes('фарш') || n.includes('филе') || n.includes('рыб') ||
    n.includes('лосос') || n.includes('форел') || n.includes('треск') ||
    n.includes('минтай') || n.includes('кревет') || n.includes('колбас') ||
    n.includes('сосиск') || n.includes('сардельк') || n.includes('бекон') ||
    n.includes('стейк') || n.includes('окорок') || n.includes('ветчин')
  ) {
    return 'meat_fish';
  }

  // 7. Vegetables & Fruits
  if (
    n.includes('яблок') || n.includes('банан') || n.includes('томат') ||
    n.includes('помидор') || n.includes('огурц') || n.includes('огуреч') ||
    n.includes('огурец') || n.includes('картоф') || n.includes('морков') ||
    n.includes('лук') || n.includes('капуст') || n.includes('зелен') ||
    n.includes('укроп') || n.includes('петрушк') ||
    (n.includes('салат') && !n.includes('цезарь')) || n.includes('апельсин') ||
    n.includes('мандарин') || n.includes('ягод') || n.includes('гриб') ||
    n.includes('чеснок') || n.includes('перец') || n.includes('виноград') ||
    n.includes('груш') || n.includes('авокадо') || n.includes('баклажан')
  ) {
    return 'vegetables_fruits';
  }

  // 8. Grocery & Bread
  if (
    n.includes('хлеб') || (n.includes('батон') && !n.includes('батончик')) || n.includes('булоч') ||
    n.includes('лаваш') || n.includes('круп') || n.includes('рис') ||
    n.includes('гречк') || n.includes('макарон') || n.includes('спагетти') ||
    n.includes('мука') || n.includes('сахар') || n.includes('соль') ||
    n.includes('масло растительн') || n.includes('масло подсолнеч') ||
    n.includes('оливков') || n.includes('овсянк') || n.includes('хлопь') ||
    n.includes('консерв') || n.includes('паштет') || n.includes('горошек') ||
    n.includes('кукуруз') || n.includes('соус')
  ) {
    return 'grocery_bread';
  }

  // 9. Drinks & Sweets
  if (
    isSweetConfectionery ||
    n.includes('вода') || n.includes('сок') || n.includes('чай') ||
    n.includes('кофе') || n.includes('напиток') || n.includes('кола') ||
    n.includes('лимонад')
  ) {
    return 'drinks_snacks';
  }

  // 10. Ready Food
  if (
    n.includes('кулинари') || n.includes('сэндвич') || n.includes('бутерброд') ||
    n.includes('ролл') || n.includes('суши') || n.includes('пицц') ||
    n.includes('супы') || n.includes('суп ') || n.includes('борщ') || n.includes('плов') ||
    (n.includes('котлет') && n.includes('готов')) || n.includes('обед') ||
    n.includes('онигири') || n.includes('комбо')
  ) {
    return 'ready_food';
  }

  return 'other';
}

function matchStore(text: string): { storeName: string; storeId: string } {
  const clean = text.toLowerCase();
  if (clean.includes('лента')) return { storeName: 'Лента', storeId: 'lenta' };
  if (clean.includes('пятёр') || clean.includes('пятер') || clean.includes('5ka')) return { storeName: 'Пятёрочка', storeId: 'pyaterochka' };
  if (clean.includes('магнит')) return { storeName: 'Магнит', storeId: 'magnit' };
  if (clean.includes('вкусвилл') || clean.includes('vkusvill')) return { storeName: 'ВкусВилл', storeId: 'vkusvill' };
  if (clean.includes('перекр') || clean.includes('перекресток')) return { storeName: 'Перекрёсток', storeId: 'perekrestok' };
  if (clean.includes('чижик')) return { storeName: 'Чижик', storeId: 'chizhik' };
  if (clean.includes('самокат')) return { storeName: 'Самокат', storeId: 'samokat' };
  if (clean.includes('купер') || clean.includes('сбермаркет')) return { storeName: 'Купер', storeId: 'kuper' };
  if (clean.includes('ашан')) return { storeName: 'Ашан', storeId: 'auchan' };
  return { storeName: 'Супермаркет', storeId: 'other' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const targetUrl = (body?.url || '').trim();
    const customCategories: CategoryConfig[] = Array.isArray(body?.customCategories) ? body.customCategories : [];

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return new Response(
        JSON.stringify({ error: 'Укажите корректную ссылку на электронный чек (начинается с http:// или https://)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch receipt page from target server
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Сервер чека вернул ошибку: HTTP ${res.status}. Убедитесь, что ссылка активна.` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await res.text();
    const today = new Date().toISOString().split('T')[0];
    const storeInfo = matchStore(html + ' ' + targetUrl);
    let receiptDate = today;

    // Try extracting date from html text
    const dateMatch = html.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      receiptDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }

    const items: Array<{ id: string; name: string; price: number; count: number; category: string }> = [];

    // 1. Check for Lenta / Upmetric / Weezmo embedded items array: var items = [...]
    let rawItems: any[] | null = null;
    let rawReceipt: any = null;

    // A. Substring extraction (most robust across newlines and special characters)
    const itemsMarker = 'var items = [';
    const itemsIdx = html.indexOf(itemsMarker);
    if (itemsIdx !== -1) {
      const arrayStart = itemsIdx + itemsMarker.length - 1;
      const endMarker = '];';
      const arrayEnd = html.indexOf(endMarker, arrayStart);
      if (arrayEnd !== -1) {
        try {
          const jsonStr = html.substring(arrayStart, arrayEnd + 1);
          rawItems = JSON.parse(jsonStr);
        } catch (e) {
          console.warn('Substring Lenta items parse failed:', e);
        }
      }
    }

    // B. Regex fallback
    if (!rawItems) {
      const lentaMatch = html.match(/var\s+items\s*=\s*(\[[\s\S]*?\])\s*;\s*(?:var\s+receipt|$)/);
      if (lentaMatch) {
        try {
          rawItems = JSON.parse(lentaMatch[1]);
        } catch (e) {
          console.warn('Regex Lenta items parse failed:', e);
        }
      }
    }

    // Extract receipt metadata if available
    const receiptMarker = 'var receipt = {';
    const receiptIdx = html.indexOf(receiptMarker);
    if (receiptIdx !== -1) {
      const objStart = receiptIdx + receiptMarker.length - 1;
      const objEnd = html.indexOf('};', objStart);
      if (objEnd !== -1) {
        try {
          rawReceipt = JSON.parse(html.substring(objStart, objEnd + 1));
        } catch (_) {}
      }
    }

    // Apply receipt metadata (precise local date and store info)
    if (rawReceipt) {
      if (rawReceipt.createDateLocal && typeof rawReceipt.createDateLocal === 'string') {
        const datePart = rawReceipt.createDateLocal.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          receiptDate = datePart;
        }
      }
      if (rawReceipt.organizationName && typeof rawReceipt.organizationName === 'string') {
        const matched = matchStore(rawReceipt.organizationName);
        if (matched.storeId !== 'other') {
          storeInfo.storeName = matched.storeName;
          storeInfo.storeId = matched.storeId;
        }
      }
    }

    // Process rawItems if found
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      rawItems.forEach((it: any, idx: number) => {
        const name = (it.name || '').trim();
        const count = Math.max(Number(it.amount) || 1, 0.001);
        // it.total is net discounted line total
        const lineTotal = (typeof it.total === 'number' && it.total > 0)
          ? it.total
          : (Number(it.price) * count) || 0;

        if (name && lineTotal > 0) {
          items.push({
            id: `url_item_${Date.now()}_${idx}`,
            name,
            price: Math.round((lineTotal / count) * 100) / 100,
            count: Math.round(count * 1000) / 1000,
            category: classifyCategory(name, customCategories),
          });
        }
      });
    }

    // 2. Generic HTML table / OFD parsing if not found
    if (items.length === 0) {
      const cleanText = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                            .replace(/<style[\s\S]*?<\/style>/gi, '')
                            .replace(/<[^>]+>/g, '\n');
      const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

      // Blacklist non-item metadata lines to avoid capturing receipt headers and addresses
      const metadataKeywords = [
        'кассовый чек', 'чек №', 'смена №', 'фд №', 'фп №', 'фн №', 'зн ккт', 'рн ккт',
        'инн', 'информация о покупке', 'пользователь:', 'адрес:', 'место расчётов:',
        'кассир:', 'сно:', 'офд:', 'сайт фнс:', 'эл.адрес', 'дата время', 'тк лента',
        'оплата банковской картой', 'соцсетях', 'промокод', 'бонус'
      ];

      const priceRegex = /(?:^|[\s—=\-])(\d+(?:[.,]\d{1,2})?)\s*(?:руб|р|₽)$/i;
      const decimalPriceRegex = /(?:^|[\s—=\-])(\d+[.,]\d{2})$/i;

      lines.forEach((line, idx) => {
        const lowerLine = line.toLowerCase();
        if (metadataKeywords.some(kw => lowerLine.includes(kw))) {
          return;
        }

        const match = line.match(priceRegex) || line.match(decimalPriceRegex);
        if (match) {
          const price = parseFloat(match[1].replace(',', '.'));
          const name = line.replace(priceRegex, '').replace(decimalPriceRegex, '').trim();
          const lowerName = name.toLowerCase();
          const isSummary = lowerName.startsWith('итого') || lowerName.startsWith('всего') || lowerName.startsWith('к оплате') || lowerName.startsWith('сумма');
          if (price > 0 && name.length >= 3 && !isSummary) {
            items.push({
              id: `ofd_item_${Date.now()}_${idx}`,
              name,
              price,
              count: 1,
              category: classifyCategory(name, customCategories),
            });
          }
        }
      });
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'По указанной ссылке не удалось распознать товарные позиции чека. Откройте ссылку в браузере и скопируйте текст позиций во вкладку «Текст».' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Discover new categories if detected
    const newCategories: CategoryConfig[] = [];
    const knownCatIds = new Set([
      'vegetables_fruits', 'dairy_cheese', 'meat_fish', 'grocery_bread', 'drinks_snacks', 'ready_food', 'other',
      ...customCategories.map(c => c.id)
    ]);

    const hasPet = items.some(i => i.category === 'pet_supplies');
    if (hasPet && !knownCatIds.has('pet_supplies')) {
      newCategories.push({
        id: 'pet_supplies',
        label: 'Зоотовары',
        icon: '🐾',
        color: '#f43f5e',
        badgeBg: 'bg-rose-500/10',
        badgeText: 'text-rose-400',
        badgeBorder: 'border-rose-500/30'
      });
    }

    const hasSnacks = items.some(i => i.category === 'snacks_chips');
    if (hasSnacks && !knownCatIds.has('snacks_chips')) {
      newCategories.push({
        id: 'snacks_chips',
        label: 'Чипсы и снеки',
        icon: '🍿',
        color: '#f59e0b',
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/30'
      });
    }

    const hasSpices = items.some(i => i.category === 'spices_seasonings');
    if (hasSpices && !knownCatIds.has('spices_seasonings')) {
      newCategories.push({
        id: 'spices_seasonings',
        label: 'Специи и приправы',
        icon: '🧂',
        color: '#ec4899',
        badgeBg: 'bg-pink-500/10',
        badgeText: 'text-pink-400',
        badgeBorder: 'border-pink-500/30'
      });
    }

    // Calculate totals dynamically across all categories
    const categoryTotals: Record<string, number> = {
      vegetables_fruits: 0,
      dairy_cheese: 0,
      meat_fish: 0,
      grocery_bread: 0,
      drinks_snacks: 0,
      ready_food: 0,
      other: 0,
    };
    newCategories.forEach(c => { categoryTotals[c.id] = 0; });
    customCategories.forEach(c => { categoryTotals[c.id] = 0; });

    let totalAmount = 0;
    for (const it of items) {
      const lineCost = Math.round(it.price * it.count * 100) / 100;
      categoryTotals[it.category] = Math.round(((categoryTotals[it.category] || 0) + lineCost) * 100) / 100;
      totalAmount = Math.round((totalAmount + lineCost) * 100) / 100;
    }

    // If authoritative total is in receipt, ensure exact alignment
    if (rawReceipt && typeof rawReceipt.total === 'number' && rawReceipt.total > 0) {
      totalAmount = Math.round(rawReceipt.total * 100) / 100;
    }

    return new Response(
      JSON.stringify({
        storeName: storeInfo.storeName,
        storeId: storeInfo.storeId,
        date: receiptDate,
        items,
        categoryTotals,
        totalAmount,
        newCategories: newCategories.length > 0 ? newCategories : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Внутренняя ошибка обработки ссылки на чек.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
