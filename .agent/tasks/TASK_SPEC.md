# TASK SPECIFICATION (Gemini 3.8 Flash Optimized)

## 1. Persona & Role
Senior Frontend Engineer (React 19, DOM Event Architecture, Pointer Events).

## 2. Task & Workflow
- Цель: Реализовать полноценное перетаскивание (drag-and-drop) ползунка кастомного скроллбара курсором мыши на ПК в компоненте `ScrollContainer`.
- Шаги реализации:
  1. Добавить `Pointer Capture` API (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`) для горизонтального и вертикального ползунков.
  2. Реализовать расчет смещения прокрутки с учетом соотношения ширины трека и ползунка без задержек (отключение `transition` во время драга).
  3. Увеличить зону захвата (hit-area) для удобного клика мышью на десктопе.
  4. Добавить визуальные состояния курсора: `cursor-grab` при наведении и `cursor-grabbing` при зажатии.
  5. Провести проверку типов `tsc --noEmit` и сборку `npm run build`.

## 3. Context & Guardrails
- Стек: React 19, TypeScript, Tailwind CSS v4.
- thinking_level = "medium".
- Без LaTeX-символов.
- Устранить любые конфликты выделения текста во время драга (`select-none`, `touch-none`).

## 4. Format & Definition of Done (DoD)
- [x] Ползунок скроллбара плавно и мгновенно перетаскивается курсором мыши при зажатии.
- [x] Работает захват указателя (`setPointerCapture`) — курсор не срывается при выходе за пределы трека.
- [x] Клик по свободному месту трека плавно перемещает ползунок и позволяет сразу продолжить перетаскивание.
- [x] `tsc --noEmit` и `npm run build` проходят без ошибок.
