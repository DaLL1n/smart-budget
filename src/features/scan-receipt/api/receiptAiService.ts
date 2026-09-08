import axios from 'axios';
import { 
  ExpenseCategory, 
  EXPENSE_CATEGORIES, 
  ExpenseCategoryConfig, 
  buildCategoryBadge 
} from '../../../entities/expense';
import { POPULAR_STORES } from '../../../entities/store';

export interface ParsedReceiptItem {
  id: string;
  name: string;
  price: number;
  count: number;
  category: ExpenseCategory;
}

export interface ParsedReceiptData {
  storeName: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  items: ParsedReceiptItem[];
  categoryTotals: Record<string, number>;
  totalAmount: number;
  newCategories?: ExpenseCategoryConfig[];
}

/**
 * Normalizes Russian store names into known store IDs
 */
export function matchStoreId(rawName: string, city: string = 'Москва'): string {
  const clean = (rawName || '').toLowerCase();
  if (clean.includes('пятёр') || clean.includes('пятер') || clean.includes('5ka')) return 'pyaterochka';
  if (clean.includes('магнит')) return 'magnit';
  if (clean.includes('вкусвилл') || clean.includes('vkusvill')) return 'vkusvill';
  if (clean.includes('перекр') || clean.includes('перекресток')) return 'perekrestok';
  if (clean.includes('лента')) return 'lenta';
  if (clean.includes('чижик')) return 'chizhik';
  if (clean.includes('самокат')) return 'samokat';
  if (clean.includes('купер') || clean.includes('сбермаркет')) return 'kuper';
  if (clean.includes('ярослав') || clean.includes('ярче')) return 'yarche';
  if (clean.includes('дикси')) return 'dixy';
  if (clean.includes('ашан') || clean.includes('auchan')) return 'auchan';
  if (clean.includes('метро') || clean.includes('metro')) return 'metro';
  if (clean.includes('спар') || clean.includes('spar')) return 'spar';
  if (clean.includes('куулклевер') || clean.includes('мяснов')) return 'coolclever';
  if (clean.includes('азбука')) return 'azbuka_vkusa';
  return 'pyaterochka';
}

/**
 * Classifies an item name into one of the system or custom categories
 */
