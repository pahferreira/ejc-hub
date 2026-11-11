import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import type { MemberRequestRow } from '../../../modules/member-request/domain/MemberRequestRepository.ts'
import type { RequestActor, RequestPerson } from '../domain/member-request.types.ts'

export function toPerson(person: MemberRequestRow['user']): RequestPerson {
  return {
    userId: person.userId,
    name: person.name,
    nickname: resolveNickname(person.name, person.nickname),
    pictureUrl: person.pictureUrl,
    experienceType: person.experienceType,
    circleKey: person.circleKey,
  }
}

export function toActor(actor: { name: string; nickname: string | null }): RequestActor {
  return { name: actor.name, nickname: resolveNickname(actor.name, actor.nickname) }
}
