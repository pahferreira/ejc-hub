export type RequestReasonProps = {
  /** The coordinator's `message`; null or blank shows the fallback. */
  text: string | null
}

/**
 * The coordinator's reason for asking, shown in full wherever someone has to
 * act on or review the request.
 *
 * `whitespace-pre-line` keeps the line breaks the coordinator typed, and
 * `break-words` stops one unbroken string from stretching a modal or a card.
 * No clamp: the admin must read the whole reason at the moment of decision.
 */
export function RequestReason(props: RequestReasonProps) {
  const text = props.text?.trim()

  return (
    <div className="rounded-lg border border-tertiary px-4 py-3 w-full">
      <span className="text-xs font-semibold tracking-wide text-dark-brown uppercase">
        Motivo da Solicitação
      </span>
      <p className="m-0 mt-1 text-sm text-text-primary italic whitespace-pre-line wrap-break-word">
        {text || 'Nenhum motivo informado.'}
      </p>
    </div>
  )
}
