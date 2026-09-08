> Context Loaded:
> - Rulebook: references/gemini_3_8_flash_rules.md [OK]
> - Workflow: references/antigravity_prompting.md [OK]
> - Template: templates/task_spec_template.md [OK]

# TASK SPECIFICATION: Мобильная нижняя навигация (App Dock) с центральным «+», модалка выбора добавления и стабилизация вьюпорта

## 1. PERSONA & ROLE
- Роль: Senior Mobile Web Engineer & UI/UX Architect.
- Стек: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide React.
- Задача: 
  1. Стабилизировать мобильный вьюпорт против вылезания адресной строки и системного меню (Samsung Internet, Safari iOS, Chrome Android) через `dvh`, `overscroll-behavior-y: none`, `viewport-fit=cover` и мета-теги PWA/App.
  2. Разработать нативный мобильный таббар `MobileBottomBar` (md:hidden):
     - Вкладка 1: Обзор (`/dashboard`)
     - Вкладка 2: Семья (`/family`)
     - Центральная кнопка: Приподнятый круговой изумрудный «+» для добавления покупок
     - Вкладка 3: Аналитика (`/analytics`)
     - Вкладка 4: Финансы (вкладка-заготовка под будущее приложение трат/доходов)
  3. Разработать модалку `AddExpenseModal`: открывается по центру с полным оверлеем и блокировкой скролла. Предлагает 2 варианта: «Отсканировать чек» (ИИ/камера/QR) и «Добавить вручную» (сумма, чипы, магазин).
  4. На дашборде заменить громоздкую статичную форму на кнопку «Добавить покупку», открывающую ту же модалку.
  5. В `TopNavbar` на мобилках скрыть дублирующиеся вкладки, оставив компактный заголовок с аватаром и настройками.

## 2. TASK & WORKFLOW
### Шаги реализации:
1. **Шаг 1 (Вьюпорт и мета-теги в index.html и index.css)**:
   - Добавить в `index.html`: `viewport-fit=cover`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `theme-color: #020617`.
   - В `src/index.css`: зафиксировать `overscroll-behavior-y: none`.

2. **Шаг 2 (Модалка AddExpenseModal)**:
   - Создать `src/features/add-expense/ui/AddExpenseModal.tsx` с React Portal, z-[100], 16px отступами от краев экрана.
   - Меню выбора: «Отсканировать чек» и «Добавить вручную».
   - При выборе «Добавить вручную» переключается на проверенную форму с чипами и выбором магазина.

3. **Шаг 3 (Мобильный таббар MobileBottomBar)**:
   - Создать `src/widgets/mobile-bottom-bar/ui/MobileBottomBar.tsx` (`md:hidden`).
   - Фиксация снизу, учет safe area insets `pb-[max(0.75rem,env(safe-area-inset-bottom))]`.
   - Подключение табов и центральной кнопки «+».

4. **Шаг 4 (Интеграция в AppLayout/router и TopNavbar)**:
   - В `TopNavbar` скрыть текстовые вкладки на мобильных экранах (`hidden md:flex`).
   - В `router.tsx` смонтировать `MobileBottomBar` и добавить нижний паддинг контенту `pb-24 sm:pb-8`.
   - В `DashboardOverview` заменить громоздкий блок формы на аккуратную карточку с кнопкой «Добавить покупку».

5. **Шаг 5 (Верификация)**:
   - Проверить сборку Vite HMR.
   - Сформировать отчеты `.agent/handoff.md` и `.agent/test-report.md`.

## 3. CONTEXT & GUARDRAILS
- Строго Tailwind v4, без LaTeX, шрифты font-bold (700).
- Премиальная Slate палитра.
- Мобильная адаптивность от 375px без горизонтального скролла.
- Сохранение правил Раздела 11 (изоляция Личное/Семейное, без «в среднем в день»).
