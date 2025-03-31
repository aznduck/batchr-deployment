import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ingredient } from "@/lib/data";
import { UnitConverter } from "@/components/UnitConverter";
import { UnitCategoryType } from "@/lib/units";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { suppliers } from "@/lib/data";

interface AddIngredientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddIngredient: (values: {
    name: string;
    stock: number;
    threshold: number;
    unit: string;
    unitCategory: UnitCategoryType;
    minimumOrderQuantity?: number;
    supplierId?: string;
    upc?: string;
  }) => void;
  onEditIngredient?: (
    id: string,
    values: {
      name: string;
      stock: number;
      threshold: number;
      unit: string;
      unitCategory: UnitCategoryType;
      minimumOrderQuantity?: number;
      supplierId?: string;
      upc?: string;
    }
  ) => void;
  editingIngredient?: Ingredient | null;
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  open,
  onOpenChange,
  onAddIngredient,
  onEditIngredient,
  editingIngredient,
}) => {
  const [name, setName] = useState("");
  const [stock, setStock] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0);
  const [unit, setUnit] = useState("");
  const [unitCategory, setUnitCategory] =
    useState<UnitCategoryType>("dairy_liquid");
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState<
    number | undefined
  >();
  const [supplierId, setSupplierId] = useState<string>("");
  const [upc, setUpc] = useState<string>("");

  useEffect(() => {
    if (editingIngredient) {
      setName(editingIngredient.name);
      setStock(editingIngredient.stock);
      setThreshold(editingIngredient.threshold);
      setUnit(editingIngredient.unit);
      setUnitCategory(editingIngredient.unitCategory || "dairy_liquid");
      setMinimumOrderQuantity(editingIngredient.minimumOrderQuantity);
      setSupplierId(editingIngredient.supplierId || "");
      setUpc(editingIngredient.upc || "");
    }
  }, [editingIngredient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const values = {
      name,
      stock,
      threshold,
      unit,
      unitCategory,
      minimumOrderQuantity,
      supplierId,
      upc,
    };

    if (editingIngredient && onEditIngredient) {
      onEditIngredient(editingIngredient._id, values);
    } else {
      onAddIngredient(values);
    }

    // Reset form
    setName("");
    setStock(0);
    setThreshold(0);
    setUnit("");
    setUnitCategory("dairy_liquid");
    setMinimumOrderQuantity(undefined);
    setSupplierId("");
    setUpc("");

    onOpenChange(false);
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
  };

  const handleUnitCategoryChange = (category: UnitCategoryType) => {
    setUnitCategory(category);
    setUnit(""); // Reset unit when category changes
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {editingIngredient ? "Edit" : "Add New"} Ingredient
          </DialogTitle>
          <DialogDescription>
            {editingIngredient ? "Update" : "Enter"} the details for the
            ingredient.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <UnitConverter
              category={unitCategory}
              initialUnit={unit}
              onUnitChange={handleUnitChange}
              value={stock}
              onValueChange={(value) => setStock(value)}
              showConverter={true}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Current Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  required
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
                  value={minimumOrderQuantity || ""}
                  onChange={(e) =>
                    setMinimumOrderQuantity(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  onValueChange={(value) => setSupplierId(value)}
                  value={supplierId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upc">UPC Code</Label>
              <Input
                id="upc"
                value={upc}
                onChange={(e) => setUpc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">
              {editingIngredient ? "Update" : "Add"} Ingredient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
