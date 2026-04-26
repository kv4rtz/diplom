import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import path from 'path';
import { SessionsModule } from 'src/sessions/sessions.module';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './auth.guard';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { TwoFactor } from './models/two-factor.model';

@Module({
  imports: [
    SequelizeModule.forFeature([TwoFactor]),
    forwardRef(() => UsersModule),
    SessionsModule,
    JwtModule.register({
      publicKey: path.join(__dirname, 'keys/public.key'),
      privateKey: path.join(__dirname, 'keys/private.key'),
    }),
  ],
  providers: [AuthResolver, AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
