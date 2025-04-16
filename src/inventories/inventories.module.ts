import { Module } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { InventoriesController } from './inventories.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [InventoriesController],
  providers: [InventoriesService],
  imports: [PrismaModule, NatsModule]
})
export class InventoriesModule {}
