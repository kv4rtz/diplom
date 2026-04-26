import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize } from 'sequelize';
import { ErrorCause } from 'src/errors-couse';
import { Locale } from 'src/graphql';
import { Permission } from 'src/permissions/models/permissions.model';
import { PermissionsService } from 'src/permissions/permissions.service';
import { UsersService } from 'src/users/users.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DEFAULT_ROLES } from './models/default-roles.constant';
import { RolePermission } from './models/roles-permissions.model';
import { RoleTranslation } from './models/roles-translations.model';
import { Role } from './models/roles.model';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Sequelize,
    @InjectModel(Role) private readonly roleRepository: typeof Role,
    @InjectModel(RolePermission)
    private readonly rolePermissionRepository: typeof RolePermission,
    @InjectModel(RoleTranslation)
    private readonly roleTranslationRepository: typeof RoleTranslation,
    @Inject(forwardRef(() => UsersService))
    private readonly usersSerivce: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async onModuleInit() {
    await this.createDefaultRoles();
  }

  async becomeSeller(approval: boolean, userId: number) {
    if (approval !== true)
      throw new BadRequestException(ErrorCause.APPROVAL_MUST_BE_TRUE);

    const user = await this.usersSerivce.getUserById(userId);

    const role = await this.roleRepository.findOne({
      where: { code: 'seller' },
    });

    await this.usersSerivce.assignRole(user!.id, role!.id);

    return true;
  }

  async createDefaultRoles() {
    for (const role of DEFAULT_ROLES) {
      const [createdOrFindedRole, created] =
        await this.roleRepository.findOrCreate({
          where: { code: role.code },
          defaults: {
            code: role.code,
          },
          hooks: false,
        });

      if (created) {
        await this.roleTranslationRepository.bulkCreate(
          role.translations.map((t) => ({
            ...t,
            roleId: createdOrFindedRole.id,
          })),
          { ignoreDuplicates: true },
        );
      }

      for (const code of role.permissions) {
        const permission = await this.permissionsService.findByCode(code);

        await this.rolePermissionRepository.findOrCreate({
          where: {
            roleId: createdOrFindedRole.id,
            permissionId: permission?.id,
          },
          defaults: {
            roleId: createdOrFindedRole.id,
            permissionId: permission?.id,
          },
          hooks: false,
        });
      }
    }
  }

  async findByIds(ids: number[], options?: FindOptions<Role>) {
    return await this.roleRepository.findAll({
      where: { id: { [Op.in]: ids } },
      include: [Permission],
      ...options,
    });
  }

  async getRoleTranslation(roleId: number, locale: Locale) {
    return await this.roleTranslationRepository.findOne({
      where: { roleId, locale },
    });
  }

  async getRoleTranslations(roleId: number) {
    return await this.roleTranslationRepository.findAll({
      where: { roleId },
    });
  }

  async getRolePermissions(roleId: number) {
    const rolePermissions = await this.rolePermissionRepository.findAll({
      where: { roleId },
    });

    return await this.permissionsService.findAllByIds(
      rolePermissions.map((rp) => rp.permissionId),
    );
  }

  async findAll(options?: FindOptions<Role>) {
    return await this.roleRepository.findAll(options);
  }

  async findById(id: number) {
    return await this.roleRepository.findByPk(id);
  }

  async findByCode(code: string) {
    return await this.roleRepository.findOne({
      where: { code },
    });
  }

  async createRole(dto: CreateRoleDto) {
    return this.connection.transaction(async (transaction) => {
      const role = await this.roleRepository.create(
        { code: dto.code, translations: dto.translations },
        { transaction, include: [RoleTranslation] },
      );

      if (dto.permissions?.length) {
        await role.$set('permissions', dto.permissions, { transaction });
      }

      return role.reload({
        transaction,
      });
    });
  }

  async updateRole(dto: UpdateRoleDto) {
    return this.connection.transaction(async (transaction) => {
      const role = await this.findById(dto.id);

      await this.roleRepository.update(
        { code: dto.code },
        { transaction, where: { id: dto.id } },
      );

      if (dto.translations) {
        await RoleTranslation.destroy({
          where: { roleId: dto.id },
          transaction,
        });

        await RoleTranslation.bulkCreate(
          dto.translations.map((t) => ({ ...t, roleId: dto.id })),
          { transaction },
        );
      }

      if (dto.permissions?.length) {
        await role?.$set('permissions', dto.permissions, { transaction });
      }

      return role?.reload({
        transaction,
      });
    });
  }

  async deleteRole(id: number) {
    return this.roleRepository.destroy({ where: { id } });
  }
}
