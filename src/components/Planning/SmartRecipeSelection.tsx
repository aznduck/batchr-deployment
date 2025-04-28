import React, { useState, useEffect } from "react";
import { Recipe } from "@/lib/data";
import { RecipeMachineYield } from "@/lib/production";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, PlusCircle, MinusCircle, Target, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SmartRecipeSelectionProps {
  recipes: Recipe[];
  recipeMachineYields: RecipeMachineYield[];
  selectedRecipes: Array<{
    recipeId: string;
    plannedAmount: number;
  }>;
  onRecipesChange: (recipes: Array<{ recipeId: string; plannedAmount: number }>) => void;
}

const SmartRecipeSelection: React.FC<SmartRecipeSelectionProps> = ({
  recipes,
  recipeMachineYields,
  selectedRecipes,
  onRecipesChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes);

  // Filter recipes based on search term
  useEffect(() => {
    setFilteredRecipes(
      recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, recipes]);

  // Calculate suggested amount for a recipe (weeklyGoal - currentInventory)
  const calculateSuggestedAmount = (recipe: Recipe): number => {
    const weeklyGoal = recipe.weeklyProductionGoal || 0;
    const currentInventory = recipe.currentInventory || 0;
    
    // If weekly goal is set and higher than current inventory, suggest the difference
    if (weeklyGoal > 0 && weeklyGoal > currentInventory) {
      return parseFloat((weeklyGoal - currentInventory).toFixed(1));
    }
    return 0;
  };

  // Check if recipe is selected
  const isRecipeSelected = (recipeId: string): boolean => {
    return selectedRecipes.some((r) => r.recipeId === recipeId);
  };

  // Get planned amount for a recipe
  const getPlannedAmount = (recipeId: string): number => {
    const recipe = selectedRecipes.find((r) => r.recipeId === recipeId);
    return recipe ? recipe.plannedAmount : 0;
  };

  // Toggle recipe selection
  const toggleRecipeSelection = (recipe: Recipe) => {
    if (isRecipeSelected(recipe._id)) {
      // Remove recipe
      onRecipesChange(selectedRecipes.filter((r) => r.recipeId !== recipe._id));
    } else {
      // Add recipe with suggested amount
      const suggestedAmount = calculateSuggestedAmount(recipe);
      onRecipesChange([
        ...selectedRecipes,
        { recipeId: recipe._id, plannedAmount: suggestedAmount },
      ]);
    }
  };

  // Update planned amount for a recipe
  const updatePlannedAmount = (recipeId: string, amount: number) => {
    // Ensure amount is not negative
    const validAmount = Math.max(0, amount);
    
    // Update recipe
    onRecipesChange(
      selectedRecipes.map((r) =>
        r.recipeId === recipeId ? { ...r, plannedAmount: validAmount } : r
      )
    );
  };

  // Handle increment/decrement amount
  const adjustAmount = (recipeId: string, delta: number) => {
    const currentAmount = getPlannedAmount(recipeId);
    updatePlannedAmount(recipeId, parseFloat((currentAmount + delta).toFixed(1)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-gray-400" />
        <Input 
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="space-y-3">
          {filteredRecipes.map((recipe) => (
            <Card 
              key={recipe._id} 
              className={`${
                isRecipeSelected(recipe._id) 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200"
              } transition-colors`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isRecipeSelected(recipe._id)}
                      onCheckedChange={() => toggleRecipeSelection(recipe)}
                      id={`recipe-${recipe._id}`}
                    />
                    <Label htmlFor={`recipe-${recipe._id}`} className="font-medium cursor-pointer">
                      {recipe.name}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Inventory Badge */}
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      <span className="flex items-center gap-1">
                        <span>📦</span>
                        {recipe.currentInventory?.toFixed(1) || "0"}
                      </span>
                    </Badge>
                    
                    {/* Weekly Goal Badge */}
                    {(recipe.weeklyProductionGoal || 0) > 0 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                      >
                        <span className="flex items-center gap-1">
                          <span>🎯</span>
                          {recipe.weeklyProductionGoal?.toFixed(1) || "0"}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>

                {isRecipeSelected(recipe._id) && (
                  <div className="mt-3 pl-6">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm w-40">Planned Amount (tubs):</Label>
                      <div className="flex items-center gap-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => adjustAmount(recipe._id, -0.1)}
                        >
                          <MinusCircle className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={getPlannedAmount(recipe._id)}
                          onChange={(e) => updatePlannedAmount(recipe._id, parseFloat(e.target.value) || 0)}
                          className="w-20 text-center h-8"
                        />
                        
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => adjustAmount(recipe._id, 0.1)}
                        >
                          <PlusCircle className="h-3 w-3" />
                        </Button>
                        
                        {calculateSuggestedAmount(recipe) > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 ml-2 text-xs"
                                  onClick={() => updatePlannedAmount(
                                    recipe._id, 
                                    calculateSuggestedAmount(recipe)
                                  )}
                                >
                                  <Target className="h-3 w-3 mr-1" />
                                  Suggest: {calculateSuggestedAmount(recipe)}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Suggested amount based on weekly goal minus current inventory</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Info about recipe yields if available */}
                    {recipeMachineYields.some(rmy => rmy.recipeId === recipe._id) && (
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mr-1" />
                        Machine yields found for this recipe
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Summary */}
      {selectedRecipes.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border">
          <p className="text-sm font-medium mb-2">Selected Recipes: {selectedRecipes.length}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selectedRecipes.map(({ recipeId, plannedAmount }) => {
              const recipe = recipes.find((r) => r._id === recipeId);
              return recipe ? (
                <Badge key={recipeId} variant="secondary" className="justify-between">
                  <span>{recipe.name}</span>
                  <span className="ml-2 font-semibold">{plannedAmount.toFixed(1)}</span>
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRecipeSelection;
