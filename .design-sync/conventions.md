## Building with Ponto EJC

A Portuguese-language (pt-BR) event-management design system: warm browns and
creams, serif headings, flat cards with a hard drop-shadow on buttons. Copy in
new UI should be Portuguese to match.

### Wrapping and setup

**Wrap anything that navigates in a router.** `Sidebar`, `Navbar`, `TeamCard`
and every component containing a link call React Router hooks and throw without
a router above them. `MemoryRouter` is exported from the library:

```jsx
<MemoryRouter initialEntries={['/']}>
  <App />
</MemoryRouter>
```

There is no theme provider and no dark mode — tokens are plain CSS custom
properties on `:root`, always light. Nothing else needs wrapping.

Fonts (**Inter** for body, **Playfair Display** for headings) load from Google
Fonts through an `@import` in the stylesheet. They are never bundled, so they
resolve at runtime; don't re-declare them.

### The styling idiom: Tailwind v4 utilities over semantic colour tokens

Style layout with ordinary Tailwind utilities (`flex`, `gap-3`, `rounded-md`,
`p-4`). For colour and type, use **this system's tokens** — never raw Tailwind
palette names like `bg-blue-500`, which are not part of the brand:

| Family | Real class names |
|---|---|
| Brand surfaces | `bg-primary` (deep brown), `bg-secondary` (tan), `bg-tertiary` (pale sand), `bg-tertiary-background` (cream), `bg-dark-brown` |
| Page / chrome | `bg-background` (off-white), `bg-sidebar-background`, `bg-table-highlight`, `bg-welcome-gradient` |
| Text | `text-dark-brown` (default ink), `text-white`, `text-secondary-foreground` |
| Status | `text-green` (success/paid), `text-red` (error/pending), `text-orange` (warning/waiting), `text-blue` (info/received) |
| Borders | `border-primary`, `border-secondary`, `border-tertiary` |
| Type | `font-serif` (Playfair — headings), default sans is Inter |
| Effects | `button-shadow` (the signature hard offset shadow + hover lift), `input-focus` |

**A caveat that will bite you:** the shipped stylesheet is a *compiled* Tailwind
build. Only utilities the library already uses exist in it — `bg-primary` is
there, but `text-primary-foreground`, `bg-sidebar-highlight` and `font-sans` are
**not**, even though the tokens are defined. If you need a colour with no
compiled utility, use the custom property directly:
`style={{ color: 'var(--color-primary)' }}`. Defined tokens include
`--color-primary`, `--color-secondary`, `--color-tertiary`, `--color-dark-brown`,
`--color-green`, `--color-red`, `--color-orange`, `--color-blue`,
`--color-background`, `--color-tertiary-background`, `--color-table-highlight`,
`--color-sidebar-highlight`, `--font-serif`, `--font-sans`.

`h1`–`h3` are already Playfair via base styles — a plain `<h2>` is correct; you
rarely need `font-serif` explicitly.

### Where the truth lives

- `_ds/<folder>/styles.css` and the `_ds_bundle.css` it imports — the real
  compiled CSS. Grep it before inventing a class name.
- `components/<group>/<Name>/<Name>.d.ts` — the prop contract.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage.

Components are grouped `ui/` (52 primitives and cards), `financial/` (5 fee
components) and `components/` (4 composites: Sidebar, DashboardSection,
WizardStepper, WizardFooter).

Prefer a library component over hand-rolled markup: `Button`, `Input`,
`TextArea`, `Selector`, `MultiSelector`, `Checkbox`, `RadioGroup` for forms;
`Table` (with `TableHeader`, `TableHeaderCell`, `TableBody`, `TableRow`,
`TableCell`) for data; `Card`, `StatusCard`, `StatBlock`, `SectionHeader`,
`SectionTitle` for structure; `Badge`, `Pill` for status; `Modal`, `Drawer`,
`Pagination`, `SearchInput` for interaction.

### An idiomatic example

```jsx
<MemoryRouter initialEntries={['/']}>
  <section className="bg-background min-h-screen p-6">
    <SectionHeader
      title="Membros da equipe"
      action={<Button variant="primary">+ Adicionar</Button>}
    />
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <StatusCard variant="success" title="Taxas Pagas" value={22} description="81% do total" />
      <StatusCard variant="error" title="Taxas Pendentes" value={5} description="19% do total" />
    </div>
  </section>
</MemoryRouter>
```

Check each component's `.d.ts` for exact prop names before using it — the
example above shows the idiom, not a guaranteed API.
