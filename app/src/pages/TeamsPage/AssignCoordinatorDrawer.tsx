import { Drawer } from '../../components/Drawer/Drawer'
import { CoordinatorSlots } from '../../components/CoordinatorSlots/CoordinatorSlots'
import { CoordinatorCandidateRow } from '../../components/CoordinatorCandidateRow/CoordinatorCandidateRow'
import { TeamPreferenceFilter } from '../../components/TeamPreferenceFilter/TeamPreferenceFilter'
import { FilterCheck } from '../../components/FilterCheck/FilterCheck'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { Button } from '../../components/Button/Button'
import { experienceFilterOptions } from '../TeamBuildingPage/experience'
import type { useAssignCoordinatorDrawer } from './useAssignCoordinatorDrawer'

type AssignCoordinatorDrawerProps = ReturnType<typeof useAssignCoordinatorDrawer>

export function AssignCoordinatorDrawer(props: AssignCoordinatorDrawerProps) {
  const teamName = props.target?.name ?? ''

  const footer = (
    <div className="w-full grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={props.close}>
        Cancelar
      </Button>
      <Button onClick={props.save} disabled={!props.canSave || props.isSaving}>
        {!props.canSave ? 'Selecione ao menos um' : `Salvar coordenação (${props.slotsUsed})`}
      </Button>
    </div>
  )

  return (
    <Drawer
      open={props.isOpen}
      onClose={props.close}
      title={`DEFINIR COORDENAÇÃO${teamName ? ` — ${teamName}` : ''}`}
      subtitle="Até 3 coordenadores por equipe"
      footer={footer}
    >
      {props.isLoading && (
        <div className="flex items-center justify-center py-12 text-sm text-dark-brown/60">
          Carregando candidatos...
        </div>
      )}

      {props.error && (
        <div className="rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
          Erro ao carregar candidatos. Tente novamente.
        </div>
      )}

      {!props.isLoading && !props.error && (
        <div className="flex flex-col gap-5">
          {/* Slots indicator — full-bleed panel under the header */}
          <div className="-mx-6 -mt-4 border-b border-gray-200 bg-secondary/20 px-6 py-4">
            <CoordinatorSlots selected={props.selectedCoordinators} onRemove={props.toggle} />
          </div>

          {/* Search */}
          <SearchInput
            placeholder="Buscar por nome..."
            value={props.search}
            onChange={props.setSearch}
          />

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <FilterCheck
              label="Exp."
              options={experienceFilterOptions}
              value={props.experienceFilter}
              onChange={props.setExperienceFilter}
              ariaLabel="Filtrar por experiência"
            />
          </div>

          {/* Result count */}
          <div className="w-full flex items-center justify-between">
            <TeamPreferenceFilter
              teamName={teamName}
              value={props.preferenceScope}
              onChange={props.setPreferenceScope}
            />
            <span className="text-xs text-dark-brown/60">
              {props.resultCount} {props.resultCount === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>

          {/* Candidate list */}
          <div className="flex flex-col gap-2">
            {props.filteredCandidates.map((candidate) => (
              <CoordinatorCandidateRow
                key={candidate.userId}
                name={candidate.name}
                nickname={candidate.nickname}
                experienceType={candidate.experienceType}
                areas={candidate.areas}
                teams={candidate.preferences}
                preferredThisTeam={
                  props.target !== null && candidate.preferenceTeamIds.includes(props.target.id)
                }
                selected={props.selectedIds.includes(candidate.userId)}
                disabled={props.isDisabled(candidate.userId)}
                onToggle={() => props.toggle(candidate.userId)}
              />
            ))}

            {props.filteredCandidates.length === 0 && (
              <p className="py-6 text-center text-sm text-dark-brown/50">
                Nenhum candidato encontrado com os filtros atuais.
              </p>
            )}
          </div>
        </div>
      )}
    </Drawer>
  )
}
