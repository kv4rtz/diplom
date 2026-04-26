import { ResolveField, Resolver } from '@nestjs/graphql';
import { type ChatMember } from 'src/graphql';
import { UsersService } from 'src/users/users.service';

@Resolver('ChatMember')
export class ChatsMembersResolver {
  constructor(private readonly usersService: UsersService) {}

  @ResolveField()
  async user(chatMember: ChatMember) {
    return await this.usersService.getUserById(Number(chatMember.userId), {
      paranoid: false,
    });
  }
}
