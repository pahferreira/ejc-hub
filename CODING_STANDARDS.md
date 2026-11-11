# Coding standards

The rules a review checks a change against. ESLint already enforces `prefer-const`, `type` over `interface`, and, in the app, props read off `props` and form libraries kept in form hooks. Those rules live in each package's ESLint config, not here.

## All packages

- **Types:** `type` for every type definition. `interface` only for a port a class implements (the modules' repositories, `Observability`) and for declaration merging into a library's types.
- **Async:** `async`/`await` over `.then()` chains. The exception is a promise handed to the app's `toastPromise`, which awaits it itself: build it with `.then()` (the day delete in `SchedulePlanningPage` is the reference).
- **Per-operation types:** every operation has its own named input and result type (`CreateScheduleDayResult`, `DeleteScheduleDayResult`, `UpdateScheduleActivityInput`), even when two share a shape. That is the convention, not duplication.
- **Permissions:** check one with `hasPermission()`, several with `hasAnyPermission()`. Permission types live in `common/permissions` and are shared by the API and the app.
- **Lists of people:** render and return people sorted by nickname, then full name, then user id (`pt-BR`, accent-insensitive). The API sorts with `comparePeopleByNickname` from `api/src/shared/compare-people-by-nickname.ts` after resolving the nickname with `resolveNickname`; the file explains why and names the one exception. The app renders people in the order the API sends; a client-side sort (a sortable Pessoa column) matches that order, with `app/src/components/MembersAttendanceTable/membersAttendanceSort.ts` as the reference.

## API

- **Layers:** follow `api/docs/architecture.md`, "Modules vs Features". Anything that maps to a database table is a module, whatever the number of features that use it.
- **Endpoints:** follow the `create-endpoint` skill (`.claude/skills/create-endpoint.md`): Zod (`zod/v4`) schemas in `<feature>.schema.ts`, routes in `<feature>.routes.ts` behind `authGuard` with the route's permission, and `fastifyErrorHandler` around the handler.
- **Business rules:** in the feature's core class (`core/<Feature>.ts`) or a helper it calls (`helpers/`), thrown as `AppError` with an `AppErrorCode`. Schemas check only the shape.
- **Transactions:** a core method may read and run its checks before `runInTransaction`; the transaction makes the writes all-or-nothing. A race between the read and the write is the database constraints' job (unique, FK). A race no constraint catches is accepted and named in a comment (`Accepted race: …`).
- **Tests:** the core's rules in `core/<Feature>.spec.ts`; a route's permissions and error mapping (403, 404, …) in `http/<feature>.routes.spec.ts`. A helper in `helpers/` gets its own `.spec.ts` only for behaviour the class's spec can't reach (the re-throw path in `schedule/helpers/day-date-unique.ts` is the reference). Helper specs that predate this rule stay.

## App

- **Components:** `ComponentName/ComponentName.tsx` with `ComponentName/ComponentName.stories.tsx`. Every reusable component has a story. Keep components small; move reusable logic into custom hooks (`useHookName.ts` or `useHookName/useHookName.ts`).
- **Props:** destructure in the signature only to give a prop a default value, and never for an optional `boolean` prop: `false`, `undefined` and `null` already behave the same.
- **Forms:** a custom hook named `use<Form Intention>Form.ts` (e.g. `useSubscriptionForm.ts`) owns the form, its values, validation and submit. A form with more than two sections splits each section into its own component and file, sharing the form through a React Context whose Provider sits in the form's parent component; the sections reach the form through the custom hook.
- **API calls:** one `use<Action><Thing>Mutation.ts` / `use<Thing>Query.ts` per API call under `src/services/<area>/`. Mutations invalidate the area's query keys on success. Hooks sharing that shape is the convention.
- **Tests:** Vitest for pure helpers and hooks; stories with `play` functions for component behaviour.

## Common

- **One function per file:** `<functionName>.ts`, named after the function it exports.
- **Event-clock maths:** anything that reads or builds São Paulo dates and times lives in `common/schedule/`, even with one caller.
- **Tests:** at least one positive and one negative case per function. The `<functionName>.spec.ts` next to every `<functionName>.ts` is checked by `common/spec-siblings.spec.ts`.
