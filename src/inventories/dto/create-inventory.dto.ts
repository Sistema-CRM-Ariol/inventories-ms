import { Prisma } from "@prisma/client";
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";


export class CreateInventoryDto implements Prisma.InventoryCreateInput {

    @IsString()
    productId: string;

    @IsString()
    warehouseId: string;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

}
