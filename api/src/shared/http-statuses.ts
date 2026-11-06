export const HttpStatus = {
  Ok: 200,
  Created: 201,

  BadRequest: 400,
  NotFound: 404,
  Conflict: 409,
  UnprocessableEntity: 422,
  Forbidden: 403,
  Unauthorized: 401,

  InternalServerError: 500,
} as const
