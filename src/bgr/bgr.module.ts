import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersModule } from 'src/orders/orders.module';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { UsersModule } from 'src/users/users.module';
import { BgrService } from './bgr.service';
import { BgrHistory } from './models/bgr-history.model';
import { BgrPenalty } from './models/bgr-penalty.model';

@Module({
  imports: [
    SequelizeModule.forFeature([BgrHistory, BgrPenalty]),
    OrdersModule,
    ReviewsModule,
    forwardRef(() => UsersModule),
  ],
  providers: [BgrService],
  exports: [BgrService],
})
export class BgrModule {}
