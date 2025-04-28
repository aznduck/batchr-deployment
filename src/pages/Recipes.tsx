import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/Recipes/RecipeCard";
import { FilterX, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Recipe, Ingredient } from "@/lib/data";
import { AddRecipeModal } from "@/components/Recipe/AddRecipeModal";
import { recipesApi, ingredientsApi } from "@/lib/api";

// Custom loading spinner component with reliable animation
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-40">
    <div className="spinner-border h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full" />
  </div>
);

const Recipes = () => {
  const initialRecipes: Recipe[] = [];
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [refreshIngredientsKey, setRefreshIngredientsKey] = useState(0);
  const [isLoading, setIsLoading] = useState({
    recipes: false,
    ingredients: false,
  });
  const [error, setError] = useState({
    recipes: null,
    ingredients: null,
  });

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading((prev) => ({ ...prev, recipes: true }));
      setError((prev) => ({ ...prev, recipes: null }));
      try {
        const data = await recipesApi.getAll();
        setRecipes(data);
      } catch (err) {
        console.error("Failed to fetch recipes", err);
        setError((prev) => ({
          ...prev,
          recipes: "Failed to load recipes. Please try again.",
        }));
        toast.error("Failed to fetch recipes");
      } finally {
        setIsLoading((prev) => ({ ...prev, recipes: false }));
      }
    };

    const fetchIngredients = async () => {
      setIsLoading((prev) => ({ ...prev, ingredients: true }));
      setError((prev) => ({ ...prev, ingredients: null }));
      try {
        const data = await ingredientsApi.getAll();
        setIngredients(data);
      } catch (err) {
        console.error("Failed to fetch ingredients", err);
        setError((prev) => ({
          ...prev,
          ingredients: "Failed to load ingredients. Please try again.",
        }));
        toast.error("Failed to fetch ingredients");
      } finally {
        setIsLoading((prev) => ({ ...prev, ingredients: false }));
      }
    };

    fetchRecipes();
    fetchIngredients();
  }, [refreshIngredientsKey]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleAddRecipe = async (values: {
    name: string;
    ingredients: { ingredientId: string; amount: number }[];
    currentInventory: number;
    weeklyProductionGoal: number;
  }) => {
    try {
      if (editingRecipe) {
        // Update existing recipe
        await recipesApi.update(editingRecipe._id, values);
        toast.success(`Recipe ${values.name} updated successfully`);
        
        // Update local state
        setRecipes((prevRecipes) =>
          prevRecipes.map((recipe) =>
            recipe._id === editingRecipe._id
              ? { ...recipe, ...values }
              : recipe
          )
        );
      } else {
        // Create new recipe
        const newRecipe = await recipesApi.create(values);
        setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
        toast.success(`Recipe ${values.name} added successfully`);
      }
      
      setEditingRecipe(null);
    } catch (error) {
      console.error("Error adding/updating recipe:", error);
      toast.error("Failed to save recipe");
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      await recipesApi.delete(recipe._id);
      setRecipes(recipes.filter((r) => r._id !== recipe._id));
      toast.success(`Recipe "${recipe.name}" deleted successfully!`);
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe");
    }
  };

  const handleRefreshIngredients = () => {
    setRefreshIngredientsKey((prev) => prev + 1);
  };

  // Filter recipes based on search term
  const filteredRecipes = searchTerm
    ? recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : recipes;

  return (
    <Layout>
      {/* Add the spinner CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner-border {
            animation: spin 1s linear infinite;
          }
        `,
        }}
      />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative max-w-sm w-80">
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
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Recipe Library</h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {filteredRecipes.length} Recipes
            </Badge>
          </div>

          {isLoading.recipes ? (
            <LoadingSpinner />
          ) : error.recipes ? (
            <div className="text-center text-red-500 py-4">
              {error.recipes}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 mx-auto block"
                onClick={() => {
                  const fetchRecipes = async () => {
                    setIsLoading((prev) => ({ ...prev, recipes: true }));
                    setError((prev) => ({ ...prev, recipes: null }));
                    try {
                      const data = await recipesApi.getAll();
                      setRecipes(data);
                    } catch (err) {
                      console.error("Failed to fetch recipes", err);
                      setError((prev) => ({
                        ...prev,
                        recipes: "Failed to load recipes. Please try again.",
                      }));
                    } finally {
                      setIsLoading((prev) => ({ ...prev, recipes: false }));
                    }
                  };
                  fetchRecipes();
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredRecipes.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/50 rounded-full p-3 mb-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No recipes found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm
                      ? `No results for "${searchTerm}"`
                      : "Try adding a recipe to get started."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setAddModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipe
                  </Button>
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe._id}
                    recipe={recipe}
                    ingredients={ingredients}
                    onEdit={() => setEditingRecipe(recipe)}
                    onDelete={() => handleDeleteRecipe(recipe)}
                    className="h-[400px]"
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <AddRecipeModal
        open={addModalOpen || !!editingRecipe}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) setEditingRecipe(null);
        }}
        onAddRecipe={handleAddRecipe}
        availableIngredients={ingredients}
        editingRecipe={editingRecipe}
        onRefreshIngredients={handleRefreshIngredients}
      />
    </Layout>
  );
};

export default Recipes;
