import { Module } from '@nestjs/common';
import { InventoriesModule } from './inventories/inventories.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [InventoriesModule, NatsModule],
})
export class AppModule {}
