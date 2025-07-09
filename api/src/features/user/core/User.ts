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
}
