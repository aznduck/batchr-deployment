import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight, PlaneTakeoff } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import {
  productionPlansApi,
  recipesApi,
  recipeMachineYieldsApi,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Recipe } from "@/lib/data";
import { RecipeMachineYield } from "@/lib/production";
import SmartRecipeSelection from "./SmartRecipeSelection";

interface EnhancedProductionPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanAdded?: () => void;
}

const EnhancedProductionPlanDialog: React.FC<
  EnhancedProductionPlanDialogProps
> = ({ isOpen, onClose, onPlanAdded }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
    notes: "",
  });

  // Recipe selections
  const [selectedRecipes, setSelectedRecipes] = useState<
    Array<{
      recipeId: string;
      plannedAmount: number;
    }>
  >([]);

  // Active tab
  const [activeTab, setActiveTab] = useState("details");

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch recipes
  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: recipesApi.getAll,
  });

  // Fetch recipe machine yields
  const { data: recipeMachineYields = [] } = useQuery({
    queryKey: ["recipeMachineYields"],
    queryFn: recipeMachineYieldsApi.getAll,
  });

  // Reset form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
        notes: "",
      });
      setSelectedRecipes([]);
      setActiveTab("details");
    }
  }, [isOpen]);

  const validateDetailsForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Please enter a plan name");
      return false;
    }
    return true;
  };

  const validateRecipeSelections = (): boolean => {
    if (selectedRecipes.length === 0) {
      toast.error("Please select at least one recipe");
      return false;
    }

    // Check that all recipes have a planned amount greater than 0
    const invalidRecipe = selectedRecipes.find((r) => r.plannedAmount <= 0);
    if (invalidRecipe) {
      const recipeName =
        recipes.find((r) => r._id === invalidRecipe.recipeId)?.name ||
        "Unknown";
      toast.error(`Planned amount for ${recipeName} must be greater than 0`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on active tab
    if (activeTab === "details" && !validateDetailsForm()) {
      return;
    }

    if (activeTab === "recipes" && !validateRecipeSelections()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the production plan with recipes
      await productionPlansApi.create({
        name: formData.name,
        weekStartDate: formData.weekStartDate,
        notes: formData.notes,
        recipes: selectedRecipes,
      });

      toast.success("Production plan created successfully");

      // Call the callback if provided
      if (onPlanAdded) {
        onPlanAdded();
      }

      // Close the dialog
      onClose();
    } catch (err) {
      console.error("Error creating production plan:", err);
      toast.error(
        "Failed to create production plan: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Production Plan</DialogTitle>
          <DialogDescription>
            Plan your production schedule with intelligent scheduling.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Plan Details</TabsTrigger>
            <TabsTrigger value="recipes">Recipe Selection</TabsTrigger>
            <TabsTrigger value="review">Review & Create</TabsTrigger>
          </TabsList>

          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="details" className="space-y-4 mt-0">
                {/* Plan Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Plan Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Weekly Production Plan"
                    className="col-span-3"
                  />
                </div>

                {/* Week Start Date */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="weekStartDate" className="text-right">
                    Week Start
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="weekStartDate"
                      name="weekStartDate"
                      type="date"
                      value={format(formData.weekStartDate, "yyyy-MM-dd")}
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : new Date();
                        setFormData((prev) => ({
                          ...prev,
                          weekStartDate: date,
                        }));
                      }}
                      className="mb-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Week: {format(formData.weekStartDate, "MMM d")} -{" "}
                      {format(
                        addDays(formData.weekStartDate, 6),
                        "MMM d, yyyy"
                      )}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right pt-2">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any notes about this production plan"
                    className="col-span-3 min-h-[100px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="recipes" className="mt-0">
                <SmartRecipeSelection
                  recipes={recipes}
                  recipeMachineYields={recipeMachineYields}
                  selectedRecipes={selectedRecipes}
                  onRecipesChange={setSelectedRecipes}
                />
              </TabsContent>

              <TabsContent value="review" className="mt-0 space-y-4">
                <div className="bg-muted rounded-md p-4">
                  <h3 className="font-medium text-lg mb-2">Plan Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Name:</div>
                    <div>{formData.name}</div>

                    <div className="font-medium">Week:</div>
                    <div>
                      {format(formData.weekStartDate, "MMM d")} -{" "}
                      {format(
                        addDays(formData.weekStartDate, 6),
                        "MMM d, yyyy"
                      )}
                    </div>

                    {formData.notes && (
                      <>
                        <div className="font-medium">Notes:</div>
                        <div className="whitespace-pre-line">
                          {formData.notes}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-muted rounded-md p-4">
                  <h3 className="font-medium text-lg mb-2">Selected Recipes</h3>
                  {selectedRecipes.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRecipes.map(({ recipeId, plannedAmount }) => {
                        const recipe = recipes.find((r) => r._id === recipeId);
                        return recipe ? (
                          <div
                            key={recipeId}
                            className="flex justify-between items-center py-1 border-b"
                          >
                            <span className="font-medium">{recipe.name}</span>
                            <span>{plannedAmount.toFixed(1)} tubs</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No recipes selected</p>
                  )}
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="mt-4 gap-2">
              {activeTab === "details" && (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateDetailsForm()) {
                      setActiveTab("recipes");
                    }
                  }}
                >
                  Next: Select Recipes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {activeTab === "recipes" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("details")}
                  >
                    Back to Details
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      if (validateRecipeSelections()) {
                        setActiveTab("review");
                      }
                    }}
                  >
                    Review Plan <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              {activeTab === "review" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("recipes")}
                  >
                    Back to Recipes
                  </Button>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Plan"
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedProductionPlanDialog;
