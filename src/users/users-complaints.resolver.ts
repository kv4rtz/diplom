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
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { CreateUserComplaintDto } from './dto/create-user-complaint.dto';
import { UserComplaintsOptionsDto } from './dto/user-complaints-options.dto';
import { UserComplaint } from './models/users-complaints.model';
import { User } from './models/users.model';
import { UsersService } from './users.service';

@Resolver('UserComplaint')
export class UsersComplaintsResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('users.complaints.view')
  async userComplaints(
    @Args() pageInfo: PageInfoDto,
    @Args() options: UserComplaintsOptionsDto,
  ) {
    return await this.usersService.findUserComplaintsWithPagination({
      pageInfo: pageInfo,
      ...options,
    });
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async createUserComplaint(
    @Args() dto: CreateUserComplaintDto,
    @CtxUser() user: User,
  ) {
    return await this.usersService.createUserComplaint({
      ...dto,
      creatorId: user.id,
    });
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('users.complaints.change-status')
  async approveUserComplaint(@Args('id') id: number) {
    return !!(await this.usersService.approveUserComplaint(id));
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('users.complaints.change-status')
  async rejectUserComplaint(@Args('id') id: number) {
    return !!(await this.usersService.rejectUserComplaint(id));
  }

  @ResolveField()
  async creator(@Parent() userComplaint: UserComplaint) {
    return await this.usersService.getUserById(userComplaint.creatorId);
  }

  @ResolveField()
  async target(@Parent() userComplaint: UserComplaint) {
    return await this.usersService.getUserById(userComplaint.targetId);
  }
}
