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
import { TicketStatus, TicketTopic, TicketTopicCategory } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './models/tickets.model';
import { TicketsService } from './tickets.service';

@Resolver('Ticket')
export class TicketsResolver {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('admin.tickets.view')
  async tickets(
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args('status') status: TicketStatus,
    @Args('topic') topic: TicketTopic,
    @Args('topicCategory') topicCategory: TicketTopicCategory,
    @Args('order') order: string,
  ) {
    return await this.ticketsService.getAllTicketsWithPagination({
      pageInfo,
      status,
      topic,
      topicCategory,
      order,
    });
  }

  @Query()
  async myTickets(
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args('status') status: TicketStatus,
    @Args('topic') topic: TicketTopic,
    @Args('topicCategory') topicCategory: TicketTopicCategory,
    @Args('order') order: string,
    @CtxUser() user: User,
  ) {
    return await this.ticketsService.getAllTicketsWithPagination({
      pageInfo,
      authorId: user.id,
      status,
      topic,
      topicCategory,
      order,
    });
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async createTicket(@Args() dto: CreateTicketDto, @CtxUser() user: User) {
    return this.ticketsService.createTicket({ ...dto, authorId: user.id });
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('admin.tickets.take')
  async takeTicket(@Args('ticketId') ticketId: number, @CtxUser() user: User) {
    return !!(await this.ticketsService.takeTicket(ticketId, user.id));
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async resolveTicket(
    @Args('ticketId') ticketId: number,
    @CtxUser() user: User,
  ) {
    return !!(await this.ticketsService.resolveTicket(ticketId, user.id));
  }

  @Query()
  @UseGuards(PermissionsGuard)
  async ticket(@Args('ticketId') ticketId: number, @CtxUser() user: User) {
    return await this.ticketsService.getTicketById(ticketId, user.id);
  }

  @ResolveField()
  async images(@Parent() ticket: Ticket) {
    if (!ticket.imagesKeys?.length) return null;
    return ticket.imagesKeys.map(
      async (key) =>
        await this.storageService.getDownloadUrl(key, StorageBuckets.Tickets),
    );
  }

  @ResolveField()
  async author(@Parent() ticket: Ticket) {
    return await this.usersService.getUserById(ticket.authorId);
  }

  @ResolveField()
  async employee(@Parent() ticket: Ticket) {
    return await this.usersService.getUserById(ticket.employeeId);
  }
}
