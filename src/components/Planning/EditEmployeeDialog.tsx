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

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEmployeeUpdated: (employee: Employee) => void;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-20">
    <div className="spinner-border h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
  </div>
);

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onEmployeeUpdated,
}: EditEmployeeDialogProps) {
  const [employeeData, setEmployeeData] = useState<Partial<Employee>>({
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

  // Load employee data when dialog opens or employee changes
  useEffect(() => {
    if (open && employee) {
      setEmployeeData({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        active: employee.active,
      });
      
      setShifts(employee.shifts || []);
      
      // Set selected machines based on employee certifications
      if (employee.machineCertifications) {
        setSelectedMachines(
          employee.machineCertifications.map(cert => cert.machineId)
        );
      } else {
        setSelectedMachines([]);
      }
    }
  }, [open, employee]);

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
    if (!employeeData.name) {
      toast.error("Employee name is required");
      return;
    }

    if (!employee?._id) {
      toast.error("Cannot update: Missing employee ID");
      return;
    }

    setIsLoading(true);
    try {
      // Update the employee through the API
      await employeesApi.update(employee._id, {
        ...employeeData,
        shifts: shifts
      });

      // Update machine certifications
      // First, determine which certifications to add and which to remove
      const currentCertIds = employee.machineCertifications?.map(cert => cert.machineId) || [];
      const certsToAdd = selectedMachines.filter(id => !currentCertIds.includes(id));
      const certsToRemove = currentCertIds.filter(id => !selectedMachines.includes(id));

      // Add new certifications
      await Promise.all(
        certsToAdd.map(async (machineId) => {
          try {
            await employeesApi.addCertification(employee._id, {
              machineId,
              certificationDate: new Date(),
            });
          } catch (error) {
            console.error(`Error adding certification for machine ${machineId}:`, error);
          }
        })
      );

      // Remove certifications no longer needed
      await Promise.all(
        certsToRemove.map(async (machineId) => {
          try {
            await employeesApi.removeCertification(employee._id, machineId);
          } catch (error) {
            console.error(`Error removing certification for machine ${machineId}:`, error);
          }
        })
      );

      // Build the updated employee object for the UI
      const updatedEmployee: Employee = {
        ...employee,
        ...employeeData,
        shifts,
        machineCertifications: selectedMachines.map(machineId => {
          // Find existing certification if possible to preserve date
          const existingCert = employee.machineCertifications?.find(c => c.machineId === machineId);
          return existingCert || {
            machineId,
            certificationDate: new Date()
          };
        }),
      };

      onEmployeeUpdated(updatedEmployee);
      toast.success("Employee updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee. Please try again.");
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
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update the details for this employee.
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
              value={employeeData.name}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, name: e.target.value })
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
              value={employeeData.email}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, email: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee-role" className="text-right">
              Role
            </Label>
            <Select
              value={employeeData.role}
              onValueChange={(value) =>
                setEmployeeData({
                  ...employeeData,
                  role: value as EmployeeRole,
                })
              }
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

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Status
            </Label>
            <div className="flex items-center col-span-3">
              <Checkbox
                id="employee-active"
                checked={employeeData.active}
                onCheckedChange={(checked) =>
                  setEmployeeData({ ...employeeData, active: !!checked })
                }
              />
              <Label htmlFor="employee-active" className="ml-2">
                Active
              </Label>
            </div>
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
            <div className="col-span-3">
              {isLoadingMachines ? (
                <LoadingSpinner />
              ) : machines.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No machines available for certification
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
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
                        className="text-sm"
                      >
                        {machine.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || isLoadingMachines}
          >
            {isLoading ? <LoadingSpinner /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditEmployeeDialog;
