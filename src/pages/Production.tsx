
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CardHeader, CardContent, CardFooter, Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clipboard, FileText, PlusCircle, Save } from "lucide-react";
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

interface ProductionEntry {
  date: Date;
  recipeId: string;
  quantity: number;
  notes: string;
  supervisor: string;
}

const Production = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("50");
  const [notes, setNotes] = useState<string>("");
  const [supervisor, setSupervisor] = useState<string>("");

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetch("http://localhost:5001/api/recipes", { credentials: "include" })
      .then((res) => res.json())
      .then(setRecipes)
      .catch((err) => console.error("Failed to fetch recipes", err));
  }, []);

  
  const [productionLog, setProductionLog] = useState<ProductionEntry[]>([
    {
      date: new Date(Date.now() - 86400000), // yesterday
      recipeId: "1",
      quantity: 50,
      notes: "Standard batch",
      supervisor: "John Doe",
    },
    {
      date: new Date(Date.now() - 172800000), // 2 days ago
      recipeId: "2",
      quantity: 45,
      notes: "Extra chocolate",
      supervisor: "Jane Smith",
    },
    {
      date: new Date(Date.now() - 259200000), // 3 days ago
      recipeId: "3",
      quantity: 40,
      notes: "Fresh strawberries",
      supervisor: "Mike Johnson",
    },
  ]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    if (/^\d*$/.test(e.target.value)) {
      setQuantity(e.target.value);
    }
  };

  const handleAddProduction = () => {
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

    setProductionLog([newEntry, ...productionLog]);
    
    // Reset form
    setSelectedRecipe("");
    setQuantity("50");
    setNotes("");
    setSupervisor("");
    
    toast.success("Production log added successfully!");
  };

  const getRecipeById = (id: string): Recipe | undefined => {
    return recipes.find((recipe) => recipe.id === id);
  };

  const getRecipeColor = (recipeName: string) => {
    switch (recipeName.toLowerCase()) {
      case "vanilla":
        return "vanilla";
      case "chocolate":
        return "chocolate";
      case "strawberry":
        return "strawberry";
      case "cookie dough":
        return "cookie";
      case "rocky road":
        return "rocky";
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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Production Tracking</h1>
          <p className="text-muted-foreground">
            Log your daily ice cream production batches.
          </p>
        </div>

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
                <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity (units)</label>
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
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  placeholder="Enter supervisor name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddProduction} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Production Log
              </Button>
            </CardFooter>
          </Card>

          <Card className="lg:col-span-2 hover-scale">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clipboard size={18} className="text-primary" />
                Production History
              </CardTitle>
              <Button variant="outline" size="sm" onClick={exportLog}>
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {productionLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/50 rounded-full p-3 mb-3">
                    <Clipboard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No production logs</h3>
                  <p className="text-muted-foreground mt-1">
                    Add your first production log to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productionLog.map((entry, index) => {
                    const recipe = getRecipeById(entry.recipeId);
                    if (!recipe) return null;
                    
                    const color = getRecipeColor(recipe.name);
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border",
                          `bg-${color}/10 border-${color}/30`
                        )}
                      >
                        <div className="flex flex-col md:flex-row justify-between mb-2">
                          <div className="flex gap-2 items-center">
                            <Badge
                              variant="outline"
                              className={`bg-${color}/20 border-${color}/40 text-${color}-foreground`}
                            >
                              {recipe.name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(entry.date, "PPP")}
                            </span>
                          </div>
                          <div className="font-medium">
                            {entry.quantity} units
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm">
                          <div className="text-muted-foreground">
                            Supervisor: {entry.supervisor}
                          </div>
                          {entry.notes && (
                            <>
                              <div className="hidden md:block text-muted-foreground">•</div>
                              <div className="text-muted-foreground">
                                Notes: {entry.notes}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Production;
