## Project Overview

The Vite React app that supports EJC Hub - A event management application for managing events, teams, subscriptions, and users.

## Tech Stack

- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Storybook:** For component documentation
- **Testing:** Vitest
- **Linting:** ESLint with Prettier
- **Authentication:** Auth0
- **Service:** React Query + Axios

## Code Conventions

### File Naming

- Components: `ComponentName/ComponentName.tsx`
- Stories: `ComponentName/ComponentName.stories.tsx`
- Hooks: `useHookName.ts` or `useHookName/useHookName.ts`
- Pages: `PageName.tsx`

### React Patterns

- Use functional components with hooks.
- Create Storybook stories for all reusable components.
- Use custom hooks for reusable logic.
- Keep components small and focused.
- Do not destructure props in the function signature, use `props.propName` instead. Unless it needs a default value.
- Do not destructure optional props in the function signature of type `boolean` since `false | undefined | null` will have the same behavior in these cases.
- Handling Forms with React:
  - Create a custom hook to encapsulate form handling. The file name for it must be `use<Form Intention>Form.ts`, for example `useSubscriptionForm.ts`.
  - Any form libraries installed in the app must be used inside the _custom hook only_.
  - If the form has more than 2 sections, split each session in it own component and file.
    - When that happens, create a React Context with the Provider at the Form Parent Component, the children components must interact with the form via custom hook.

## Testing

- Vitest for component and hook tests.
- Write stories for visual component testing.
