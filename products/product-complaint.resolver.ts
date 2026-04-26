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
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { ComplaintProductDto } from './dto/complaint-product.dto';
import { ProductComplaintsOptionsDto } from './dto/product-complaints-options.dto';
import { ProductComplaint } from './models/product-complaints.model';
import { ProductService } from './products.service';

@Resolver('ProductComplaint')
export class ProductComplaintResolver {
  constructor(
    private readonly productService: ProductService,
    private readonly usersService: UsersService,
  ) {}

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('product-complaints.view')
  async productComplaints(
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args() options: ProductComplaintsOptionsDto,
  ) {
    return await this.productService.findProductComplaintsWithPagination({
      ...options,
      pageInfo,
    });
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async createComplaintProduct(
    @Args() dto: ComplaintProductDto,
    @CtxUser() user: User,
  ) {
    return !!(await this.productService.createComplaintProduct({
      ...dto,
      userId: user.id,
    }));
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('product-complaints.change-status')
  async approveProductComplaint(@Args('id') id: number) {
    return !!(await this.productService.approveComplaint(id));
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('product-complaints.change-status')
  async rejectProductComplaint(@Args('id') id: number) {
    return !!(await this.productService.rejectComplaint(id));
  }

  @ResolveField()
  async product(@Parent() productComplaint: ProductComplaint) {
    return await this.productService.findById(productComplaint.productId, {
      paranoid: false,
    });
  }

  @ResolveField()
  async user(@Parent() productComplaint: ProductComplaint) {
    return await this.usersService.getUserById(productComplaint.userId);
  }
}
