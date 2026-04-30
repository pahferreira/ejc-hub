import { Button } from '../Button/Button'

type WizardFooterProps = {
  isFirst: boolean
  isLast: boolean
  isNavigating: boolean
  isSubmitting: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

export function WizardFooter(props: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <div>
        {!props.isFirst && (
          <Button variant="secondary" onClick={props.onBack} disabled={props.isNavigating}>
            ← Voltar
          </Button>
        )}
      </div>
      <div>
        {!props.isLast && (
          <Button onClick={props.onNext} disabled={props.isNavigating}>
            Próximo →
          </Button>
        )}
        {props.isLast && (
          <Button onClick={props.onSubmit} disabled={props.isSubmitting || props.isNavigating}>
            {props.isSubmitting ? 'Aguarde...' : 'Inscrever-se'}
          </Button>
        )}
      </div>
    </div>
  )
}
