import * as React from 'react';
import * as S from "@ds-stories/app/src/components/FeeBulkSelectionBar/FeeBulkSelectionBar.stories";

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

// OWNED preview. FeeBulkSelectionBar is `fixed inset-x-0` with NO vertical
// anchor, so it resolves to its STATIC position. Stories that render only
// the bar therefore land at the very top of the card cell and get clipped
// (validate reported [RENDER_BLANK]). Spacer gives the bar somewhere to sit;
// nothing about the component or its args is changed.
const Spacer = (Story: any) => () => React.createElement(
  'div',
  { style: { position: 'relative', minHeight: 160, paddingTop: 96 } },
  React.createElement(Story),
);

// Hidden is skipped via cfg.overrides (it renders nothing by design — the bar
// only appears once members are selected), so no cell is emitted for it.
export const OneSelected = /* One Selected */ Spacer(compose(S, "OneSelected"));
export const TwoSelected = /* Two Selected */ Spacer(compose(S, "TwoSelected"));
export const ManySelected = /* Many Selected */ Spacer(compose(S, "ManySelected"));
export const Interactive = /* Interactive */ Spacer(compose(S, "Interactive"));
export const TogglesWithoutFlashingZero = /* Toggles Without Flashing Zero */ Spacer(compose(S, "TogglesWithoutFlashingZero"));
