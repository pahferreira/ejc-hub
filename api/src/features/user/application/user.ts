import { User } from '../core/User.ts'
import { userRepository } from '../../../modules/user/repository/DrizzleUserRepository.ts'
import { circleRepository } from '../../../modules/circle/repository/DrizzleCircleRepository.ts'

export const userApp = new User(userRepository, circleRepository)
