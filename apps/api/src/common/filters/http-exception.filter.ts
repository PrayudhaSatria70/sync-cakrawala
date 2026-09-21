import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let fieldErrors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = exception.name;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string) || message;
        code = (obj.code as string) || exception.name;
        if (Array.isArray(obj.message)) {
          message = 'Validation failed';
          fieldErrors = { form: obj.message as string[] };
        }
        if (obj.fieldErrors) {
          fieldErrors = obj.fieldErrors as Record<string, string[]>;
        }
      }
    }

    response.status(status).json({
      code,
      message,
      fieldErrors,
      requestId: request.requestId,
    });
  }
}
