import { Injectable } from '@nestjs/common';
import { ProductService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GeneralService {
  constructor(
    private readonly usersService: UsersService,
    private readonly productsService: ProductService,
  ) {}

  async countsOnlineAndProducts() {
    return {
      countOnline: await this.usersService.countOnlineUsers(),
      countProducts: await this.productsService.countActiveProducts(),
    };
  }
}
