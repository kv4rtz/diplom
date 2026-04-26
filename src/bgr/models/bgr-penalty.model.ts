import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';

export enum PenaltyType {
  REFUND = 'REFUND',
  IDLE = 'IDLE',
}

export type BgrPenaltyCreationAttrs = {
  userId: number;
  penaltyType: PenaltyType;
  penaltyAmount: number;
  appliedUntil: Date;
  cycleIndex: number;
};

@Table({
  tableName: 'bgr_penalties',
})
export class BgrPenalty extends Model<BgrPenalty, BgrPenaltyCreationAttrs> {
  @BelongsTo(() => User, 'userId')
  declare user: User;
  declare userId: number;

  @Column({ type: DataType.ENUM(...Object.values(PenaltyType)) })
  declare penaltyType: PenaltyType;

  @Column({ type: DataType.INTEGER })
  declare penaltyAmount: number;

  @Column({ type: DataType.DATE })
  declare appliedUntil: Date;

  @Column({ type: DataType.INTEGER })
  declare cycleIndex: number;
}
