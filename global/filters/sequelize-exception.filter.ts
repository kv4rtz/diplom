// src/filters/sequelize-exception.filter.ts
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  BaseError,
  EmptyResultError,
  ForeignKeyConstraintError,
  QueryError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import { ErrorCause } from 'src/errors-couse';

@Catch(BaseError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    switch (exception.constructor) {
      case EmptyResultError:
        throw new NotFoundException(ErrorCause.NOT_FOUND);
      case ValidationError:
        const messages = exception.errors.map((err) => err.message);
        throw new BadRequestException(messages);
      case ForeignKeyConstraintError:
        throw new BadRequestException(ErrorCause.FOREIGN_KEY_CONSTRAINT_FAILED);
      case UniqueConstraintError:
        throw new ConflictException(ErrorCause.ALREADY_EXISTS);
      case QueryError:
        throw new BadRequestException(ErrorCause.DATABASE_QUERY_ERROR);
      default:
        console.log(exception);

        throw new BadRequestException(ErrorCause.DATABASE_ERROR);
    }
  }
}
