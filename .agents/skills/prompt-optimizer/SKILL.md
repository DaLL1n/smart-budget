name: prompt-optimizer

description: Оптимизирует входящий запрос пользователя в техническую спецификацию TASK\_SPEC.md под модель Gemini 3.8 Flash и среду Google Antigravity на основе нормативных справочников и шаблона.

triggers:

* "перед началом работы"  
* "новая задача"  
* "оптимизируй промпт"  
* "создай spec"

# **Goal**

Проанализировать входящий пользовательский запрос, последовательно считать справочные руководства из каталога references/ и шаблон из templates/, преобразовать требования по 4-компонентному фреймворку Google (Persona, Task, Context, Format) с учетом технических ограничений Gemini 3.8 Flash и артефактного процесса Antigravity, сохранить результат в .agent/tasks/TASK\_SPEC.md со строго пустыми чекбоксами \[ \] в блоке Definition of Done (DoD) и передать эстафету агенту feature-developer.

# **Prerequisites & Knowledge Sources**

Перед генерацией и обновлением спецификации обязательно вызвать инструмент чтения (read\_file / inspect) для следующих локальных файлов:

1. .agent/skills/prompt-optimizer/references/gemini\_3\_8\_flash\_rules.md — нормативные правила и ограничения модели Gemini 3.8 Flash.  
2. .agent/skills/prompt-optimizer/references/antigravity\_prompting.md — архитектура артефактов и слэш-команды Antigravity.  
3. .agent/skills/prompt-optimizer/templates/task\_spec\_template.md — эталонный параметризованный шаблон спецификации задачи.

# **Execution Workflow**

1. **Загрузка нормативного контекста:**  
   * Вызвать инструмент чтения для всех трех файлов из раздела Prerequisites & Knowledge Sources.  
   * Зафиксировать успешную загрузку во внутренних рассуждениях (блок Thought).  
2. **Анализ и декомпозиция пользовательского запроса:**  
   * Выделить ключевую проблему, целевые сущности, архитектурный слой и ограничения.  
   * Если в запросе обнаружена критическая неопределенность, зафиксировать рекомендацию запуска команды /grill-me.  
3. **Калибровка под модель Gemini 3.8 Flash:**  
   * Задать глубину рассуждений: thinking\_level \= "medium" (или "high" для сложной математики, гонок состояний и критической логики; значение "minimal" строго запрещено).  
   * Полностью исключить устаревшие параметры сэмплирования (temperature, top\_p, top\_k, candidate\_count, frequency\_penalty, presence\_penalty).  
   * Исключить любые LaTeX-теги (\\sum, \\le, \\ge, \\mathcal{O}, $, $$). Форматировать алгоритмическую сложность строго в ASCII: O(1), O(N), O(log N), а сравнения — как \<=, \>=, \!=.  
   * Разделять смысловые блоки и директивы двойным переводом строки (\\n\\n).  
4. **Формирование артефакта .agent/tasks/TASK\_SPEC.md:**  
   * В самом начале спецификации ОБЯЗАТЕЛЬНО вывести служебный верификационный блок:  
     \> Context Loaded:  
     \> \- Rulebook: references/gemini\_3\_8\_flash\_rules.md \[OK\]  
     \> \- Workflow: references/antigravity\_prompting.md \[OK\]  
     \> \- Template: templates/task\_spec\_template.md \[OK\]

   * Заполнить 4 раздела шаблона (Persona & Role, Task & Workflow, Context & Guardrails, Format & Definition of Done).  
   * **КРИТИЧЕСКИЙ СТАНДАРТ DOD:** Все пункты чек-листа приемки генерировать СТРОГО с незаполненными чекбоксами \- \[ \]. Запрещено генерировать \- \[x\].  
5. **Инициация эстафеты (Agent Handoff):**  
   * Создать или обновить манифест передачи контекста .agent/handoff.md:  
     * source\_agent: prompt-optimizer  
     * status: SUCCESS  
     * artifacts\_produced: \[".agent/tasks/TASK\_SPEC.md"\]  
     * pending\_tasks: \["Реализация логики агентом feature-developer"\]  
     * blockers\_or\_notes: \["Спецификация откалибрована под Gemini 3.8 Flash, чек-лист DoD готов к исполнению"\]  
   * Передать управление исполнителю: transfer\_to\_agent("feature-developer", ".agent/tasks/TASK\_SPEC.md").

# **Error Handling & Fallback**

