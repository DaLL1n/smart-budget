# Передача контекста (feature-developer -> feature-tester & browser-ui-tester)

## Что сделано:
- Выполнена тотальная очистка кодовой базы от мертвого кода и неиспользуемых файлов в изолированной ветке `chore/cleanup-dead-code`:
  1. Удален неиспользуемый отладочный компонент `src/features/error-fallback/ui/BuggyComponent.tsx`.
  2. Удален устаревший сервис очереди email-приглашений `src/shared/api/mailService.ts`.
  3. Удален дублирующий неактуальный лок-файл `bun.lock`.
  4. Подчищены мертвые экспорты в `src/features/error-fallback/index.ts` и `src/shared/api/index.ts`.
- Проведена полная проверка типов TypeScript (`npm run lint` / `tsc --noEmit`) — 0 ошибок.
- Проверена сборка продакшен-бандла (`npm run build` / `vite build`) — сборка завершилась успешно за 10.25s.
- Проведены регрессионные юнит-тесты (`familyService.test.ts` 5/5 PASS, `errorBoundary.test.ts` 2/2 PASS).

## Точки интеграции:
- Слой `features/error-fallback`: модуль `ErrorFallbackCard` и `QueryErrorBoundary` продолжают стабильно обслуживать перехват ошибок на уровне виджетов и роутов.
- Слой `shared/api`: модуль чисто экспортирует активные клиенты `firebase`, `supabase`, `axiosInstance`.
- Локальный сервер Vite: работает в обычном режиме на порту 3000.

## Критерии успеха для тестирования:
- `feature-tester`: запуск и прогон юнит-тестов бизнес-логики без ошибок импорта.
- `browser-ui-tester`: открытие приложения в браузере (http://localhost:3000), проверка дашборда, экрана семьи и аналитики на отсутствие ошибок в консоли и визуальных артефактов.
