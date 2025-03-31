import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitConverter } from "@/components/UnitConverter";
import { UnitCategoryType } from "@/lib/units";
import { useForm } from "react-hook-form";

interface AddIngredientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewIngredient) => void;
}

interface NewIngredient {
  name: string;
  stock: number;
  unit: string;
  unitCategory: UnitCategoryType;
  threshold: number;
  minimumOrderQuantity?: number;
  supplierUnit?: string;
  upc?: string;
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<NewIngredient>({
    defaultValues: {
      unitCategory: "dairy_liquid",
    },
  });

  const selectedUnit = watch("unit");
  const selectedCategory = watch("unitCategory");

  const handleUnitChange = (unit: string) => {
    setValue("unit", unit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Ingredient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>

          <UnitConverter
            category={selectedCategory}
            initialUnit={selectedUnit}
            onUnitChange={handleUnitChange}
            showConverter={false}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock</Label>
              <Input
                id="stock"
                type="number"
                {...register("stock", { required: true, min: 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                type="number"
                {...register("threshold", { required: true, min: 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimumOrderQuantity">
                Minimum Order Quantity
              </Label>
              <Input
                id="minimumOrderQuantity"
                type="number"
                {...register("minimumOrderQuantity", { min: 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierUnit">Supplier Unit</Label>
              <Input id="supplierUnit" {...register("supplierUnit")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upc">UPC Code</Label>
            <Input id="upc" {...register("upc")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Ingredient</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
