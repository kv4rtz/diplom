import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { type Message } from 'src/graphql';
import { OrdersService } from 'src/orders/orders.service';
import { ProductService } from 'src/products/products.service';
import { StorageService } from 'src/storage/storage.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';

@Resolver('Message')
export class MessagesResolver {
  constructor(
    private readonly storageService: StorageService,
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly productsService: ProductService,
    private readonly ordersService: OrdersService,
  ) {}

  @Query()
  @UseGuards(AuthGuard)
  async chatMessages(
    @Args('chatId') chatId: number,
    @Args('pageInfo') pageInfo: PageInfoDto,
    @CtxUser() user: User,
  ) {
    return await this.messagesService.getChatMessages(
      chatId,
      pageInfo,
      user.id,
    );
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async createMessage(@CtxUser() user: User, @Args() dto: CreateMessageDto) {
    return await this.messagesService.createMessage(user.id, dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async updateMessage(@Args() dto: UpdateMessageDto, @CtxUser() user: User) {
    return await this.messagesService.updateMessage(user.id, dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async deleteMessage(@CtxUser() user: User, @Args('id') id: number) {
    return await this.messagesService.deleteMessage(user.id, id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  markMessageAsRead(@CtxUser() user: User, @Args('id') id: number) {
    return this.messagesService.markMessageAsRead(user.id, id);
  }

  @ResolveField()
  async files(@Parent() message: Message) {
    return await this.messagesService.getFilesDownloadUrls(message.id);
  }

  @ResolveField()
  async user(@Parent() message: Message) {
    return await this.usersService.getUserById(Number(message.userId), {
      paranoid: false,
    });
  }

  @ResolveField()
  async product(@Parent() message: Message) {
    const meta = message.metadata;

    let productId: number | null = null;
    if (meta?.productId) productId = meta.productId;
    else if (meta?.orderId) {
      const order = await this.ordersService.getOrderById(meta.orderId);
      productId = order?.productSnapshot?.originalProductId;
    }

    if (productId) {
      return await this.productsService.findById(productId, {
        paranoid: false,
      });
    }
    return null;
  }
}
