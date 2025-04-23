import React, { useEffect, useState } from "react";
import { Recipe, Ingredient } from "@/lib/data";
import { recipesApi, ingredientsApi } from "@/lib/api";
import { RecipeCard } from "./RecipeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Plus, UtensilsCrossed } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AddRecipeModal } from "@/components/Recipe/AddRecipeModal";

export const RecipeCarousel: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [recipesData, ingredientsData] = await Promise.all([
          recipesApi.getAll(),
          ingredientsApi.getAll(),
        ]);
        setRecipes(recipesData);
        setIngredients(ingredientsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshRecipes = async () => {
    try {
      const recipesData = await recipesApi.getAll();
      setRecipes(recipesData);
    } catch (error) {
      console.error("Error refreshing recipes:", error);
    }
  };

  return (
    <Card className="hover-scale h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-primary" />
          Recipe Cards
        </CardTitle>
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <Link to="/recipes">Version History</Link>
        </Button>
        <Button
          size="sm"
          className="ml-2"
          onClick={() => setShowAddRecipeModal(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Recipe
        </Button>

        {/* Add Recipe Modal */}
        <AddRecipeModal
          open={showAddRecipeModal}
          onOpenChange={setShowAddRecipeModal}
          onAddRecipe={(recipe) => {
            refreshRecipes();
          }}
          availableIngredients={ingredients}
        />
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col h-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recipes available. Create your first recipe to get started.
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 h-full pb-4">
            <div className="flex space-x-4 px-2 min-w-max h-full">
              {recipes.map((recipe) => (
                <div
                  key={recipe._id}
                  className="flex-shrink-0 w-[280px] sm:w-[300px] h-full min-h-[150px] max-h-[330px] transition-all duration-200 hover:scale-[1.02]"
                >
                  <RecipeCard recipe={recipe} allIngredients={ingredients} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeCarousel;
