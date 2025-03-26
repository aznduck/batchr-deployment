
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getIngredientsByUrgency, ingredients, recipes } from "@/lib/data";
import { AlertTriangle, CheckCircle, Clock, TrendingDown } from "lucide-react";

export const Stats = () => {
  const lowStockCount = getIngredientsByUrgency().filter(
    (ingredient) => ingredient.stock < ingredient.threshold
  ).length;

  const totalIngredients = ingredients.length;
  const totalRecipes = recipes.length;
  const criticalIngredients = getIngredientsByUrgency().filter(
    (ingredient) => ingredient.stock < ingredient.threshold * 0.5
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover-scale">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockCount}</div>
          <p className="text-xs text-muted-foreground">
            {lowStockCount > 0
              ? "Items below threshold"
              : "All items above threshold"}
          </p>
        </CardContent>
      </Card>

      <Card className="hover-scale">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{criticalIngredients}</div>
          <p className="text-xs text-muted-foreground">
            {criticalIngredients > 0
              ? "Urgent attention needed"
              : "No critical items"}
          </p>
        </CardContent>
      </Card>

      <Card className="hover-scale">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalIngredients}</div>
          <p className="text-xs text-muted-foreground">
            In inventory management
          </p>
        </CardContent>
      </Card>

      <Card className="hover-scale">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Recipes</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRecipes}</div>
          <p className="text-xs text-muted-foreground">
            Recipes in production
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stats;
