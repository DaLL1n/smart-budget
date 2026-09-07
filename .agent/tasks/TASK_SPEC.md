> Context Loaded:
> - Rulebook: references/gemini_3_8_flash_rules.md [OK]
> - Workflow: references/antigravity_prompting.md [OK]
> - Template: templates/task_spec_template.md [OK]

# TASK SPECIFICATION: Отмена JS-скролла (только CSS) и возврат дефолтных скроллбаров на мобилках

## 1. PERSONA & ROLE
- Роль исполнителя: Senior Frontend Engineer (Zero Overhead, Pure CSS Performance).
- Фокус: Полное устранение любых вспомогательных JS-скриптов и слушателей скролла для исключения накладных расходов процессора; возврат нативных браузерных скроллбаров на смартфонах/планшетах.
- Scope Isolation: Удаление компонента `MobileScrollIndicator`, очистка импортов в `src/app/router/router.tsx` и `src/shared/ui/index.ts`, возврат отображения дефолтных системных скроллбаров в `src/index.css`.

## 2. TASK & WORKFLOW
- Цель:
  1. Полностью отменить плавный скроллбар через JS (убрать `MobileScrollIndicator` и сопутствующие слушатели/таймеры). Плавность обеспечивается строго через CSS (`scroll-behavior: smooth`).
  2. На мобильных устройствах вернуть стандартные (дефолтные) скроллбары операционных систем (iOS Safari, Android Chrome, Samsung Internet).

### Алгоритм исполнения:
1. **Фаза 1: Разработка (Development Phase)**:
   - Удалить `MobileScrollIndicator` из `src/app/router/router.tsx` и из `src/shared/ui/index.ts`.
   - Удалить папку `src/shared/ui/mobile-scroll-indicator`.
   - В `src/index.css` убрать скрытие скроллбаров для `html, body` на мобильных брейкпоинтах / `pointer: coarse`.
2. **Фаза 2: Верификация (Verification Phase)**:
   - Проверить типизацию TypeScript (`npm run lint` / `tsc --noEmit`).
   - Проверить сборку продакшен-бандла (`npm run build`).
   - Сформировать отчеты `handoff.md` и `test-report.md`.

## 3. CONTEXT & GUARDRAILS
- Стек проекта: React 19, Vite, TypeScript, Tailwind CSS v4.
- Конфигурация рассуждений: thinking_level = "medium".
- ПОЛНЫЙ ЗАПРЕТ LATEX: Вычислительная сложность строго в ASCII: O(1).
- Форматирование: Разделять смысловые блоки двойным переносом строки (\n\n).

## 4. FORMAT & DEFINITION OF DONE (DOD)
- [x] Полностью удален компонент `MobileScrollIndicator` и связанные с ним JS-слушатели событий scroll
- [x] Плавный скролл страницы реализован строго на уровне CSS (`scroll-behavior: smooth`) без нагрузки на CPU
- [x] На мобильных устройствах возвращены стандартные дефолтные скроллбары операционных систем
- [x] Проверка типов `npm run lint` (`tsc --noEmit`) проходит с кодом 0
- [x] Сборка `npm run build` проходит успешно
- [x] Подготовлены артефакты `handoff.md` и `test-report.md`
