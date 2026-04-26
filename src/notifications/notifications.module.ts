import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/kafka/kafka.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [KafkaModule],
  controllers: [],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
