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

function buildRepository() {
  return {
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    listUsers: vi.fn(),
  } as unknown as UserRepository
}

describe('User.syncProfile', () => {
  let userRepository: UserRepository
  let user: User

  beforeEach(() => {
    userRepository = buildRepository()
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

describe('User.listUsers', () => {
  let userRepository: UserRepository
  let user: User

  beforeEach(() => {
    userRepository = buildRepository()
    user = new User(userRepository)
  })

  it('returns the users page from the repository', async () => {
    const users = [buildExisting()]
    vi.mocked(userRepository.listUsers).mockResolvedValue(users as never)

    const result = await user.listUsers({ limit: 20, offset: 0 })

    expect(userRepository.listUsers).toHaveBeenCalledWith({ limit: 20, offset: 0 })
    expect(result).toEqual(users)
  })

  it('returns all users when no pagination options are given', async () => {
    const users = [buildExisting(), buildExisting({ name: 'Maria da Silva' })]
    vi.mocked(userRepository.listUsers).mockResolvedValue(users as never)

    const result = await user.listUsers({})

    expect(userRepository.listUsers).toHaveBeenCalledWith({})
    expect(result).toEqual(users)
  })

  it('returns an empty list when there are no users in the page', async () => {
    vi.mocked(userRepository.listUsers).mockResolvedValue([] as never)

    const result = await user.listUsers({ limit: 20, offset: 100 })

    expect(result).toEqual([])
  })
})

describe('User.updateUserById', () => {
  let userRepository: UserRepository
  let user: User

  beforeEach(() => {
    userRepository = buildRepository()
    user = new User(userRepository)
  })

  it('updates the user by id and converts dateOfBirth to a Date', async () => {
    const updated = buildExisting({ name: 'Maria da Silva' })
    vi.mocked(userRepository.updateUser).mockResolvedValue(updated as never)

    const result = await user.updateUserById(USER_ID, {
      nickname: 'Mari',
      dateOfBirth: '1990-05-01',
    })

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ nickname: 'Mari', dateOfBirth: new Date('1990-05-01') })
    )
    expect(result).toEqual(updated)
  })

  it('throws when the user does not exist', async () => {
    vi.mocked(userRepository.updateUser).mockResolvedValue(undefined as never)

    await expect(user.updateUserById('missing-id', { nickname: 'Mari' })).rejects.toThrow(
      'user not found'
    )
  })
})
