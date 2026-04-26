interface Valute {
  ID: string;
  NumCode: string;
  CharCode: string;
  Nominal: number;
  Name: string;
  Value: number;
  Previous: number;
}

interface Valutes {
  USD: Valute;
  EUR: Valute;
}

export interface CbrXmlDailyResponse {
  Date: string;
  PreviousDate: string;
  PreviousURL: string;
  Timestamp: string;
  Valute: Valutes;
}
