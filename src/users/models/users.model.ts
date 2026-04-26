import { DataTypes, type DestroyOptions } from 'sequelize';
import {
  AfterDestroy,
  BelongsToMany,
  Column,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { BgrHistory } from 'src/bgr/models/bgr-history.model';
import { Currency, Locale } from 'src/graphql';
import { Role } from 'src/roles/models/roles.model';
import { UserBlacklist } from './users-blacklist.model';
import { UserRole } from './users-roles.model';

type UserCreationAttributes = {
  login?: string;
  email: string;
  password: string | null;
  selectedLocale: Locale;
  selectedCurrency: Currency;
};

@Table({ tableName: 'users', timestamps: true, paranoid: true })
export class User extends Model<User, UserCreationAttributes> {
  @Column({ type: DataTypes.STRING, allowNull: true, unique: true })
  declare login: string;

  @Column({ type: DataTypes.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataTypes.STRING, allowNull: true })
  declare password: string | null;

  @Column({ type: DataTypes.STRING })
  declare phone: string;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: false })
  declare verified: boolean;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: false })
  declare verifiedIdentity: boolean;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: false })
  declare isOnline: boolean;

  @Column({ type: DataTypes.DATE })
  declare lastSeen: Date;

  @Column({ type: DataTypes.STRING })
  declare avatarKey: string | null;

  @Column({ type: DataTypes.ENUM(...Object.values(Locale)), allowNull: false })
  declare selectedLocale: Locale;

  @Column({
    type: DataTypes.ENUM(...Object.values(Currency)),
    allowNull: false,
  })
  declare selectedCurrency: Currency;

  @BelongsToMany(() => Role, () => UserRole)
  declare roles: Role[];

  @HasMany(() => BgrHistory)
  declare bgrHistory: BgrHistory;

  @HasMany(() => UserBlacklist, {
    foreignKey: 'ownerId',
    as: 'blacklist',
  })
  declare blacklist: UserBlacklist[];

  @HasMany(() => UserBlacklist, {
    foreignKey: 'bannedUserId',
    as: 'blockedBy',
  })
  declare blockedBy: UserBlacklist[];

  @AfterDestroy
  static async handleAfterDestroy(
    instance: User,
    options: DestroyOptions<User>,
  ) {
    if (options.force) return;
    if (!this.sequelize?.models) return;

    for (const model of Object.values(this.sequelize.models)) {
      for (const association of Object.values(model.associations)) {
        const isUserRelation = association.target === User;
        if (!isUserRelation) continue;
        const foreignKey = association.foreignKey;
        if (!foreignKey) continue;
        if (!model.options.paranoid) continue;

        await model.destroy({
          where: { [foreignKey]: instance.id },
          transaction: options.transaction,
        });
      }
    }
  }
}
