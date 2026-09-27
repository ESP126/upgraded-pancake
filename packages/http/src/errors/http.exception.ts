export class HttpException extends Error {
  constructor(
    private readonly response: string | Record<string, unknown>,
    public readonly statusCode: number,
  ) {
    super(typeof response === 'string' ? response : String(response.message ?? 'Http Exception'));

    this.name = this.constructor.name;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  getResponse(): Record<string, unknown> {
    if (typeof this.response === 'string') {
      return {
        statusCode: this.statusCode,
        message: this.response,
        error: this.name.replace(/Exception$/, ''),
      };
    }

    return {
      statusCode: this.statusCode,
      ...this.response,
    };
  }
}
