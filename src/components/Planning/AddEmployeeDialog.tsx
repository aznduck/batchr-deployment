import React, { useState, useEffect } from "react";
import {
  Employee,
  EmployeeRole,
  Shift,
  MachineCertification,
} from "@/lib/employee";
import { Machine } from "@/lib/machine";
import { employeesApi, machinesApi } from "@/lib/api";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: (employee: Employee) => void;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-20">
    <div className="spinner-border h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
  </div>
);

export function AddEmployeeDialog({
  open,
  onOpenChange,
  onEmployeeAdded,
}: AddEmployeeDialogProps) {
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "operator" as EmployeeRole,
    active: true,
  });

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);

  // Fetch available machines for certification selection
  useEffect(() => {
    if (open) {
      const fetchMachines = async () => {
        setIsLoadingMachines(true);
        try {
          const response = await machinesApi.getAll();
          setMachines(response as Machine[]);
        } catch (error) {
          console.error("Error fetching machines:", error);
          toast.error("Failed to load machines for certification selection");
        } finally {
          setIsLoadingMachines(false);
        }
      };

      fetchMachines();
    }
  }, [open]);

  const resetForm = () => {
    setNewEmployee({
      name: "",
      email: "",
      role: "operator",
      active: true,
    });
    setShifts([]);
    setSelectedMachines([]);
  };

  const handleAddShift = () => {
    setShifts([
      ...shifts,
      {
        day: "Monday",
        startTime: "09:00",
        endTime: "17:00",
      },
    ]);
  };

  const handleRemoveShift = (index: number) => {
    const updatedShifts = [...shifts];
    updatedShifts.splice(index, 1);
    setShifts(updatedShifts);
  };

  const handleShiftChange = (
    index: number,
    field: keyof Shift,
    value: string
  ) => {
    const updatedShifts = [...shifts];
    updatedShifts[index] = {
      ...updatedShifts[index],
      [field]: value,
    };
    setShifts(updatedShifts);
  };

  const handleMachineCertificationToggle = (machineId: string) => {
    if (selectedMachines.includes(machineId)) {
      setSelectedMachines(selectedMachines.filter((id) => id !== machineId));
    } else {
      setSelectedMachines([...selectedMachines, machineId]);
    }
  };

  const handleSubmit = async () => {
    if (!newEmployee.name) {
      toast.error("Employee name is required");
      return;
    }

    setIsLoading(true);
    try {
      // First create the employee through the API
      const response = await employeesApi.create({
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        shifts: shifts.map((shift) => ({
          day: shift.day,
          startTime: shift.startTime,
          endTime: shift.endTime,
        })),
      });

      // Build the complete employee object
      const machineCertifications: MachineCertification[] =
        selectedMachines.map((machineId) => ({
          machineId,
          certificationDate: new Date(),
        }));

      const createdEmployee: Employee = {
        ...newEmployee,
        _id:
          typeof response === "object" && response
            ? (response as any)._id || crypto.randomUUID()
            : crypto.randomUUID(),
        shifts,
        machineCertifications,
        availability: {},
        createdAt: new Date(),
      };

      // Add certifications for each selected machine
      await Promise.all(
        selectedMachines.map(async (machineId) => {
          try {
            await employeesApi.addCertification(createdEmployee._id, {
              machineId,
              certificationDate: new Date(),
            });
          } catch (error) {
            console.error(
              `Error adding certification for machine ${machineId}:`,
              error
            );
          }
        })
      );

      onEmployeeAdded(createdEmployee);
      toast.success("Employee added successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner-border {
              animation: spin 1s linear infinite;
            }
          `,
        }}
      />
      <DialogContent className="max-w-[40vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details for the new employee.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee-name" className="text-right">
              Name
            </Label>
            <Input
              id="employee-name"
              className="col-span-3"
              value={newEmployee.name}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee-email" className="text-right">
              Email
            </Label>
            <Input
              id="employee-email"
              className="col-span-3"
              type="email"
              value={newEmployee.email}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, email: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee-role" className="text-right">
              Role
            </Label>
            <Select
              onValueChange={(value) =>
                setNewEmployee({
                  ...newEmployee,
                  role: value as EmployeeRole,
                })
              }
              defaultValue={newEmployee.role}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="trainee">Trainee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shifts Section */}
          <div className="grid grid-cols-4 items-start gap-4 mt-4">
            <div className="text-right">
              <Label>Shifts</Label>
            </div>
            <div className="col-span-3 space-y-3">
              {shifts.map((shift, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={shift.day}
                    onValueChange={(value) =>
                      handleShiftChange(index, "day", value as any)
                    }
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Day" />
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

                  <Input
                    type="time"
                    className="w-[150px]"
                    value={shift.startTime}
                    onChange={(e) =>
                      handleShiftChange(index, "startTime", e.target.value)
                    }
                  />

                  <span>-</span>

                  <Input
                    type="time"
                    className="w-[150px]"
                    value={shift.endTime}
                    onChange={(e) =>
                      handleShiftChange(index, "endTime", e.target.value)
                    }
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveShift(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddShift}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Shift
              </Button>
            </div>
          </div>

          {/* Machine Certifications */}
          <div className="grid grid-cols-4 items-start gap-4 mt-4">
            <div className="text-right">
              <Label>Machine Certifications</Label>
            </div>
            <div className="col-span-3 space-y-3">
              {isLoadingMachines ? (
                <LoadingSpinner />
              ) : machines.length > 0 ? (
                <div className="space-y-2">
                  {machines.map((machine) => (
                    <div key={machine._id} className="flex items-center gap-2">
                      <Checkbox
                        id={`machine-${machine._id}`}
                        checked={selectedMachines.includes(machine._id)}
                        onCheckedChange={() =>
                          handleMachineCertificationToggle(machine._id)
                        }
                      />
                      <Label
                        htmlFor={`machine-${machine._id}`}
                        className="font-normal"
                      >
                        {machine.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No machines available for certification.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <div className="spinner-border h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
            ) : null}
            Add Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
