import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Download,
  Upload,
  User,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleView } from "@/components/Planning/ScheduleView";
import ScheduleBlock from "@/components/Planning/ScheduleBlock";
import { cn } from "@/lib/utils";
import { Recipe } from "@/lib/data";
import { Machine, MachineStatus } from "@/lib/machine";
import { machinesApi, recipesApi } from "@/lib/api";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductionPlan } from "@/lib/production";
import { Employee } from "@/lib/employee";
import { AddMachineDialog } from "@/components/Planning/AddMachineDialog";

// Custom loading spinner component with reliable animation
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-20">
    <div className="spinner-border h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
  </div>
);

// ResourceManagement panel implementation
const ResourceManagementPanel = () => {
  const [activeTab, setActiveTab] = useState<string>("recipes");
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState({
    machines: false,
    employees: false,
    recipes: false
  });
  const [error, setError] = useState({
    machines: null,
    employees: null,
    recipes: null
  });

  // Fetch machines from the database
  useEffect(() => {
    const fetchMachines = async () => {
      setIsLoading(prev => ({ ...prev, machines: true }));
      try {
        const fetchedMachines = await machinesApi.getAll();
        // Type assertion to ensure it matches Machine[] type
        setMachines(fetchedMachines as Machine[]);
        setError(prev => ({ ...prev, machines: null }));
      } catch (err) {
        console.error("Error fetching machines:", err);
        setError(prev => ({ ...prev, machines: "Failed to load machines" }));
        // If API call fails, fallback to sample data
        setMachines([
          {
            _id: "m1",
            name: "Mixer Alpha",
            tubCapacity: 8,
            productionTime: 45,
            assignedEmployeeId: "e1",
            status: "available",
            notes: "Primary ice cream machine (Sample)",
            createdAt: new Date(),
          },
          {
            _id: "m2",
            name: "Freezer Beta",
            tubCapacity: 4,
            productionTime: 30,
            assignedEmployeeId: null,
            status: "in-use",
            notes: "Secondary freezer (Sample)",
            createdAt: new Date(),
          },
          {
            _id: "m3",
            name: "Packager Gamma",
            tubCapacity: 2,
            productionTime: 15,
            assignedEmployeeId: null,
            status: "maintenance",
            notes: "Needs repair (Sample)",
            createdAt: new Date(),
          },
        ]);
      } finally {
        setIsLoading(prev => ({ ...prev, machines: false }));
      }
    };

    if (activeTab === "machines") {
      fetchMachines();
    }
  }, [activeTab]);

  // Fetch recipes from the database
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(prev => ({ ...prev, recipes: true }));
      try {
        const fetchedRecipes = await recipesApi.getAll();
        // Type assertion to ensure it matches Recipe[] type
        setRecipes(fetchedRecipes as Recipe[]);
        setError(prev => ({ ...prev, recipes: null }));
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError(prev => ({ ...prev, recipes: "Failed to load recipes" }));
        // Keep existing recipes as fallback
      } finally {
        setIsLoading(prev => ({ ...prev, recipes: false }));
      }
    };

    if (activeTab === "recipes") {
      fetchRecipes();
    }
  }, [activeTab]);

  const handleMachineAdded = (newMachine: Machine) => {
    setMachines(prev => [...prev, newMachine]);
  };

  const [employees, setEmployees] = useState<Employee[]>([
    {
      _id: "e1",
      name: "Jane Smith",
      email: "jane@example.com",
      shifts: [
        { day: "Monday", startTime: "09:00", endTime: "17:00" },
        { day: "Wednesday", startTime: "09:00", endTime: "17:00" },
        { day: "Friday", startTime: "09:00", endTime: "17:00" },
      ],
      machineCertifications: [
        { machineId: "m1", certificationDate: new Date() },
      ],
      availability: {},
      role: "manager",
      active: true,
      createdAt: new Date(),
    },
    {
      _id: "e2",
      name: "John Doe",
      email: "john@example.com",
      shifts: [
        { day: "Tuesday", startTime: "08:00", endTime: "16:00" },
        { day: "Thursday", startTime: "08:00", endTime: "16:00" },
        { day: "Saturday", startTime: "10:00", endTime: "14:00" },
      ],
      machineCertifications: [
        { machineId: "m1", certificationDate: new Date() },
        { machineId: "m2", certificationDate: new Date() },
      ],
      availability: {},
      role: "operator",
      active: true,
      createdAt: new Date(),
    },
    {
      _id: "e3",
      name: "Alice Cooper",
      email: "alice@example.com",
      shifts: [
        { day: "Monday", startTime: "12:00", endTime: "20:00" },
        { day: "Wednesday", startTime: "12:00", endTime: "20:00" },
        { day: "Friday", startTime: "12:00", endTime: "20:00" },
      ],
      machineCertifications: [
        { machineId: "m3", certificationDate: new Date() },
      ],
      availability: {},
      role: "operator",
      active: false,
      createdAt: new Date(),
    },
  ]);

  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      _id: "r1",
      name: "Vanilla",
      ingredients: [],
      currentInventory: 12,
      weeklyProductionGoal: 36,
      plannedProduction: 24,
      goalAchievement: 66,
      batches: [],
    },
    {
      _id: "r2",
      name: "Chocolate",
      ingredients: [],
      currentInventory: 8,
      weeklyProductionGoal: 24,
      plannedProduction: 20,
      goalAchievement: 83,
      batches: [],
    },
    {
      _id: "r3",
      name: "Strawberry",
      ingredients: [],
      currentInventory: 4,
      weeklyProductionGoal: 18,
      plannedProduction: 4,
      goalAchievement: 22,
      batches: [],
    },
  ]);

  const getMachineStatusColor = (status: MachineStatus) => {
    switch (status) {
      case "available":
        return "text-green-600 bg-green-100";
      case "in-use":
        return "text-blue-600 bg-blue-100";
      case "maintenance":
        return "text-amber-600 bg-amber-100";
      default:
        return "text-gray-600 bg-gray-100";
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
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getGoalColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-600";
    if (percentage >= 50) return "bg-blue-600";
    return "bg-amber-600";
  };

  return (
    <Card className="w-72 h-full max-h-[calc(100vh-220px)] flex flex-col overflow-hidden">
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
            <TabsTrigger value="recipes" className="flex-1">
              Recipes
            </TabsTrigger>
            <TabsTrigger value="machines" className="flex-1">
              Machines
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex-1">
              Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes" className="p-0 mt-3">
            <ScrollArea className="h-[calc(100vh-300px)] pr-2">
              <div className="space-y-3">
                {isLoading.recipes ? (
                  <LoadingSpinner />
                ) : error.recipes ? (
                  <div className="text-center text-red-500 py-4">
                    {error.recipes}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        setActiveTab("recipes");
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : recipes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No recipes found. Add your first recipe!
                  </div>
                ) : (
                  recipes.map((recipe) => (
                    <Card key={recipe._id} className="p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{recipe.name}</div>
                        <Badge variant="outline">
                          {recipe.currentInventory} tubs
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground mb-2">
                        Weekly Goal: {recipe.weeklyProductionGoal} tubs
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span>Progress</span>
                          <span>{recipe.goalAchievement}%</span>
                        </div>
                        <Progress
                          value={recipe.goalAchievement}
                          className={cn(
                            "h-2",
                            getGoalColor(recipe.goalAchievement || 0)
                          )}
                        />

                        <div className="flex justify-between text-xs mt-1">
                          <span>Planned: {recipe.plannedProduction} tubs</span>
                          <span>Goal: {recipe.weeklyProductionGoal} tubs</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Recipe</span>
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

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
                    <Card key={machine._id} className="p-3 shadow-sm">
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

                      {machine.assignedEmployeeId && (
                        <div className="mt-2 text-xs flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>
                            {employees.find(
                              (e) => e._id === machine.assignedEmployeeId
                            )?.name || "Unassigned"}
                          </span>
                        </div>
                      )}

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
                        <AccordionTrigger className="py-2">
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span
                                className={cn(
                                  !employee.active &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {employee.name}
                              </span>
                            </div>
                            <Badge variant="outline" className="ml-auto mr-2">
                              {employee.role}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-6 pb-2 text-xs space-y-2">
                            <div className="text-muted-foreground">
                              {employee.email}
                            </div>

                            <div>
                              <h4 className="font-medium mb-1">Shifts</h4>
                              {employee.shifts.map((shift, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{shift.day}</span>
                                  <span>
                                    {shift.startTime} - {shift.endTime}
                                  </span>
                                </div>
                              ))}
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
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Employee</span>
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardHeader>

      <CardContent className="p-3 overflow-hidden flex-1"></CardContent>
    </Card>
  );
};

const WeeklyOverview = () => {
  // This would fetch data from the backend in the actual implementation
  const completionPercentage = 65;

  return (
    <Card className="mb-4 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Weekly Production Overview</h3>
        <Button variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Recipes</div>
            <div className="text-2xl font-semibold">12</div>
            <div className="text-xs text-green-600">4 ahead of goal</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Batches</div>
            <div className="text-2xl font-semibold">36</div>
            <div className="text-xs text-amber-600">2 behind schedule</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Machine Utilization
            </div>
            <div className="text-2xl font-semibold">78%</div>
            <div className="text-xs text-green-600">+12% vs last week</div>
          </Card>
        </div>
      </div>
    </Card>
  );
};

const ProductionPlansList = () => {
  // Placeholder data - this would come from the backend API
  const plans = [
    {
      id: "1",
      name: "Week of April 10th",
      weekStartDate: "2025-04-10",
      status: "active",
      completionStatus: 65,
      recipesCount: 12,
    },
    {
      id: "2",
      name: "Week of April 3rd",
      weekStartDate: "2025-04-03",
      status: "completed",
      completionStatus: 100,
      recipesCount: 10,
    },
    {
      id: "3",
      name: "Week of March 27th",
      weekStartDate: "2025-03-27",
      status: "archived",
      completionStatus: 100,
      recipesCount: 11,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-slate-100">
            Draft
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Completed
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="bg-slate-100">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Production Plans</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{plan.name}</h4>
                  {getStatusBadge(plan.status)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {plan.recipesCount} recipes •{" "}
                  {new Date(plan.weekStartDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <div className="text-sm font-medium">
                    {plan.completionStatus}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ProductionPlanning = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const handleCreatePlan = () => {
    // This would open a modal or navigate to create plan page
    toast.info("Create plan functionality will be implemented in later steps");
  };

  return (
    <Layout>
      {/* Add the spinner CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner-border {
            animation: spin 1s linear infinite;
          }
        `
      }} />

      <div className="container mx-auto space-y-6 py-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Production Planning
            </h1>
            <p className="text-muted-foreground">
              Schedule and manage your recipe production.
            </p>
          </div>

          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Load schedule functionality coming in step 3.5")
              }
            >
              Load Schedule
            </Button>
            <Button onClick={handleCreatePlan}>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-3 space-y-6">
                <WeeklyOverview />
                <ProductionPlansList />
              </div>

              <div>
                <ResourceManagementPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="flex gap-6 h-[calc(100vh-220px)]">
              <ResourceManagementPanel />
              <div className="flex-1">
                <ScheduleView />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <ProductionPlansList />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProductionPlanning;
