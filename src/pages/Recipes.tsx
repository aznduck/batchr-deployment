
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/Recipes/RecipeCard";
import { FilterX, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Recipe } from "@/lib/data";

const Recipes = () => {
  const initialRecipes: Recipe[] = [];
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/recipes`, {
          credentials: "include",
        });
        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        console.error("Failed to fetch recipes", err);
      }
    };
  
    fetchRecipes();
  }, []);
  

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleAddRecipe = () => {
    toast.info("Add recipe functionality", {
      description: "This feature would allow creating new recipes.",
    });
  };

  // Filter recipes based on search term
  const filteredRecipes = searchTerm
    ? recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : recipes;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground">
              Manage your ice cream recipes and production records.
            </p>
          </div>
          <Button onClick={handleAddRecipe}>
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        </div>

        <div className="flex items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recipes..."
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
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Recipe Library</h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {filteredRecipes.length} Recipes
            </Badge>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/50 rounded-full p-3 mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No recipes found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : "Try adding a recipe to get started."}
              </p>
              <Button variant="outline" className="mt-4" onClick={handleAddRecipe}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} className="h-[290px]" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Recipes;
