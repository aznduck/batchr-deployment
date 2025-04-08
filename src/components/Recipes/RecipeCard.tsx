import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recipe, Ingredient } from "@/lib/data";
import { cn } from "@/lib/utils";
import { History, Info, Users, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  ingredients: Ingredient[];
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  className,
  ingredients,
  onEdit,
  onDelete,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(recipe);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(recipe);
    }
    setDeleteDialogOpen(false);
  };

  // Get color based on recipe name
  const getRecipeColor = () => {
    switch (recipe.name.toLowerCase()) {
      default:
        return "ice";
    }
  };

  const color = getRecipeColor();
  const lastBatch = recipe.batches[recipe.batches.length - 1];

  return (
    <div className={cn("perspective-1000 h-full", className)}>
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 preserve-3d cursor-pointer",
          flipped ? "rotate-y-180" : ""
        )}
        onClick={toggleFlip}
      >
        {/* Front Side - Ingredients */}
        <Card
          className={cn(
            "absolute w-full h-full backface-hidden hover-scale",
            `bg-${color}/40 border-${color}/60`
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className={`text-${color}-foreground`}>
                {recipe.name}
              </CardTitle>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 text-${color}-foreground/70 hover:text-${color}-foreground hover:bg-${color}/60`}
                  onClick={handleEdit}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 text-${color}-foreground/70 hover:text-danger hover:bg-${color}/60`}
                  onClick={handleDeleteClick}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <h4
              className={`text-sm font-medium mb-2 text-${color}-foreground/80`}
            >
              Ingredients
            </h4>
            <ul className="space-y-1 text-sm">
              {recipe.ingredients.map((item) => {
                const ingredient = ingredients.find(
                  (i) => i._id === item.ingredientId
                );
                return (
                  ingredient && (
                    <li
                      key={item.ingredientId}
                      className="flex justify-between items-center"
                    >
                      <span className={`text-${color}-foreground/70`}>
                        {ingredient.name}:
                      </span>
                      <span className={`font-medium text-${color}-foreground`}>
                        {item.amount} {ingredient.unit}
                      </span>
                    </li>
                  )
                );
              })}
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs p-1 h-6 text-${color}-foreground/70 hover:text-${color}-foreground hover:bg-${color}/60`}
              onClick={toggleFlip}
            >
              <History size={14} className="mr-1" /> Batch History
            </Button>
          </CardFooter>
        </Card>

        {/* Back Side - Batch History */}
        <Card
          className={cn(
            "absolute w-full h-full backface-hidden rotate-y-180 hover-scale",
            `bg-${color}/40 border-${color}/60`
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className={`text-${color}-foreground`}>
                {recipe.name}{" "}
                <span className="text-base font-normal">History</span>
              </CardTitle>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 text-${color}-foreground/70 hover:text-${color}-foreground hover:bg-${color}/60`}
                  onClick={handleEdit}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 text-${color}-foreground/70 hover:text-danger hover:bg-${color}/60`}
                  onClick={handleDeleteClick}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <h4
              className={`text-sm font-medium mb-2 text-${color}-foreground/80`}
            >
              Recent Batches
            </h4>
            <ul className="space-y-3 text-sm">
              {recipe.batches.map((batch, index) => (
                <li key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className={`text-${color}-foreground border-${color}-foreground/30 bg-${color}/30`}
                    >
                      {new Date(batch.date).toLocaleDateString()}
                    </Badge>
                    <span className={`font-medium text-${color}-foreground`}>
                      {batch.quantity} units
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={12} />
                    <span>{batch.supervisor}</span>
                  </div>
                  {batch.notes && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground mt-1">
                      <Info size={12} className="mt-0.5" />
                      <span>{batch.notes}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs p-1 h-6 text-${color}-foreground/70 hover:text-${color}-foreground hover:bg-${color}/60`}
              onClick={toggleFlip}
            >
              <Info size={14} className="mr-1" /> Ingredients
            </Button>
          </CardFooter>
        </Card>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {recipe.name}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipeCard;
