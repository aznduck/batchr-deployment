import React from "react";
import { Recipe } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Ingredient } from "@/lib/data";

interface RecipeCardProps {
  recipe: Recipe;
  allIngredients: Ingredient[];
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  allIngredients,
}) => {
  // Find the corresponding ingredient data for each ingredient in the recipe
  const recipeIngredients = recipe.ingredients.map((ingredient) => {
    const ingredientData = allIngredients.find(
      (i) => i._id === ingredient.ingredientId
    );
    return {
      name: ingredientData?.name || "Unknown Ingredient",
      amount: ingredient.amount,
      unit: ingredientData?.unit || "units",
    };
  });

  // Get notes from batches if any exist
  const notes =
    recipe.batches && recipe.batches.length > 0
      ? recipe.batches.map((batch) => batch.notes).filter(Boolean)
      : ["No notes available"];

  // Get the version number from the history or default to 1.0
  const versionNumber =
    recipe.versionHistory && recipe.versionHistory.length > 0
      ? recipe.versionHistory.length + 1
      : 1;

  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-sm border-2 border-border/40">
      <CardHeader className="p-3 pb-2 border-b bg-secondary/50 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h3 className="text-sm">{recipe.name}</h3>
          <div className="text-xs text-purple-500 bg-purple-100 px-2 py-1 rounded-full">
            Vers. {versionNumber}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-auto">
        <div className="h-full p-3 flex flex-col">
          <p className="text-xs font-medium mb-2 flex-shrink-0">Ingredients:</p>
          <div className="flex flex-col space-y-1 flex-1 overflow-y-auto">
            {recipeIngredients.map((ing, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="mr-1.5 text-primary text-xs">•</span>
                  <span className="text-xs">{ing.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {ing.amount} {ing.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
