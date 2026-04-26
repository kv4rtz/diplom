import { Field } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterAccountDto {
  @Field()
  @IsEmail()
  @IsString()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}
