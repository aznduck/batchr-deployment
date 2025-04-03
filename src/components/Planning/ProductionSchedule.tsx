import React, { useState } from "react";
import { Share2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Mock data for the schedule
const dateOptions = [
  "Monday, 3/31",
  "Tuesday, 4/1",
  "Wednesday, 4/2",
  "Thursday, 4/3",
  "Friday, 4/4",
];

const machines = [
  "Machine 1",
  "Machine 2",
  "Machine 3",
  "Machine 4",
  "Machine 5",
];
const hours = [
  "9AM",
  "10AM",
  "11AM",
  "12PM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "5PM",
  "6PM",
  "7PM",
  "8PM",
  "9PM",
  "10PM",
];

// Mock employee data
const employees = [
  { id: 1, name: "John Smith", color: "bg-purple-400" },
  { id: 2, name: "Emma Davis", color: "bg-blue-400" },
  { id: 3, name: "Michael Chen", color: "bg-teal-400" },
  { id: 4, name: "Sarah Johnson", color: "bg-amber-400" },
  { id: 5, name: "David Wilson", color: "bg-red-400" },
  { id: 6, name: "Lisa Garcia", color: "bg-green-400" },
];

// Updated tasks data with more entries
const tasks = [
  {
    id: 1,
    employeeId: 1,
    startHour: 0, // 9AM
    duration: 2,
    machineIndex: 0,
    date: "Monday, 3/31",
  },
  {
    id: 2,
    employeeId: 2,
    startHour: 1, // 10AM
    duration: 3,
    machineIndex: 1,
    date: "Tuesday, 4/1",
  },
  {
    id: 3,
    employeeId: 3,
    startHour: 2, // 11AM
    duration: 3,
    machineIndex: 2,
    date: "Wednesday, 4/2",
  },
  {
    id: 4,
    employeeId: 3,
    startHour: 4, // 1PM
    duration: 2,
    machineIndex: 2,
    date: "Wednesday, 4/2",
  },
  {
    id: 5,
    employeeId: 4,
    startHour: 5, // 2PM
    duration: 4,
    machineIndex: 3,
    date: "Wednesday, 4/2",
  },
  {
    id: 6,
    employeeId: 1,
    startHour: 0, // 9AM
    duration: 3,
    machineIndex: 4,
    date: "Thursday, 4/3",
  },
  // Additional tasks for Monday
  {
    id: 7,
    employeeId: 5,
    startHour: 3, // 12PM
    duration: 3,
    machineIndex: 2,
    date: "Monday, 3/31",
  },
  {
    id: 8,
    employeeId: 6,
    startHour: 1, // 10AM
    duration: 4,
    machineIndex: 3,
    date: "Monday, 3/31",
  },
  {
    id: 9,
    employeeId: 2,
    startHour: 6, // 3PM
    duration: 3,
    machineIndex: 4,
    date: "Monday, 3/31",
  },
  // Additional tasks for Tuesday
  {
    id: 10,
    employeeId: 4,
    startHour: 5, // 2PM
    duration: 2,
    machineIndex: 0,
    date: "Tuesday, 4/1",
  },
  {
    id: 11,
    employeeId: 5,
    startHour: 7, // 4PM
    duration: 3,
    machineIndex: 3,
    date: "Tuesday, 4/1",
  },
  // Additional tasks for Friday
  {
    id: 12,
    employeeId: 6,
    startHour: 2, // 11AM
    duration: 5,
    machineIndex: 1,
    date: "Friday, 4/4",
  },
  {
    id: 13,
    employeeId: 3,
    startHour: 8, // 5PM
    duration: 2,
    machineIndex: 0,
    date: "Friday, 4/4",
  },
];

const ProductionSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]);

  // Get the employee color based on employeeId
  const getEmployeeColor = (employeeId: number) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? employee.color : "bg-gray-400";
  };

  // Get the employee name based on employeeId
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : "Unknown";
  };

  // Filter tasks by selected date
  const filteredTasks = tasks.filter((task) => task.date === selectedDate);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            Caramel Crack Production Schedule
            <button className="ml-2 p-1 text-gray-500 hover:text-gray-700">
              <Share2 className="w-5 h-5" />
            </button>
          </h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {selectedDate}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {dateOptions.map((date, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className="cursor-pointer"
                >
                  {date}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex border-b border-gray-200 pb-2">
          <div className="w-16"></div> {/* Empty space for time labels */}
          {machines.map((machine, index) => (
            <div key={index} className="flex-1 text-center font-medium">
              {machine}
            </div>
          ))}
        </div>

        <div
          className="relative overflow-y-auto"
          style={{ height: "calc(100vh - 240px)" }}
        >
          {hours.map((hour, hourIndex) => (
            <div key={hourIndex} className="flex border-b border-gray-100">
              <div className="w-16 py-4 pr-4 text-right text-sm text-gray-500 sticky left-0 bg-white">
                {hour}
              </div>

              {machines.map((_, machineIndex) => (
                <div
                  key={`${hourIndex}-${machineIndex}`}
                  className="flex-1 h-10 border-l border-gray-100 relative"
                >
                  {filteredTasks
                    .filter(
                      (task) =>
                        task.machineIndex === machineIndex &&
                        task.startHour === hourIndex
                    )
                    .map((task) => (
                      <div
                        key={task.id}
                        className={`absolute w-[95%] rounded-md ${getEmployeeColor(
                          task.employeeId
                        )} group`}
                        style={{
                          height: `${task.duration * 40}px`,
                          top: 0,
                          left: "2.5%",
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-30 text-white text-xs font-medium transition-opacity rounded-md">
                          {getEmployeeName(task.employeeId)}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductionSchedule;
