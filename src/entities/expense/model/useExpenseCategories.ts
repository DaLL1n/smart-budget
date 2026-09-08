import { useStore } from '@tanstack/react-store';
import { useMemo, useCallback } from 'react';
import { userStore } from '../../user/model/userStore';
import { DEFAULT_EXPENSE_CATEGORIES, ExpenseCategoryConfig, getCategoryConfig } from './schema';

export function useExpenseCategories(): {
  categories: ExpenseCategoryConfig[];
  customCategories: ExpenseCategoryConfig[];
  getCategory: (id: string) => ExpenseCategoryConfig;
} {
  const customCategories = useStore(
    userStore,
    (s) => (s.currentUser?.profile?.custom_categories as ExpenseCategoryConfig[]) || []
  );

  const categories = useMemo(() => {
    const map = new Map<string, ExpenseCategoryConfig>();
    DEFAULT_EXPENSE_CATEGORIES.forEach((c) => map.set(c.id, c));
    customCategories.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [customCategories]);

  const getCategory = useCallback(
    (id: string) => {
      return getCategoryConfig(id, customCategories);
    },
    [customCategories]
  );

  return { categories, customCategories, getCategory };
}
