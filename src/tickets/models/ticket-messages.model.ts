import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';
import { Ticket } from './tickets.model';

export type TicketMessageCreationAttrs = {
  ticketId: number;
  userId: number;
  text: string;
  filesKeys?: string[] | null;
};

@Table({ tableName: 'ticket_messages' })
export class TicketMessage extends Model<
  TicketMessage,
  TicketMessageCreationAttrs
> {
  @BelongsTo(() => Ticket, 'ticketId')
  declare ticket: Ticket;
  declare ticketId: number;

  @BelongsTo(() => User, 'userId')
  declare user: User;
  declare userId: number;

  @Column({ type: DataType.TEXT })
  declare text: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  declare filesKeys: string[] | null;
}
