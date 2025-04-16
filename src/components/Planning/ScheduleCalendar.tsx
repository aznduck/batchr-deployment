import React, { useState } from "react";
import { addDays, format, startOfWeek, isSameDay, subDays, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CalendarDays, 
  Calendar as CalendarIcon
} from "lucide-react";

// Constants for time display
const HOURS_START = 8; // 8 AM
const HOURS_END = 20; // 8 PM
const BUSINESS_HOURS_START = 9; // 9 AM
const BUSINESS_HOURS_END = 17; // 5 PM
const TIME_SLOT_HEIGHT = 20; // Height in pixels for 15-minute slot

// Generate time slots for the entire day with 15-minute increments
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = HOURS_START; hour < HOURS_END; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push({
        hour,
        minute,
        label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        isBusinessHour: hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END
      });
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

interface ScheduleCalendarProps {
  onTimeSlotClick?: (day: Date, hour: number, minute: number) => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ onTimeSlotClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 })); // Start on Monday

  // Generate array of days for the current week view
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));
  
  // Navigation functions
  const goToPreviousWeek = () => {
    const newWeekStart = subWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
    setCurrentDate(addDays(newWeekStart, 2)); // Move to mid-week
  };
  
  const goToNextWeek = () => {
    const newWeekStart = addWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
    setCurrentDate(addDays(newWeekStart, 2)); // Move to mid-week
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
  };

  const handleTimeSlotClick = (day: Date, hour: number, minute: number) => {
    if (onTimeSlotClick) {
      const clickedDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
        minute
      );
      onTimeSlotClick(clickedDate, hour, minute);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border overflow-hidden">
      {/* Calendar Header with Navigation */}
      <div className="p-4 border-b flex justify-between items-center bg-card">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">
            {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="flex border-b">
        <div className="w-16 min-w-[4rem] border-r bg-muted px-2 py-3 text-xs font-medium text-muted-foreground">
          <Clock className="h-4 w-4 mx-auto" />
        </div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 text-center px-2 py-3 text-sm font-medium border-r last:border-r-0",
              isSameDay(day, new Date()) && "bg-primary/5"
            )}
          >
            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
            <div className={cn(
              "text-sm",
              isSameDay(day, new Date()) && "text-primary font-semibold"
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time Slots Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative flex h-full">
          {/* Time Indicators */}
          <div className="w-16 min-w-[4rem] flex flex-col border-r">
            {timeSlots.map((slot, index) => (
              <div key={index}>
                {slot.minute === 0 && (
                  <div className="h-[80px] border-t flex items-start justify-center px-2 text-xs text-muted-foreground relative -top-2">
                    <span>{slot.hour % 12 === 0 ? 12 : slot.hour % 12}{slot.hour >= 12 ? 'PM' : 'AM'}</span>
                  </div>
                )}
                {slot.minute !== 0 && (
                  <div className="h-[20px]"></div>
                )}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 border-r last:border-r-0 relative",
                isSameDay(day, new Date()) && "bg-primary/5"
              )}
            >
              {/* Business Hours Highlight */}
              <div 
                className="absolute bg-blue-50/50 w-full pointer-events-none"
                style={{
                  top: `${(BUSINESS_HOURS_START - HOURS_START) * 4 * TIME_SLOT_HEIGHT}px`,
                  height: `${(BUSINESS_HOURS_END - BUSINESS_HOURS_START) * 4 * TIME_SLOT_HEIGHT}px`
                }}
              ></div>
              
              {/* Time Slots */}
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-[20px] border-t",
                    slot.minute === 0 && "border-muted",
                    slot.minute !== 0 && "border-muted/30",
                    "hover:bg-muted/50 transition-colors cursor-pointer"
                  )}
                  onClick={() => handleTimeSlotClick(day, slot.hour, slot.minute)}
                ></div>
              ))}
            </div>
          ))}
          
          {/* Current time indicator */}
          {(() => {
            const now = new Date();
            const hoursDiff = now.getHours() - HOURS_START;
            const minutesDiff = now.getMinutes();
            // Fix the calculation to align exactly with time slots
            const topPosition = hoursDiff * 4 * TIME_SLOT_HEIGHT + (minutesDiff / 15) * TIME_SLOT_HEIGHT;
            
            // Only show if current time is within view
            if (hoursDiff >= 0 && hoursDiff < (HOURS_END - HOURS_START) && weekDays.some(day => isSameDay(day, now))) {
              const currentDayIndex = weekDays.findIndex(day => isSameDay(day, now));
              if (currentDayIndex !== -1) {
                const leftPosition = `calc(4rem + ${currentDayIndex * (100 / 7)}%)`;
                
                return (
                  <div 
                    className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                    style={{ top: `${topPosition}px` }}
                  >
                    <div className="w-16 min-w-[4rem] pr-1 text-right">
                      <div className="text-xs font-medium text-primary">{format(now, 'h:mm a')}</div>
                    </div>
                    <div className="flex-1 h-0.5 bg-primary/70"></div>
                  </div>
                );
              }
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;