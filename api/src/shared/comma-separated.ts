import { z } from 'zod/v4'

/**
 * A multi-value filter arriving as one `a,b` query parameter.
 *
 * Every multi-value control above a table in this app is a checkbox group, so
 * the wire format is shared rather than re-spelled per field. Blank segments
 * are dropped, which is what a cleared control sending `experience=` means.
 *
 * An already-split array is passed through untouched, so a client that repeats
 * the parameter instead (`teamKeys=a&teamKeys=b`) still parses — hand-rolled
 * versions of this preprocess silently dropped that shape and took a
 * multi-select filter with them.
 */
export const commaSeparated = <Schema extends z.ZodTypeAny>(itemSchema: Schema) =>
  z.preprocess((value) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    }

    return value
  }, z.array(itemSchema).optional())
