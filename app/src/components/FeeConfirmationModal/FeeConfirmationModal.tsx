import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'
import { pluralize } from '../../utils/pluralize/pluralize'

export type FeeConfirmationModalProps = {
  open: boolean
  /**
   * Who is about to be marked as paid, in the order they will be sent. Naming
   * them is the point of the dialog: "confirmar 12 taxas" is not something
   * anyone can check before clicking.
   */
  memberNames: string[]
  onClose: () => void
  onConfirm: () => void
  /** Disables both buttons while the write is in flight. */
  isConfirming?: boolean
}

/**
 * Last stop before a fee is marked paid.
 *
 * Guards an action that is easy to trigger by accident — a stray click on a
 * table row, or a bulk bar still holding a selection from before the filters
 * changed — and that a coordinator cannot undo from this screen.
 */
export function FeeConfirmationModal(props: FeeConfirmationModalProps) {
  const count = props.memberNames.length
  const isSingle = count === 1

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={pluralize(count, 'Confirmar pagamento', 'Confirmar pagamentos')}
    >
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-dark-brown">
          {isSingle ? (
            <>
              Confirmar o pagamento da taxa de inscrição de{' '}
              <strong className="font-semibold">{props.memberNames[0]}</strong>?
            </>
          ) : (
            <>
              Confirmar o pagamento da taxa de inscrição de{' '}
              <strong className="font-semibold">
                {count} {pluralize(count, 'membro', 'membros')}
              </strong>
              ?
            </>
          )}
        </p>

        {/* Listed for a bulk confirmation only: repeating the single name the
            sentence just used would be noise. Scrolls rather than growing the
            dialog past the viewport on a large selection. */}
        {!isSingle && (
          <ul className="m-0 max-h-48 list-disc overflow-y-auto rounded-lg border border-tertiary bg-tertiary/30 py-3 pl-8 pr-4 text-sm text-dark-brown">
            {/* Keyed with the index too: two members can genuinely share a name,
                and the list is static for the life of the dialog. */}
            {props.memberNames.map((name, index) => (
              <li key={`${name}-${index}`}>{name}</li>
            ))}
          </ul>
        )}

        <p className="m-0 text-xs text-secondary-foreground">
          Esta ação registra o pagamento e não pode ser desfeita nesta tela.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={props.onClose} disabled={props.isConfirming}>
            Cancelar
          </Button>
          <Button onClick={props.onConfirm} disabled={props.isConfirming}>
            {props.isConfirming ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
