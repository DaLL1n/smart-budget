---
name: prompt-optimizer
description: Оптимизирует сырой запрос пользователя в спецификацию TASK_SPEC.md под модель Gemini 3.8 Flash и среду Google Antigravity на основе встроенных источников.
triggers:
  - "перед началом работы"
  - "новая задача"
---

# Goal
Проанализировать входящий запрос, обратиться к справочным файлам в каталоге `references/`, переработать ТЗ по 4-компонентному фреймворку Google (Persona, Task, Context, Format) и сохранить результат в `.agent/tasks/TASK_SPEC.md` с пустыми чекбоксами `[ ]` в блоке DoD.

# Prerequisites & Knowledge Sources
Перед генерацией спецификации обязательно прочитать:
1. `.agent/skills/prompt-optimizer/references/gemini_3_8_flash_rules.md`
2. `.agent/skills/prompt-optimizer/references/antigravity_prompting.md`
3. `.agent/skills/prompt-optimizer/templates/task_spec_template.md`

# Execution Workflow
1. **Загрузка контекста источников:** Вызвать инструмент чтения для файлов из папки `references/` и шаблона из `templates/`.
2. **Анализ сырого промпта:** Извлечь суть задачи, целевые сущности, стек и ограничения.
3. **Калибровка под Gemini 3.8 Flash:**
   - Выставить `thinking_level = "medium"` (или "high").
   - Исключить любые упоминания LaTeX (записывать сложность как O(1), O(N)).
   - Разделить секции двойным переносом `\n\n`.
4. **Формирование артефакта:** Сгенерировать спецификацию строго по 4 разделам шаблона и сохранить в `.agent/tasks/TASK_SPEC.md`.
5. **Эстафета (Handoff):** Зафиксировать завершение оптимизации и уведомить агента `feature-developer`.

# Few-Shot Calibration
[Привести 1 эталонный пример преобразования сырого запроса в готовый TASK_SPEC.md]