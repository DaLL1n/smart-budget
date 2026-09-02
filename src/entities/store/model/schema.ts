import { z } from 'zod';

export const storeCategorySchema = z.enum([
  'supermarket',
  'discount',
  'delivery',
  'hypermarket',
  'organic',
]);
export type StoreCategory = z.infer<typeof storeCategorySchema>;

export const storeOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: storeCategorySchema,
  color: z.string(),
});
export type StoreOption = z.infer<typeof storeOptionSchema>;

export const cityStoreRegistrySchema = z.object({
  cityNames: z.array(z.string()),
  stores: z.array(storeOptionSchema),
});
export type CityStoreRegistry = z.infer<typeof cityStoreRegistrySchema>;
