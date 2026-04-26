import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { WithdrawalRublesMethods } from 'src/graphql';

export class WithdrawalRublesDto {
  @IsEnum(WithdrawalRublesMethods)
  type: WithdrawalRublesMethods;

  @IsNumber()
  amount: number;

  @ValidateIf((o) => o.type === WithdrawalRublesMethods.bank_card)
  @IsString()
  cardNumber?: string;

  @ValidateIf((o) => o.type === WithdrawalRublesMethods.sbp)
  @IsString()
  bankId?: string;

  @ValidateIf((o) => o.type === WithdrawalRublesMethods.sbp)
  @IsString()
  phone?: string;

  @ValidateIf((o) => o.type === WithdrawalRublesMethods.yoo_money)
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  isInstant?: boolean;
}
