import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { format } from "date-fns";
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
import { productionBlocksApi, machinesApi, employeesApi } from "@/lib/api";

// Define the ref methods to expose
export interface ScheduleBuilderRef {
  openAddDialog: (initialBlock?: Partial<ProductionBlock>) => void;
}

interface ScheduleBuilderProps {
  onBlockAdded?: (block: ProductionBlock) => void;
  onBlockUpdated?: (block: ProductionBlock) => void;
  onBlockDeleted?: (blockId: string) => void;
}

const ScheduleBuilder = forwardRef<ScheduleBuilderRef, ScheduleBuilderProps>(
  ({ onBlockAdded, onBlockUpdated, onBlockDeleted }, ref) => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<ProductionBlock | null>(
      null
    );
    const [machines, setMachines] = useState<Machine[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState({
      blocks: false,
      machines: false,
      employees: false,
    });

    // Expose methods to the parent
    useImperativeHandle(ref, () => ({
      openAddDialog: (initialBlock?: Partial<ProductionBlock>) => {
        if (initialBlock) {
          // Create a new block with the provided properties
          const newBlock: ProductionBlock = {
            _id: initialBlock._id || uuidv4(),
            startTime:
              initialBlock.startTime ||
              new Date(new Date().setHours(9, 0, 0, 0)),
            endTime:
              initialBlock.endTime ||
              new Date(new Date().setHours(10, 0, 0, 0)),
            blockType: initialBlock.blockType || "production",
            machine: initialBlock.machine,
            assignedEmployee: initialBlock.assignedEmployee,
            status: initialBlock.status || "scheduled",
            notes: initialBlock.notes || "",
          };
          setSelectedBlock(newBlock);
        } else {
          // Default block
          const newBlock: ProductionBlock = {
            _id: uuidv4(),
            startTime: new Date(new Date().setHours(9, 0, 0, 0)),
            endTime: new Date(new Date().setHours(10, 0, 0, 0)),
            blockType: "production",
            status: "scheduled",
            notes: "",
          };
          setSelectedBlock(newBlock);
        }
        setIsAddDialogOpen(true);
      },
    }));

    // Fetch machines and employees when component mounts
    useEffect(() => {
      const fetchResources = async () => {
        setIsLoading((prev) => ({ ...prev, machines: true, employees: true }));
        try {
          // Fetch machines
          const fetchedMachines = await machinesApi.getAll();
          setMachines(fetchedMachines as Machine[]);

          // Fetch employees
          const fetchedEmployees = await employeesApi.getAll();
          setEmployees(fetchedEmployees as Employee[]);
        } catch (err) {
          console.error("Error fetching resources:", err);
          toast.error("Failed to load machines or employees");
        } finally {
          setIsLoading((prev) => ({
            ...prev,
            machines: false,
            employees: false,
          }));
        }
      };

      fetchResources();
    }, []);

    const handleSaveBlock = async (block: ProductionBlock) => {
      setIsLoading((prev) => ({ ...prev, blocks: true }));

      try {
        // Determine if this is a new block (no ID or empty ID)
        const isNewBlock = !block._id || block._id === "";

        // Convert time strings to Date objects for the API
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);

        // Create the data for the API
        const blockData = {
          startTime,
          endTime,
          blockType: block.blockType,
          machineId: block.machine?._id || "",
          employeeId: block.assignedEmployee?._id || "",
          planId: "temp-plan-id", // This would be from context or props in a real app
          notes: block.notes || "",
        };

        let updatedBlock: ProductionBlock;

        if (isNewBlock) {
          // Call API to create the block
          const response = await productionBlocksApi.create(blockData);

          // Update the block with the response data
          updatedBlock = {
            ...block,
            _id: response._id || block._id,
          };

          // Call callback if provided
          if (onBlockAdded) {
            onBlockAdded(updatedBlock);
          }

          toast.success("Production block added successfully");
        } else {
          // Call API to update the block
          await productionBlocksApi.update(block._id, blockData);

          updatedBlock = block;

          // Call callback if provided
          if (onBlockUpdated) {
            onBlockUpdated(updatedBlock);
          }

          toast.success("Production block updated successfully");
        }

        // Close dialogs
        setIsAddDialogOpen(false);
        setSelectedBlock(null);
      } catch (err) {
        console.error("Error saving production block:", err);
        toast.error("Failed to save production block");
      } finally {
        setIsLoading((prev) => ({ ...prev, blocks: false }));
      }
    };

    return (
      <div id="schedule-builder">
        {/* Add Block Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                if (selectedBlock) {
                  handleSaveBlock(selectedBlock);
                }
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
                        setSelectedBlock((prev) =>
                          prev
                            ? {
                                ...prev,
                                machine,
                              }
                            : null
                        );
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
                        setSelectedBlock((prev) =>
                          prev
                            ? {
                                ...prev,
                                assignedEmployee: employee,
                              }
                            : null
                        );
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

                <div className="space-y-2">
                  <Label htmlFor="blockType">Block Type</Label>
                  <Select
                    value={selectedBlock?.blockType || "production"}
                    onValueChange={(value) => {
                      setSelectedBlock((prev) =>
                        prev
                          ? {
                              ...prev,
                              blockType: value as any,
                            }
                          : null
                      );
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      type="time"
                      id="startTime"
                      value={
                        selectedBlock
                          ? format(new Date(selectedBlock.startTime), "HH:mm")
                          : "09:00"
                      }
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value
                          .split(":")
                          .map(Number);
                        const startTime = new Date();
                        startTime.setHours(hours, minutes, 0, 0);

                        setSelectedBlock((prev) =>
                          prev
                            ? {
                                ...prev,
                                startTime,
                              }
                            : null
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      type="time"
                      id="endTime"
                      value={
                        selectedBlock
                          ? format(new Date(selectedBlock.endTime), "HH:mm")
                          : "10:00"
                      }
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value
                          .split(":")
                          .map(Number);
                        const endTime = new Date();
                        endTime.setHours(hours, minutes, 0, 0);

                        setSelectedBlock((prev) =>
                          prev
                            ? {
                                ...prev,
                                endTime,
                              }
                            : null
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={selectedBlock?.notes || ""}
                    onChange={(e) => {
                      setSelectedBlock((prev) =>
                        prev
                          ? {
                              ...prev,
                              notes: e.target.value,
                            }
                          : null
                      );
                    }}
                    placeholder="Add any additional notes here..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setSelectedBlock(null);
                  }}
                  disabled={isLoading.blocks}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedBlock || isLoading.blocks}
                >
                  {isLoading.blocks ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Add Block"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default ScheduleBuilder;
