import React, { useState } from "react";
import { Machine, MachineStatus } from "@/lib/machine";
import { machinesApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMachineAdded: (machine: Machine) => void;
}

export function AddMachineDialog({
  open,
  onOpenChange,
  onMachineAdded,
}: AddMachineDialogProps) {
  const [newMachine, setNewMachine] = useState({
    name: "",
    tubCapacity: 4,
    productionTime: 30,
    status: "available" as MachineStatus,
    notes: "",
  });

  const resetForm = () => {
    setNewMachine({
      name: "",
      tubCapacity: 4,
      productionTime: 30,
      status: "available",
      notes: "",
    });
  };

  const handleAddMachine = async () => {
    try {
      const response = await machinesApi.create({
        name: newMachine.name,
        tubCapacity: newMachine.tubCapacity,
        productionTime: newMachine.productionTime,
        status: newMachine.status,
        notes: newMachine.notes || undefined,
      });

      // Add generated _id and createdAt from response
      const createdMachine: Machine = {
        ...newMachine,
        _id:
          typeof response === "object" && response
            ? (response as any)._id || crypto.randomUUID()
            : crypto.randomUUID(),
        createdAt: new Date(),
        assignedEmployeeId: null,
      };

      onMachineAdded(createdMachine);
      toast.success("Machine added successfully");

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding machine:", error);
      toast.error("Failed to add machine. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Machine</DialogTitle>
          <DialogDescription>
            Enter the details for the new machine.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="machine-name" className="text-right">
              Name
            </Label>
            <Input
              id="machine-name"
              className="col-span-3"
              value={newMachine.name}
              onChange={(e) =>
                setNewMachine({ ...newMachine, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tub-capacity" className="text-right">
              Capacity
            </Label>
            <div className="col-span-3 flex items-center">
              <Input
                id="tub-capacity"
                type="number"
                value={newMachine.tubCapacity}
                onChange={(e) =>
                  setNewMachine({
                    ...newMachine,
                    tubCapacity: parseInt(e.target.value),
                  })
                }
              />
              <span className="ml-2 text-muted-foreground">tubs</span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="production-time" className="text-right">
              Prod. Time
            </Label>
            <div className="col-span-3 flex items-center">
              <Input
                id="production-time"
                type="number"
                min={1}
                value={newMachine.productionTime}
                onChange={(e) =>
                  setNewMachine({
                    ...newMachine,
                    productionTime: parseInt(e.target.value) || 1,
                  })
                }
              />
              <span className="ml-2 text-muted-foreground">minutes</span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              onValueChange={(value) =>
                setNewMachine({ ...newMachine, status: value as MachineStatus })
              }
              defaultValue={newMachine.status}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              className="col-span-3"
              rows={3}
              value={newMachine.notes}
              onChange={(e) =>
                setNewMachine({ ...newMachine, notes: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleAddMachine}>
            Add Machine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
