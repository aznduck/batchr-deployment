import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Plus, RefreshCw, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// Import types from our API
import { ProductionPlan } from "@/lib/production";

// We'll create placeholders for components to be implemented in later steps
const ScheduleCalendarView = () => (
  <Card className="flex-1 border-2 border-dashed border-muted rounded-lg p-8 flex items-center justify-center bg-muted/20">
    <div className="text-center space-y-3">
      <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="font-medium text-lg">Schedule Calendar View</h3>
      <p className="text-muted-foreground text-sm">
        Time-slot grid with 15-minute increments<br />
        Coming in step 3.2
      </p>
    </div>
  </Card>
);

const ResourceManagementPanel = () => (
  <Card className="w-72 border-2 border-dashed border-muted rounded-lg p-8 flex flex-col items-center justify-center bg-muted/20">
    <div className="text-center space-y-3">
      <h3 className="font-medium text-lg">Resource Management</h3>
      <p className="text-muted-foreground text-sm">
        Employee availability<br />
        Machine status<br />
        Recipe goal progress<br />
        Coming in step 3.4
      </p>
    </div>
  </Card>
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
              style={{width: `${completionPercentage}%`}}
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
            <div className="text-xs text-muted-foreground mb-1">Machine Utilization</div>
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
      id: '1', 
      name: 'Week of April 10th', 
      weekStartDate: '2025-04-10',
      status: 'active',
      completionStatus: 65,
      recipesCount: 12
    },
    { 
      id: '2', 
      name: 'Week of April 3rd', 
      weekStartDate: '2025-04-03',
      status: 'completed',
      completionStatus: 100,
      recipesCount: 10
    },
    { 
      id: '3', 
      name: 'Week of March 27th', 
      weekStartDate: '2025-03-27',
      status: 'archived',
      completionStatus: 100,
      recipesCount: 11
    }
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-slate-100">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-slate-100">Archived</Badge>;
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
        {plans.map(plan => (
          <Card key={plan.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{plan.name}</h4>
                  {getStatusBadge(plan.status)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {plan.recipesCount} recipes • {new Date(plan.weekStartDate).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <div className="text-sm font-medium">{plan.completionStatus}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <Button variant="outline" size="sm">View</Button>
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
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Production Planning</h1>
            <p className="text-muted-foreground">
              Schedule and manage your ice cream production.
            </p>
          </div>
          
          <div className="space-x-4">
            <Button variant="outline" onClick={() => toast.info("Load schedule functionality coming in step 3.5")}>
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
              <ScheduleCalendarView />
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
