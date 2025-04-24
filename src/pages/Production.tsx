import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardContent,
  CardFooter,
  Card,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  Clipboard,
  FileText,
  PlusCircle,
  Save,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Recipe } from "@/lib/data";
import { ProductionEntry, recipesApi, productionApi } from "@/lib/api";

const Production = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");
  const [supervisor, setSupervisor] = useState<string>("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [productionLog, setProductionLog] = useState<any[]>([]);

  // Fetch recipes and production log on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recipes
        const recipesData = await recipesApi.getAll();
        setRecipes(recipesData);

        // Fetch production log
        const logData = await productionApi.getAll();
        setProductionLog(
          logData.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to load data");
      }
    };

    fetchData();
  }, []);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    if (/^\d*$/.test(e.target.value)) {
      setQuantity(e.target.value);
    }
  };

  const handleAddProduction = async () => {
    if (!selectedRecipe) {
      toast.error("Please select a recipe");
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!supervisor) {
      toast.error("Please enter a supervisor name");
      return;
    }

    const newEntry: ProductionEntry = {
      date,
      recipeId: selectedRecipe,
      quantity: parseInt(quantity),
      notes,
      supervisor,
    };

    try {
      // Add production log and update ingredient stocks
      const updatedLog = await productionApi.create(newEntry);

      // Update local state with the new production log
      setProductionLog([
        {
          ...newEntry,
          date: new Date(newEntry.date),
        },
        ...productionLog,
      ]);

      // Reset form
      setSelectedRecipe("");
      setQuantity("1");
      setNotes("");
      setSupervisor("");

      toast.success("Production log added and inventory updated!");
    } catch (err) {
      console.error("Failed to add production:", err);
      toast.error("Failed to add production log");
    }
  };

  const getRecipeById = (id: string): Recipe | undefined => {
    return recipes.find((recipe) => recipe._id === id);
  };

  const getRecipeColor = (recipeName: string) => {
    switch (recipeName.toLowerCase()) {
      default:
        return "ice";
    }
  };

  const exportLog = () => {
    toast.info("Export functionality", {
      description: "This would export the production log as CSV or PDF.",
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 hover-scale">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle size={18} className="text-primary" />
                New Production Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe</label>
                <Select
                  value={selectedRecipe}
                  onValueChange={setSelectedRecipe}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipe" />
                  </SelectTrigger>
                  <SelectContent
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    position="popper"
                  >
                    <div
                      className="sticky top-0 p-2 bg-white border-b z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search recipes..."
                          value={recipeSearchQuery}
                          onChange={(e) => setRecipeSearchQuery(e.target.value)}
                          className="h-9 pl-8"
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
                    </div>
                    {recipes
                      .filter((recipe) =>
                        recipe.name
                          .toLowerCase()
                          .includes(recipeSearchQuery.toLowerCase())
                      )
                      .map((recipe) => (
                        <SelectItem key={recipe._id} value={recipe._id}>
                          {recipe.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="text"
                  value={quantity}
                  onChange={handleQuantityChange}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Supervisor</label>
                <Input
                  type="text"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  placeholder="Enter supervisor name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddProduction} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Production Log
              </Button>
            </CardFooter>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  Production History
                </CardTitle>
                <Button variant="outline" size="sm" onClick={exportLog}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {productionLog.map((entry, index) => {
                  const recipe = getRecipeById(entry.recipeId);
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {recipe?.name || "Unknown Recipe"}
                            </span>
                            <Badge>{entry.quantity} units</Badge>
                          </div>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{format(entry.date, "PPP")}</span>
                            <span>•</span>
                            <span>{entry.supervisor}</span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < productionLog.length - 1 && (
                        <Separator className="mt-6" />
                      )}
                    </div>
                  );
                })}
                {productionLog.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No production logs yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Production;
