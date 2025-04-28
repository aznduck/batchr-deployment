import React, { useState, useEffect } from "react";
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
import { Plus, Trash, ChefHat } from "lucide-react";
import { Ingredient, Recipe } from "@/lib/data";
import { toast } from "sonner";
import { AddIngredientModal } from "@/components/Inventory/AddIngredientModal";
import { ingredientsApi } from "@/lib/api";

interface RecipeIngredient {
  ingredientId: string;
  amount: number;
}

interface AddRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRecipe: (values: {
    name: string;
    ingredients: RecipeIngredient[];
    currentInventory: number;
    weeklyProductionGoal: number;
  }) => void;
  availableIngredients: Ingredient[];
  editingRecipe?: Recipe | null;
  onRefreshIngredients?: () => void;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  open,
  onOpenChange,
  onAddRecipe,
  availableIngredients,
  editingRecipe,
  onRefreshIngredients,
}) => {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [refreshIngredients, setRefreshIngredients] = useState(false);
  const [currentInventory, setCurrentInventory] = useState<number>(0);
  const [weeklyProductionGoal, setWeeklyProductionGoal] = useState<number>(0);

  // Reset form when opening modal or switching recipes
  useEffect(() => {
    if (editingRecipe) {
      setName(editingRecipe.name);
      // Remove any duplicate ingredients that might exist in the data
      const uniqueIngredients = editingRecipe.ingredients.reduce(
        (acc, curr) => {
          if (!acc.some((item) => item.ingredientId === curr.ingredientId)) {
            acc.push(curr);
          }
          return acc;
        },
        [] as RecipeIngredient[]
      );

      if (uniqueIngredients.length !== editingRecipe.ingredients.length) {
        toast.warning("Duplicate ingredients were removed from the recipe");
      }
      setIngredients(uniqueIngredients);
      setSearchQueries(new Array(uniqueIngredients.length).fill(""));
      setCurrentInventory(editingRecipe.currentInventory || 0);
      setWeeklyProductionGoal(editingRecipe.weeklyProductionGoal || 0);
    } else {
      setName("");
      setIngredients([]);
      setSearchQueries([]);
      setCurrentInventory(0);
      setWeeklyProductionGoal(0);
    }
  }, [editingRecipe, open]);

  // Function to handle new ingredient creation
  const handleAddNewIngredient = async (values: {
    name: string;
    stock: number;
    threshold: number;
    unit: string;
    unitCategory: any;
    minimumOrderQuantity?: number;
    supplierId?: string;
    upc?: string;
  }) => {
    try {
      await ingredientsApi.create(values);
      toast.success(`Ingredient "${values.name}" added successfully`);
      setRefreshIngredients(true);
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast.error("Failed to add ingredient");
    }
  };

  // Refresh available ingredients when needed
  useEffect(() => {
    if (refreshIngredients) {
      // This will trigger the parent component to refresh the ingredients list
      // The actual API call happens in the parent component
      setRefreshIngredients(false);
      onRefreshIngredients?.();
    }
  }, [refreshIngredients, onRefreshIngredients]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredientId: "", amount: 0 }]);
    setSearchQueries([...searchQueries, ""]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setSearchQueries(searchQueries.filter((_, i) => i !== index));
  };

  const handleSearchQueryChange = (index: number, value: string) => {
    const newSearchQueries = [...searchQueries];
    newSearchQueries[index] = value;
    setSearchQueries(newSearchQueries);
  };

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredient,
    value: string | number
  ) => {
    const newIngredients = [...ingredients];

    if (field === "ingredientId" && typeof value === "string") {
      // Check if this ingredient is already used in another slot
      const isDuplicate = ingredients.some(
        (ing, i) => i !== index && ing.ingredientId === value
      );

      if (isDuplicate) {
        toast.error("This ingredient is already added to the recipe");
        return;
      }
    }

    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    };
    setIngredients(newIngredients);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!name.trim()) {
      toast.error("Recipe name is required");
      return;
    }

    // Validate ingredients
    for (const ing of ingredients) {
      if (!ing.ingredientId) {
        toast.error("Please select an ingredient for all recipe items");
        return;
      }
      if (ing.amount <= 0) {
        toast.error("Amount must be greater than 0 for all ingredients");
        return;
      }
    }

    onAddRecipe({
      name: name.trim(),
      ingredients: ingredients.map((ing) => ({
        ...ing,
        amount: parseFloat(ing.amount.toString()),
      })),
      currentInventory: parseFloat(currentInventory.toString()),
      weeklyProductionGoal: parseFloat(weeklyProductionGoal.toString()),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[75vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>
              {editingRecipe ? "Edit Recipe" : "Add New Recipe"}
            </DialogTitle>
            <DialogDescription className="mt-3">
              {editingRecipe
                ? "Edit the recipe details and its ingredients."
                : "Enter the recipe details and its required ingredients."}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowIngredientModal(true)}
            className="whitespace-nowrap border-blue-600 bg-blue-50 hover:bg-blue-50 hover:text-blue-700"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Create Ingredient
          </Button>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="grid gap-6 py-4 overflow-y-auto pr-2">
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
              <Label htmlFor="inventory" className="text-right">
                Current Inventory (tubs)
              </Label>
              <Input
                id="inventory"
                type="number"
                value={currentInventory}
                onChange={(e) => setCurrentInventory(Number(e.target.value))}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weeklyGoal" className="text-right">
                Weekly Production Goal (tubs)
              </Label>
              <Input
                id="weeklyGoal"
                type="number"
                min="0"
                step="0.1"
                value={weeklyProductionGoal}
                onChange={(e) => setWeeklyProductionGoal(Number(e.target.value))}
                className="col-span-3"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Ingredients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddIngredient}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>

              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-6">
                    <Select
                      value={ingredient.ingredientId}
                      onValueChange={(value) =>
                        handleIngredientChange(index, "ingredientId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent
                        onCloseAutoFocus={(e) => e.preventDefault()}
                        position="popper"
                      >
                        <div
                          className="sticky top-0 p-2 bg-white border-b z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            placeholder="Search ingredients..."
                            value={searchQueries[index] || ""}
                            onChange={(e) =>
                              handleSearchQueryChange(index, e.target.value)
                            }
                            className="h-8"
                            // Completely isolate the input from Select's keyboard controls
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              // Prevent the dropdown from closing on Enter key press
                              if (e.key === "Enter") {
                                e.preventDefault();
                              }
                              // Stop all keyboard navigation events from bubbling up
                              e.stopPropagation();
                            }}
                            // Prevent the dropdown from controlling focus
                            onFocus={(e) => e.stopPropagation()}
                            onBlur={(e) => e.stopPropagation()}
                          />
                        </div>
                        {availableIngredients
                          .filter((ing) =>
                            ing.name
                              .toLowerCase()
                              .includes(
                                searchQueries[index]?.toLowerCase() || ""
                              )
                          )
                          .map((ing) => {
                            const isSelected = ingredients.some(
                              (i) =>
                                i.ingredientId === ing._id && i !== ingredient
                            );
                            return (
                              <SelectItem
                                key={ing._id}
                                value={ing._id}
                                disabled={isSelected}
                                className={isSelected ? "opacity-50" : ""}
                              >
                                {ing.name} ({ing.unit})
                                {isSelected && " - Already added"}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={ingredient.amount || ""}
                      onChange={(e) =>
                        handleIngredientChange(
                          index,
                          "amount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      step="0.001"
                      min="0"
                      placeholder="Amount"
                      className="w-24"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveIngredient(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={name.trim() === "" || ingredients.length === 0}
            >
              {editingRecipe ? "Save Changes" : "Add Recipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Add Ingredient Modal */}
      <AddIngredientModal
        open={showIngredientModal}
        onOpenChange={setShowIngredientModal}
        onAddIngredient={handleAddNewIngredient}
      />
    </Dialog>
  );
};
