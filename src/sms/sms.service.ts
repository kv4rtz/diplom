import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly apiEndpointSendSms = 'https://api3.greensms.ru/sms/send';

  constructor(private configService: ConfigService) {}

  async sendSms(phone: string, message: string) {
    try {
      const query = await axios.post(
        this.apiEndpointSendSms + `?phone=${phone}&message=${message}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('GREENSMS_TOKEN')}`,
          },
        },
      );
    } catch (e: any) {
      if (e.isAxiosError) {
        console.log(e.response.data);
      }
    }
  }
}
