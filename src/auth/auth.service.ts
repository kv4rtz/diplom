import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { ErrorCause } from 'src/errors-couse';
import { LogVariants } from 'src/global/logger/variants';
import { Currency, Locale, OAuthProvider, UserCodeType } from 'src/graphql';
import { SessionsService } from 'src/sessions/sessions.service';
import { UserCode } from 'src/users/models/users-codes.model';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { JWTTokenPayload } from './jwt.interface';
import { TwoFactor } from './models/two-factor.model';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly accessPrivateKey: string;
  private readonly accessPublicKey: string;
  private readonly refreshPrivateKey: string;
  private readonly refreshPublicKey: string;

  private readonly VK_GET_TOKEN_URL = 'https://id.vk.ru/oauth2/auth';
  private readonly VK_GET_USER_URL = 'https://id.vk.ru/oauth2/user_info';

  private readonly DISCORD_GET_TOKEN_URL =
    'https://discord.com/api/oauth2/token';
  private readonly DISCORD_GET_USER_URL = 'https://discord.com/api/oauth2/@me';

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    @InjectModel(TwoFactor)
    private readonly twoFactorRepository: typeof TwoFactor,
  ) {
    const keysPath = path.join(__dirname, 'keys');

    this.accessPrivateKey = fs.readFileSync(
      path.join(keysPath, 'access.private.pem'),
      'utf8',
    );
    this.accessPublicKey = fs.readFileSync(
      path.join(keysPath, 'access.public.pem'),
      'utf8',
    );
    this.refreshPrivateKey = fs.readFileSync(
      path.join(keysPath, 'refresh.private.pem'),
      'utf8',
    );
    this.refreshPublicKey = fs.readFileSync(
      path.join(keysPath, 'refresh.public.pem'),
      'utf8',
    );
  }

  async generateTwoFactor(user: User, password: string) {
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid)
      throw new UnauthorizedException(ErrorCause.INVALID_EMAIL_OR_PASSWORD);

    const secret = speakeasy.generateSecret({
      name: `BetaGames (${user.email})`,
    });

    await this.twoFactorRepository.upsert({
      userId: user.id,
      twoFactorSecret: secret.base32,
      isTwoFactorEnabled: false,
      twoFactorBackupCodes: [],
    });

    const qr = await QRCode.toDataURL(secret?.otpauth_url || '');

    return { qr };
  }

  generateBackupCodes(): string[] {
    return Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10),
    );
  }

  async verifyTwoFactor(tempTokenForTwoFactor: string, code: string) {
    const payload = this.verifyAccessToken(tempTokenForTwoFactor);

    if (!payload.isTwoFactorPending) {
      throw new UnauthorizedException(ErrorCause.INVALID_TOKEN);
    }

    const userId = payload.id;

    const record = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    let isVerified = false;

    if (!record?.isTwoFactorEnabled) {
      isVerified = true;
    } else {
      isVerified = speakeasy.totp.verify({
        secret: record.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 1,
      });

      if (!isVerified) {
        const backupCodes = record.twoFactorBackupCodes || [];
        if (backupCodes.includes(code)) {
          record.twoFactorBackupCodes = backupCodes.filter((c) => c !== code);
          await record.save();
          isVerified = true;
        }
      }
    }

    if (!isVerified) {
      throw new UnauthorizedException(ErrorCause.INVALID_CODE);
    }

    const tokens = this.generateTokens({ id: userId });

    await this.sessionsService.createSession({
      userId,
      refreshToken: tokens.refreshToken,
    });

    const user = await this.usersService.getUserById(userId);

    return { user, ...tokens };
  }

  async enableTwoFactor(userId: number, code: string) {
    const record = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    const verified = speakeasy.totp.verify({
      secret: record!.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) throw new BadRequestException(ErrorCause.INVALID_CODE);

    const backupCodes = this.generateBackupCodes();

    await record!.update({
      isTwoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes,
    });

    return backupCodes;
  }

  async oAuthLogin(
    provider: OAuthProvider,
    code: string,
    deviceId?: string,
    originalPKCE?: string,
    locale?: Locale,
    currency?: Currency,
  ) {
    switch (provider) {
      case OAuthProvider.vk:
        return await this.loginViaVk(
          code,
          deviceId,
          originalPKCE,
          locale,
          currency,
        );
      case OAuthProvider.discord:
        return await this.loginViaDiscord(code, locale, currency);
    }
  }

  async loginViaDiscord(code: string, locale?: Locale, currency?: Currency) {
    try {
      const response = await axios.post<{ access_token: string }>(
        this.DISCORD_GET_TOKEN_URL,
        {
          grant_type: 'authorization_code',
          redirect_uri: this.configService.get('DISCORD_REDIRECT_URI'),
          code,
        },
        {
          auth: {
            username: this.configService.get('DISCORD_CLIENT_ID') || '',
            password: this.configService.get('DISCORD_CLIENT_SECRET') || '',
          },
        },
      );

      if (!response.data?.access_token)
        throw new UnauthorizedException(ErrorCause.OAUTH_ERROR);

      const discordUser = await axios.get<{ user?: { email?: string } }>(
        this.DISCORD_GET_USER_URL,
        {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`,
          },
        },
      );
      if (!discordUser.data?.user?.email)
        throw new UnauthorizedException(ErrorCause.OAUTH_ERROR);

      const user = await this.usersService.getOrCreateUserByEmailOnly(
        discordUser.data.user.email,
        locale,
        currency,
      );

      const requiredTwoFactor = await this.requiredTwoFactorForUser(user.id);

      if (requiredTwoFactor) {
        const tempTokenForTwoFactor = this.jwtService.sign(
          { id: user.id, isTwoFactorPending: true },
          {
            expiresIn: '5m',
            algorithm: 'RS256',
            privateKey: this.accessPrivateKey,
          },
        );

        return { tempTokenForTwoFactor };
      }

      const tokens = this.generateTokens({ id: user.id });
      await this.sessionsService.createSession({
        userId: user.id,
        refreshToken: tokens.refreshToken,
      });

      await this.usersService.getOrCreateUserOAuthAccount(
        user.id,
        OAuthProvider.discord,
      );

      return { user, ...tokens };
    } catch (error) {
      throw new UnauthorizedException(ErrorCause.OAUTH_ERROR);
    }
  }

  async loginViaVk(
    code: string,
    deviceId?: string,
    originalPKCE?: string,
    locale?: Locale,
    currency?: Currency,
  ) {
    try {
      const response = await axios.post<{ access_token: string }>(
        this.VK_GET_TOKEN_URL,
        {
          grant_type: 'authorization_code',
          client_id: this.configService.get('VK_CLIENT_ID'),
          client_secret: this.configService.get('VK_CLIENT_SECRET'),
          redirect_uri: this.configService.get('VK_REDIRECT_URI'),
          device_id: deviceId,
          code,
          code_verifier: originalPKCE,
        },
      );

      if (!response.data?.access_token)
        throw new UnauthorizedException(ErrorCause.OAUTH_ERROR);

      const vkUser = await axios.post<{ user?: { email?: string } }>(
        this.VK_GET_USER_URL,
        {
          client_id: this.configService.get('VK_CLIENT_ID'),
          access_token: response.data.access_token,
        },
      );
      if (!vkUser.data?.user?.email)
        throw new UnauthorizedException(ErrorCause.OAUTH_ERROR);

      const user = await this.usersService.getOrCreateUserByEmailOnly(
        vkUser.data.user.email,
        locale,
        currency,
      );

      const requiredTwoFactor = await this.requiredTwoFactorForUser(user.id);

      if (requiredTwoFactor) {
        const tempTokenForTwoFactor = this.jwtService.sign(
          { id: user.id, isTwoFactorPending: true },
          {
            expiresIn: '5m',
            algorithm: 'RS256',
            privateKey: this.accessPrivateKey,
          },
        );

        return { tempTokenForTwoFactor };
      }

      const tokens = this.generateTokens({ id: user.id });
      await this.sessionsService.createSession({
        userId: user.id,
        refreshToken: tokens.refreshToken,
      });

      await this.usersService.getOrCreateUserOAuthAccount(
        user.id,
        OAuthProvider.vk,
      );

      return { user, ...tokens };
    } catch (error) {
      throw new UnauthorizedException(ErrorCause.OAUTH_ERROR);
    }
  }

  async requiredTwoFactorForUser(userId: number) {
    try {
      const record = await this.twoFactorRepository.findOne({
        where: { userId },
      });

      return record?.isTwoFactorEnabled!;
    } catch (e) {
      if (e instanceof NotFoundException) {
        return false;
      }
      throw e;
    }
  }

  async login(login: string, password: string) {
    let user: User | null;
    try {
      user = await this.usersService.getUserByLoginOrEmail(login);
    } catch {
      throw new UnauthorizedException(ErrorCause.INVALID_EMAIL_OR_PASSWORD);
    }

    if (!user)
      throw new UnauthorizedException(ErrorCause.INVALID_EMAIL_OR_PASSWORD);

    if (!user.password)
      throw new UnauthorizedException(ErrorCause.INVALID_EMAIL_OR_PASSWORD);

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException(ErrorCause.INVALID_EMAIL_OR_PASSWORD);

    const requiredTwoFactor = await this.requiredTwoFactorForUser(user.id);

    if (requiredTwoFactor) {
      const tempTokenForTwoFactor = this.jwtService.sign(
        { id: user.id, isTwoFactorPending: true },
        {
          expiresIn: '5m',
          algorithm: 'RS256',
          privateKey: this.accessPrivateKey,
        },
      );

      return { tempTokenForTwoFactor };
    }

    const tokens = this.generateTokens({ id: user.id });
    await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
    });

    return { user, ...tokens };
  }

  async registerAccount(
    email: string,
    password: string,
    selectedLocale?: Locale,
    selectedCurrency?: Currency,
  ) {
    const user = await this.usersService.createUser({
      email,
      password,
      selectedLocale,
      selectedCurrency,
    });
    const tokens = this.generateTokens({ id: user.id });

    await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
    });

    this.logger.log({ message: LogVariants.UserRegistered, user });

    return { user, ...tokens };
  }

  async confirmAccount(confirmAccountDto: ConfirmAccountDto) {
    const user = await this.usersService.getUserByEmail(
      confirmAccountDto.email,
    );

    if (user?.verified)
      throw new BadRequestException(ErrorCause.USER_ALREADY_VERIFIED);

    let userCode: UserCode | null;

    try {
      userCode = await this.usersService.getUserCodeByUserIdAndType(
        user?.id,
        UserCodeType.CONFIRM_EMAIL,
      );
    } catch (error) {
      throw new NotFoundException(ErrorCause.USER_CODE_NOT_FOUND_OR_EXPIRED);
    }

    if (userCode?.code !== confirmAccountDto.code) {
      throw new BadRequestException(ErrorCause.USER_CODE_INCORRECT);
    }

    await user?.update({ verified: true });
    await userCode?.destroy();

    return await user?.reload();
  }

  async logout(id: number | undefined, refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    if (payload.id !== id) throw new UnauthorizedException();
    return await this.sessionsService.deleteSession(refreshToken);
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.getUserById(payload.id);
    if (!user) throw new UnauthorizedException();

    const tokens = this.generateTokens({ id: user.id });

    await this.sessionsService.deleteSession(refreshToken);
    await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
    });

    return { user, ...tokens };
  }

  generateTokens(payload: JWTTokenPayload) {
    const accessToken = this.jwtService.sign(payload, {
      algorithm: 'RS256',
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      privateKey: this.accessPrivateKey,
    });

    const refreshToken = this.jwtService.sign(payload, {
      algorithm: 'RS256',
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
      privateKey: this.refreshPrivateKey,
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(accessToken: string) {
    return this.jwtService.verify<JWTTokenPayload>(accessToken, {
      algorithms: ['RS256'],
      publicKey: this.accessPublicKey,
    });
  }

  verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verify<JWTTokenPayload>(refreshToken, {
      algorithms: ['RS256'],
      publicKey: this.refreshPublicKey,
    });
  }
}
