import React, { useState, useEffect } from "react";
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

interface EditMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  onMachineUpdated: (machine: Machine) => void;
}

export function EditMachineDialog({
  open,
  onOpenChange,
  machine,
  onMachineUpdated,
}: EditMachineDialogProps) {
  const [editedMachine, setEditedMachine] = useState<Partial<Machine>>({
    name: "",
    tubCapacity: 4,
    productionTime: 30,
    status: "available" as MachineStatus,
    notes: "",
  });

  // Update form when machine changes
  useEffect(() => {
    if (machine) {
      setEditedMachine({
        name: machine.name,
        tubCapacity: machine.tubCapacity,
        productionTime: machine.productionTime,
        status: machine.status,
        notes: machine.notes || "",
      });
    }
  }, [machine]);

  const handleUpdateMachine = async () => {
    if (!machine) return;
    
    try {
      await machinesApi.update(machine._id, {
        name: editedMachine.name,
        tubCapacity: editedMachine.tubCapacity,
        productionTime: editedMachine.productionTime,
        status: editedMachine.status as MachineStatus,
        notes: editedMachine.notes || undefined,
      });

      // Create updated machine object
      const updatedMachine: Machine = {
        ...machine,
        ...editedMachine,
      };

      onMachineUpdated(updatedMachine);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating machine:", error);
      toast.error("Failed to update machine. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Machine</DialogTitle>
          <DialogDescription>
            Update the details for this machine.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="machine-name" className="text-right">
              Name
            </Label>
            <Input
              id="machine-name"
              value={editedMachine.name}
              onChange={(e) =>
                setEditedMachine({ ...editedMachine, name: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tub-capacity" className="text-right">
              Tub Capacity
            </Label>
            <Input
              id="tub-capacity"
              type="number"
              value={editedMachine.tubCapacity}
              onChange={(e) =>
                setEditedMachine({
                  ...editedMachine,
                  tubCapacity: parseInt(e.target.value) || 0,
                })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="production-time" className="text-right">
              Production Time (min)
            </Label>
            <Input
              id="production-time"
              type="number"
              value={editedMachine.productionTime}
              onChange={(e) =>
                setEditedMachine({
                  ...editedMachine,
                  productionTime: parseInt(e.target.value) || 0,
                })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={editedMachine.status}
              onValueChange={(value: MachineStatus) =>
                setEditedMachine({ ...editedMachine, status: value })
              }
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
              value={editedMachine.notes}
              onChange={(e) =>
                setEditedMachine({ ...editedMachine, notes: e.target.value })
              }
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpdateMachine}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
