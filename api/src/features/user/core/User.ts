import type { UserRepository } from '../domain/UserRepository.ts'
import { AppError } from '../../../shared/AppError.ts'

type CreateUserInput = {
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

  async createUser(input: CreateUserInput) {
    const user = await this.#userRepository.getUser(input.authId)

    if (user) {
      return user
    }

    const createdUser = await this.#userRepository.createUser({
      authId: input.authId,
      name: input.name,
      email: input.email,
    })

    return createdUser
  }

  async updateUser(authId: string, input: UpdateUserInput) {
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