export function classifyItemCategory(
  itemName: string, 
  knownCategories?: ExpenseCategoryConfig[]
): ExpenseCategory {
  const name = itemName.toLowerCase();

  // Check known custom categories first if any match keywords
  if (knownCategories && knownCategories.length > 0) {
    for (const cat of knownCategories) {
      const catId = cat.id.toLowerCase();
      const label = cat.label.toLowerCase();
      
      // Pet supplies custom category
      if (catId.includes('pet') || label.includes('зоо') || label.includes('питом')) {
        if (
          name.includes('корм') || name.includes('кошач') || name.includes('собач') ||
          name.includes('кош') || name.includes('собак') || name.includes('наполнитель') ||
          name.includes('whiskas') || name.includes('felix') || name.includes('kitekat') ||
          name.includes('sheba') || name.includes('purina') || name.includes('пурин') ||
          name.includes('pro plan') || name.includes('chappi') || name.includes('pedigree') ||
          name.includes('вискас') || name.includes('феликс')
        ) {
          return cat.id;
        }
      }

      // Snacks / chips custom category
      if (catId.includes('snack') || catId.includes('chip') || label.includes('чипс') || label.includes('снек')) {
        if (
          name.includes('чипс') || name.includes('корнерс') || name.includes('нутс') ||
          name.includes('сухарик') || name.includes('снек') || name.includes('lays') ||
          name.includes('doritos') || name.includes('pringles') || name.includes('хруст')
        ) {
          return cat.id;
        }
      }

      // Pharmacy custom category
      if (catId.includes('pharm') || label.includes('аптек') || label.includes('лекарств')) {
        if (
          name.includes('таблет') || name.includes('пластыр') || name.includes('бинт') ||
          name.includes('витамин') || name.includes('мазь') || name.includes('спрей')
        ) {
          return cat.id;
        }
      }
    }
  }

  // 1. Non-food / Hygiene / Household goods / Cleaning / Packages (checked FIRST so scented items with peach, almond, coconut won't match food)
  const isNonFood =
    name.includes('мыло') || name.includes('ж/мыло') || name.includes('шампунь') ||
    name.includes('гель для душа') || name.includes('гель д/душа') || name.includes('бальзам д/волос') ||
    name.includes('бальзам для волос') || name.includes('кондиционер для волос') ||
    name.includes('зубн') || name.includes('ополаскиватель') || name.includes('дезодорант') ||
    name.includes('станок') || name.includes('бритв') || name.includes('прокладк') ||
    name.includes('тампон') || name.includes('диски ватн') || name.includes('палочки ватн') ||
    name.includes('салфетк') || name.includes('туалетная бумага') || name.includes('бумага туалет') ||
    name.includes('порошок стирал') || name.includes('стиральный порошок') || name.includes('капсулы для стирки') ||
    name.includes('гель для стирки') || name.includes('д/стирки') || name.includes('д/посуды') ||
    name.includes('для мытья посуды') || name.includes('таблетки д/пмм') || name.includes('чистящ') ||
    name.includes('моющее') || name.includes('освежитель') || name.includes('белизна') ||
    name.includes('пакет') || name.includes('рукав д/запек') || name.includes('рукав для запек') ||
    name.includes('коврик д/гриля') || name.includes('коврик для гриля') || name.includes('фольга') ||
    name.includes('пергамент') || name.includes('губк') || name.includes('тряпк') ||
    name.includes('химия') || name.includes('батарейк') || name.includes('domestos') ||
    name.includes('fairy') || (name.includes('крем') && (name.includes('рук') || name.includes('лиц') || name.includes('ног') || name.includes('тела') || name.includes('д/рук') || name.includes('д/лиц') || name.includes('д/ног')));

  if (isNonFood) {
    return 'other';
  }

  // 2. Autonomous Pet Supplies detection
  if (
    name.includes('корм') || name.includes('кошач') || name.includes('собач') ||
    name.includes('кош') || name.includes('собак') || name.includes('наполнитель') ||
    name.includes('whiskas') || name.includes('felix') || name.includes('kitekat') ||
    name.includes('sheba') || name.includes('purina') || name.includes('пурин') ||
    name.includes('pro plan') || name.includes('chappi') || name.includes('pedigree') ||
    name.includes('вискас') || name.includes('феликс')
  ) {
    return 'pet_supplies';
  }

  // 3. Autonomous Spices & Seasonings detection
  if (
    name.includes('паприк') || name.includes('приправ') || name.includes('специ') ||
    name.includes('куркум') || name.includes('карри') || name.includes('хмели-сунели') ||
    name.includes('лавровый лист') || name.includes('кориц') || name.includes('ванилин') ||
    name.includes('базилик сушен') || name.includes('орегано') || name.includes('чеснок сушен') ||
    name.includes('зелень сушен') || name.includes('перец молот') || name.includes('перец черн') ||
    name.includes('перец душист') || name.includes('смесь перцев') || name.includes('гвоздик') ||
    name.includes('кориандр') || name.includes('тмин') || name.includes('зира') ||
    name.includes('kotanyi') || name.includes('kamis') || name.includes('приправыч')
  ) {
    return 'spices_seasonings';
  }

  // Sweet confectionery check: chocolates, sweets, cookies, cakes with nuts belong to drinks_snacks
  const isSweetConfectionery = 
    name.includes('шоколад') || name.includes('конфет') || name.includes('торт') ||
    name.includes('пирожн') || name.includes('батончик') || name.includes('бат-к') ||
    name.includes('печень') || name.includes('вафл') || name.includes('зефир') ||
    name.includes('пряник');

  // Autonomous Snacks & Chips detection (nuts, corn crackers, chips, seeds, crunchy snacks)
  if (!isSweetConfectionery && (
    name.includes('чипс') || name.includes('корнерс') || name.includes('нутс') ||
    name.includes('сухарик') || name.includes('снек') || name.includes('lays') ||
    name.includes('doritos') || name.includes('pringles') || name.includes('хруст') ||
    name.includes('арахис') || name.includes('фисташк') || name.includes('кешью') ||
    name.includes('миндал') || name.includes('фундук') || name.includes('орех') ||
    name.includes('начос') || name.includes('nachos') || name.includes('попкорн') ||
    name.includes('семечк') || name.includes('крекер')
  )) {
    return 'snacks_chips';
  }

  // 1. Dairy & Cheese (checked before vegetables so "йогурт" won't match "огур")
  if (
    name.includes('молок') || name.includes('сыр') || name.includes('творог') ||
    name.includes('сметан') || name.includes('масло сливоч') || name.includes('йогурт') ||
    name.includes('кефир') || name.includes('сливк') || name.includes('ряженк') ||
    name.includes('снежок') || name.includes('брынз') || name.includes('сулугуни') ||
    name.includes('моцарелл') || name.includes('пармезан') || name.includes('гауда')
  ) {
    return 'dairy_cheese';
  }

  // 2. Vegetables & Fruits
  if (
    name.includes('яблок') || name.includes('банан') || name.includes('томат') ||
    name.includes('помидор') || name.includes('огурц') || name.includes('огуреч') ||
    name.includes('огурец') || name.includes('картоф') || name.includes('морков') ||
    name.includes('лук') || name.includes('капуст') || name.includes('зелен') ||
    name.includes('укроп') || name.includes('петрушк') ||
    (name.includes('салат') && !name.includes('цезарь')) || name.includes('апельсин') ||
    name.includes('мандарин') || name.includes('ягод') || name.includes('гриб') ||
    name.includes('чеснок') || name.includes('перец') || name.includes('виноград') ||
    name.includes('груш') || name.includes('авокадо') || name.includes('баклажан')
  ) {
    return 'vegetables_fruits';
  }

  // 3. Meat & Fish
  if (
    name.includes('мясо') || name.includes('говядин') || name.includes('свинин') ||
    name.includes('куриц') || name.includes('цыплен') || name.includes('индейк') ||
    name.includes('фарш') || name.includes('филе') || name.includes('рыб') ||
    name.includes('лосос') || name.includes('форел') || name.includes('треск') ||
    name.includes('минтай') || name.includes('кревет') || name.includes('колбас') ||
    name.includes('сосиск') || name.includes('сардельк') || name.includes('бекон') ||
    name.includes('стейк') || name.includes('окорок') || name.includes('ветчин')
  ) {
    return 'meat_fish';
  }

  // 4. Grocery & Bread
  if (
    name.includes('хлеб') || (name.includes('батон') && !name.includes('батончик')) || name.includes('булоч') ||
    name.includes('лаваш') || name.includes('круп') || name.includes('рис') ||
    name.includes('гречк') || name.includes('макарон') || name.includes('спагетти') ||
    name.includes('мука') || name.includes('сахар') || name.includes('соль') ||
    name.includes('масло растительн') || name.includes('масло подсолнеч') ||
    name.includes('оливков') || name.includes('овсянк') || name.includes('хлопь') ||
    name.includes('консерв') || name.includes('паштет') || name.includes('горошек') ||
    name.includes('кукуруз')
  ) {
    return 'grocery_bread';
  }

  // 5. Drinks & Sweets
  if (
    name.includes('вода') || name.includes('сок') || name.includes('чай') ||
    name.includes('кофе') || name.includes('напиток') || name.includes('кола') ||
    name.includes('лимонад') || name.includes('шоколад') || name.includes('конфет') ||
    name.includes('печень') || name.includes('вафл') || name.includes('торт') ||
    name.includes('пирожн') || name.includes('пряник') || name.includes('зефир') ||
    name.includes('батончик') || name.includes('бат-к')
  ) {
    return 'drinks_snacks';
  }

  // 6. Ready Food
  if (
    name.includes('кулинари') || name.includes('сэндвич') || name.includes('бутерброд') ||
    name.includes('ролл') || name.includes('суши') || name.includes('пицц') ||
    name.includes('супы') || name.includes('суп ') || name.includes('борщ') || name.includes('плов') ||
    (name.includes('котлет') && name.includes('готов')) || name.includes('обед') ||
    name.includes('онигири') || name.includes('комбо')
  ) {
    return 'ready_food';
  }

  // 7. Other
  return 'other';
}

