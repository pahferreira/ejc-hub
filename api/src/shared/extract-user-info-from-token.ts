import { decodeJwt } from 'jose'

type UserInfo = {
  email: string
  name: string
  picture: string
  permissions?: string[]
}

export function extractUserInformationFromToken(token: string) {
  const user = decodeJwt<UserInfo>(token)

  return {
    authId: user.sub as string,
    email: user.email,
    name: user.name,
    picture: user.picture,
    permissions: user.permissions ?? [],
  }
}
