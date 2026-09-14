// Preview provider surface for design-sync.
//
// Stories get a router from storybook-addon-remix-react-router, which is
// stubbed for previews (see .design-sync/overrides/story-imports.mjs), so
// cfg.provider wraps every preview in MemoryRouter instead.
//
// useNavigate is exported for owned previews that need a story rendered at a
// SPECIFIC location (Sidebar's NestedRoute stories). React Router v7 throws
// "You cannot render a <Router> inside another <Router>", so those previews
// navigate the provider's router rather than nesting a second one.
export { MemoryRouter, useNavigate } from 'react-router'
