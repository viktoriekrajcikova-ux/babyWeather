# Architecture decisions

Short records of the notable technical decisions in this project — the *why*
behind them, not just the *what*. Each entry follows a lightweight
**Context → Decision → Trade-offs** format.

---

## 1. TanStack Query for server state

**Context.** The app has two kinds of server state: weather (read-only, keyed
by location) and children (read + optimistic delete/add). The first version
hand-rolled this with `useState` + `useEffect` + manual `loading`/`error` flags,
and an optimistic delete implemented by hand (remove from state, reload on
failure).

**Decision.** Adopt **TanStack Query v5** and move both `useWeather` and
`useChildren` onto `useQuery` / `useMutation`.

**Trade-offs.**
- The weather query key `['weather', lat, lon]` is derived from the selected
  coordinates, so changing the location refetches and caches for free — the
  location feature and the data layer meet at the query key.
- The delete becomes a canonical optimistic update: `onMutate` cancels
  in-flight queries, snapshots the cache and writes the optimistic value;
  `onError` rolls back to the snapshot; `onSettled` invalidates. This replaces a
  fragile hand-rolled snapshot-and-reload.
- Less boilerplate — `useWeather` went from ~31 lines to ~15, with no manual
  cancellation flag.
- One more dependency and a learning curve. For an app this small it is
  arguably more than strictly needed — it was chosen deliberately to use the
  industry-standard tool and to be able to contrast a hand-rolled vs a
  library-backed optimistic update.

---

## 2. SCSS Modules over Tailwind

**Context.** The UI is component-based and needs a styling approach that scales
past a handful of components without class-name collisions.

**Decision.** **SCSS Modules** — a global `main.scss`, shared `_variables.scss`,
and a co-located `*.module.scss` per component — with **stylelint** enforcing
consistency.

**Trade-offs.**
- Class names are locally scoped, so components can't accidentally style each
  other.
- Markup stays readable (semantic class names) instead of long utility
  strings in the JSX.
- Variables and nesting are familiar and keep the design tokens in one place.
- More files and no utility-first prototyping speed. Tailwind would be quicker
  to throw together but clutters the markup and adds build config; for a
  component-per-file structure, CSS Modules keep style and structure separate.

---

## 3. Union types + parsing at the boundary

**Context.** The database `sex` column is nullable text, so a row can technically
contain any string. The UI, however, only understands `male` / `female`.

**Decision.** Model the domain as a **union type** `type Sex = 'male' | 'female'`
(not a TypeScript `enum`), and **narrow the raw DB rows at the boundary** with
`toSex` / `toChild` — *parse, don't validate*. Anything unexpected (e.g.
`'nesmysl'`) becomes `null` once, at the edge.

**Trade-offs.**
- Union types are idiomatic TS, have zero runtime cost, and work directly with
  string literals — no enum import ceremony at every use site.
- Parsing at the boundary means the rest of the app can trust the `Child`
  type; invalid data can't leak inward.
- An `enum` would give a named namespace and iteration, which this app doesn't
  need.

---

## 4. Tests mock at the network boundary

**Context.** Every test has to decide *where* to place its mocks, and that choice
determines what the test actually proves.

**Decision.** Pure logic (`clothesDeterminer`, `temperature`) is tested with no
mocks at all. Hooks and screens are tested by mocking **only the API clients**
(the network boundary), letting the real hooks, query cache and domain logic
run.

**Trade-offs.**
- Maximizes the amount of real code each test exercises.
- Catches wiring bugs a unit test can't — e.g. the `Home` integration test
  fails if the Kelvin→°C conversion is removed, because the wrong clothing
  advice reaches the screen.
- Tests query by what the user sees (text/role), so they survive refactors of
  the internals.
- More setup (providers, client mocks) and slightly slower than mocking the
  hooks outright.

---

## 5. Export convention: default for components, named for the rest

**Context.** The codebase started with a mix of default and named exports.

**Decision.** **Components and screens use a default export; hooks, model, API
clients and context use named exports.**

**Trade-offs.**
- Consistent within each category, so imports are predictable.
- Named exports give better rename-refactoring, autocomplete, and catch typos
  at the import site.
- Default export matches the "one component per file" convention readers expect
  for React components.
- The codebase mixes both styles — but consistently, by category, rather than
  at random.
