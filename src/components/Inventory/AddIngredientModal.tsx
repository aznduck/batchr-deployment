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
import { Ingredient, Supplier } from "@/lib/data";
import { UnitConverter } from "@/components/UnitConverter";
import { UnitCategoryType } from "@/lib/units";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [supplierId, setSupplierId] = useState<string>("unassigned");
  const [upc, setUpc] = useState<string>("");
  const [userSuppliers, setUserSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    // Fetch user's suppliers from the backend
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("/api/suppliers");
        if (!response.ok) {
          throw new Error("Failed to fetch suppliers");
        }
        const data = await response.json();
        setUserSuppliers(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (editingIngredient) {
      setName(editingIngredient.name);
      setStock(editingIngredient.stock);
      setThreshold(editingIngredient.threshold);
      setUnit(editingIngredient.unit);
      setUnitCategory(editingIngredient.unitCategory || "dairy_liquid");
      setMinimumOrderQuantity(editingIngredient.minimumOrderQuantity);
      setSupplierId(editingIngredient.supplierId || "unassigned");
      setUpc(editingIngredient.upc || "");
    } else {
      // Reset form when not editing
      setName("");
      setStock(0);
      setThreshold(0);
      setUnit("");
      setUnitCategory("dairy_liquid");
      setMinimumOrderQuantity(undefined);
      setSupplierId("unassigned");
      setUpc("");
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
      supplierId: supplierId === "unassigned" ? undefined : supplierId,
      upc: upc || undefined,
    };

    if (editingIngredient && onEditIngredient) {
      onEditIngredient(editingIngredient._id, values);
    } else {
      onAddIngredient(values);
    }

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
              />
            </div>

            <div className="space-y-2">
              <Label>Unit Category</Label>
              <UnitConverter
                category={unitCategory}
                initialUnit={unit}
                onUnitChange={handleUnitChange}
                showConverter={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Current Stock ({unit})</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">PAR Level ({unit})</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumOrderQuantity">
                  Minimum Order Quantity ({unit})
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
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={supplierId}
                  onValueChange={(value) => setSupplierId(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No Supplier</SelectItem>
                    {userSuppliers &&
                      userSuppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                          {supplier.preferred && " (Preferred)"}
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
                placeholder="Optional"
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
