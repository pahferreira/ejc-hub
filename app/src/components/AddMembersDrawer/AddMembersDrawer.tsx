import clsx from 'clsx'
import { FiCheck } from 'react-icons/fi'
import { Drawer } from '../Drawer/Drawer'
import { CoordinatorCandidateRow } from '../CoordinatorCandidateRow/CoordinatorCandidateRow'
import { TeamPreferenceFilter } from '../TeamPreferenceFilter/TeamPreferenceFilter'
import { FilterCheck } from '../FilterCheck/FilterCheck'
import { SearchInput } from '../SearchInput/SearchInput'
import { Button } from '../Button/Button'
import { experienceFilterOptions } from '../../pages/TeamBuildingPage/experience'
import type { useAddMembersDrawer } from './useAddMembersDrawer'

type AddMembersDrawerProps = ReturnType<typeof useAddMembersDrawer>

export function AddMembersDrawer(props: AddMembersDrawerProps) {
  const teamName = props.target?.name ?? ''
  const memberCount = props.target?.memberCount ?? 0
  const maxCapacity = props.target?.maxCapacity ?? 0
  const remaining = Math.max(0, maxCapacity - memberCount)

  const footer = (
    <div className="w-full grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={props.close}>
        Cancelar
      </Button>
      <Button onClick={props.save} disabled={!props.canSave || props.isSaving}>
        {!props.canSave ? '+ Selecione ao menos um' : `+ Adicionar ${props.selectedCount} à equipe`}
      </Button>
    </div>
  )

  return (
    <Drawer
      open={props.isOpen}
      onClose={props.close}
      title={`ADICIONAR MEMBROS${teamName ? ` — ${teamName}` : ''}`}
      subtitle={`${memberCount} de ${maxCapacity} membros atribuídos · ${remaining} vagas`}
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
          {/* Search */}
          <SearchInput
            placeholder="Buscar por nome..."
            value={props.search}
            onChange={props.setSearch}
            fullWidth
          />

          {/* Experience filter */}
          <div className="flex flex-wrap gap-2">
            <FilterCheck
              label="Exp."
              options={experienceFilterOptions}
              value={props.experienceFilter}
              onChange={props.setExperienceFilter}
              ariaLabel="Filtrar por experiência"
            />
          </div>

          {/* Preference toggle + selected-only toggle + result count */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <TeamPreferenceFilter
                teamName={teamName}
                value={props.preferenceScope}
                onChange={props.setPreferenceScope}
              />
              <button
                type="button"
                onClick={props.toggleViewSelectedOnly}
                disabled={props.selectedCount === 0}
                aria-pressed={props.viewSelectedOnly}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  props.selectedCount === 0
                    ? 'cursor-not-allowed border-tertiary bg-white text-dark-brown/40'
                    : props.viewSelectedOnly
                      ? 'cursor-pointer border-dark-brown bg-dark-brown text-white'
                      : 'cursor-pointer border-tertiary bg-white text-dark-brown hover:bg-secondary/50'
                )}
              >
                <FiCheck aria-hidden="true" className="h-3 w-3 shrink-0" />
                Selecionados {props.selectedCount}
              </button>
            </div>
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
                pictureUrl={candidate.pictureUrl}
                experienceType={candidate.experienceType}
                circleKey={candidate.circleKey}
                areas={candidate.areas}
                details={candidate.details}
                weekAvailability={candidate.weekAvailability}
                hideCoordinatorExperience
                teams={candidate.preferences}
                preferredThisTeam={
                  props.target !== null && candidate.preferenceTeamIds.includes(props.target.id)
                }
                selected={props.selectedIds.includes(candidate.userId)}
                disabled={false}
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
