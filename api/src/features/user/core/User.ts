import type {
  ListUsersOptions,
  UserRepository,
} from '../../../modules/user/domain/UserRepository.ts'
import type { CircleRepository } from '../../../modules/circle/domain/CircleRepository.ts'
import type { UserInput } from '../../../core/database/schemas/index.ts'
import { experienceType } from '../../../core/database/schemas/users.ts'
import { AppError } from '../../../shared/AppError.ts'

type ExperienceType = (typeof experienceType.enumValues)[number]

type SyncUserInput = {
  authId: string
  name: string
  email: string
  picture: string
}

type UpdateUserInput = {
  name?: string
  phone?: string
  nickname?: string
  dateOfBirth?: string
  hasMusicSkills?: boolean
  hasActingSkills?: boolean
  hasDancingSkills?: boolean
  hasSingingSkills?: boolean
  hasManualSkills?: boolean
  hasCookingSkills?: boolean
  hasCommunicationSkills?: boolean
  hasGuitarSkills?: boolean
  hasPercussionSkills?: boolean
  hasMidiaSkills?: boolean
}

type UpdateUserByIdInput = UpdateUserInput & {
  circleKey?: string
  experienceType?: ExperienceType
}

export class User {
  #userRepository: UserRepository
  #circleRepository: CircleRepository

  constructor(userRepo: UserRepository, circleRepo: CircleRepository) {
    this.#userRepository = userRepo
    this.#circleRepository = circleRepo
  }

  async syncProfile(input: SyncUserInput) {
    const existing = await this.#userRepository.getUser(input.authId)

    if (!existing) {
      return this.#userRepository.createUser({
        authId: input.authId,
        name: input.name,
        email: input.email,
        pictureUrl: input.picture || null,
      })
    }

    const diff: Partial<UserInput> = {}
    if (existing.email !== input.email) diff.email = input.email
    // For database-connection signups Auth0 sets the token's name claim to the
    // email, and users provide their real name in the app (e.g. subscription
    // form). Only take the token's name while ours is still that placeholder,
    // so login syncs never clobber a user-provided name.
    if (existing.name !== input.name && existing.name === existing.email) diff.name = input.name
    const nextPicture = input.picture || null
    if (existing.pictureUrl !== nextPicture) diff.pictureUrl = nextPicture

    if (Object.keys(diff).length === 0) return existing

    return this.#userRepository.updateUser(existing.id, diff)
  }

  async listUsers(options: ListUsersOptions) {
    return this.#userRepository.listUsers(options)
  }

  async updateUserById(id: string, { circleKey, ...input }: UpdateUserByIdInput) {
    // An unknown circle key is ignored rather than rejected, leaving the
    // user's current circle untouched.
    const circle = circleKey ? await this.#circleRepository.getCircleByKey(circleKey) : undefined

    const updatedUser = await this.#userRepository.updateUser(id, {
      ...input,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      circleId: circle?.id,
    })

    if (!updatedUser) {
      throw new AppError('user not found')
    }

    return updatedUser
  }

  async updateProfile(authId: string, input: UpdateUserInput) {
    const userToUpdate = await this.#userRepository.getUser(authId)

    if (!userToUpdate) {
      throw new AppError('user not found')
    }

    const updatedUser = await this.#userRepository.updateUser(userToUpdate.id, {
      ...input,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
    })

    return updatedUser
  }
}
