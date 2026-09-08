# Манифест передачи состояния: Обязательная установка PWA на рабочий стол

- **source_agent**: feature-developer
- **status**: SUCCESS
- **artifacts_produced**:
  - `src/features/install-pwa/ui/MandatoryInstallScreen.tsx` (полноэкранный блокирующий экран с кнопкой добавления на рабочий стол)
  - `src/features/install-pwa/index.ts`
  - `src/app/router/router.tsx` (проверка `isMobile && !isStandalone`: блокировка контента, меню и скролла до запуска с домашнего экрана)
  - `public/manifest.json` (скоуп, maskable иконки, standalone режим)
  - `public/sw.js` (Service Worker для критериев PWA)
  - `src/main.tsx` (регистрация Service Worker)
  - `index.html` (метатеги Apple и PWA)
  - Удалена вся ненужная логика перехватов скролла: удалены `useMobileScrollStabilizer.ts`, `MobileScrollContainer`.
- **pending_tasks**: None
- **blockers_or_notes**:
  - Реализовано строго по требованию пользователя:
    1. Если пользователь открывает сервис из браузера телефона (не через ярлык PWA), загружается **исключительно** экран добавления на рабочий стол `<MandatoryInstallScreen />`.
    2. Никакой контент, навигационные меню (`TopNavbar`, `MobileBottomBar`), карточки и фоновые скроллы не отображаются и не загружаются.
    3. Модалку невозможно закрыть или пропустить (нет кнопки закрытия / отмены).
    4. При нажатии на главную кнопку «Добавить на рабочий стол» вызывается нативный диалог установки (`beforeinstallprompt`) на Android/Samsung/Chrome, либо пошаговая наглядная инструкция для iOS Safari и ручного добавления.
    5. После добавления на рабочий стол и открытия через ярлык активируется режим `display-mode: standalone`, и приложение открывается на полный экран без адресных строк и всплывающих панелей браузера.
    6. Инструкция реализована в виде премиальной шторки (Bottom Sheet) с автоопределением браузера и интерактивными вкладками: Samsung Internet, Google Chrome, Safari (iOS), Яндекс Браузер.
    7. Тексты каждого шага выверены с официальной русской локализацией меню каждого браузера.
