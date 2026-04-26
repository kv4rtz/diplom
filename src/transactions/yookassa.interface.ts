import { WithdrawalRublesMethods } from 'src/graphql';

export interface YookassaNotification {
  event: string;
  object: {
    status: string;
    payment_id: string;
    paid: boolean;
    amount: {
      value: string;
      currency: string;
    };
    income_amount: {
      value: string;
      currency: string;
    };
    metadata: {
      financeId: string;
      enteredAmount: number;
      userId: number;
      buyProductId?: number;
      userPayedAmount: number;
      reservedOrderId?: string;
    };
  };
}

export interface YooKassaPayoutDestinationData {
  type: WithdrawalRublesMethods;
  card?: { number?: string };
  bank_id?: string;
  phone?: string;
  account_number?: string;
}
