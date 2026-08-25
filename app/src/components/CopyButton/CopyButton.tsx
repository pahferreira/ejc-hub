import { useState } from 'react'
import { FiCheck, FiCopy } from 'react-icons/fi'

export type CopyButtonProps = {
  /** Text written to the clipboard when clicked. */
  value: string
  /** Accessible label / tooltip. Defaults to "Copiar". */
  ariaLabel?: string
  /** Icon size in pixels. Defaults to 12 to sit inline with small text. */
  size?: number
}

/** Inline icon button that copies a value and briefly shows a check as feedback. */
export function CopyButton(props: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const label = props.ariaLabel ?? 'Copiar'
  const size = props.size ?? 16

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copiado' : label}
      title={copied ? 'Copiado' : label}
      className="inline-flex items-center justify-center rounded p-1 text-secondary-foreground/60 transition-colors hover:cursor-pointer hover:text-dark-brown"
    >
      {copied ? <FiCheck size={size} className="text-green" /> : <FiCopy size={size} />}
    </button>
  )
}
