import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Session, SessionCreationAttributes } from './sessions.model';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session) private readonly sessionsRepository: typeof Session,
  ) {}

  async createSession(sessionData: SessionCreationAttributes) {
    return await this.sessionsRepository.create(sessionData);
  }

  async deleteSession(refreshToken: string) {
    return await this.sessionsRepository.destroy({ where: { refreshToken } });
  }
}
