
import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IngredientCard } from "@/components/Inventory/IngredientCard";
import { AddIngredientModal } from "@/components/Inventory/AddIngredientModal";
import { Ingredient, getIngredientsByUrgency, ingredients as initialIngredients } from "@/lib/data";
import { FilterX, Plus, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Inventory = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("urgency");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleAddIngredient = (values: any) => {
    const newIngredient: Ingredient = {
      id: (ingredients.length + 1).toString(),
      name: values.name,
      stock: Number(values.stock),
      unit: values.unit,
      threshold: Number(values.threshold),
      history: [
        {
          date: new Date().toISOString().split("T")[0],
          level: Number(values.stock),
        },
      ],
    };

    setIngredients([...ingredients, newIngredient]);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    // In a real app, this would open an edit modal
    toast.info(`Edit functionality would open for ${ingredient.name}`, {
      description: "This feature is not implemented in the demo.",
    });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Filter and sort ingredients
  let filteredIngredients = [...ingredients];

  // Apply search filter
  if (searchTerm) {
    filteredIngredients = filteredIngredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply sorting
  if (sortBy === "urgency") {
    filteredIngredients.sort((a, b) => {
      const aPercentage = (a.stock / a.threshold) * 100;
      const bPercentage = (b.stock / b.threshold) * 100;
      return aPercentage - bPercentage;
    });
  } else if (sortBy === "name-asc") {
    filteredIngredients.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "name-desc") {
    filteredIngredients.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === "stock-asc") {
    filteredIngredients.sort((a, b) => a.stock - b.stock);
  } else if (sortBy === "stock-desc") {
    filteredIngredients.sort((a, b) => b.stock - a.stock);
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Ingredient Inventory</h1>
          <p className="text-muted-foreground">
            Manage your ingredients and monitor stock levels.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search ingredients..."
              className="pl-10 pr-10"
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={handleClearSearch}
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="text-muted-foreground h-4 w-4" />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-32 sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgency">Restock Urgency</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                  <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredIngredients.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/50 rounded-full p-3 mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No ingredients found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : "Try adding some ingredients to get started."}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </div>
          ) : (
            filteredIngredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                onEdit={handleEditIngredient}
              />
            ))
          )}
        </div>
      </div>

      <AddIngredientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAddIngredient={handleAddIngredient}
      />
    </Layout>
  );
};

export default Inventory;
