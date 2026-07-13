import type { UserInput, UserModel } from '../../../core/database/schemas/index.ts'

export type ListUsersOptions = {
  limit?: number
  offset?: number
}

export interface UserRepository {
  getUser: (authId: string) => Promise<UserModel>
  createUser: (input: UserInput) => Promise<UserModel>
  updateUser: (id: string, input: Partial<UserInput>) => Promise<UserModel>
  listUsers: (options: ListUsersOptions) => Promise<UserModel[]>
}
