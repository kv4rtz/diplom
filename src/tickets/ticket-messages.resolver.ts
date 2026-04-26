import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { TicketMessage } from './models/ticket-messages.model';
import { TicketsService } from './tickets.service';

@Resolver('TicketMessage')
export class TicketMessagesResolver {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Query()
  @UseGuards(PermissionsGuard)
  async ticketMessages(
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args('ticketId') ticketId: number,
    @CtxUser() user: User,
  ) {
    return await this.ticketsService.getTicketMessagesWithPagination(
      {
        pageInfo,
        ticketId,
      },
      user.id,
    );
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async createTicketMessage(
    @Args() dto: CreateTicketMessageDto,
    @CtxUser() user: User,
  ) {
    return this.ticketsService.createTicketMessage({ ...dto, userId: user.id });
  }

  @ResolveField()
  async files(@Parent() ticketMessage: TicketMessage) {
    if (!ticketMessage.filesKeys?.length) return null;
    return ticketMessage.filesKeys.map(
      async (key) =>
        await this.storageService.getDownloadUrl(key, StorageBuckets.Tickets),
    );
  }

  @ResolveField()
  async user(@Parent() ticketMessage: TicketMessage) {
    return await this.usersService.getUserById(ticketMessage.userId);
  }
}
