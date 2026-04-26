import { Module } from '@nestjs/common';
import { ProductModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { GeneralResolver } from './general.resolver';
import { GeneralService } from './general.service';

@Module({
  imports: [ProductModule, UsersModule],
  providers: [GeneralResolver, GeneralService],
})
export class GeneralModule {}
