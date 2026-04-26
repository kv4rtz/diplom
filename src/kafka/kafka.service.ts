import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  EachMessageHandler,
  Kafka,
  logLevel,
  Partitioners,
  Producer,
} from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private logger = new Logger(KafkaService.name);

  private kafka: Kafka;
  private producer: Producer;

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_EXTERNAL_PORT}`],
      logCreator: (level) => (logEntry) => {
        switch (level) {
          case logLevel.ERROR:
            this.logger.error(logEntry.log.message);
            break;
          case logLevel.WARN:
            this.logger.warn(logEntry.log.message);
            break;
          case logLevel.INFO:
            this.logger.log(logEntry.log.message);
            break;
          case logLevel.DEBUG:
            this.logger.debug(logEntry.log.message);
            break;
          default:
            break;
        }
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
    await this.producer.connect();
  }

  async produce(topic: string, message: string) {
    await this.producer.send({
      topic,
      messages: [{ value: message }],
    });
  }

  async subscribe(topic: string, callback: EachMessageHandler) {
    const consumer = this.kafka.consumer({
      groupId: `${process.env.KAFKA_GROUP_ID}-${topic}-${Date.now()}`,
    });

    await consumer.connect();

    await consumer.subscribe({ topic });

    await consumer.run({
      eachMessage: callback,
    });
  }
}
