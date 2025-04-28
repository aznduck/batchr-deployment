import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { recipeMachineYieldsApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecipeYieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: { id: string; name: string } | null;
}

export function RecipeYieldDialog({
  open,
  onOpenChange,
  recipe,
}: RecipeYieldDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [yields, setYields] = useState<any[]>([]);
  const [newYield, setNewYield] = useState({
    machineId: "",
    tubsPerBatch: 3,
  });

  // Fetch machines and existing yields
  useEffect(() => {
    if (open && recipe) {
      setIsLoading(true);
      Promise.all([
        fetch("/api/machines").then(res => res.json()),
        recipeMachineYieldsApi.getByRecipe(recipe.id)
      ]).then(([machinesData, yieldsData]) => {
        setMachines(machinesData);
        setYields(yieldsData);
        setIsLoading(false);
      }).catch(error => {
        console.error("Error fetching data:", error);
        toast.error("Failed to load machines and yields");
        setIsLoading(false);
      });
    }
  }, [open, recipe]);

  const handleAddYield = async () => {
    if (!newYield.machineId || newYield.tubsPerBatch <= 0) {
      toast.error("Please select a machine and enter a valid tubs per batch value");
      return;
    }

    setIsLoading(true);
    try {
      if (!recipe) {
        toast.error("No recipe selected");
        return;
      }
      
      const machine = machines.find(m => m._id === newYield.machineId);
      const result = await recipeMachineYieldsApi.create({
        recipeId: recipe.id,
        machineId: newYield.machineId,
        tubsPerBatch: newYield.tubsPerBatch,
        notes: `Default yield for ${recipe.name} on ${machine?.name || 'machine'}`
      });

      setYields([...yields, result]);
      setNewYield({
        machineId: "",
        tubsPerBatch: 3,
      });
      toast.success("Recipe yield added successfully");
    } catch (error) {
      console.error("Error adding yield:", error);
      toast.error("Failed to add recipe yield");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveYield = async (yieldId: string) => {
    setIsLoading(true);
    try {
      await recipeMachineYieldsApi.delete(yieldId);
      setYields(yields.filter(y => y._id !== yieldId));
      toast.success("Recipe yield removed");
    } catch (error) {
      console.error("Error removing yield:", error);
      toast.error("Failed to remove recipe yield");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out machines that already have a yield set
  const availableMachines = machines.filter(
    machine => !yields.some(y => y.machineId === machine._id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Machine Yields for {recipe?.name}</DialogTitle>
          <DialogDescription>
            Set the number of tubs that can be produced per batch on each machine.
            This information is used for production scheduling.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Existing Yields */}
            {yields.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="text-sm font-medium">Existing Machine Yields</h3>
                <div className="space-y-2">
                  {yields.map((yieldItem) => {
                    const machine = machines.find(m => m._id === yieldItem.machineId);
                    return (
                      <Card key={yieldItem._id} className="overflow-hidden">
                        <CardContent className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{machine?.name || 'Unknown Machine'}</p>
                            <p className="text-sm text-muted-foreground">{yieldItem.tubsPerBatch} tubs per batch</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveYield(yieldItem._id)}
                          >
                            Remove
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add New Yield */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Add New Machine Yield</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="machine">Machine</Label>
                  <Select
                    value={newYield.machineId}
                    onValueChange={(value) => setNewYield({...newYield, machineId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMachines.length === 0 ? (
                        <SelectItem value="none" disabled>No available machines</SelectItem>
                      ) : (
                        availableMachines.map(machine => (
                          <SelectItem key={machine._id} value={machine._id}>
                            {machine.name} (Capacity: {machine.tubCapacity})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tubsPerBatch">Tubs Per Batch</Label>
                  <Input
                    id="tubsPerBatch"
                    type="number"
                    min="1"
                    step="1"
                    value={newYield.tubsPerBatch}
                    onChange={(e) => setNewYield({...newYield, tubsPerBatch: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <Button 
                className="w-full mt-2" 
                disabled={!newYield.machineId || availableMachines.length === 0 || isLoading}
                onClick={handleAddYield}
              >
                Add Machine Yield
              </Button>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
