import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type { UserInput } from '../../../core/database/schemas/index.ts'
import { AppError } from '../../../shared/AppError.ts'

type SyncUserInput = {
  authId: string
  name: string
  email: string
  picture: string
}

type UpdateUserInput = {
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
}

export class User {
  #userRepository: UserRepository

  constructor(userRepo: UserRepository) {
    this.#userRepository = userRepo
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
    if (existing.name !== input.name) diff.name = input.name
    const nextPicture = input.picture || null
    if (existing.pictureUrl !== nextPicture) diff.pictureUrl = nextPicture

    if (Object.keys(diff).length === 0) return existing

    return this.#userRepository.updateUser(existing.id, diff)
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
