export type ApiError = {
  response: {
    data: {
      message: string
      code?: string
    }
  }
}

export const errorMessage: { [key: string]: string } = {
  user_already_subscribed: 'Você já se inscreveu para este evento.',
}
