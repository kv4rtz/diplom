export type CallMemberPayload = {
  email: string;
  nickname: string;
  chatId: number;
};

export const toCallMemberPayload = (payload: CallMemberPayload) => {
  return JSON.stringify(payload);
};

export const fromCallMemberPayload = (message: string) => {
  const payload = JSON.parse(message);

  if (!payload.email || !payload.nickname || !payload.chatId) {
    throw new Error('Invalid payload');
  }

  return payload as CallMemberPayload;
};
