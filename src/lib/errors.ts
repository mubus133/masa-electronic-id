export class DomainError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DomainError";
    this.status = status;
  }
}

export function isUniqueViolation(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    if ((error as { code?: string }).code === "23505") return true;
  }
  return error instanceof Error && /duplicate key|unique constraint/i.test(error.message);
}

export function publicError(error: unknown) {
  if (error instanceof DomainError) return error.message;
  console.error(error);
  return "Something went wrong. Please try again.";
}
