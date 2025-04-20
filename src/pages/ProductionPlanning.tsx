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
import { employeesApi, machinesApi, recipesApi } from "@/lib/api";
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
  const [activeTab, setActiveTab] = useState<string>("overview"); // Keep as string to work with Tabs component

  const handleCreatePlan = () => {
    // This would open a modal or navigate to create plan page
    toast.info("Create plan functionality will be implemented in later steps");
  };

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

  // Add callback handlers for ScheduleBuilder
  const handleBlockAdded = (newBlock: ProductionBlock) => {
    toast.success(`New ${newBlock.blockType} block added to schedule`);
    // Here you would typically update any parent state if needed
  };

  const handleBlockUpdated = (updatedBlock: ProductionBlock) => {
    toast.success(`Block updated successfully`);
    // Here you would typically update any parent state if needed
  };

  const handleBlockDeleted = (blockId: string) => {
    toast.success(`Block removed from schedule`);
    // Here you would typically update any parent state if needed
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
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

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
                <h2 className="text-xl font-semibold">Production Calendar</h2>
                <Button
                  onClick={() => {
                    // Create a default block
                    const defaultBlock: ProductionBlock = {
                      _id: "",
                      startTime: new Date(new Date().setHours(9, 0, 0, 0)), // Default 9 AM
                      endTime: new Date(new Date().setHours(10, 0, 0, 0)), // Default 10 AM
                      blockType: "production",
                      status: "scheduled",
                      notes: "",
                    };

                    // Open the Add Block dialog in ScheduleBuilder
                    const scheduleBuilder = document.getElementById(
                      "schedule-builder"
                    ) as any;
                    if (scheduleBuilder && scheduleBuilder.openAddDialog) {
                      scheduleBuilder.openAddDialog(defaultBlock);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Block
                </Button>
              </div>

              <ScheduleView />
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceManagementPanel fullWidth={true} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProductionPlanning;
