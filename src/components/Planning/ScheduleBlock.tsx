import React, { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProductionBlock } from "@/lib/productionBlock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Utensils, User, Settings } from "lucide-react";

type BlockType = "prep" | "production" | "cleaning" | "default";

interface ScheduleBlockProps {
  block: ProductionBlock;
  type: BlockType;
  onClick?: () => void;
}

export const ScheduleBlock: React.FC<ScheduleBlockProps> = ({
  block,
  type,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate position and height based on start/end times
  const getTimeInMinutes = (date: Date) => {
    return date.getHours() * 60 + date.getMinutes();
  };

  const startTimeInMinutes = getTimeInMinutes(new Date(block.startTime));
  const endTimeInMinutes = getTimeInMinutes(new Date(block.endTime));
  const durationInMinutes = endTimeInMinutes - startTimeInMinutes;

  // Calculate position based on time
  // Assuming the calendar starts at 8:00 AM (480 minutes from midnight)
  const calendarStartMinutes = 8 * 60;
  const topPosition = ((startTimeInMinutes - calendarStartMinutes) / 15) * 20; // 15 min slots, 20px high
  const height = (durationInMinutes / 15) * 20;

  // Determine color based on block type
  const getBlockStyles = () => {
    switch (type) {
      case "prep":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "production":
        return "bg-green-100 border-green-300 text-green-800";
      case "cleaning":
        return "bg-purple-100 border-purple-300 text-purple-800";
      default:
        return "bg-orange-100 border-orange-300 text-orange-800";
    }
  };

  // Enhanced detailed information for the tooltip
  const getDetailedInfo = () => {
    return (
      <div className="p-2 space-y-2 max-w-xs">
        <div className="font-medium text-sm">
          {block.recipe?.name || "Unnamed Production"}
        </div>

        <div className="text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {format(new Date(block.startTime), "h:mm a")} -{" "}
            {format(new Date(block.endTime), "h:mm a")}
          </span>
        </div>

        {block.machine && (
          <div className="text-xs flex items-center gap-1">
            <Settings className="h-3 w-3" />
            <span>{block.machine.name}</span>
            {block.machine.status && (
              <span className="px-1 py-0.5 rounded-full text-[10px] bg-muted">
                {block.machine.status}
              </span>
            )}
          </div>
        )}

        {block.assignedEmployee && (
          <div className="text-xs flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{block.assignedEmployee.name}</span>
            {block.assignedEmployee.role && (
              <span className="text-muted-foreground">
                ({block.assignedEmployee.role})
              </span>
            )}
          </div>
        )}

        {block.recipe && block.plannedQuantity && (
          <div className="text-xs flex items-center gap-1">
            <Utensils className="h-3 w-3" />
            <span>{block.plannedQuantity} units</span>
          </div>
        )}

        {block.notes && (
          <div className="text-xs text-muted-foreground mt-1 border-t pt-1">
            {block.notes}
          </div>
        )}
      </div>
    );
  };

  // Truncate description based on height
  const getTruncatedLabel = () => {
    const fullLabel = `${block.recipe?.name || "Unnamed"} - ${
      block.machine?.name || "No machine"
    }`;
    if (height < 40) return block.recipe?.name || "Unnamed";
    if (height < 60) return fullLabel;
    return (
      <>
        <div className="font-medium">{block.recipe?.name || "Unnamed"}</div>
        <div className="text-xs">
          {block.machine?.name || "No machine"} ({block.blockType || "Default"})
        </div>
        <div className="text-xs mt-1">
          {format(new Date(block.startTime), "h:mm a")} -{" "}
          {format(new Date(block.endTime), "h:mm a")}
        </div>
      </>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute rounded border-l-2 p-1 shadow-sm cursor-pointer transition-all",
              getBlockStyles(),
              isHovered && "shadow-md scale-[1.02] z-10"
            )}
            style={{
              top: `${topPosition}px`,
              height: `${height}px`,
              left: "4px",
              right: "4px",
              zIndex: 10,
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={cn(
                "text-xs font-medium truncate",
                height > 40 ? "leading-tight" : ""
              )}
            >
              {getTruncatedLabel()}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>{getDetailedInfo()}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ScheduleBlock;