* **Справочные файлы не найдены:** Если чтение файлов из папки references/ завершилось ошибкой, сформировать TASK\_SPEC.md по базовому встроенному шаблону 4-Pillar, указать в шапке \> Context Loaded: \[FALLBACK\_INTERNAL\] и зафиксировать предупреждение в .agent/handoff.md.  
* **Размытые или противоречивые требования:** Если пользовательский запрос невозможно декомпозировать на конкретные шаги, сгенерировать спецификацию с фокусом на аудит и первым шагом воркфлоу назначить запуск /grill-me для сбора недостающих требований.

# **Few-Shot Calibration**

### **Входной запрос пользователя:**

> "кастомный скроллбар не могу на пк перетаскивать при зажатие курсором"

### **Ожидаемый результат генерации (.agent/tasks/TASK\_SPEC.md):**

\> Context Loaded:  
\> \- Rulebook: references/gemini\_3\_8\_flash\_rules.md \[OK\]  
\> \- Workflow: references/antigravity\_prompting.md \[OK\]  
\> \- Template: templates/task\_spec\_template.md \[OK\]

\# TASK SPECIFICATION: Реализация Desktop Drag-and-Drop для кастомного скроллбара

\#\# 1\. PERSONA & ROLE  
\- Роль исполнителя: Senior Frontend Engineer (React 19, TypeScript, Tailwind CSS v4, Motion).  
\- Фокус: Интерактивные компоненты пользовательского интерфейса, обработка низкоуровневых событий мыши (Pointer/Mouse Events), производительность и отсутствие скачков верстки (Cumulative Layout Shift \= 0).  
\- Scope Isolation: Модифицировать исключительно логику захвата и позиционирования ползунка скроллбара; не затрагивать глобальные стили страницы и несвязанные виджеты.

\#\# 2\. TASK & WORKFLOW  
\- Цель: Восстановить возможность ручного перетаскивания (Drag-and-Drop) кастомного скроллбара мышью на десктопных устройствах при нажатии левой кнопки мыши.  
\- Режим выполнения: Local Mode (прямое точечное редактирование рабочего компонента).  
\- Слэш-команды: /browser для интерактивной проверки перетаскивания мышью во встроенном Chrome.

\#\#\# Двухфазный алгоритм исполнения:  
1\. \*\*Фаза 1: Планирование (Planning Phase)\*\*:  
   \- Найти компонент скроллбара (\`src/shared/ui/ScrollContainer.tsx\` или аналогичный).  
   \- Сформировать артефакты Task List и Implementation Plan до изменения кода.  
   \- Разметить обработчики: onMouseDown на ползунке, расчет стартовой позиции курсора startY, добавление глобальных слушателей mousemove и mouseup на объект window для удержания захвата за пределами контейнера.  
2\. \*\*Фаза 2: Реализация и Верификация (Verification Phase)\*\*:  
   \- Внедрить стейт перетаскивания (isDragging) и расчет смещения scrollTop пропорционально высоте трека.  
   \- Провести проверку типов TypeScript (\`npm run lint\` / \`tsc \--noEmit\`).  
   \- Запустить встроенный Chrome через /browser, открыть http://localhost:3000, захватить скроллбар курсором и проверить плавность прокрутки на экранах 1024px и 1440px.  
   \- Сформировать артефакты Code Diff и отчет Walkthrough & Screenshots.

\#\# 3\. CONTEXT & GUARDRAILS  
\- Стек проекта: React 19, Vite, TypeScript, Tailwind CSS v4.  
\- Конфигурация рассуждений: thinking\_level \= "medium".  
\- Запрет устаревших параметров: Исключить temperature, top\_p, top\_k, candidate\_count.  
\- ПОЛНЫЙ ЗАПРЕТ LATEX: Нотацию вычислительной сложности писать строго в ASCII: O(1) при обработке движения мыши (через requestAnimationFrame). Сравнения писать как \<=, \>=.  
\- Форматирование: Разделять логические секции двойным переносом строки (\\n\\n).

\#\# 4\. FORMAT & DEFINITION OF DONE (DOD)  
\- \[ \] Сформированы системные артефакты Task List и Implementation Plan  
\- \[ \] В компоненте контейнера скролла реализованы события mousedown, mousemove, mouseup с корректной отпиской в useEffect  
\- \[ \] Ползунок плавно перетаскивается при зажатии ЛКМ на ПК и не теряет захват при выходе за пределы блока  
\- \[ \] Проверка типов tsc \--noEmit завершается с кодом 0 (без ошибок)  
\- \[ \] Проведена проверка в браузере через /browser (отсутствует срыв скролла и скачки макета)  
\- \[ \] Сформированы артефакты Code Diff и отчет Walkthrough  
\- \[ \] Подготовлен манифест передачи контекста .agent/handoff.md со статусом SUCCESS  
