import { Badge } from '../../../../components/Badge/Badge'
import { SectionTitle } from '../../../../components/SectionTitle/SectionTitle'
import {
  availability,
  circleOptions,
  experienceOptions,
  getOptionLabel,
  skills,
} from '../../profileOptions'
import { useEventSubscriptionForm } from '../../useEventSubscriptionForm'
import { ReviewField } from './ReviewField'

type ProfileReviewProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function ProfileReview(props: ProfileReviewProps) {
  const form = useEventSubscriptionForm()
  const values = form.watch()

  const isNewbie = values.experienceType === 'newbie'
  const hasServed = !isNewbie && Boolean(values.experienceType)

  const experienceLabel = getOptionLabel(values.experienceType, experienceOptions)
  const circleLabel = values.circle ? getOptionLabel(values.circle, circleOptions) : null
  const experienceFullLabel =
    isNewbie && circleLabel ? `${experienceLabel} - Círculo ${circleLabel}` : experienceLabel

  const skillLabels = (values.selectedSkills ?? []).map((value) => getOptionLabel(value, skills))
  const availabilityLabels = values.selectedAvailability.map((value) =>
    getOptionLabel(value, availability)
  )
  const previousTeamLabels = (values.selectedPreviousExperienceTeams ?? []).map(
    (key) => props.teamOptions.find((team) => team.key === key)?.name ?? key
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionTitle title="Perfil" />
        <ReviewField label="Experiência" value={experienceFullLabel} />
        {hasServed && (
          <ReviewField
            label="Experiência como coordenador/líder"
            value={values.hasCoordinatorExperience ? 'Sim' : 'Não'}
          />
        )}
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">Habilidades</p>
          {skillLabels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillLabels.map((label) => (
                <Badge key={label}>{label}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-base font-medium text-gray-900">—</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">Disponibilidade</p>
          <div className="flex flex-wrap gap-2">
            {availabilityLabels.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
          </div>
        </div>
      </div>

      {hasServed && (
        <div className="flex flex-col gap-4">
          <SectionTitle title="Experiência em Equipes" />
          {previousTeamLabels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {previousTeamLabels.map((label) => (
                <Badge key={label}>{label}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-base font-medium text-gray-900">Nenhuma equipe selecionada</p>
          )}
        </div>
      )}
    </div>
  )
}
