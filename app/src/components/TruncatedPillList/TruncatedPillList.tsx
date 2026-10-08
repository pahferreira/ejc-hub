import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Pill } from '../Pill/Pill'

export type TruncatedPillListProps = {
  /**
   * The labels to render, in order. Each label doubles as its own React key, so
   * the list is expected to be deduplicated by whoever builds it — which is
   * already true of the skill labels this was written for.
   */
  items: string[]
  /** How many pills show inline before the rest fold into the popover. */
  maxVisible?: number
  /**
   * Plural noun for the overflow trigger's accessible label ("mais 5
   * habilidades"). The visible "+5" is meaningless read on its own, so this is
   * the only thing that tells a screen reader what is being counted.
   */
  itemNoun?: string
  /** What stands in for an empty list. */
  emptyLabel?: string
}

const DEFAULT_MAX_VISIBLE = 4
const DEFAULT_ITEM_NOUN = 'itens'
const DEFAULT_EMPTY_LABEL = '—'

/**
 * A row of `Pill`s capped at `maxVisible`, with the remainder behind a "+N"
 * button that opens a popover.
 *
 * Written for the "Habilidades" column of `RequestMembersTable`, where a
 * candidate with nine skills wrapped the row onto three lines. Unlike
 * `TeamPreferenceAvatars` — which caps at three and drops the rest into a
 * `title` tooltip — the hidden labels here are full words that have to stay
 * readable, so they get a real popover instead.
 *
 * The panel is positioned with Headless UI's `anchor` rather than
 * `absolute`-in-flow (the pattern `TableActionCell` and `Selector` use) for one
 * specific reason: this renders inside two nested clipping contexts —
 * `RequestMembersTable`'s `overflow-hidden` section and `Table`'s
 * `overflow-x-auto` wrapper — either of which would cut an in-flow panel off.
 * Passing `anchor` forces Headless UI to portal the panel out to the document,
 * which escapes both.
 */
export function TruncatedPillList(props: TruncatedPillListProps) {
  const maxVisible = props.maxVisible ?? DEFAULT_MAX_VISIBLE
  const itemNoun = props.itemNoun ?? DEFAULT_ITEM_NOUN
  const emptyLabel = props.emptyLabel ?? DEFAULT_EMPTY_LABEL

  if (props.items.length === 0) {
    return <span className="text-dark-brown/40">{emptyLabel}</span>
  }

  const visible = props.items.slice(0, maxVisible)
  const hidden = props.items.slice(maxVisible)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((item) => (
        <Pill key={item}>{item}</Pill>
      ))}

      {hidden.length > 0 && (
        <Popover as="span" className="inline-flex">
          <PopoverButton
            aria-label={`mais ${hidden.length} ${itemNoun}`}
            className="button-shadow inline-flex h-6 items-center rounded-lg border-2 border-dark-brown bg-secondary px-1.5 text-xs font-semibold text-dark-brown hover:cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-brown"
          >
            +{hidden.length}
          </PopoverButton>
          <PopoverPanel
            transition
            anchor={{ to: 'top end', gap: 8 }}
            className="z-20 flex max-w-64 flex-wrap gap-1 rounded-lg border border-primary bg-white p-2 shadow-lg transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {hidden.map((item) => (
              <Pill key={item}>{item}</Pill>
            ))}
          </PopoverPanel>
        </Popover>
      )}
    </div>
  )
}
