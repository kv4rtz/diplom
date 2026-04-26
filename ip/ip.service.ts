// src/transactions/ip-check.service.ts
import { Injectable } from '@nestjs/common';
import { type Request } from 'express';
import { Address4, Address6 } from 'ip-address';

@Injectable()
export class IpService {
  private readonly YOOKASSA_IPS = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11',
    '77.75.156.35',
    '77.75.154.128/25',
    '2a02:5180::/32',
  ];

  isYookassaIp(ip: string): boolean {
    try {
      // Проверяем каждый доверенный IP/CIDR
      for (const trustedIp of this.YOOKASSA_IPS) {
        if (this.isIpInRange(ip, trustedIp)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking IP:', error);
      return false;
    }
  }

  getIpFromRequest(req: Request): string {
    const headers = req.headers as { 'x-real-ip': string };

    return headers['x-real-ip'] || req.ip!;
  }

  private isIpInRange(ip: string, range: string): boolean {
    try {
      // Если range - конкретный IP
      if (!range.includes('/')) {
        return ip === range;
      }

      // Для IPv4
      if (ip.includes('.')) {
        if (!Address4.isValid(ip) || !Address4.isValid(range)) {
          return false;
        }

        const ipAddr = new Address4(ip);
        const rangeAddr = new Address4(range);
        return ipAddr.isInSubnet(rangeAddr);
      }

      // Для IPv6
      if (ip.includes(':')) {
        if (!Address6.isValid(ip) || !Address6.isValid(range)) {
          return false;
        }

        const ipAddr = new Address6(ip);
        const rangeAddr = new Address6(range);
        return ipAddr.isInSubnet(rangeAddr);
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
