import { IsString, Matches } from 'class-validator';

export class SetPhoneDto {
  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'Phone must be in format +7XXXXXXXXXX',
  })
  phone: string;
}
