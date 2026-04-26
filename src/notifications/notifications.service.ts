import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { configDotenv } from 'dotenv';
import { UserCodeType } from 'src/graphql';
import { KafkaService } from 'src/kafka/kafka.service';
import { fromCallMemberPayload } from './replacers/call-member';
import { fromNotificationEmailCodePayload } from './replacers/notification-email-code';
import { getCallMemberHtml } from './templates/call-member';
import { getChangePasswordHtml } from './templates/change-password';
import { getResetPasswordHtml } from './templates/reset-password';
import { getVerficationCodeHtml } from './templates/verification-code';

configDotenv({ quiet: true });

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly mailerService: MailerService,
    private readonly kafkaService: KafkaService,
  ) {}

  private readonly LINK_RESET_PASSWORD = process.env.LINK_RESET_PASSWORD || '';

  onModuleInit() {
    this.kafkaService.subscribe(
      'notifications.call.member',
      async ({ message }) => {
        if (!message.value) return;

        const data = fromCallMemberPayload(message.value.toString());

        await this.sendCallMember(data.email, data.nickname, data.chatId);
      },
    );

    this.kafkaService.subscribe(
      'notifications.email.code',
      async ({ message }) => {
        if (!message.value) return;

        const data = fromNotificationEmailCodePayload(message.value.toString());

        switch (data.type) {
          case UserCodeType.CONFIRM_EMAIL:
            await this.sendVerificationEmail(data.email, data.code);
            return;

          case UserCodeType.RESET_PASS:
            const link = new URL(this.LINK_RESET_PASSWORD);
            const searchParams = new URLSearchParams({
              code: data.code,
              email: data.email,
            });
            link.search = searchParams.toString();
            await this.sendVerficationPasswordEmail(
              data.email,
              link.toString(),
            );
            return;

          case UserCodeType.CHANGE_PASS:
            await this.sendChangePasswordEmail(data.email, data.code);
            return;

          default:
            return;
        }
      },
    );
  }

  private async sendVerificationEmail(email: string, code: string) {
    await this.mailerService.sendMail({
      from: process.env.MAIL_AUTH_USER,
      to: email,
      subject: 'Verification your email address',
      html: getVerficationCodeHtml(code),
    });
  }

  private async sendVerficationPasswordEmail(email: string, link: string) {
    await this.mailerService.sendMail({
      from: process.env.MAIL_AUTH_USER,
      to: email,
      subject: 'Reset password',
      html: getResetPasswordHtml(link),
    });
  }

  private async sendChangePasswordEmail(email: string, code: string) {
    await this.mailerService.sendMail({
      from: process.env.MAIL_AUTH_USER,
      to: email,
      subject: 'Change password',
      html: getChangePasswordHtml(code),
    });
  }

  private async sendCallMember(
    email: string,
    nickname: string,
    chatId: number,
  ) {
    await this.mailerService.sendMail({
      from: process.env.MAIL_AUTH_USER,
      to: email,
      subject: 'Вас позвали в чат',
      html: getCallMemberHtml(
        nickname,
        `${process.env.LINK_CHAT_WITH_ID}${chatId}`,
      ),
    });
  }
}
