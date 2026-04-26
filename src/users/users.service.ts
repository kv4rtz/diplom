import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import {
  FindOptions,
  IncludeOptions,
  Op,
  Sequelize,
  WhereOptions,
} from 'sequelize';
import { BgrHistory } from 'src/bgr/models/bgr-history.model';
import { ErrorCause } from 'src/errors-couse';
import { FinanceService } from 'src/finance/finance.service';
import { IMAGE_MIME_TYPES } from 'src/global/constants/mime-types';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import {
  ComplaintUserStatus,
  Currency,
  Locale,
  OAuthProvider,
  UserCodeType,
  UserTradingOption,
} from 'src/graphql';
import { KafkaService } from 'src/kafka/kafka.service';
import { toNotificationEmailCodePayload } from 'src/notifications/replacers/notification-email-code';
import { PermissionCode } from 'src/permissions/models/permissions.constant';
import { Permission } from 'src/permissions/models/permissions.model';
import { Role } from 'src/roles/models/roles.model';
import { RolesService } from 'src/roles/roles.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { SmsService } from './../sms/sms.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { UserComplaintsOptionsDto } from './dto/user-complaints-options.dto';
import {
  UserBlacklist,
  UserBlacklistCreationAttributes,
} from './models/users-blacklist.model';
import { UserCode } from './models/users-codes.model';
import {
  UserComplaint,
  UserComplaintCreationAttrs,
} from './models/users-complaints.model';
import { UserOAuthAccount } from './models/users-oauth-accounts.model';
import { UserOption } from './models/users-options.model';
import { UserRole } from './models/users-roles.model';
import { User } from './models/users.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly usersRepository: typeof User,
    @InjectModel(UserCode)
    private readonly userCodesRepository: typeof UserCode,
    @InjectModel(UserComplaint)
    private readonly userComplaintsRepository: typeof UserComplaint,
    @InjectModel(UserOption)
    private readonly userOptionsRepository: typeof UserOption,
    @InjectConnection() private readonly sequalize: Sequelize,
    private readonly rolesService: RolesService,
    @InjectModel(UserRole)
    private readonly userRolesRepository: typeof UserRole,
    private readonly storageService: StorageService,
    private readonly kafkaService: KafkaService,
    @InjectModel(UserOAuthAccount)
    private readonly userOAuthRepository: typeof UserOAuthAccount,
    @InjectModel(UserBlacklist)
    private readonly userBlacklistRepository: typeof UserBlacklist,
    private readonly financeService: FinanceService,
    private readonly smsService: SmsService,
  ) {}

  async sendCodeForVerifyPhone(phone: string, userId: number) {
    await this.smsService.sendSms(phone, 'test');

    return {
      message: 'test',
    };
  }

  async findAllWithPagination(options: {
    pageInfo: PageInfoDto;
    search?: string;
    roleId?: number;
    onlyBuyers?: boolean;
    onlySellers?: boolean;
    onlyStaff?: boolean;
    bgrMin?: number;
    bgrMax?: number;
    order?: string;
  }) {
    const { page = 1, limit = 20 } = options.pageInfo;
    const offset = (page - 1) * limit;

    const where: WhereOptions<User> = {};
    if (options.search) {
      where[Op.or] = {
        login: { [Op.iLike]: `%${options.search}%` },
        email: { [Op.iLike]: `%${options.search}%` },
        phone: { [Op.iLike]: `%${options.search}%` },
      };
    }

    const include: IncludeOptions[] = [];
    if (
      options.roleId ||
      options.onlyBuyers ||
      options.onlySellers ||
      options.onlyStaff
    ) {
      const roleInclude: IncludeOptions[] = [];
      if (options.onlyStaff) {
        roleInclude.push({
          model: Permission,
          required: true,
          where: { code: 'admin-panel.access' },
        });
      }
      const roleWhere: WhereOptions<Role> = {};
      if (options.roleId) roleWhere.id = options.roleId;
      if (options.onlyBuyers) roleWhere.code = 'user';
      if (options.onlySellers) roleWhere.code = 'seller';
      include.push({
        model: Role,
        required: true,
        where: roleWhere,
        include: roleInclude,
      });
    }

    if (options.bgrMin || options.bgrMax) {
      include.push({
        model: BgrHistory,
        required: true,
        limit: 1,
        order: [['updatedAt', 'DESC']],
        where: {
          bgr: {
            [Op.between]: [options.bgrMin, options.bgrMax],
          },
        },
      });
    }

    const { count, rows } = await this.usersRepository.findAndCountAll({
      where,
      include,
      distinct: true,
      offset,
      limit,
      order: options.order ? [parseOrderBy(options.order)] : undefined,
    });

    return {
      pages: Math.ceil(count / limit),
      roles: await this.rolesService.findAll({
        include: [{ model: User, required: true }],
      }),
      count,
      rows,
    };
  }

  async findUserComplaintsWithPagination(
    options: UserComplaintsOptionsDto & { pageInfo: PageInfoDto },
  ) {
    const { page = 1, limit = 20 } = options.pageInfo;
    const offset = (page - 1) * limit;

    const where: WhereOptions<UserComplaint> = {};
    if (options.creatorId) where.creatorId = options.creatorId;
    if (options.targetId) where.targetId = options.targetId;
    if (options.status) where.status = options.status;

    const { count, rows } = await this.userComplaintsRepository.findAndCountAll(
      {
        where,
        offset,
        limit,
        order: options.order
          ? [parseOrderBy(options.order)]
          : [['createdAt', 'DESC']],
      },
    );

    return {
      pages: Math.ceil(count / limit),
      count,
      rows,
    };
  }

  async approveUserComplaint(id: number) {
    return await this.userComplaintsRepository.update(
      { status: ComplaintUserStatus.APPROVED },
      { where: { id } },
    );
  }

  async rejectUserComplaint(id: number) {
    return await this.userComplaintsRepository.update(
      { status: ComplaintUserStatus.REJECTED },
      { where: { id } },
    );
  }

  async createUserComplaint(creationAttrs: UserComplaintCreationAttrs) {
    if (creationAttrs.targetId === creationAttrs.creatorId)
      throw new BadRequestException(ErrorCause.CAN_NOT_COMPLAIN_ABOUT_YOURSELF);

    return await this.userComplaintsRepository.create(creationAttrs);
  }

  async countOnlineUsers() {
    return await this.usersRepository.count({ where: { isOnline: true } });
  }

  async countAllUsers() {
    return await this.usersRepository.count();
  }

  async getOrCreateUserByEmailOnly(
    email: string,
    locale?: Locale,
    currency?: Currency,
  ) {
    let user: User | null;
    try {
      user = await this.getUserByEmail(email);
    } catch {
      user = await this.createUser({
        email,
        password: null,
        selectedLocale: locale || Locale.ru,
        selectedCurrency: currency || Currency.RUB,
      });
    }
    return user as User;
  }

  async getUserOAuthAccounts(userId: number) {
    return await this.userOAuthRepository.findAll({ where: { userId } });
  }

  async deleteUser(userId: number, hardRemove: boolean = false) {
    const user = await this.getUserById(userId, { paranoid: false });

    await user?.destroy({
      force: hardRemove,
    });

    return true;
  }

  async getUserOAuthAccountByUserIdAndProvider(
    userId: number,
    provider: OAuthProvider,
  ) {
    return await this.userOAuthRepository.findOne({
      where: { userId, provider },
    });
  }

  async createUserOAuthAccount(userId: number, provider: OAuthProvider) {
    return await this.userOAuthRepository.create({ userId, provider });
  }

  async getOrCreateUserOAuthAccount(userId: number, provider: OAuthProvider) {
    let userOAuthAccount: UserOAuthAccount | null;
    try {
      userOAuthAccount = await this.getUserOAuthAccountByUserIdAndProvider(
        userId,
        provider,
      );
    } catch {
      userOAuthAccount = await this.createUserOAuthAccount(userId, provider);
    }

    return userOAuthAccount as UserOAuthAccount;
  }

  async getUserByLoginOrEmail(loginOrEmail: string) {
    let user: User | null;
    try {
      user = await this.getUserByLogin(loginOrEmail);
    } catch {
      user = await this.getUserByEmail(loginOrEmail);
    }
    return user;
  }

  async checkCurrentPassword(password: string, currentPassword: string) {
    return await bcrypt.compare(password, currentPassword);
  }

  async getUserRoles(userId: number, options?: FindOptions) {
    const userRoles = await this.userRolesRepository.findAll({
      where: { userId },
      ...options,
    });

    return await this.rolesService.findByIds(
      userRoles.map((ur) => ur.roleId),
      options,
    );
  }

  async getUserByIdOrLogin(slug: string) {
    let user: User | null;
    try {
      user = await this.getUserById(Number(slug));
    } catch {
      user = await this.getUserByLogin(slug);
    }
    return user;
  }

  async requestCode(dto: RequestCodeDto) {
    const user = await this.getUserByLoginOrEmail(dto.login);

    switch (dto.type) {
      case UserCodeType.CONFIRM_EMAIL:
        return this.requestCodeConfirmEmail(user!);

      case UserCodeType.RESET_PASS:
        return this.requestCodeResetPass(user!);

      case UserCodeType.CHANGE_PASS:
        return this.requestCodeChangePass(user!);

      default:
        return false;
    }
  }

  async requestCodeChangePass(user: User) {
    await this.deleteAllUserCodes(user?.id, UserCodeType.CHANGE_PASS);

    const code = this.generateCode(6);
    const userCode = await this.createUserCode(
      user?.id,
      code,
      UserCodeType.CHANGE_PASS,
    );

    await this.kafkaService.produce(
      'notifications.email.code',
      toNotificationEmailCodePayload({
        email: user.email,
        code,
        type: UserCodeType.CHANGE_PASS,
      }),
    );

    return userCode;
  }

  async deleteAllUserCodes(userId: number, type: UserCodeType) {
    await this.userCodesRepository.destroy({ where: { userId, type } });
  }

  async createUserCode(userId: number, code: string, type: UserCodeType) {
    return await this.userCodesRepository.create({ userId, code, type });
  }

  async getUserCodeByUserIdAndType(userId: number, type: UserCodeType) {
    return await this.userCodesRepository.findOne({
      where: {
        userId,
        type,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });
  }

  async getAllUsers() {
    return await this.usersRepository.findAll();
  }

  async getUserCodeByUserIdAndTypes(userId: number, types: UserCodeType[]) {
    return await this.userCodesRepository.findOne({
      where: {
        userId,
        type: {
          [Op.in]: types,
        },
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });
  }

  async getUserById(id: number, options?: FindOptions<User>) {
    return await this.usersRepository.findByPk(id, options);
  }

  async getUserByEmail(email: string) {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async setUserOnline(id: number) {
    await this.usersRepository.update(
      { isOnline: true, lastSeen: new Date() },
      { where: { id } },
    );
  }

  async setUserOffline(id: number) {
    await this.usersRepository.update(
      { isOnline: false, lastSeen: new Date() },
      { where: { id } },
    );
  }

  async getUserByLogin(login: string) {
    return await this.usersRepository.findOne({
      where: { login },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const password = createUserDto.password
      ? bcrypt.hashSync(createUserDto.password, 12)
      : null;
    try {
      const user = await this.usersRepository.create({
        ...createUserDto,
        password,
        selectedCurrency: createUserDto.selectedCurrency || Currency.RUB,
        selectedLocale: createUserDto.selectedLocale || Locale.ru,
      });

      await this.createUserOptions(user.id);

      await this.financeService.findOrCreate({ userId: user.id });

      return user;
    } catch {
      throw new BadRequestException(ErrorCause.EMAIL_ALREADY_EXISTS);
    }
  }

  async createUserOptions(userId: number) {
    return await this.userOptionsRepository.create({ userId });
  }

  async getUserOptions(userId: number) {
    const [userOption] = await this.userOptionsRepository.upsert({ userId });
    return userOption;
  }

  async setTradingOption(userId: number, option: UserTradingOption) {
    const [userOption] = await this.userOptionsRepository.upsert({
      userId,
      tradingOption: option,
    });
    return userOption;
  }

  async changePhone(id: number, phone: string) {
    await this.usersRepository.update({ phone }, { where: { id } });
  }

  async changePasswordWithVerification(dto: ChangePasswordDto) {
    const user = await this.getUserByLoginOrEmail(dto.login);

    let userCode: UserCode | null;

    try {
      userCode = await this.getUserCodeByUserIdAndType(user?.id, dto.type);
    } catch (error) {
      throw new NotFoundException(ErrorCause.USER_CODE_NOT_FOUND_OR_EXPIRED);
    }

    if (userCode?.code !== dto.code) {
      throw new BadRequestException(ErrorCause.USER_CODE_INCORRECT);
    }

    await this.changePassword(user?.id, dto.password);
    await this.deleteAllUserCodes(user?.id, dto.type);

    return true;
  }

  async changePassword(id: number, password: string) {
    const passwordHash = bcrypt.hashSync(password, 12);
    await this.usersRepository.update(
      { password: passwordHash },
      { where: { id } },
    );
  }

  async editUser(id: number, dto: EditUserDto) {
    const user = await this.getUserById(id);

    if (dto.avatar === null && user?.avatarKey) {
      await this.storageService.deleteFile(
        user.avatarKey,
        StorageBuckets.Avatars,
      );
      await this.usersRepository.update({ avatarKey: null }, { where: { id } });
    }

    if (dto.avatar) {
      const fileExists = await this.storageService.fileExists(
        dto.avatar,
        StorageBuckets.Avatars,
      );
      if (!fileExists) throw new NotFoundException(ErrorCause.FILE_NOT_FOUND);
      const isImage = await this.storageService.checkFileMimeType(
        dto.avatar,
        IMAGE_MIME_TYPES,
        StorageBuckets.Avatars,
      );
      if (!isImage)
        throw new BadRequestException(ErrorCause.FILE_INCORRECT_MIME_TYPE);
      this.usersRepository.update({ avatarKey: dto.avatar }, { where: { id } });
    }

    await this.usersRepository.update(
      {
        ...dto,
        login: undefined,
        password: undefined,
        selectedCurrency: dto.currency,
        selectedLocale: dto.locale,
      },
      { where: { id } },
    );

    try {
      await this.usersRepository.update(
        { login: dto.login },
        { where: { id } },
      );
    } catch {
      throw new BadRequestException(ErrorCause.NICKNAME_ALREADY_EXISTS);
    }
  }

  async assignRole(userId: number, roleId: number) {
    const user = await this.getUserById(userId);
    const role = await this.rolesService.findById(roleId);

    const userRoles = await user?.$get('roles');

    if (userRoles?.some((ur) => ur.id === role?.id)) {
      throw new BadRequestException(ErrorCause.ROLE_ALREADY_ASSIGNED);
    }

    await user?.$add('roles', role?.id);
  }

  async removeRole(userId: number, roleId: number) {
    const user = await this.getUserById(userId);

    const role = await this.rolesService.findById(roleId);

    await user?.$remove('roles', role?.id);
  }

  async hasPermissions(
    userId: number,
    permissions: PermissionCode[],
    options?: FindOptions,
  ) {
    const userRoles = await this.getUserRoles(userId, options);

    return userRoles.some((role) =>
      role.permissions.some((permission) =>
        permissions.includes(permission.code as PermissionCode),
      ),
    );
  }

  private async requestCodeConfirmEmail(user: User) {
    if (user?.verified)
      throw new BadRequestException(ErrorCause.USER_ALREADY_VERIFIED);

    await this.deleteAllUserCodes(user?.id, UserCodeType.CONFIRM_EMAIL);

    const code = this.generateCode(6);
    const userCode = await this.createUserCode(
      user?.id,
      code,
      UserCodeType.CONFIRM_EMAIL,
    );

    await this.kafkaService.produce(
      'notifications.email.code',
      toNotificationEmailCodePayload({
        email: user.email,
        code,
        type: UserCodeType.CONFIRM_EMAIL,
      }),
    );

    return userCode;
  }

  private async requestCodeResetPass(user: User) {
    await this.deleteAllUserCodes(user?.id, UserCodeType.RESET_PASS);

    const code = this.generateCode(6);
    const userCode = await this.createUserCode(
      user?.id,
      code,
      UserCodeType.RESET_PASS,
    );

    await this.kafkaService.produce(
      'notifications.email.code',
      toNotificationEmailCodePayload({
        email: user.email,
        code,
        type: UserCodeType.RESET_PASS,
      }),
    );

    return userCode;
  }

  async createUserBlacklist(
    attrs: UserBlacklistCreationAttributes,
    options?: FindOptions<UserBlacklist>,
  ) {
    if (attrs.bannedUserId === attrs.ownerId)
      throw new BadRequestException(
        ErrorCause.YOU_CANT_ADD_HIMSELF_TO_BLACKLIST,
      );

    return await this.userBlacklistRepository.create(attrs, options);
  }

  async removeUserFromBlacklist(
    attrs: UserBlacklistCreationAttributes,
    options?: FindOptions<UserBlacklist>,
  ) {
    return await this.userBlacklistRepository.destroy({
      where: attrs,
      ...options,
    });
  }

  async checkUserInBlacklist(
    attrs: UserBlacklistCreationAttributes,
    options?: FindOptions<UserBlacklist>,
  ) {
    try {
      return await this.userBlacklistRepository.findOne({
        where: attrs,
        ...options,
      });
    } catch {
      return null;
    }
  }

  async getUserBlacklist(ownerId: number, options?: FindOptions<User>) {
    const user = await this.usersRepository.findByPk(ownerId, {
      include: [
        {
          association: 'blacklist',
          include: [
            {
              association: 'bannedUser',
            },
          ],
        },
      ],
      ...options,
    });

    return user?.blacklist.map((blacklist) => blacklist.bannedUser);
  }

  async requestCodeChangeOldPassword(user: User, oldPassword: string) {
    if (user.password) {
      const isPasswordCorrect = await this.checkCurrentPassword(
        oldPassword,
        user.password,
      );

      if (!isPasswordCorrect)
        throw new BadRequestException(ErrorCause.INCORRECT_PASSWORD);
    }

    return !!(await this.requestCode({
      login: user.login,
      type: UserCodeType.CHANGE_PASS,
    }));
  }

  private generateCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
