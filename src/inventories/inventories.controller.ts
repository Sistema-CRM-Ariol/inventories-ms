// inventories-ms/inventories.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { WarehouseFilterPaginatedDto } from './dto/warehouse-filter-paginated.dto';

@Controller()
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) { }

  @MessagePattern('createInventory')
  async create(@Payload() createInventoryDto: CreateInventoryDto) {
    // Se crea el inventario y, dentro del método create, se emite el evento "inventory.created"
    return await this.inventoriesService.create(createInventoryDto);
  }

  @MessagePattern('updateInventory')
  async update(@Payload() payload: {id: string; updateInventoryDto: UpdateInventoryDto}) {
    // Se actualiza el inventario y se emite el evento "inventory.updated"
    return await this.inventoriesService.update(payload.id, payload.updateInventoryDto);
  }

  @MessagePattern('removeInventory')
  async remove(@Payload() id: string) {
    // Se elimina el inventario y se emite el evento "inventory.deleted"
    return await this.inventoriesService.remove(id);
  }

  @MessagePattern('findAllInventories')
  async findAll(@Payload() warehouseFilterPaginatedDto: WarehouseFilterPaginatedDto) {
    // Este método se utiliza para el listado inicial de inventarios (paginado)
    return await this.inventoriesService.findAll(warehouseFilterPaginatedDto);
  }

  @MessagePattern('findProductsByWarehouseId')
  async findProductsByWarehouseId(@Payload() warehouseId: string) {
    // Este método se utiliza para obtener los productos de un almacén específico
    return await this.inventoriesService.findProductsByWarehouseId(warehouseId);
  }
}
