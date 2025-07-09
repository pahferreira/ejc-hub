import type { UserInput, UserModel } from '../../../core/database/schemas/index.ts'

export interface UserRepository {
  getUser: (authId: string) => Promise<UserModel>
  createUser: (input: UserInput) => Promise<UserModel>
  // updateUser: () => Promise<unknown>
}
