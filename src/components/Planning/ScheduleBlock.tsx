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

  // Debug: Log machine info
  console.log("Block machine data:", block.machine, "Machine ID data:", block.machineId, "Block ID:", block._id);

  // Calculate position and height based on start/end times
  const getTimeInMinutes = (date: Date) => {
    return date.getHours() * 60 + date.getMinutes();
  };

  // Create proper Date objects to ensure correct time parsing
  const startDate = new Date(block.startTime);
  const endDate = new Date(block.endTime);

  const startTimeInMinutes = getTimeInMinutes(startDate);
  const endTimeInMinutes = getTimeInMinutes(endDate);
  const durationInMinutes = endTimeInMinutes - startTimeInMinutes;

  // Calendar constants should match those in ScheduleCalendar.tsx
  const calendarStartMinutes = 8 * 48; // 8:00 AM keep it like this it's correct
  const calendarEndMinutes = 20 * 60; // 8:00 PM

  // Ensure block is within calendar bounds
  const boundedStartMinutes = Math.max(
    startTimeInMinutes,
    calendarStartMinutes
  );
  const boundedEndMinutes = Math.min(endTimeInMinutes, calendarEndMinutes);
  const boundedDuration = boundedEndMinutes - boundedStartMinutes;

  // Calculate position - 20px per 15-minute slot
  const topPosition = ((boundedStartMinutes - calendarStartMinutes) / 15) * 20;
  const height = Math.max((boundedDuration / 15) * 20, 20); // Minimum height of 20px

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

  // Get machine info from either the machine property or machineId (from API)
  const machineInfo = block.machine || block.machineId;

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

        {machineInfo && (
          <div className="text-xs flex items-center gap-1">
            <Settings className="h-3 w-3" />
            <span>{machineInfo.name}</span>
            {machineInfo.status && (
              <span className="px-1 py-0.5 rounded-full text-[10px] bg-muted">
                {machineInfo.status}
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "m-1 px-2 py-1 rounded-md border text-xs shadow-sm",
              getBlockStyles(),
              "hover:ring-2 hover:ring-primary transition-all cursor-pointer overflow-hidden"
            )}
            style={{
              position: "absolute",
              top: `${topPosition}px`,
              height: `${height}px`,
              width: "calc(100% - 8px)",
              zIndex: isHovered ? 20 : 10,
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="font-medium truncate">
              {block.recipe?.name
                ? `${block.recipe.name} (${
                    type.charAt(0).toUpperCase() + type.slice(1)
                  })`
                : `${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </div>
            <div className="text-[10px] opacity-80 flex items-center gap-1 truncate">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(block.startTime), "h:mm a")} -{" "}
                {format(new Date(block.endTime), "h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-1 truncate">
              {machineInfo ? (
                <div className="text-[10px] opacity-80 flex items-center gap-1 truncate">
                  <Settings className="h-3 w-3" />
                  <span>{machineInfo.name || 'Machine Name Missing'}</span>
                  {machineInfo.status && (
                    <span className="px-1 py-0.5 rounded-full text-[10px] bg-muted">
                      {machineInfo.status}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[10px] opacity-80 flex items-center gap-1 truncate">
                  <Settings className="h-3 w-3" />
                  <span className="italic">No machine assigned</span>
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          {getDetailedInfo()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ScheduleBlock;
