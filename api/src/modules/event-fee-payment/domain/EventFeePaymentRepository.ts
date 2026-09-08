export interface EventFeePaymentRepository {
  /**
   * Fee standing per team for one event.
   *
   * Driven from team instances rather than memberships so a team with nobody
   * assigned still reports a row (total 0) instead of vanishing from the
   * dashboard.
   *
   * `paid` folds `exempt` in with `paid`: a comped member owes nothing, so from
   * the coordination view they are settled. The distinction stays intact in the
   * column itself — this rollup is presentation, not storage.
   */
  aggregateFeeStatusByTeam: (eventId: string) => Promise<
    {
      teamId: string
      teamKey: string
      teamName: string
      total: number
      paid: number
    }[]
  >
}
