import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';

export class MailerConfig implements MailerOptionsFactory {
  createMailerOptions(): Promise<MailerOptions> | MailerOptions {
    return {
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        auth: {
          user: process.env.MAIL_AUTH_USER,
          pass: process.env.MAIL_AUTH_PASSWORD,
        },
      },
    };
  }
}
