import { BadRequestException, ValidationError } from '@nestjs/common';
import { ErrorCause } from 'src/errors-couse';

export const exceptionFactory = (errors: ValidationError[]) => {
  const extractAllErrorMessages = (validationErrors: any[]): string[] => {
    const messages: string[] = [];

    const traverseErrors = (errorNodes: any[]) => {
      for (const error of errorNodes) {
        // Если есть constraints, добавляем их сообщения
        if (error.constraints) {
          messages.push(...Object.values(error.constraints as string));
        }

        // Рекурсивно обходим детей, если они есть
        if (error.children && error.children.length > 0) {
          traverseErrors(error.children);
        }
      }
    };

    traverseErrors(validationErrors);
    return messages;
  };

  const exception = new BadRequestException({
    statusCode: 400,
    message: extractAllErrorMessages(errors),
    error: ErrorCause.VALIDATION_ERROR,
  });

  return exception;
};
