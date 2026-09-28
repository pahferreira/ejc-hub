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
  subscriptions_closed: 'As inscrições para o evento foram encerradas, aguarde.',
  member_already_assigned: 'Este membro já foi alocado em outra equipe.',
}
