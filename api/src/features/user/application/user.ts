import { User } from '../core/User.ts'
import { userRepository } from '../../../modules/user/repository/DrizzleUserRepository.ts'

export const userApp = new User(userRepository)
