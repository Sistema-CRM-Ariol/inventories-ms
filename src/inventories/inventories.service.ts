// inventories-ms/inventories.service.ts
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { WarehouseFilterPaginatedDto } from './dto/warehouse-filter-paginated.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config/services';

@Injectable()
export class InventoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICE) // Para responder solicitudes
    private readonly natsClient: ClientProxy,
  ) { }

  async create(createInventoryDto: CreateInventoryDto) {
    const existingInventory = await this.prisma.inventory.findFirst({
      where: {
        productId: createInventoryDto.productId,
        warehouseId: createInventoryDto.warehouseId,
      },
    });

    if (existingInventory) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Ya se registro este item en este almacén',
      });
    }

    const productExists = await firstValueFrom(
      this.natsClient.send('findProductsByIds', [createInventoryDto.productId])
    );

    if( productExists.length === 0  ){
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No se encontro el producto',
      });
    }
    const inventory = await this.prisma.inventory.create({
      data: createInventoryDto,
    })

    const inventoryItem = {
      ...inventory,
      product: productExists[0],
    }

    this.natsClient.emit('inventory.created', inventoryItem);

    return {
      message: "Item registrado con exito",
      inventory: inventoryItem
    };
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {

    const inventory = await this.prisma.inventory.update({
      where: { id },
      data: updateInventoryDto,
    });


    const product = await firstValueFrom(
      this.natsClient.send('findProductsByIds', [inventory.productId])
    );
    const inventoryItem = {
      ...inventory,
      product: product[0],
    }
    this.natsClient.emit('inventory.updated', inventoryItem);
    return {
      message: "Item actualizado con exito",
      inventory: inventoryItem
    };
  }

  async remove(id: string) {
    const deleted = await this.prisma.inventory.delete({
      where: { id },
    });

    // Emitir evento de eliminación
    this.natsClient.emit('inventory.deleted', deleted);
    return deleted;
  }

  async findAll(warehouseFilterPaginatedDto: WarehouseFilterPaginatedDto) {
    const { warehouseId, page, limit } = warehouseFilterPaginatedDto;

    const whereClause: any = { isActive: true };
    if (warehouseId) {
      whereClause['warehouseId'] = warehouseId;
    }

    const [inventories, totalInventories] = await this.prisma.$transaction([
      this.prisma.inventory.findMany({
        where: whereClause,
        take: limit ?? 10,
        skip: (page! - 1) * (limit ?? 10)
      }),
      this.prisma.inventory.count({ where: whereClause }),
    ]);

    const productIds = inventories.map(inv => inv.productId);

    const productsData = await firstValueFrom(
      this.natsClient.send('findProductsByIds', productIds)
    );

    console.log(productsData)

    const inventory = inventories.map(inv => ({
      id: inv.id,
      quantity: inv.quantity,
      warehouseId: inv.warehouseId,
      product: productsData.find((p: any) => p.id === inv.productId),
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }));

    const lastPage = Math.ceil(totalInventories / (limit ?? 10));

    return {
      inventory,
      meta: {
        page,
        lastPage,
        total: totalInventories,
      },
    };
  }
}
