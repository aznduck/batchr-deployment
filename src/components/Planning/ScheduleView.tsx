import React, { useEffect, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import ScheduleCalendar from "./ScheduleCalendar";
import ScheduleBlock from "./ScheduleBlock";
import ProductionBlock from "@/lib/productionBlock";
import { productionBlocksApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Utensils,
  Settings,
  User,
  AlertCircle,
} from "lucide-react";

interface ScheduleViewProps {
  weekOf?: Date;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  weekOf = new Date(),
}) => {
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<ProductionBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch production blocks when component mounts
  useEffect(() => {
    const fetchProductionBlocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedBlocks = await productionBlocksApi.getAll();
        setBlocks(fetchedBlocks as ProductionBlock[]);
      } catch (err) {
        console.error("Error fetching production blocks:", err);
        setError("Failed to load production schedule. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductionBlocks();
  }, []);

  // Filter blocks by day when selected date changes
  const filteredBlocks = selectedDate
    ? blocks.filter((block) => {
        const blockDate = new Date(block.startTime);
        return isSameDay(blockDate, selectedDate);
      })
    : blocks;

  // Group blocks by day for the week view
  const blocksByDay = blocks.reduce((acc, block) => {
    const date = format(new Date(block.startTime), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(block);
    return acc;
  }, {} as Record<string, ProductionBlock[]>);

  // Handle time slot click in the calendar
  const handleTimeSlotClick = (day: Date, hour: number, minute: number) => {
    setSelectedDate(day);
    // You could add functionality to create a new block at this time
    console.log(`Clicked on ${format(day, "yyyy-MM-dd")} at ${hour}:${minute}`);
  };

  // Handle block click to show details
  const handleBlockClick = (block: ProductionBlock) => {
    console.log("Block clicked:", block);
    // You could add modal or sidebar to show block details
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Production Schedule</span>
          </div>
          {selectedDate && (
            <Badge variant="outline" className="ml-auto">
              {format(selectedDate, "MMMM d, yyyy")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <Tabs defaultValue="calendar" className="flex-1 flex flex-col">
          <div className="px-4 border-b">
            <TabsList>
              <TabsTrigger value="calendar" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Day View</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="calendar"
            className="flex-1 flex m-0 p-4 data-[state=inactive]:hidden"
          >
            {loading ? (
              <div className="flex-1 flex flex-col space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-2/3" />
                <div className="flex-1 grid grid-cols-7 gap-2">
                  {Array(7)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-full" />
                    ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="p-6 max-w-md">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Unable to Load Schedule
                  </h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 relative">
                <ScheduleCalendar onTimeSlotClick={handleTimeSlotClick} />

                {/* Rendering blocks for each day */}
                {Object.entries(blocksByDay).map(([dateStr, dayBlocks]) => {
                  // Find which column (day) this block belongs to
                  const blockDate = parseISO(dateStr);
                  const dayIndex = [0, 1, 2, 3, 4, 5, 6].find((i) =>
                    isSameDay(
                      blockDate,
                      new Date(
                        blockDate.getFullYear(),
                        blockDate.getMonth(),
                        blockDate.getDate() - blockDate.getDay() + i + 1
                      )
                    )
                  );

                  if (dayIndex === undefined) return null;

                  return dayBlocks.map((block) => (
                    <div
                      key={block._id}
                      className="absolute"
                      style={{
                        left: `calc(4rem + ${dayIndex * (100 / 7)}%)`,
                        width: `calc(${100 / 7}% - 8px)`,
                      }}
                    >
                      <ScheduleBlock
                        block={block}
                        type={
                          block.blockType === "prep"
                            ? "prep"
                            : block.blockType === "production"
                            ? "production"
                            : block.blockType === "cleaning"
                            ? "cleaning"
                            : "default"
                        }
                        onClick={() => handleBlockClick(block)}
                      />
                    </div>
                  ));
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="list"
            className="flex-1 overflow-auto m-0 p-0 data-[state=inactive]:hidden"
          >
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                {selectedDate
                  ? format(selectedDate, "MMMM d, yyyy")
                  : "Today's Schedule"}
              </h3>

              {loading ? (
                <div className="space-y-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
              ) : error ? (
                <div className="text-center p-6">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                  <p className="text-muted-foreground">{error}</p>
                </div>
              ) : filteredBlocks.length === 0 ? (
                <div className="text-center p-6 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">
                    No production blocks scheduled for this day.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBlocks
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    )
                    .map((block) => (
                      <Card key={block._id} className="overflow-hidden">
                        <div className="flex">
                          <div
                            className={`w-2 h-full ${
                              block.blockType === "prep"
                                ? "bg-blue-500"
                                : block.blockType === "production"
                                ? "bg-green-500"
                                : block.blockType === "cleaning"
                                ? "bg-purple-500"
                                : "bg-orange-500"
                            }`}
                          />
                          <CardContent className="p-4 flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">
                                {block.recipe?.name || "Unnamed Production"}
                              </h4>
                              <Badge>{block.blockType || "production"}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(new Date(block.startTime), "h:mm a")}{" "}
                                  - {format(new Date(block.endTime), "h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Settings className="h-4 w-4" />
                                <span>
                                  {block.machine?.name || "No machine"}
                                </span>
                              </div>
                              {block.assignedEmployee && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  <span>
                                    {block.assignedEmployee.name ||
                                      "Unassigned"}
                                  </span>
                                </div>
                              )}
                              {block.recipe && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Utensils className="h-4 w-4" />
                                  <span>
                                    {block.plannedQuantity || 0}{" "}
                                    units
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScheduleView;
