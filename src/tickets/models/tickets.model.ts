import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { TicketStatus, TicketTopic, TicketTopicCategory } from 'src/graphql';
import { User } from 'src/users/models/users.model';

export type TicketCreationAttrs = {
  authorId: number;
  topic: TicketTopic;
  topicCategory: TicketTopicCategory;
  comment?: string;
  imagesKeys?: string[];
  notifyAboutResolveByEmail: boolean;
};

@Table({ tableName: 'tickets' })
export class Ticket extends Model<Ticket, TicketCreationAttrs> {
  @Column({ type: DataType.ENUM(...Object.values(TicketTopic)) })
  declare topic: TicketTopic;

  @Column({ type: DataType.ENUM(...Object.values(TicketTopicCategory)) })
  declare topicCategory: TicketTopicCategory;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  declare imagesKeys: string[];

  @Column({
    type: DataType.ENUM(...Object.values(TicketStatus)),
    defaultValue: TicketStatus.OPEN,
  })
  declare status: TicketStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare resolvedAt: Date | null;

  @BelongsTo(() => User, 'authorId')
  declare author: User;
  declare authorId: number;

  @BelongsTo(() => User, 'employeeId')
  declare employee: User;
  declare employeeId: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare notifyAboutResolveByEmail: boolean;
}
