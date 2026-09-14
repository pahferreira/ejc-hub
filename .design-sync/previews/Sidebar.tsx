import * as React from 'react';
import { useNavigate } from 'app';
import { ROUTE_PATHS } from '@ds-stories/app/src/constants/routePaths';
import * as S from "@ds-stories/app/src/components/Sidebar/Sidebar.stories";

function compose(S: any, key: string) {
  const meta: any = S.default ?? {};
  const st: any = S[key];
  const args: any = { ...(meta.args ?? {}), ...(st && st.args ? st.args : {}) };
  // Storybook resolves argTypes.mapping (control value -> real arg) before
  // rendering; mirror that so mapped args don't render raw.
  const at: any = { ...(meta.argTypes ?? {}), ...(st && st.argTypes ? st.argTypes : {}) };
  for (const k of Object.keys(args)) {
    const m = at[k] && at[k].mapping;
    if (m && typeof m === 'object' && args[k] in m) args[k] = m[args[k]];
  }
  const title: string = typeof meta.title === 'string' ? meta.title : '';
  const ctx: any = {
    args, name: key, title, kind: title, id: '', componentId: '',
    globals: {}, viewMode: 'story',
    parameters: (st && st.parameters) ?? meta.parameters ?? {},
  };
  let render: (() => any) | null = null;
  if (st && typeof st.render === 'function') render = () => st.render(args, ctx);
  else if (typeof st === 'function') render = () => st(args, ctx);
  else if (typeof meta.render === 'function') render = () => meta.render(args, ctx);
  else {
    const C = (st && st.component) || meta.component;
    if (C) render = () => React.createElement(C, args);
  }
  if (!render) return () => null;
  // [].concat: a single function is legal CSF decorator shorthand. A
  // decorator returning undefined (stubbed addon) falls through to the inner
  // render — otherwise one unrecognized addon blanks the cell silently.
  const decorators: any[] = ([] as any[]).concat((st && st.decorators) ?? []).concat(meta.decorators ?? []);
  return decorators.reduce((inner: any, dec: any) => () => {
    const out = dec(inner, ctx);
    return out === undefined ? inner() : out;
  }, render);
}

// OWNED preview. The two NestedRoute stories declare their location through
// storybook-addon-remix-react-router (reactRouterParameters). That addon is
// stubbed for previews (see .design-sync/overrides/story-imports.mjs), so the
// location never reaches the component and the active nav item loses its
// bg-tertiary highlight — which is the entire point of both stories.
// AtRoute restores exactly the location each story declares, using the same
// ROUTE_PATHS constants the story imports. It NAVIGATES the provider's
// MemoryRouter instead of nesting a second one — React Router v7 throws
// "You cannot render a <Router> inside another <Router>".
const AtRoute = (path: string, Story: any) => () => {
  const navigate = useNavigate();
  React.useEffect(() => { navigate(path, { replace: true }); }, [navigate]);
  return React.createElement(Story);
};

export const Expanded = /* Expanded */ compose(S, "Expanded");
export const Collapsed = /* Collapsed */ compose(S, "Collapsed");
export const WithoutPicture = /* Without Picture */ compose(S, "WithoutPicture");
export const SingleGroup = /* Single Group */ compose(S, "SingleGroup");
export const NestedRouteHighlightsOnlyTheLeaf = /* Nested Route Highlights Only The Leaf */ AtRoute(ROUTE_PATHS.EVENT_FEE_MEMBERS, compose(S, "NestedRouteHighlightsOnlyTheLeaf"));
export const NestedRouteWithoutOwnEntryHighlightsAncestor = /* Nested Route Without Own Entry Highlights Ancestor */ AtRoute('/teams/liturgia', compose(S, "NestedRouteWithoutOwnEntryHighlightsAncestor"));
