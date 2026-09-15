/**
 * Renders integer cents as pt-BR currency.
 *
 * Cents in, never a float: every money column in the schema is an integer so
 * that node-postgres cannot hand back a numeric as a string, and dividing here —
 * at the one point the number becomes text — keeps the rounding out of the rest
 * of the app.
 *
 * The currency comes from the event rather than a constant, so an event priced
 * in anything other than BRL still renders its own symbol.
 */
export function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amountCents / 100)
}
