# ARCHITECTURE_RULES

## Mandatory Pre-Work

All coding agents (Codex, Claude, or any automated contributor) **must read this file before making any code change**.

---

## 1) State Management and Data Flow

- Use `Context + Provider` patterns to avoid prop-drilling.
- Do not pass shared state through multiple component levels unless it is strictly local UI state.
- Each domain should expose a provider and a typed access hook when needed.
- Keep business logic out of presentational components.

---

## 2) Models and Domain Design

- Define explicit, typed models for domain entities.
- Keep model definitions centralized and reusable.
- Avoid ad-hoc object shapes spread across components.
- Validate incoming external data (API/local storage/imported JSON) before using it in views.

---

## 3) Manager Classes + Provider Access

- Use manager classes to encapsulate domain operations/state transitions.
- Managers should be instantiated and exposed through providers.
- Components must consume managers/state through provider APIs, not through direct global singletons.
- Keep side effects and orchestration inside managers/providers, not in UI leaf components.

---

## 4) Styling Rules (Tailwind + Global Theme)

- Use **Tailwind CSS** for component styling (`className` utilities in components).
- Define theme tokens/variables in `global.css`.
- Global CSS should be minimal and design-token oriented (colors, spacing tokens, typography scales, etc.).
- Do not replace Tailwind utility usage with large component-level custom CSS unless there is a strong reason.

---

## 5) Folder Structure (Required)

Use this project structure as the default organization:

```txt
src/
  providers/      # App/domain providers and context wiring
  components/     # Reusable global components
  views/          # Route/page-level screens
  layouts/        # Shared layout shells used by views
  hooks/          # Reusable custom hooks
  lib/            # Core logic: models, managers, utils, services, constants
    models/
    utils/
  lang/           # i18n resources (translations, dictionaries)
  styles/         # Global styles (including global.css/theme definitions)
```

Notes:
- `components/` is for shared/global UI blocks, not route-specific page composition.
- `views/` should focus on screen composition and orchestration.
- `layouts/` should hold reusable structures shared between multiple views.

---

## 6) i18n Rules

- Store translation resources in `lang/`.
- Avoid hardcoded user-facing strings in reusable components when i18n is expected.
- Keep translation keys consistent and domain-oriented.

---

## 7) Implementation Discipline

- Prefer clear boundaries: UI layer, provider layer, domain logic layer.
- Prefer small, composable modules over monolithic files.
- Keep APIs typed and explicit.
- New features must follow these rules unless an exception is documented in the PR/implementation notes.
