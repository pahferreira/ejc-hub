import { z } from 'zod/v4'
import type { UserRepository } from '../domain/UserRepository.ts'
import { AppError } from '../../../shared/AppError.ts'

const createUserInputSchema = z.object({
  authId: z.string('authId is required'),
  name: z.string('name is required').nonempty('name must not be empty'),
  email: z.email('email is required'),
  picture: z.string(),
})
type CreateUserInputSchema = z.infer<typeof createUserInputSchema>

const updateUserInputSchema = z.object({
  phone: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  hasMusicSkills: z.boolean().optional(),
  hasActingSkills: z.boolean().optional(),
  hasDancingSkills: z.boolean().optional(),
  hasSingingSkills: z.boolean().optional(),
  hasManualSkills: z.boolean().optional(),
  hasCookingSkills: z.boolean().optional(),
  hasCommunicationSkills: z.boolean().optional(),
})

type UpdateUserInputSchema = z.infer<typeof updateUserInputSchema>

export class User {
  #userRepository: UserRepository

  constructor(userRepo: UserRepository) {
    this.#userRepository = userRepo
  }

  async createUser(input: CreateUserInputSchema) {
    const validatedInput = createUserInputSchema.safeParse(input)

    if (!validatedInput.success) {
      throw new AppError(validatedInput.error.message)
    }

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

  async updateUser(authId: string, input: UpdateUserInputSchema) {
    const validateInput = updateUserInputSchema.safeParse(input)

    if (!validateInput.success) {
      throw new AppError(validateInput.error.message)
    }

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
