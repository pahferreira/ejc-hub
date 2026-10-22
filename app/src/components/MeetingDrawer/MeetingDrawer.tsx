import { Drawer } from '../Drawer/Drawer'
import { Button } from '../Button/Button'
import { Input } from '../Input/Input'
import { TextArea } from '../TextArea/TextArea'
import { SearchInput } from '../SearchInput/SearchInput'
import { FiTrash2 } from 'react-icons/fi'
import { MeetingAttendeeRow } from '../MeetingAttendeeRow/MeetingAttendeeRow'
import { DeleteMeetingModal } from '../DeleteMeetingModal/DeleteMeetingModal'
import type { MeetingRosterPerson } from './meetingForm'
import type { useMeetingForm } from './useMeetingForm'

type MeetingDrawerProps = ReturnType<typeof useMeetingForm> & {
  teamName: string
}

function RosterGroup(props: {
  title: string
  members: MeetingRosterPerson[]
  drawer: MeetingDrawerProps
}) {
  if (props.members.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-dark-brown">
        {props.title} · {props.members.length}
      </h3>
      {props.members.map((member) => (
        <MeetingAttendeeRow
          key={member.userId}
          userId={member.userId}
          name={member.name}
          nickname={member.nickname}
          pictureUrl={member.pictureUrl}
          isCoordinator={member.type === 'coordinator'}
          status={props.drawer.statusOf(member.userId)}
          reason={props.drawer.reasonOf(member.userId)}
          reasonError={props.drawer.errors.reasons[member.userId]}
          onPresentChange={(present) => props.drawer.setPresent(member.userId, present)}
          onJustify={() => props.drawer.justify(member.userId)}
          onClearJustification={() => props.drawer.clearJustification(member.userId)}
          onReasonChange={(reason) => props.drawer.setReason(member.userId, reason)}
        />
      ))}
    </div>
  )
}

/**
 * The meeting drawer: "Registrar reunião" for a new meeting, "Editar reunião"
 * for an existing one. Edit mode lists the meeting's own rows, so removed
 * members show under their own heading, and adds the delete action.
 */
export function MeetingDrawer(props: MeetingDrawerProps) {
  const { present, absent, justified } = props.tally
  const hasVisibleRows =
    props.groups.coordinators.length + props.groups.members.length + props.groups.removed.length > 0

  const footer = (
    <div className="flex w-full flex-col gap-3">
      <p className="m-0 text-center text-xs text-dark-brown/70">
        {present} {present === 1 ? 'presente' : 'presentes'} · {absent}{' '}
        {absent === 1 ? 'ausente' : 'ausentes'} · {justified}{' '}
        {justified === 1 ? 'justificada' : 'justificadas'}
      </p>
      <div className="grid w-full grid-cols-2 gap-3">
        <Button variant="secondary" onClick={props.close}>
          Cancelar
        </Button>
        <Button onClick={props.save} disabled={props.isSaving || props.isDeleting}>
          {props.isEditing ? 'Salvar alterações' : 'Salvar reunião'}
        </Button>
      </div>
      {props.isEditing && (
        <Button
          variant="destructive"
          onClick={props.requestDelete}
          disabled={props.isSaving || props.isDeleting}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <FiTrash2 aria-hidden />
            Excluir reunião
          </span>
        </Button>
      )}
    </div>
  )

  return (
    <Drawer
      open={props.isOpen}
      onClose={props.close}
      title={`${props.isEditing ? 'EDITAR REUNIÃO' : 'REGISTRAR REUNIÃO'} — ${props.teamName}`}
      subtitle={
        props.isEditing
          ? 'Corrija quem esteve presente. A lista é a de quem estava na equipe nesta reunião.'
          : 'Marque quem esteve presente. Quem não for marcado fica como ausente.'
      }
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        <Input
          label="Data da reunião"
          name="heldOn"
          type="date"
          isRequired
          max={props.today}
          value={props.form.heldOn}
          onChange={props.setHeldOn}
          error={props.errors.heldOn}
        />
        <Input
          label="Título (opcional)"
          name="title"
          placeholder="Ex.: Ensaio geral"
          value={props.form.title}
          onChange={props.setTitle}
        />
        <TextArea
          label="Descrição (opcional)"
          name="description"
          rows={3}
          value={props.form.description}
          onChange={props.setDescription}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold text-dark-brown">Quem esteve presente?</h3>
            <span className="text-xs text-dark-brown/60">
              {present} de {props.totalCount}
            </span>
          </div>

          <div className="grid md:flex w-full items-center gap-3">
            <SearchInput
              placeholder="Buscar por nome ou apelido..."
              value={props.search}
              onChange={props.setSearch}
              fullWidth
            />
            <Button variant="secondary" onClick={props.toggleAll} disabled={!hasVisibleRows}>
              {props.allVisiblePresent ? 'Desmarcar todos' : 'Marcar todos'}
            </Button>
          </div>

          <RosterGroup title="Coordenadores" members={props.groups.coordinators} drawer={props} />
          <RosterGroup title="Membros" members={props.groups.members} drawer={props} />
          <RosterGroup
            title="Não estão mais na equipe"
            members={props.groups.removed}
            drawer={props}
          />

          {!hasVisibleRows && (
            <p className="py-6 text-center text-sm text-dark-brown/50">
              Ninguém encontrado com essa busca.
            </p>
          )}
        </div>
      </div>

      {/* Inside the drawer's dialog, so headless UI nests the two and closing the
          confirmation leaves the drawer open. */}
      <DeleteMeetingModal
        open={props.isConfirmingDelete}
        meetingLabel={props.meetingLabel}
        onClose={props.cancelDelete}
        onConfirm={props.confirmDelete}
        isDeleting={props.isDeleting}
      />
    </Drawer>
  )
}
