> Context Loaded:
> - Rulebook: references/gemini_3_8_flash_rules.md [OK]
> - Workflow: references/antigravity_prompting.md [OK]
> - Template: templates/task_spec_template.md [OK]

# TASK SPECIFICATION: Кастомный нативный мобильный скроллбар (прижат к краю экрана, появление при скролле)

## 1. PERSONA & ROLE
- Роль исполнителя: Senior Frontend Engineer (Mobile UX, Motion & Hardware Compositing).
- Фокус: Мобильный интерфейс (iOS Safari, Android Chrome, Samsung Internet), полное скрытие дефолтных браузерных полос прокрутки на мобильных устройствах, реализация ультра-легкого кастомного индикатора прокрутки у правого края экрана телефона с затуханием (fade-in / fade-out).
- Scope Isolation: Стилизация в `src/index.css` (скрытие нативного скроллбара на тач-устройствах), создание компонента `MobileScrollIndicator` в `src/shared/ui/mobile-scroll-indicator/MobileScrollIndicator.tsx`, подключение в `RootLayout` в `src/app/router/router.tsx`.

## 2. TASK & WORKFLOW
- Цель:
  1. На всех мобильных устройствах (`pointer: coarse` / мобильные экраны) полностью скрыть системный дефолтный скроллбар страницы.
  2. Разработать кастомный скроллбар-индикатор для мобильных устройств, прижатый к правому краю экрана телефона (`right: 1.5px`), учитывающий Safe Area Insets (`env(safe-area-inset-top)` / `bottom`).
  3. Обеспечить поведение классического мобильного скроллбара:
     - Полностью невидим в покое (`opacity: 0`).
     - Мгновенно появляется при скролле (`opacity: 1`), плавно перемещается по высоте пропорционально прогрессу прокрутки через GPU (`transform: translateY(...)`).
     - Автоматически плавно затухает через ~800-900 мс после остановки скролла.
     - Не показывается, если контент страницы целиком помещается на экране без прокрутки.

### Алгоритм исполнения:
1. **Фаза 1: Разработка (Development Phase)**:
   - В `src/index.css` для `@media (pointer: coarse), (hover: none)` скрыть дефолтный скроллбар `html, body` (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`).
   - Создать компонент `MobileScrollIndicator.tsx` с отслеживанием `window.scrollY`, расчетом высоты ползунка и таймером затухания.
   - Экспортировать компонент в `src/shared/ui/index.ts` и встроить в `RootLayout` в `src/app/router/router.tsx`.
2. **Фаза 2: Верификация (Verification Phase)**:
   - Проверить типизацию TypeScript (`npm run lint` / `tsc --noEmit`).
   - Проверить сборку продакшен-бандла (`npm run build`).
   - Подготовить отчеты `handoff.md` и `test-report.md`.

## 3. CONTEXT & GUARDRAILS
- Стек проекта: React 19, Vite, TypeScript, Tailwind CSS v4.
- Конфигурация рассуждений: thinking_level = "medium".
- ПОЛНЫЙ ЗАПРЕТ LATEX: Вычислительная сложность строго в ASCII: O(1) на обработчик скролла. Сравнения писать как <=, >=, !=.
- Форматирование: Разделять логические блоки двойным переносом строки (\n\n).

## 4. FORMAT & DEFINITION OF DONE (DOD)
- [x] На мобильных устройствах системные дефолтные скроллбары страницы полностью скрыты
- [x] Кастомный мобильный индикатор прижат к правому краю экрана (1.5-2px)
- [x] Индикатор появляется только во время скролла страницы и плавно исчезает после паузы
- [x] Высота и положение ползунка пропорциональны размеру страницы и текущей позиции скролла
- [x] На десктопах с мышью системный десктопный скроллбар работает штатно без наложений
- [x] Проверка типов `npm run lint` (`tsc --noEmit`) проходит с кодом 0
- [x] Сборка `npm run build` проходит успешно
- [x] Подготовлены артефакты `handoff.md` и `test-report.md`
