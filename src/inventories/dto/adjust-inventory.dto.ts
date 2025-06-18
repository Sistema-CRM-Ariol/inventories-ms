interface AdjustInventoryDto {
    productId: string;
    warehouseId: string;
    quantityOrdered: number; // cantidad a sumar (puede ser positiva o negativa según casos)
}