/**
 * Calculates category totals and grand total from items
 */
export function calculateTotals(
  items: ParsedReceiptItem[],
  customCategories?: ExpenseCategoryConfig[]
): {
  categoryTotals: Record<string, number>;
  totalAmount: number;
} {
  const totals: Record<string, number> = {
    vegetables_fruits: 0,
    dairy_cheese: 0,
    meat_fish: 0,
    grocery_bread: 0,
    drinks_snacks: 0,
    ready_food: 0,
    other: 0,
  };

  if (customCategories) {
    customCategories.forEach(cat => {
      totals[cat.id] = 0;
    });
  }

  let grandTotal = 0;
  for (const it of items) {
    const cost = Math.round((it.price * (it.count || 1)) * 100) / 100;
    totals[it.category] = Math.round(((totals[it.category] || 0) + cost) * 100) / 100;
    grandTotal = Math.round((grandTotal + cost) * 100) / 100;
  }

  return { categoryTotals: totals, totalAmount: grandTotal };
}

/**
 * Detects whether the input is a question, conversational prompt, math calculation,
 * or general non-receipt text to prevent false positives and bypasses.
 */
export function isNonReceiptText(text: string): { isInvalid: boolean; reason?: string } {
  const lower = text.toLowerCase().trim();

  // 1. Explicit questions and interrogatives
  const isQuestion = lower.includes('?') || /^(сколько|почему|зачем|как|кто|где|когда|куда|что|будет ли|подскажи|скажи|какой|какая|какие)\b/i.test(lower);
  if (isQuestion) {
    return {
      isInvalid: true,
      reason: 'Введённый текст является вопросом или диалоговой фразой, а не кассовым чеком. Сканер принимает списки покупок и кассовые квитанции.',
    };
  }

  // 2. Math expressions, formulas or calculation requests
  const hasMathExpr = /[0-9]+\s*[+\-*\/^=]\s*[0-9]+/i.test(lower);
  const hasMathWord = /\b(посчитай|вычисли|реши|сложи|умножь|прибавь|плюс|минус|равно|будет)\b/i.test(lower);
  if (hasMathExpr || (hasMathWord && (lower.includes('+') || lower.includes('=')))) {
    return {
      isInvalid: true,
      reason: 'Введённый текст содержит математическое вычисление. Сканер чека предназначен для распознавания покупок, а не для расчётов.',
    };
  }

  // 3. Conversational greetings and chatbot queries
  const isChatPhrase = /^(привет|здравствуй|добрый (день|вечер|утро)|хай|hello|hi|тест|проверка|расскажи|помоги|напиши)\b/i.test(lower);
  if (isChatPhrase && !lower.includes('чек') && !lower.includes('покупк')) {
    return {
      isInvalid: true,
      reason: 'Введённый текст является обращением или приветствием. Вставьте текст чека с наименованиями и ценами (например: «Хлеб 45, Молоко 90»).',
    };
  }

  return { isInvalid: false };
}

