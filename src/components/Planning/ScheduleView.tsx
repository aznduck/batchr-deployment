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

        // Check if blocks have populated recipe references
        const processedBlocks = (fetchedBlocks as any[]).map((block) => {
          // In the API response, recipe data is in recipeId when populated
          if (block.recipeId && typeof block.recipeId === "object") {
            return {
              ...block,
              recipe: block.recipeId, // Map API's recipeId object to recipe property
            };
          }
          return block;
        });

        setBlocks(processedBlocks as ProductionBlock[]);
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
      <div className="px-4 pb-2 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300"></div>
          <span>Prep</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-300"></div>
          <span>Production</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-300"></div>
          <span>Cleaning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-300"></div>
          <span>Other</span>
        </div>
      </div>
      <CardContent className="p-0 flex-1 flex flex-col">
        <Tabs defaultValue="calendar" className="flex-1 flex flex-col">
          <div className="px-4 border-b"></div>

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

                {/* Rendering blocks for the week based on their assigned day property */}
                {blocks.map((block) => {
                  // Map day string to column index (0-6, Monday to Sunday)
                  const dayToIndex = {
                    Monday: 0,
                    Tuesday: 1,
                    Wednesday: 2,
                    Thursday: 3,
                    Friday: 4,
                    Saturday: 5,
                    Sunday: 6,
                  };

                  const dayIndex =
                    dayToIndex[block.day as keyof typeof dayToIndex];

                  // Skip if day is invalid
                  if (dayIndex === undefined) return null;

                  return (
                    <div
                      key={block._id}
                      className="absolute"
                      style={{
                        // Position blocks exactly aligned with calendar columns
                        left: `calc(4rem + (${dayIndex} * (100% - 4rem) / 7))`,
                        width: `calc((100% - 4rem) / 7)`,
                        top: 0,
                        height: "100%",
                        pointerEvents: "none",
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
                  );
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
                                    {block.plannedQuantity || 0} units
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
