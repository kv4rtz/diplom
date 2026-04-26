import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Currency, Locale } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { User } from 'src/users/models/users.model';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CtxCurrency } from './ctx-currency.decorator';
import { CtxLocale } from './ctx-locale.decorator';
import { CtxUser } from './ctx-user.decorator';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthLoginDto } from './dto/o-auth-login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterAccountDto } from './dto/register-account.dto';

@Resolver('Auth')
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query()
  @UseGuards(AuthGuard)
  viewer(@CtxUser() user: User) {
    return user;
  }

  @Mutation()
  async registerAccount(
    @Args() registerAccountDto: RegisterAccountDto,
    @CtxLocale() locale: Locale,
    @CtxCurrency() currency: Currency,
  ) {
    return await this.authService.registerAccount(
      registerAccountDto.email,
      registerAccountDto.password,
      locale,
      currency,
    );
  }

  @Mutation()
  async verifyTwoFactor(
    @Args('tempTokenForTwoFactor') tempTokenForTwoFactor: string,
    @Args('code') code: string,
  ) {
    return await this.authService.verifyTwoFactor(tempTokenForTwoFactor, code);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async generateTwoFactor(
    @Args('password') password: string,
    @CtxUser() user: User,
  ) {
    return await this.authService.generateTwoFactor(user, password);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async enableTwoFactor(@CtxUser() user: User, @Args('code') code: string) {
    return {
      backupCodes: await this.authService.enableTwoFactor(user.id, code),
    };
  }

  @Mutation()
  async loginOAuth(
    @Args() oAuthLoginDto: OAuthLoginDto,
    @CtxLocale() locale: Locale,
    @CtxCurrency() currency: Currency,
  ) {
    return await this.authService.oAuthLogin(
      oAuthLoginDto.provider,
      oAuthLoginDto.code,
      oAuthLoginDto.deviceId,
      oAuthLoginDto.originalPKCE,
      locale,
      currency,
    );
  }

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('admin-panel.access')
  async checkAdminAccess() {
    return true;
  }

  @Mutation()
  confirmAccount(@Args() confirmAccountDto: ConfirmAccountDto) {
    return this.authService.confirmAccount(confirmAccountDto);
  }

  @Mutation()
  login(@Args() loginDto: LoginDto) {
    return this.authService.login(loginDto.login, loginDto.password);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async logout(@CtxUser() user: User, @Args() refreshDto: RefreshDto) {
    return !!(await this.authService.logout(user.id, refreshDto.refreshToken));
  }

  @Mutation()
  async refresh(@Args() refreshDto: RefreshDto) {
    return await this.authService.refresh(refreshDto.refreshToken);
  }
}
