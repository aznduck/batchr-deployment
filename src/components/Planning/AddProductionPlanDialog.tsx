import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { productionPlansApi } from "@/lib/api";
import { ProductionPlan } from "@/lib/production";

interface AddProductionPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanAdded?: () => void;
}

const AddProductionPlanDialog: React.FC<AddProductionPlanDialogProps> = ({
  isOpen,
  onClose,
  onPlanAdded,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
    notes: "",
  });

  // State for tracking submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
        notes: "",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the production plan
      await productionPlansApi.create({
        name: formData.name,
        weekStartDate: formData.weekStartDate,
        notes: formData.notes,
      });
      
      toast.success("Production plan created successfully");
      
      // Call the callback if provided
      if (onPlanAdded) {
        onPlanAdded();
      }
      
      // Close the dialog
      onClose();
    } catch (err) {
      console.error("Error creating production plan:", err);
      toast.error("Failed to create production plan: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Production Plan</DialogTitle>
          <DialogDescription>
            Create a new production plan for scheduling.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>

          {/* Week Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weekStartDate" className="text-right">
              Week Start
            </Label>
            <div className="col-span-3">
              <Input
                type="date"
                id="weekStartDate"
                name="weekStartDate"
                value={format(formData.weekStartDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  // Create date at noon to avoid timezone issues
                  const dateValue = e.target.value;
                  const [year, month, day] = dateValue.split('-').map(Number);
                  const date = new Date(year, month - 1, day, 12, 0, 0);
                  
                  if (!isNaN(date.getTime())) {
                    setFormData(prev => ({ ...prev, weekStartDate: date }));
                  }
                }}
                min="2020-01-01"
                max="2030-12-31"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right align-top mt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="col-span-3"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductionPlanDialog;
