/**
 * Pure helper to format amounts strictly in Russian Rubles (₽)
 */
export function formatRubles(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  return `${rounded.toLocaleString('ru-RU')}\u00A0₽`;
}

/**
 * Calculates budget metrics for an individual (single user profile baseline)
 */
export function calculateSingleUserBudget(monthlyBudget: number) {
  const safeMonthly = Math.max(0, monthlyBudget);
  const weekly = Math.round(safeMonthly / 4);
  const daily = Math.round(safeMonthly / 30);
  return {
    monthly: safeMonthly,
    weekly,
    daily,
    perPersonDaily: daily,
    totalMembers: 1,
  };
}

/**
 * Calculates aggregated budget metrics when family members or partners are connected
 */
export function calculateFamilyBudget(
  monthlyBudget: number,
  adultsCount: number,
  childrenCount: number,
  petsCount: number = 0
) {
  const safeMonthly = Math.max(0, monthlyBudget);
  const safeAdults = Math.max(1, adultsCount);
  const safeChildren = Math.max(0, childrenCount);
  const safePets = Math.max(0, petsCount);
  const totalPersons = safeAdults + safeChildren;

  const weekly = Math.round(safeMonthly / 4);
  const daily = Math.round(safeMonthly / 30);
  const perPersonDaily = Math.round(daily / totalPersons);

  return {
    monthly: safeMonthly,
    weekly,
    daily,
    perPersonDaily,
    totalPersons,
    safeAdults,
    safeChildren,
    safePets,
  };
}

/**
 * Validation for Step 1: Personal Budget in Rubles
 */
export function validateStep1Profile(data: {
  monthlyBudget: number;
  city?: string;
  avatar?: string;
}) {
  const errors: string[] = [];
  if (typeof data.monthlyBudget !== 'number' || isNaN(data.monthlyBudget) || data.monthlyBudget < 1000) {
    errors.push('Минимальный бюджет должен составлять от 1 000 ₽ в месяц.');
  }
  if (data.monthlyBudget > 5000000) {
    errors.push('Сумма бюджета превышает допустимый лимит.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validation for Step 2: Family composition
 */
export function validateStep2Family(data: {
  adultsCount: number;
  childrenCount: number;
  petsCount?: number;
}) {
  const errors: string[] = [];
  if (data.adultsCount < 1) {
    errors.push('Количество взрослых должно быть минимум 1.');
  }
  if (data.childrenCount < 0) {
    errors.push('Количество детей не может быть отрицательным.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
