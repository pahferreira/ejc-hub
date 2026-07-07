import { describe, it, expect, vi, beforeEach } from 'vitest'

import { User } from './User.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'

const AUTH_ID = 'auth0|user-1'
const USER_ID = 'user-1'
const EMAIL = 'maria@example.com'

function buildExisting(overrides: Partial<{ name: string; email: string }> = {}) {
  return {
    id: USER_ID,
    authId: AUTH_ID,
    email: EMAIL,
    name: EMAIL,
    pictureUrl: null,
    ...overrides,
  }
}

describe('User.syncProfile', () => {
  let userRepository: UserRepository
  let user: User

  beforeEach(() => {
    userRepository = {
      getUser: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
    } as unknown as UserRepository

    user = new User(userRepository)
  })

  it('takes the token name while the stored name is still the email placeholder', async () => {
    vi.mocked(userRepository.getUser).mockResolvedValue(buildExisting() as never)

    await user.syncProfile({ authId: AUTH_ID, name: 'Maria da Silva', email: EMAIL, picture: '' })

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ name: 'Maria da Silva' })
    )
  })

  it('does not overwrite a user-provided name with the token name on login', async () => {
    vi.mocked(userRepository.getUser).mockResolvedValue(
      buildExisting({ name: 'Maria da Silva' }) as never
    )

    const result = await user.syncProfile({
      authId: AUTH_ID,
      name: EMAIL,
      email: EMAIL,
      picture: '',
    })

    expect(userRepository.updateUser).not.toHaveBeenCalled()
    expect(result).toEqual(buildExisting({ name: 'Maria da Silva' }))
  })
})
