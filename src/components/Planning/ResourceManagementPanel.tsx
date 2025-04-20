import { useState, useEffect } from "react";
import { Machine, MachineStatus } from "@/lib/machine";
import { Employee } from "@/lib/employee";
import { machinesApi } from "@/lib/api";
import { employeesApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Settings, User } from "lucide-react";
import { Trash2, CheckCircle2, Layers, AlertCircle } from "lucide-react";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { AddMachineDialog } from "./AddMachineDialog";

interface ResourceManagementPanelProps {
  className?: string;
  fullWidth?: boolean;
}

export const ResourceManagementPanel: React.FC<
  ResourceManagementPanelProps
> = ({ className, fullWidth = false }) => {
  const [activeTab, setActiveTab] = useState<string>("machines");
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState({
    machines: false,
    employees: false,
    recipes: false,
  });
  const [error, setError] = useState({
    machines: null,
    employees: null,
    recipes: null,
  });

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-20">
      <div className="spinner-border h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
    </div>
  );

  // Fetch machines from the database
  useEffect(() => {
    const fetchMachines = async () => {
      setIsLoading((prev) => ({ ...prev, machines: true }));
      try {
        const fetchedMachines = await machinesApi.getAll();
        // Type assertion to ensure it matches Machine[] type
        setMachines(fetchedMachines as Machine[]);
        setError((prev) => ({ ...prev, machines: null }));
      } catch (err) {
        console.error("Error fetching machines:", err);
        setError((prev) => ({ ...prev, machines: "Failed to load machines" }));
        // If API call fails, fallback to sample data
        setMachines([
          {
            _id: "m1",
            name: "Mixer Alpha",
            tubCapacity: 8,
            productionTime: 45,
            assignedEmployeeId: null,
            status: "available",
            notes: "Primary ice cream mixer",
            createdAt: new Date(),
          },
          {
            _id: "m2",
            name: "Freezer Beta",
            tubCapacity: 4,
            productionTime: 30,
            assignedEmployeeId: null,
            status: "in-use",
            notes: "Secondary freezer",
            createdAt: new Date(),
          },
        ]);
      } finally {
        setIsLoading((prev) => ({ ...prev, machines: false }));
      }
    };

    fetchMachines();
  }, []);

  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading((prev) => ({ ...prev, employees: true }));
      try {
        const fetchedEmployees = await employeesApi.getAll();
        // Type assertion to ensure it matches Employee[] type
        setEmployees(fetchedEmployees as Employee[]);
        setError((prev) => ({ ...prev, employees: null }));
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError((prev) => ({
          ...prev,
          employees: "Failed to load employees",
        }));
        // If API call fails, fallback to sample data
        setEmployees([
          {
            _id: "e1",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "manager",
            active: true,
            shifts: [],
            machineCertifications: [],
            availability: {},
            createdAt: new Date(),
          },
          {
            _id: "e2",
            name: "John Doe",
            email: "john@example.com",
            role: "operator",
            active: true,
            shifts: [],
            machineCertifications: [],
            availability: {},
            createdAt: new Date(),
          },
        ]);
      } finally {
        setIsLoading((prev) => ({ ...prev, employees: false }));
      }
    };

    fetchEmployees();
  }, []);

  const handleMachineAdded = (newMachine: Machine) => {
    setMachines((prev) => [...prev, newMachine]);
  };

  const handleEmployeeAdded = (newEmployee: Employee) => {
    setEmployees((prev) => [...prev, newEmployee]);
  };

  const handleDeleteMachine = async (machineId: string) => {
    try {
      await machinesApi.delete(machineId);
      setMachines(machines.filter((machine) => machine._id !== machineId));
      toast.success("Machine deleted successfully");
    } catch (error) {
      console.error("Error deleting machine:", error);
      toast.error("Failed to delete machine");
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await employeesApi.delete(employeeId);
      setEmployees(employees.filter((employee) => employee._id !== employeeId));
      toast.success("Employee deleted successfully");
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
    }
  };

  const getMachineStatusColor = (status: MachineStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in-use":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "maintenance":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getMachineStatusIcon = (status: MachineStatus) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-use":
        return <Layers className="h-4 w-4 text-blue-600" />;
      case "maintenance":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card
      className={cn(
        "h-full max-h-[calc(100vh-220px)] flex flex-col overflow-hidden",
        fullWidth ? "w-full" : "w-72",
        className
      )}
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Resource Management</CardTitle>
          <Button variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-2"
        >
          <TabsList className="w-full">
            <TabsTrigger value="machines" className="flex-1">
              Machines
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex-1">
              Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="machines" className="p-0 mt-3">
            <ScrollArea className="h-[calc(100vh-300px)] pr-2">
              <div className="space-y-3">
                {isLoading.machines ? (
                  <LoadingSpinner />
                ) : error.machines ? (
                  <div className="text-center text-red-500 py-4">
                    {error.machines}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setActiveTab("machines");
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : machines.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No machines found. Add your first machine!
                  </div>
                ) : (
                  machines.map((machine) => (
                    <Card
                      key={machine._id}
                      className="p-3 shadow-sm relative min-h-[140px]"
                    >
                      <div className="absolute bottom-3 right-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Machine
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {machine.name}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMachine(machine._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center">
                            <Settings className="h-4 w-4 mr-1 text-muted-foreground" />
                            {machine.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Capacity: {machine.tubCapacity} tubs
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={getMachineStatusColor(machine.status)}
                        >
                          <span className="flex items-center">
                            {getMachineStatusIcon(machine.status)}
                            <span className="ml-1">{machine.status}</span>
                          </span>
                        </Badge>
                      </div>

                      {machine.notes && (
                        <div className="mt-1 text-xs italic text-muted-foreground">
                          {machine.notes}
                        </div>
                      )}
                    </Card>
                  ))
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={() => setIsAddingMachine(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Machine</span>
                </Button>

                {/* Use the new AddMachineDialog component */}
                <AddMachineDialog
                  open={isAddingMachine}
                  onOpenChange={setIsAddingMachine}
                  onMachineAdded={handleMachineAdded}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="employees" className="p-0 mt-3">
            <ScrollArea className="h-[calc(100vh-300px)] pr-2">
              <div className="space-y-3">
                {isLoading.employees ? (
                  <LoadingSpinner />
                ) : error.employees ? (
                  <div className="text-center text-red-500 py-4">
                    {error.employees}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setActiveTab("employees");
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No employees found. Add your first employee!
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {employees.map((employee) => (
                      <AccordionItem
                        value={employee._id}
                        key={employee._id}
                        className="border-b"
                      >
                        <AccordionTrigger className="py-4">
                          <div className="flex items-center justify-between w-full px-2">
                            {/* Left: Employee Info */}
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span
                                className={cn(
                                  "text-sm",
                                  !employee.active &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {employee.name}
                              </span>
                            </div>

                            {/* Right: Role Badge + Delete Button */}
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{employee.role}</Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Employee
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      <strong>{employee.name}</strong>? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteEmployee(employee._id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="py-3">
                          <div className="pl-6 pb-2 text-xs space-y-2">
                            <div className="text-muted-foreground">
                              {employee.email}
                            </div>

                            <div>
                              <h4 className="font-medium mb-1">Shifts</h4>
                              {employee.shifts.length > 0 ? (
                                employee.shifts.map((shift, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between"
                                  >
                                    <span>{shift.day}</span>
                                    <span>
                                      {shift.startTime} - {shift.endTime}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground">
                                  No shifts
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="font-medium mb-1">
                                Machine Certifications
                              </h4>
                              {employee.machineCertifications.length > 0 ? (
                                <div className="space-y-1">
                                  {employee.machineCertifications.map(
                                    (cert, idx) => (
                                      <div key={idx}>
                                        {machines.find(
                                          (m) => m._id === cert.machineId
                                        )?.name || "Unknown Machine"}
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="text-muted-foreground">
                                  No certifications
                                </div>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={() => setIsAddingEmployee(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Employee</span>
                </Button>

                {/* Add Employee Dialog */}
                <AddEmployeeDialog
                  open={isAddingEmployee}
                  onOpenChange={setIsAddingEmployee}
                  onEmployeeAdded={handleEmployeeAdded}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardHeader>

      <CardContent className="p-3 overflow-hidden flex-1"></CardContent>
    </Card>
  );
};

export default ResourceManagementPanel;
