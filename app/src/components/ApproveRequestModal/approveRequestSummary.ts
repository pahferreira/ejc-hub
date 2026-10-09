/**
 * The approve button's label, which changes when the approval also closes
 * rival requests.
 *
 * Reads **encerrar**, not *negar* — plan decision D8. Approving one request
 * writes the others as `outdated`, which the coordinator's own page reports as
 * "Sem efeito"; calling it a denial here would give one event two vocabularies
 * and invite support threads that open with "you said you denied it". The deny
 * modal keeps every `negar`, because that one is a real denial.
 *
 * A deliberate departure from the signed-off screens, which say
 * `Aprovar e negar N`. Do not restore the mock's wording.
 */
export function approveButtonLabel(supersededCount: number): string {
  if (supersededCount <= 0) {
    return 'Aprovar'
  }

  return `Aprovar e encerrar ${supersededCount}`
}
