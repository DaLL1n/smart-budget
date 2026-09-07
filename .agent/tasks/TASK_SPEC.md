> Context Loaded:
> - Rulebook: references/gemini_3_8_flash_rules.md [OK]
> - Workflow: references/antigravity_prompting.md [OK]
> - Template: templates/task_spec_template.md [OK]

# TASK SPECIFICATION: Реализация максимально плавного скролла для body на ПК и мобильных устройствах

## 1. PERSONA & ROLE
- Роль исполнителя: Senior Frontend Engineer (Performance, Kinetic Scrolling & Cross-Platform UX).
- Фокус: Плавность прокрутки документа (body/window) на уровне 60-120 FPS, исключение рывков на колесике мыши (Windows/Linux/macOS), сохранение нативной инерции сенсорного экрана на мобильных ОС (iOS Safari, Android Chrome, Samsung Internet).
- Scope Isolation: Оптимизация стилей `html` и `body` в `src/index.css`, создание хука/сервиса кинетической плавной интерполяции для десктопного колеса мыши в `src/shared/lib/scroll/useSmoothScroll.ts`, интеграция в корень приложения (`RootLayout` в `src/app/router/router.tsx`).

## 2. TASK & WORKFLOW
- Цель: Обеспечить ультра-плавную прокрутку страницы:
  1. На мобильных устройствах (iOS, Android): нативная аппаратная инерция без задержек через `-webkit-overflow-scrolling: touch`, `overscroll-behavior-y: contain`, `overscroll-behavior-x: none`, `touch-action: pan-y` и аппаратное ускорение GPU.
  2. На ПК (Windows, macOS, Linux): кинетическая интерполяция скролла колеса мыши через `requestAnimationFrame` с коэффициентом демпфирования, без вмешательства в трекпады, мобильные тачи и внутренние скролл-контейнеры.
  3. Учет доступности (`prefers-reduced-motion: reduce`).

### Двухфазный алгоритм исполнения:
1. **Фаза 1: Разработка (Development Phase)**:
   - Внести системные CSS-свойства для `html, body` в `src/index.css` (аппаратное ускорение, тач-поведение, предотвращение паразитных горизонтальных сдвигов).
   - Создать хук `useSmoothScroll` в `src/shared/lib/scroll/useSmoothScroll.ts` с фильтрацией внутренних скролл-контейнеров, синхронизацией при перетаскивании скроллбара и поддержкой 120 Гц.
   - Подключить хук в `src/app/router/router.tsx` в `RootLayout`.
2. **Фаза 2: Верификация (Verification Phase)**:
   - Провести проверку типов TypeScript (`npm run lint` / `tsc --noEmit`).
   - Проверить сборку проекта (`npm run build`).
   - Проверить работу скролла в браузере.
   - Сформировать отчеты `handoff.md`, `test-report.md`, `ui-audit-report.md`.

## 3. CONTEXT & GUARDRAILS
- Стек проекта: React 19, Vite, TypeScript, Tailwind CSS v4.
- Конфигурация рассуждений: thinking_level = "medium".
- ПОЛНЫЙ ЗАПРЕТ LATEX: Нотацию вычислительной сложности писать строго в ASCII: O(1) для шага requestAnimationFrame. Сравнения писать как <=, >=, !=.
- Форматирование: Разделять логические секции двойным переносом строки (\n\n).

## 4. FORMAT & DEFINITION OF DONE (DOD)
- [x] Настроены CSS-параметры `scroll-behavior: smooth`, `-webkit-overflow-scrolling: touch`, `overscroll-behavior: contain` в `src/index.css`
- [x] Реализован хук кинетического плавного скролла для десктопа с отсечением тач-устройств и внутренних скролл-блоков
- [x] Обеспечена мгновенная синхронизация при ручном перетаскивании нативного скроллбара
- [x] Учтен медиа-запрос `prefers-reduced-motion`
- [x] Проверка типов `npm run lint` (`tsc --noEmit`) проходит с кодом 0
- [x] Сборка `npm run build` проходит успешно
- [x] Подготовлены артефакты `handoff.md` и `test-report.md`
