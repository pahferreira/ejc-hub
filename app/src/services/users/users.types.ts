export type SyncedUser = {
  id: string
  authId: string
  email: string
  name: string
  phone: string | null
  nickname: string | null
  pictureUrl: string | null
  dateOfBirth: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  hasActingSkills: boolean
  hasCommunicationSkills: boolean
  hasCookingSkills: boolean
  hasDancingSkills: boolean
  hasManualSkills: boolean
  hasMusicSkills: boolean
  hasSingingSkills: boolean
  experienceType: 'newbie' | 'experienced' | 'coordinator'
  createdAt: string
  updatedAt: string
}