/**
 * AI Receipt Scanner Core Service
 * Strict multi-channel validation and parsing for grocery receipts.
 */
export const receiptAiService = {
  /**
   * Validate and parse receipt from an Image or PDF file (Camera / Photo / File)
   */
  async scanReceiptImage(
    file: File | Blob, 
    city: string = 'Москва',
    customCategories?: ExpenseCategoryConfig[]
  ): Promise<ParsedReceiptData> {
    if (file instanceof File) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
      const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf' || validTypes.includes(file.type);
      
      if (!isImageOrPdf) {
        throw new Error('Неподдерживаемый формат файла. Загрузите фотографию чека (JPG, PNG, WebP) или PDF-документ.');
      }
      if (file.size === 0) {
        throw new Error('Файл пуст. Выберите изображение или документ с данными чека.');
      }
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Размер файла превышает 20 МБ. Пожалуйста, сожмите изображение или выберите файл меньшего размера.');
      }
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения.'));
      reader.readAsDataURL(file);
    });

    if (apiKey) {
      return await this.callGeminiVision(base64Data, file.type || 'image/jpeg', city, customCategories);
    }

    // No API key: clear user guidance
    throw new Error(
      'Для оптического распознавания чеков по фото/файлу требуется подключение Gemini Vision (укажите VITE_GEMINI_API_KEY в .env). Вы можете быстро ввести чек текстом во вкладке «Текст».'
    );
  },

  /**
   * Validate and parse receipt from pasted text (SMS, email, banking notification, app order)
   */
  async scanReceiptText(
    text: string, 
    city: string = 'Москва',
    customCategories?: ExpenseCategoryConfig[]
  ): Promise<ParsedReceiptData> {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      throw new Error('Введите или вставьте текст чека.');
    }

    if (trimmed.length < 4) {
      throw new Error('Текст слишком короткий. Укажите наименования продуктов и цены.');
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey && trimmed.length > 10) {
      try {
        return await this.callGeminiText(trimmed, city, customCategories);
      } catch (err: any) {
        // If Gemini explicitly rejected the prompt as non-receipt, rethrow that message
        if (err?.message && !err.message.includes('API') && !err.message.includes('timeout') && !err.message.includes('Network')) {
          throw err;
        }
        console.warn('Gemini Text API call failed, attempting local line parsing:', err);
      }
    }

    // Local deterministic parsing
    return this.parseTextLocally(trimmed, city, customCategories);
  },

  /**
   * Validate and parse receipt from URL (OFD link, electronic receipt page, Lenta, etc.)
   */
  async scanReceiptUrl(
    url: string, 
    city: string = 'Москва',
    customCategories?: ExpenseCategoryConfig[]
  ): Promise<ParsedReceiptData> {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      throw new Error('Укажите ссылку на электронный чек.');
    }

    // Strict URL syntax validation
    try {
      const parsedUrl = new URL(trimmed);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw new Error('Некорректный формат ссылки. Ссылка должна начинаться с https:// или http:// (например: https://check.ofd.ru/...)');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evqksvsoxjeoauprzojt.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 1. Call serverless Edge Function (bypasses browser CORS, parses Lenta, OFD, check tables)
    try {
      const resp = await axios.post(
        `${supabaseUrl}/functions/v1/parse-receipt-url`,
        { url: trimmed, city, customCategories },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(supabaseAnonKey ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } : {}),
          },
          timeout: 25000,
        }
      );

      if (resp.data && resp.data.items && resp.data.items.length > 0) {
        return resp.data as ParsedReceiptData;
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message;
      if (errorMsg && typeof errorMsg === 'string' && !errorMsg.includes('Network') && !errorMsg.includes('500')) {
        throw new Error(errorMsg);
      }
      console.warn('Edge Function receipt fetch failed, trying AI fallback:', err);
    }

    // 2. Gemini fallback if API key configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      return await this.callGeminiText(`Ссылка на электронный чек: ${trimmed}. Перейди или извлеки магазин, дату и позиции чека.`, city, customCategories);
    }

    throw new Error('Не удалось автоматически загрузить чек по ссылке. Откройте ссылку в браузере и скопируйте текст позиций во вкладку «Текст».');
  },

  /**
   * Local regex/line parser for pasted receipt text with strict validation and autonomous category detection
   */
  parseTextLocally(
    text: string, 
    city: string = 'Москва',
    customCategories?: ExpenseCategoryConfig[]
  ): ParsedReceiptData {
    // Pre-validation: reject questions, formulas, chat prompts
    const guard = isNonReceiptText(text);
    if (guard.isInvalid) {
      throw new Error(guard.reason);
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const today = new Date().toISOString().split('T')[0];

    let storeName = 'Супермаркет';
    const firstFew = lines.slice(0, 5).join(' ');
    const storeId = matchStoreId(firstFew, city);
    const popular = POPULAR_STORES.find(s => s.id === storeId);
    if (popular) storeName = popular.name;

    const items: ParsedReceiptItem[] = [];
    const newCategories: ExpenseCategoryConfig[] = [];

    // Helper to check and add new categories locally
    const ensureNewCategory = (cat: ExpenseCategoryConfig) => {
      const alreadyExists = (customCategories || []).some(c => c.id === cat.id);
      const alreadyAdded = newCategories.some(c => c.id === cat.id);
      if (!alreadyExists && !alreadyAdded) {
        newCategories.push(cat);
      }
    };

    // Stop words that never appear in real receipt item names
    const INVALID_NAME_WORDS = [
      'сколько', 'будет', 'почему', 'зачем', 'как', 'посчитай', 'реши',
      'вычисли', 'скажи', 'подскажи', 'равно', 'плюс', 'минус', 'привет',
      'пожалуйста', 'спасибо', 'здравствуйте', 'вопрос'
    ];

    // Parse lines with price at the end:
    // "Хлеб 45.00", "Молоко 90 руб", "1. Бананы 120 р", "Сыр = 210 ₽"
    const priceRegex = /(?:^|[\s—=\-])(\d+(?:[.,]\d{1,2})?)\s*(?:руб|р|₽)?$/i;

    lines.forEach((line, idx) => {
      // Reject any individual line containing question marks or math operators
      if (line.includes('?') || line.includes('+')) {
        return;
      }

      // Clean leading bullet points or numbers
      const cleanLine = line.replace(/^\s*\d+[\.\)]\s*/, '').replace(/^[-*•]\s*/, '').trim();
      const match = cleanLine.match(priceRegex);
      if (match) {
        const price = parseFloat(match[1].replace(',', '.'));
        const name = cleanLine.replace(priceRegex, '').trim();
        const lowerName = name.toLowerCase();

        // Check for stop words inside item name
        const hasBannedWord = INVALID_NAME_WORDS.some(w => new RegExp(`\\b${w}\\b`, 'i').test(lowerName));
        if (hasBannedWord) {
          return;
        }

        // Check if the remaining name still has prices inside it
        if (/(?:^|\s)\d+(?:[.,]\d{1,2})?\s*(?:руб|р|₽)/i.test(name)) {
          return;
        }

        // Filter out total/summary lines and empty names
        const isSummary = lowerName.startsWith('итого') || lowerName.startsWith('всего') || lowerName.startsWith('к оплате') || lowerName.startsWith('сумма');
        if (price > 0 && name.length >= 2 && !isSummary) {
          // Autonomous check: Pet supplies
          if (
            lowerName.includes('корм') || lowerName.includes('кошач') || lowerName.includes('собач') ||
            lowerName.includes('whiskas') || lowerName.includes('felix') || lowerName.includes('kitekat') ||
            lowerName.includes('наполнитель') || lowerName.includes('вискас') || lowerName.includes('феликс')
          ) {
            ensureNewCategory({
              id: 'pet_supplies',
              label: 'Зоотовары',
              icon: '🐾',
              color: '#14B8A6',
              badgeBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
              isCustom: true,
            });
          }

          // Autonomous check: Snacks & chips
          if (
            lowerName.includes('чипс') || lowerName.includes('корнерс') || lowerName.includes('нутс') ||
            lowerName.includes('lays') || lowerName.includes('doritos') || lowerName.includes('pringles')
          ) {
            ensureNewCategory({
              id: 'snacks_chips',
              label: 'Чипсы и снеки',
              icon: '🍿',
              color: '#F97316',
              badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
              isCustom: true,
            });
          }

          // Autonomous check: Spices & Seasonings
          if (
            lowerName.includes('паприк') || lowerName.includes('приправ') || lowerName.includes('специ') ||
            lowerName.includes('куркум') || lowerName.includes('карри') || lowerName.includes('хмели-сунели') ||
            lowerName.includes('лавровый лист') || lowerName.includes('кориц') || lowerName.includes('ванилин') ||
            lowerName.includes('базилик сушен') || lowerName.includes('орегано') || lowerName.includes('чеснок сушен') ||
            lowerName.includes('зелень сушен') || lowerName.includes('перец молот') || lowerName.includes('перец черн') ||
            lowerName.includes('перец душист') || lowerName.includes('смесь перцев') || lowerName.includes('kotanyi') ||
            lowerName.includes('kamis') || lowerName.includes('приправыч')
          ) {
            ensureNewCategory({
              id: 'spices_seasonings',
              label: 'Специи и приправы',
              icon: '🧂',
              color: '#EC4899',
              badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
              isCustom: true,
            });
          }

          const allKnown = [...(customCategories || []), ...newCategories];
          items.push({
            id: `local_item_${Date.now()}_${idx}`,
            name,
            price,
            count: 1,
            category: classifyItemCategory(name, allKnown),
          });
        }
      }
    });

    if (items.length === 0) {
      throw new Error(
        'В тексте не обнаружены товары и цены чека. Введите позиции в формате «Товар Цена» (например: «Молоко 95», «Хлеб 45 руб») или скопируйте текст банковского уведомления.'
      );
    }

    const { categoryTotals, totalAmount } = calculateTotals(items, [...(customCategories || []), ...newCategories]);

    return {
      storeName,
      storeId,
      date: today,
      items,
      categoryTotals,
      totalAmount,
      newCategories: newCategories.length > 0 ? newCategories : undefined,
    };
  },

  /**
   * Calls Google Gemini Vision endpoint with structured JSON schema and dynamic category creation
   */
  async callGeminiVision(
    base64Data: string, 
    mimeType: string, 
    city: string,
    customCategories?: ExpenseCategoryConfig[]
  ): Promise<ParsedReceiptData> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const customCategoriesText = (customCategories && customCategories.length > 0)
      ? `\nТакже у пользователя уже созданы категории:\n` + customCategories.map(c => `- ${c.id} (${c.icon} ${c.label})`).join('\n')
      : '';

    const systemInstruction = `
Ты — интеллектуальный финансовый анализатор и сканер кассовых чеков продуктового бюджета для города ${city}.
КРИТИЧЕСКИЕ ПРАВИЛА ВАЛИДАЦИИ:
1. Если изображение НЕ является кассовым чеком, квитанцией, списком покупок или счётом (например, лицо человека, пейзаж, случайный предмет, пустой лист), верни STRICT JSON с полем "isReceipt": false и причиной в "rejectionReason".
2. Не выдумывай и не добавляй товары, которых нет на фото.

Существующие категории:
- vegetables_fruits (🥦 Овощи и фрукты)
- dairy_cheese (🧀 Молочка и сыры)
- meat_fish (🥩 Мясо и рыба)
- grocery_bread (🍞 Бакалея и хлеб)
- drinks_snacks (🧃 Напитки и снеки)
- ready_food (🍱 Готовая еда)
- other (🛒 Прочее)
${customCategoriesText}

АВТОНОМНОЕ СОЗДАНИЕ КАТЕГОРИЙ:
Если в чеке есть товары, которые явно требуют отдельной понятной категории (например: «Зоотовары» 🐱 для кормов питомцев, «Чипсы и снеки» 🍿, «Аптека» 💊, «Бытовая химия» 🧼, «Сладости» 🍫, «Алкоголь» 🍷 и т.д.):
1. Автономно создай новую категорию и добавь её в массив "newCategories".
2. Поля новой категории:
   - "id": уникальный id латиницей в snake_case (например: "pet_supplies", "snacks_chips", "pharmacy")
   - "label": понятное название на русском языке с заглавной буквы (например: "Зоотовары", "Чипсы и снеки")
   - "icon": один подходящий тематический emoji (например: "🐱", "🍿", "💊", "🧼")
   - "color": красивый HEX-цвет (например: "#14B8A6", "#F97316", "#8B5CF6")
3. В "items" для таких товаров укажи category = этот новый "id".
`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          parts: [
            { text: 'Распознай кассовый чек на изображении. Извлеки магазин, дату и позиции с ценами.' },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            isReceipt: { 
              type: 'BOOLEAN', 
              description: 'true если на изображении кассовый чек, счет или список покупок. false если это постороннее изображение.' 
            },
            rejectionReason: { 
              type: 'STRING', 
              description: 'Понятная пользователю причина отклонения, если isReceipt false' 
            },
            storeName: { type: 'STRING' },
            date: { type: 'STRING' },
            newCategories: {
              type: 'ARRAY',
              description: 'Новые категории, созданные автономно для товаров чека, если они не подходят к существующим',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  label: { type: 'STRING' },
                  icon: { type: 'STRING' },
                  color: { type: 'STRING' }
                },
                required: ['id', 'label', 'icon']
              }
            },
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  price: { type: 'NUMBER' },
                  count: { type: 'NUMBER' },
                  category: { 
                    type: 'STRING',
                    description: 'ID категории: существующей или созданной в newCategories'
                  }
                },
                required: ['name', 'price', 'category']
              }
            }
          },
          required: ['isReceipt']
        }
      },
    };

    const resp = await axios.post(url, payload, { timeout: 18000 });
    const rawText = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText || '{}');

    if (!parsed.isReceipt) {
      throw new Error(parsed.rejectionReason || 'На фотографии не обнаружен кассовый чек. Убедитесь, что чек снят чётко и при хорошем освещении.');
    }

    if (!parsed.items || parsed.items.length === 0) {
      throw new Error('На чеке не удалось распознать товарные позиции или цены.');
    }

    const storeName = parsed.storeName || 'Супермаркет';
    const storeId = matchStoreId(storeName, city);
    const date = parsed.date || new Date().toISOString().split('T')[0];

    const newCategories: ExpenseCategoryConfig[] = [];
    if (Array.isArray(parsed.newCategories)) {
      for (const c of parsed.newCategories) {
        if (c.id && c.label) {
          const badge = buildCategoryBadge(c.color, c.id);
          newCategories.push({
            id: c.id,
            label: c.label,
            icon: c.icon || '🏷️',
            color: badge.color,
            badgeBg: badge.badgeBg,
            isCustom: true,
          });
        }
      }
    }

    const allKnownMap = new Map<string, ExpenseCategoryConfig>();
    EXPENSE_CATEGORIES.forEach(c => allKnownMap.set(c.id, c));
    (customCategories || []).forEach(c => allKnownMap.set(c.id, c));
    newCategories.forEach(c => allKnownMap.set(c.id, c));

    const items: ParsedReceiptItem[] = parsed.items.map((it: any, idx: number) => ({
      id: `gemini_item_${idx}`,
      name: it.name || 'Товар',
      price: Number(it.price) || 0,
      count: Number(it.count) || 1,
      category: (it.category && allKnownMap.has(it.category))
        ? it.category
        : classifyItemCategory(it.name || '', Array.from(allKnownMap.values())),
    }));

    const { categoryTotals, totalAmount } = calculateTotals(items, Array.from(allKnownMap.values()));

    return {
      storeName,
      storeId,
      date,
      items,
      categoryTotals,
      totalAmount,
      newCategories: newCategories.length > 0 ? newCategories : undefined,
    };
  },

  /**
   * Calls Google Gemini Text endpoint with structured JSON schema, prompt injection guardrails, and dynamic category creation
   */
  async callGeminiText(
    receiptText: string, 
    city: string,
    customCategories?: ExpenseCategoryConfig[]
  ): Promise<ParsedReceiptData> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const customCategoriesText = (customCategories && customCategories.length > 0)
      ? `\nТакже у пользователя уже созданы категории:\n` + customCategories.map(c => `- ${c.id} (${c.icon} ${c.label})`).join('\n')
      : '';

    const systemInstruction = `
Ты — интеллектуальный финансовый анализатор продуктового бюджета для города ${city}.
КРИТИЧЕСКИЕ ПРАВИЛА ВАЛИДАЦИИ:
1. Если предоставленный текст НЕ является кассовым чеком, квитанцией, банковским уведомлением о покупке или списком продуктов с ценами (например, математический пример "2+2", приветствие, общий вопрос, программный код, стих или бессмысленный набор слов), ты ОБЯЗАН вернуть "isReceipt": false и внятное описание в "rejectionReason".
2. Категорически запрещено придумывать чек на произвольные вопросы.

Существующие категории:
- vegetables_fruits (🥦 Овощи и фрукты)
- dairy_cheese (🧀 Молочка и сыры)
- meat_fish (🥩 Мясо и рыба)
- grocery_bread (🍞 Бакалея и хлеб)
- drinks_snacks (🧃 Напитки и снеки)
- ready_food (🍱 Готовая еда)
- other (🛒 Прочее)
${customCategoriesText}

АВТОНОМНОЕ СОЗДАНИЕ КАТЕГОРИЙ:
Если в чеке есть товары, которые явно требуют отдельной понятной категории (например: «Зоотовары» 🐱 для кормов питомцев, «Чипсы и снеки» 🍿, «Аптека» 💊, «Бытовая химия» 🧼, «Сладости» 🍫, «Алкоголь» 🍷 и т.д.):
1. Автономно создай новую категорию и добавь её в массив "newCategories".
2. Поля новой категории:
   - "id": уникальный id латиницей в snake_case (например: "pet_supplies", "snacks_chips", "pharmacy")
   - "label": понятное название на русском языке с заглавной буквы (например: "Зоотовары", "Чипсы и снеки")
   - "icon": один подходящий тематический emoji (например: "🐱", "🍿", "💊", "🧼")
   - "color": красивый HEX-цвет (например: "#14B8A6", "#F97316", "#8B5CF6")
3. В "items" для таких товаров укажи category = этот новый "id".
`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          parts: [
            {
              text: `Проанализируй следующий текст как кассовый чек:\n"""\n${receiptText}\n"""`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            isReceipt: { 
              type: 'BOOLEAN', 
              description: 'true если текст является чеком или списком покупок с ценами. false если это посторонний вопрос или не чек.' 
            },
            rejectionReason: { 
              type: 'STRING', 
              description: 'Причина отклонения для пользователя, если isReceipt false' 
            },
            storeName: { type: 'STRING' },
            date: { type: 'STRING' },
            newCategories: {
              type: 'ARRAY',
              description: 'Новые категории, созданные автономно для товаров чека, если они не подходят к существующим',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  label: { type: 'STRING' },
                  icon: { type: 'STRING' },
                  color: { type: 'STRING' }
                },
                required: ['id', 'label', 'icon']
              }
            },
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  price: { type: 'NUMBER' },
                  count: { type: 'NUMBER' },
                  category: { 
                    type: 'STRING',
                    description: 'ID категории: существующей или созданной в newCategories'
                  }
                },
                required: ['name', 'price', 'category']
              }
            }
          },
          required: ['isReceipt']
        }
      },
    };

    const resp = await axios.post(url, payload, { timeout: 12000 });
    const rawText = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText || '{}');

    if (!parsed.isReceipt) {
      throw new Error(parsed.rejectionReason || 'Введенный текст не является кассовым чеком или списком покупок.');
    }

    if (!parsed.items || parsed.items.length === 0) {
      throw new Error('В тексте не удалось распознать товарные позиции или цены.');
    }

    const storeName = parsed.storeName || 'Супермаркет';
    const storeId = matchStoreId(storeName, city);
    const date = parsed.date || new Date().toISOString().split('T')[0];

    const newCategories: ExpenseCategoryConfig[] = [];
    if (Array.isArray(parsed.newCategories)) {
      for (const c of parsed.newCategories) {
        if (c.id && c.label) {
          const badge = buildCategoryBadge(c.color, c.id);
          newCategories.push({
            id: c.id,
            label: c.label,
            icon: c.icon || '🏷️',
            color: badge.color,
            badgeBg: badge.badgeBg,
            isCustom: true,
          });
        }
      }
    }

    const allKnownMap = new Map<string, ExpenseCategoryConfig>();
    EXPENSE_CATEGORIES.forEach(c => allKnownMap.set(c.id, c));
    (customCategories || []).forEach(c => allKnownMap.set(c.id, c));
    newCategories.forEach(c => allKnownMap.set(c.id, c));

    const items: ParsedReceiptItem[] = parsed.items.map((it: any, idx: number) => ({
      id: `gemini_text_item_${idx}`,
      name: it.name || 'Товар',
      price: Number(it.price) || 0,
      count: Number(it.count) || 1,
      category: (it.category && allKnownMap.has(it.category))
        ? it.category
        : classifyItemCategory(it.name || '', Array.from(allKnownMap.values())),
    }));

    const { categoryTotals, totalAmount } = calculateTotals(items, Array.from(allKnownMap.values()));

    return {
      storeName,
      storeId,
      date,
      items,
      categoryTotals,
      totalAmount,
      newCategories: newCategories.length > 0 ? newCategories : undefined,
    };
  },
};

