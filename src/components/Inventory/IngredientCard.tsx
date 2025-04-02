import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularGauge } from "@/components/ui/CircularGauge";
import { Ingredient, getStockStatus } from "@/lib/data";
import { AreaChart, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

interface IngredientCardProps {
  ingredient: Ingredient;
  onEdit?: (ingredient: Ingredient) => void;
  onDelete?: (ingredient: Ingredient) => void;
}

export const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(ingredient);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      onDelete(ingredient);
    }
    setDeleteDialogOpen(false);
  };

  const status = getStockStatus(ingredient);
  const statusColor = {
    critical: "bg-danger text-danger-foreground",
    warning: "bg-warning text-warning-foreground",
    normal: "bg-success text-success-foreground",
  }[status];

  const chartData = ingredient.history.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    stock: item.level,
  }));

  return (
    <>
      <Card
        className={cn(
          "hover-scale transition-all duration-300 overflow-hidden",
          expanded && "row-span-2"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {ingredient.name}
            </CardTitle>
            <Badge
              className={cn(
                "transition-colors ml-2 px-2 py-0 h-5 text-xs",
                statusColor
              )}
            >
              {status === "critical"
                ? "Critical"
                : status === "warning"
                ? "Low"
                : "Good"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center justify-between">
            <CircularGauge
              value={ingredient.stock}
              maxValue={ingredient.threshold * 2}
              size={80}
              thickness={8}
              label={ingredient.unit}
              valueFormatter={(value) => `${value}`}
            />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stock:</span>
                <span className="font-medium">
                  {ingredient.stock} {ingredient.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Threshold:</span>
                <span className="font-medium">
                  {ingredient.threshold} {ingredient.unit}
                </span>
              </div>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={() => setDetailsOpen(true)}
                >
                  <AreaChart size={14} className="mr-1" /> View History
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleEditClick}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleExpanded}>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>

        {expanded && (
          <div className="px-6 pb-4 pt-0 animate-fade-in">
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3984A3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3984A3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stock"
                    stroke="#3984A3"
                    fillOpacity={1}
                    fill="url(#stockGradient)"
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ingredient History</DialogTitle>
            <DialogDescription>
              Historical stock levels for {ingredient.name}
            </DialogDescription>
          </DialogHeader>

          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="detailStockGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3984A3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3984A3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'dataMax + 50']}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="stock"
                  name={`Stock (${ingredient.unit})`}
                  stroke="#3984A3"
                  fillOpacity={1}
                  fill="url(#detailStockGradient)"
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 bg-muted rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">Stock Level Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {ingredient.history.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {new Date(item.date).toLocaleDateString()}:
                  </span>
                  <span className="font-medium">
                    {item.level} {ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ingredient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {ingredient.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IngredientCard;
