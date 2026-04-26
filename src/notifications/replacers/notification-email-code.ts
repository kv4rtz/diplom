import { UserCodeType } from 'src/graphql';

export type NotificationEmailCodePayload = {
  email: string;
  code: string;
  type: UserCodeType;
};

export const toNotificationEmailCodePayload = (
  payload: NotificationEmailCodePayload,
) => {
  return JSON.stringify(payload);
};

export const fromNotificationEmailCodePayload = (message: string) => {
  const payload = JSON.parse(message);

  if (!payload.email || !payload.code || !payload.type) {
    throw new Error('Invalid payload');
  }

  return payload as NotificationEmailCodePayload;
};
