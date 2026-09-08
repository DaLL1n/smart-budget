# Манифест передачи состояния: Классификация непищевых товаров, специи и стабильность скроллбара

- **source_agent**: feature-developer
- **status**: SUCCESS
- **artifacts_produced**:
  - `src/features/scan-receipt/ui/ScanReceiptView.tsx` (добавлен `scrollbar-gutter: stable` для контейнера аккордеонов категорий чека во избежание сдвига верстки при раскрытии списков)
  - `src/index.css` (добавлено правило `scrollbar-gutter: stable` для `.custom-scrollbar` и утилитный класс `.scrollbar-gutter-stable`)
  - `src/features/scan-receipt/api/receiptAiService.ts` (приоритетная фильтрация непищевых товаров в `other`, исключение ложных срабатываний по ароматизаторам «персик», «миндаль», «олива»; автономная категория `spices_seasonings` для паприки, специй и приправ)
  - `supabase/functions/parse-receipt-url/index.ts` (приоритетный `isNonFood` чекер, поддержка `spices_seasonings`, исключение паприки из `grocery_bread`, развернута версия 6 в Supabase)
  - `tests/autonomousCategoryDetection.test.ts` (тесты для мыла/косметики с экстрактами орехов и фруктов, тесты для паприки и специй)
- **pending_tasks**: None
- **blockers_or_notes**:
  - `scrollbar-gutter: stable` устраняет горизонтальный рывок (layout shift) при раскрытии аккордеонов категорий, когда появляется вертикальный скроллбар.
  - Чек `https://check.lenta.com/r/5vMf6KnsJCbmTBYWfFBz2U?ch=email` проверен живым запросом к Supabase Edge Function:
    - «Паприка KOTANYI красный сладкий 25г» ➔ `spices_seasonings` («🧂 Специи и приправы»).
    - «Ж/мыло Я САМАЯ Персик и миндаль 500мл» ➔ `other` («Прочее»).
    - «Рукав д/запекания HOMECLUB», «Коврики д/гриля», «Пакет ЛЕНТА» ➔ `other` («Прочее»).
    - Новая категория `snacks_chips` для этого чека НЕ создается (нет чипсов).
    - `totalAmount`: 1385.08 ₽, итог совпадает до копейки.
  - Все тесты (7/7) и `npm run lint` (`tsc --noEmit`) пройдены без единой ошибки.
