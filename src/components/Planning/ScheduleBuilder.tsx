import React, { useState, useEffect } from "react";
import { format, getDay } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { ProductionBlock } from "@/lib/productionBlock";
import { Machine } from "@/lib/machine";
import { Employee } from "@/lib/employee";
import { Recipe } from "@/lib/data";
import {
  productionBlocksApi,
  machinesApi,
  employeesApi,
  recipesApi,
  productionPlansApi,
} from "@/lib/api";

interface ScheduleBuilderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBlockAdded?: (block: ProductionBlock) => void;
  onBlockUpdated?: (block: ProductionBlock) => void;
  onBlockDeleted?: (blockId: string) => void;
  planId?: string;
}

const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({
  isOpen,
  onOpenChange,
  onBlockAdded,
  onBlockUpdated,
  onBlockDeleted,
  planId,
}) => {
  // Extended interface for the form state that includes additional UI properties
  interface ExtendedProductionBlock extends ProductionBlock {
    plan?: any; // Store the full plan object for UI purposes
  }

  // State for form data
  const [selectedBlock, setSelectedBlock] = useState<ExtendedProductionBlock>({
    _id: "",
    startTime: new Date().toISOString(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
    blockType: "production",
    day: "Monday",
    status: "scheduled",
    notes: "",
    planId: "",
    plan: null,
  });
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    blocks: false,
    machines: false,
    employees: false,
    recipes: false,
    plans: false,
  });

  // Reset the selected block when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBlock({
        _id: "",
        startTime: new Date().toISOString(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        blockType: "production",
        day: "Monday",
        status: "scheduled",
        notes: "",
        planId: "",
        plan: null,
      });
    }
  }, [isOpen]);

  // Fetch machines and employees when component mounts
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading((prev) => ({
        ...prev,
        machines: true,
        employees: true,
        recipes: true,
        plans: true,
      }));
      try {
        // Fetch machines
        const fetchedMachines = await machinesApi.getAll();
        setMachines(fetchedMachines as Machine[]);

        // Fetch employees
        const fetchedEmployees = await employeesApi.getAll();
        setEmployees(fetchedEmployees as Employee[]);

        // Fetch recipes
        const fetchedRecipes = await recipesApi.getAll();
        setRecipes(fetchedRecipes as Recipe[]);

        // Fetch production plans
        const fetchedPlans = await productionPlansApi.getAll();
        setPlans(fetchedPlans as any[]);

        // If a planId is provided via props, pre-select that plan
        if (planId) {
          const selectedPlan = (fetchedPlans as any[]).find((p) => p._id === planId);
          setSelectedBlock((prev) => ({
            ...prev,
            planId: planId,
            plan: selectedPlan,
          }));
        }
      } catch (err) {
        console.error("Error fetching resources:", err);
        toast.error("Failed to load resources");
      } finally {
        setIsLoading((prev) => ({
          ...prev,
          machines: false,
          employees: false,
          recipes: false,
          plans: false,
        }));
      }
    };

    if (isOpen) {
      fetchResources();
    }
  }, [isOpen, planId]);

  const handleSaveBlock = async () => {
    setIsLoading((prev) => ({ ...prev, blocks: true }));

    try {
      // Validate that a plan is selected
      if (!selectedBlock.planId) {
        toast.error("Please select a production plan");
        setIsLoading((prev) => ({ ...prev, blocks: false }));
        return;
      }

      // Prepare the block data for API
      const blockData = {
        startTime: new Date(selectedBlock.startTime),
        endTime: new Date(selectedBlock.endTime),
        blockType: selectedBlock.blockType,
        machineId: selectedBlock.machine?._id || "",
        employeeId: selectedBlock.assignedEmployee?._id || "",
        day: selectedBlock.day || "Monday",
        notes: selectedBlock.notes || "",
        planId: selectedBlock.planId,
      };

      console.log("Sending block data with day:", blockData.day);

      // For production blocks, add recipe and quantity
      if (selectedBlock.blockType === "production") {
        if (selectedBlock.recipe?._id) {
          Object.assign(blockData, { recipeId: selectedBlock.recipe._id });
        }
        if (selectedBlock.plannedQuantity) {
          Object.assign(blockData, { quantity: selectedBlock.plannedQuantity });
        }
      }

      // Determine if this is a new block or an update
      if (!selectedBlock._id || selectedBlock._id === "") {
        // Create a new block
        const response = await productionBlocksApi.create(blockData);

        // Type assertion for the response
        const createdBlockResponse = response as { _id: string };

        // Create a complete block object with the response data
        const createdBlock: ProductionBlock = {
          ...selectedBlock,
          _id: createdBlockResponse._id || selectedBlock._id,
        };

        // If this is a production block, automatically create prep and cleaning blocks
        if (selectedBlock.blockType === "production") {
          try {
            // Calculate the times for prep and cleaning blocks (15 minutes each)
            const prodStartTime = new Date(selectedBlock.startTime);
            const prodEndTime = new Date(selectedBlock.endTime);
            
            // Prep block (15 minutes before production)
            const prepStartTime = new Date(prodStartTime);
            prepStartTime.setMinutes(prepStartTime.getMinutes() - 15);
            const prepEndTime = new Date(prodStartTime);
            
            // Cleaning block (15 minutes after production)
            const cleaningStartTime = new Date(prodEndTime);
            const cleaningEndTime = new Date(prodEndTime);
            cleaningEndTime.setMinutes(cleaningEndTime.getMinutes() + 15);
            
            // Create prep block
            const prepBlockData = {
              startTime: prepStartTime,
              endTime: prepEndTime,
              blockType: "prep" as "prep" | "production" | "cleaning" | "maintenance",
              machineId: selectedBlock.machine?._id || "",
              employeeId: selectedBlock.assignedEmployee?._id || "",
              day: selectedBlock.day,
              notes: `Auto-created prep block for ${selectedBlock.recipe?.name || 'production'}`,
              planId: selectedBlock.planId,
            };
            
            // Create cleaning block
            const cleaningBlockData = {
              startTime: cleaningStartTime,
              endTime: cleaningEndTime,
              blockType: "cleaning" as "prep" | "production" | "cleaning" | "maintenance",
              machineId: selectedBlock.machine?._id || "",
              employeeId: selectedBlock.assignedEmployee?._id || "",
              day: selectedBlock.day,
              notes: `Auto-created cleaning block for ${selectedBlock.recipe?.name || 'production'}`,
              planId: selectedBlock.planId,
            };
            
            // Send requests to create the additional blocks
            await Promise.all([
              productionBlocksApi.create(prepBlockData),
              productionBlocksApi.create(cleaningBlockData)
            ]);
            
            console.log("Auto-created prep and cleaning blocks");
          } catch (err) {
            console.error("Error creating auxiliary blocks:", err);
            toast.error("Main block created, but failed to create prep/cleaning blocks");
          }
        }

        // Notify parent component
        if (onBlockAdded) {
          onBlockAdded(createdBlock);
        }

        toast.success("Production block created successfully");
      } else {
        // Update an existing block
        await productionBlocksApi.update(selectedBlock._id, blockData);

        // Notify parent component
        if (onBlockUpdated) {
          onBlockUpdated(selectedBlock);
        }

        toast.success("Production block updated successfully");
      }

      // Close dialog
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving production block:", err);
      toast.error(
        "Failed to save production block: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, blocks: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Production Block</DialogTitle>
          <DialogDescription>
            Create a new production block on the calendar
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveBlock();
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="machine">Machine</Label>
              {isLoading.machines ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading machines...
                  </span>
                </div>
              ) : (
                <Select
                  value={selectedBlock?.machine?._id || ""}
                  onValueChange={(value) => {
                    const machine = machines.find((m) => m._id === value);
                    setSelectedBlock((prev) => ({
                      ...prev,
                      machine,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine._id} value={machine._id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              {isLoading.employees ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading employees...
                  </span>
                </div>
              ) : (
                <Select
                  value={selectedBlock?.assignedEmployee?._id || ""}
                  onValueChange={(value) => {
                    const employee = employees.find((e) => e._id === value);
                    setSelectedBlock((prev) => ({
                      ...prev,
                      assignedEmployee: employee,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Day Selection */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="day">Day</Label>
              <Select
                value={selectedBlock.day || "Monday"}
                onValueChange={(day) =>
                  setSelectedBlock({ ...selectedBlock, day })
                }
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
              {!selectedBlock.day && (
                <p className="text-xs text-red-500 mt-1">Day is required</p>
              )}
            </div>

            {/* Production Plan Selection */}
            <div className="space-y-2">
              <Label htmlFor="plan">Production Plan</Label>
              {planId ? (
                <div className="flex flex-col">
                  <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                    <span className="text-sm">{selectedBlock.plan?.name || 'Selected Plan'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    Plan pre-selected from current context
                  </span>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedBlock.planId}
                    onValueChange={(value) => {
                      const selectedPlan = plans.find((p) => p._id === value);
                      setSelectedBlock((prev) => ({
                        ...prev,
                        planId: value,
                        plan: selectedPlan,
                      }));
                    }}
                    disabled={isLoading.plans}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select production plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading.plans ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading plans...</span>
                        </div>
                      ) : plans.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No production plans available
                        </div>
                      ) : (
                        plans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!selectedBlock.planId && (
                    <p className="text-xs text-red-500 mt-1">
                      Production plan is required
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Block Type */}
            <div className="space-y-2">
              <Label htmlFor="blockType">Block Type</Label>
              <Select
                value={selectedBlock.blockType}
                onValueChange={(value) => {
                  setSelectedBlock((prev) => ({
                    ...prev,
                    blockType: value as any,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="prep">Preparation</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipe selection (only for production blocks) */}
            {selectedBlock.blockType === "production" && (
              <div className="space-y-2">
                <Label htmlFor="recipe">Recipe</Label>
                {isLoading.recipes ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading recipes...
                    </span>
                  </div>
                ) : (
                  <Select
                    value={selectedBlock.recipe?._id || ""}
                    onValueChange={(value) => {
                      const recipe = recipes.find((r) => r._id === value);
                      setSelectedBlock((prev) => ({
                        ...prev,
                        recipe,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a recipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe._id} value={recipe._id}>
                          {recipe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Quantity field (only for production blocks) */}
            {selectedBlock.blockType === "production" && (
              <div className="space-y-2">
                <Label htmlFor="plannedQuantity">Quantity (tubs)</Label>
                <Input
                  type="number"
                  id="plannedQuantity"
                  value={selectedBlock.plannedQuantity || ""}
                  onChange={(e) => {
                    const quantity = parseFloat(e.target.value);
                    setSelectedBlock((prev) => ({
                      ...prev,
                      plannedQuantity: isNaN(quantity) ? undefined : quantity,
                    }));
                  }}
                  placeholder="Enter production quantity"
                  min="0"
                  step="0.5"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  type="time"
                  id="startTime"
                  value={format(new Date(selectedBlock.startTime), "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value
                      .split(":")
                      .map(Number);
                    const startTime = new Date();
                    startTime.setHours(hours, minutes, 0, 0);

                    setSelectedBlock((prev) => ({
                      ...prev,
                      startTime,
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  type="time"
                  id="endTime"
                  value={format(new Date(selectedBlock.endTime), "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value
                      .split(":")
                      .map(Number);
                    const endTime = new Date();
                    endTime.setHours(hours, minutes, 0, 0);

                    setSelectedBlock((prev) => ({
                      ...prev,
                      endTime,
                    }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={selectedBlock.notes || ""}
                onChange={(e) => {
                  setSelectedBlock((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }));
                }}
                placeholder="Add any additional notes here..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading.blocks}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading.blocks}>
              {isLoading.blocks ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Add Block"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleBuilder;
