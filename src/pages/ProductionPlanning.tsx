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
  Trash2, // Add X icon for delete buttons
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleView } from "@/components/Planning/ScheduleView";
import ScheduleBlock from "@/components/Planning/ScheduleBlock";
import { cn } from "@/lib/utils";
import { Recipe } from "@/lib/data";
import { Machine, MachineStatus } from "@/lib/machine";
import {
  employeesApi,
  machinesApi,
  recipesApi,
  productionPlansApi,
  productionBlocksApi,
} from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductionBlock, ProductionPlan } from "@/lib/production";
import { Employee } from "@/lib/employee";
import { ResourceManagementPanel } from "@/components/Planning/ResourceManagementPanel";
import { AddMachineDialog } from "@/components/Planning/AddMachineDialog";
import { AddEmployeeDialog } from "@/components/Planning/AddEmployeeDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ScheduleBuilder from "@/components/Planning/ScheduleBuilder";
import AddProductionPlanDialog from "@/components/Planning/AddProductionPlanDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom loading spinner component with reliable animation
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-20">
    <div className="spinner-border h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
  </div>
);

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
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [isViewPlanDialogOpen, setIsViewPlanDialogOpen] = useState(false);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [planBlocks, setPlanBlocks] = useState<any[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<ProductionPlan | null>(null);

  // Fetch production plans from API
  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPlans = await productionPlansApi.getAll();
      setPlans(fetchedPlans as ProductionPlan[]);
    } catch (err) {
      console.error("Error fetching production plans:", err);
      setError("Failed to load production plans");
      toast.error("Failed to load production plans");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlanBlocks = async (planId: string) => {
    setIsLoadingBlocks(true);
    try {
      const fetchedBlocks = await productionPlansApi.getBlocks(planId);
      setPlanBlocks(fetchedBlocks as any[]);
    } catch (err) {
      console.error("Error fetching plan blocks:", err);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  // Handle deleting a production block
  const handleDeleteBlock = async (blockId: string) => {
    try {
      await productionBlocksApi.delete(blockId);

      // Update the local state to remove the deleted block
      setPlanBlocks(planBlocks.filter((block) => block._id !== blockId));

      // Refresh the plans to update the blocks count
      fetchPlans();

      toast.success("Block deleted successfully");
    } catch (err) {
      console.error("Error deleting block:", err);
      toast.error("Failed to delete block");
    }
  };

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlans}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchPlans}
            >
              Try Again
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 border rounded-md border-dashed p-6">
            <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No production plans found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first production plan to get started
            </p>
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan._id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{plan.name}</h4>
                    {getStatusBadge(plan.status)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {plan.recipes?.length || 0} recipes •{" "}
                    {new Date(plan.weekStartDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <div className="text-sm font-medium">
                      {plan.completionStatus || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Complete
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlan(plan);
                      fetchPlanBlocks(plan._id);
                      setIsEditPlanDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      setPlanToDelete(plan);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Plan Dialog */}
      {selectedPlan && (
        <Dialog
          open={isEditPlanDialogOpen}
          onOpenChange={setIsEditPlanDialogOpen}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedPlan.name}</DialogTitle>
              <DialogDescription>
                Edit plan details or manage production blocks in this plan.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 overflow-y-auto pr-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Plan Details</h3>
                <div className="text-sm text-muted-foreground">
                  Week of{" "}
                  {new Date(selectedPlan.weekStartDate).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">{selectedPlan.status}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">
                    Completion
                  </div>
                  <div className="font-medium">
                    {selectedPlan.completionStatus || 0}%
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Recipes</div>
                  <div className="font-medium">
                    {selectedPlan.recipes?.length || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Production Blocks</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddBlockDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Block
                  </Button>
                </div>

                {isLoadingBlocks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : planBlocks.length === 0 ? (
                  <div className="text-center py-8 border rounded-md border-dashed p-6">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No blocks in this plan
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click "Add Block" to add production blocks to this plan
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Block Type</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Machine</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Recipe</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planBlocks.map((block) => (
                          <TableRow key={block._id}>
                            <TableCell className="font-medium capitalize">
                              {block.blockType}
                            </TableCell>
                            <TableCell>{block.day}</TableCell>
                            <TableCell>
                              {new Date(block.startTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}{" "}
                              -
                              {new Date(block.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              {block.machineId?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {block.employeeId?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {block.recipeId?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "capitalize",
                                  block.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : block.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100"
                                )}
                              >
                                {block.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Production Block
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this{" "}
                                      {block.blockType} block? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteBlock(block._id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Plan Dialog */}
      {selectedPlan && (
        <Dialog
          open={isViewPlanDialogOpen}
          onOpenChange={setIsViewPlanDialogOpen}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedPlan.name}</DialogTitle>
              <DialogDescription>
                Production plan details and associated blocks.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 overflow-y-auto pr-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Plan Details</h3>
                <div className="text-sm text-muted-foreground">
                  Week of{" "}
                  {new Date(selectedPlan.weekStartDate).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">{selectedPlan.status}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">
                    Completion
                  </div>
                  <div className="font-medium">
                    {selectedPlan.completionStatus || 0}%
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Recipes</div>
                  <div className="font-medium">
                    {selectedPlan.recipes?.length || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Production Blocks</h3>
                </div>

                {isLoadingBlocks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : planBlocks.length === 0 ? (
                  <div className="text-center py-8 border rounded-md border-dashed p-6">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No blocks in this plan
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use the Edit button to add blocks to this plan
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Block Type</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Machine</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Recipe</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planBlocks.map((block) => (
                          <TableRow key={block._id}>
                            <TableCell className="font-medium capitalize">
                              {block.blockType}
                            </TableCell>
                            <TableCell>{block.day}</TableCell>
                            <TableCell>
                              {new Date(block.startTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}{" "}
                              -
                              {new Date(block.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              {block.machineId?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {block.employeeId?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {block.recipeId?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "capitalize",
                                  block.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : block.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100"
                                )}
                              >
                                {block.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Block Dialog */}
      {selectedPlan && (
        <ScheduleBuilder
          isOpen={isAddBlockDialogOpen}
          onOpenChange={setIsAddBlockDialogOpen}
          planId={selectedPlan._id}
          onBlockAdded={() => {
            // Refresh the plan data after adding a block
            fetchPlans();
            toast.success("Block added to plan successfully");
          }}
        />
      )}

      {/* Delete Plan Dialog */}
      {planToDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Production Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete plan "{planToDelete.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  productionPlansApi
                    .delete(planToDelete._id)
                    .then(() => {
                      toast.success(`Production plan deleted successfully`);
                      // Refresh the list of plans
                      fetchPlans();
                    })
                    .catch((err) => {
                      console.error("Error deleting plan:", err);
                      toast.error(
                        `Failed to delete production plan: ${err.message}`
                      );
                    });
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

const ProductionPlanning = () => {
  const [activeTab, setActiveTab] = useState<string>("overview"); // Keep as string to work with Tabs component
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);

  const handleCreatePlan = () => {
    // Open the add plan dialog
    setIsAddPlanDialogOpen(true);
  };

  // Add callback handlers for ScheduleBuilder
  const handleBlockAdded = (newBlock: ProductionBlock) => {
    toast.success(`New ${newBlock.blockType} block added to schedule`);
    // Close the dialog
    setIsAddBlockDialogOpen(false);
  };

  const handleBlockUpdated = (updatedBlock: ProductionBlock) => {
    toast.success(`Block updated successfully`);
    // Close the dialog
    setIsAddBlockDialogOpen(false);
  };

  const handleBlockDeleted = (blockId: string) => {
    toast.success(`Block removed from schedule`);
  };

  return (
    <Layout>
      {/* Add the spinner CSS */}
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

      <div className="container mx-auto space-y-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Load schedule functionality coming in step 3.5")
                }
              >
                Load Schedule
              </Button>
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-1" />
                Create Plan
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="flex gap-6 h-[calc(100vh-220px)]">
              <div className="flex-1">
                <div className="col-span-3 space-y-6">
                  <WeeklyOverview />
                  <ProductionPlansList />
                </div>
              </div>
              <ResourceManagementPanel />
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <Button onClick={() => setIsAddBlockDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Block
                </Button>
              </div>

              <ScheduleView />

              {/* Simple dialog approach */}
              <ScheduleBuilder
                isOpen={isAddBlockDialogOpen}
                onOpenChange={setIsAddBlockDialogOpen}
                onBlockAdded={handleBlockAdded}
                onBlockUpdated={handleBlockUpdated}
                onBlockDeleted={handleBlockDeleted}
              />
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceManagementPanel fullWidth={true} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Production Plan Dialog */}
      <AddProductionPlanDialog
        isOpen={isAddPlanDialogOpen}
        onClose={() => setIsAddPlanDialogOpen(false)}
        onPlanAdded={() => {
          // Here we could refresh the list of plans
        }}
      />
    </Layout>
  );
};

export default ProductionPlanning;
