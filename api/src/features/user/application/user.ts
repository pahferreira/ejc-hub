import { User } from '../core/User.ts'
import { userRepository } from '../repository/DrizzleUserRepository.ts'

export const userApp = new User(userRepository)
