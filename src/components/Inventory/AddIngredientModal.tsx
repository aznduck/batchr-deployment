import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Ingredient } from "@/lib/data";

interface AddIngredientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddIngredient: (values: {
    name: string;
    stock: number;
    threshold: number;
    unit: string;
  }) => void;
  onEditIngredient?: (id: string, values: {
    name: string;
    stock: number;
    threshold: number;
    unit: string;
  }) => void;
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
  const [unit, setUnit] = useState("kg");

  useEffect(() => {
    if (editingIngredient) {
      setName(editingIngredient.name);
      setStock(editingIngredient.stock);
      setThreshold(editingIngredient.threshold);
      setUnit(editingIngredient.unit);
    }
  }, [editingIngredient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const values = {
      name,
      stock,
      threshold,
      unit,
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
    setUnit("kg");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingIngredient ? 'Edit' : 'Add New'} Ingredient</DialogTitle>
          <DialogDescription>
            {editingIngredient ? 'Update' : 'Enter'} the details for the ingredient.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="col-span-3"
                required
                min="0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="threshold" className="text-right">
                Threshold
              </Label>
              <Input
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="col-span-3"
                required
                min="0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Unit
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="units">units</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{editingIngredient ? 'Update' : 'Add'} Ingredient</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIngredientModal;
