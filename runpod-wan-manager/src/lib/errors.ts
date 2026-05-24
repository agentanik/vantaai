export class AppError extends Error {
  public readonly status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class BudgetExceededError extends AppError {
  constructor(message: string) {
    super(message, 402); // Payment Required
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(message, 503);
  }
}

export class ComfyUIError extends AppError {
  constructor(message: string) {
    super(message, 502);
  }
}

export class RunPodError extends AppError {
  constructor(message: string, status: number = 502) {
    super(message, status);
  }
}

export class JobNotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}
