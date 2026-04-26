import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { DEFAULT_PERMISSIONS } from './models/permissions.constant';
import { Permission } from './models/permissions.model';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(
    @InjectModel(Permission) private permissionsRepository: typeof Permission,
  ) {}

  async onModuleInit() {
    await this.createDefaultPermissions();
  }

  async findAllByIds(ids: number[]) {
    return this.permissionsRepository.findAll({
      where: { id: { [Op.in]: ids } },
    });
  }

  async findByCode(code: string) {
    return this.permissionsRepository.findOne({
      where: { code },
    });
  }

  async findAll() {
    return this.permissionsRepository.findAll();
  }

  async findById(id: number) {
    return this.permissionsRepository.findByPk(id);
  }

  async createDefaultPermissions() {
    await this.permissionsRepository.bulkCreate(DEFAULT_PERMISSIONS, {
      ignoreDuplicates: true,
    });
  }
}
