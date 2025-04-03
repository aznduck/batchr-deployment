import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScheduleHeaderProps = {
  title: string;
};

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({ title }) => {
  return (
    <div className="flex justify-between items-center py-4 px-6 border-b border-gray-200">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          className="bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200"
        >
          Load Schedule
        </Button>
        <Button className="bg-black text-white hover:bg-gray-800">
          New Schedule
        </Button>
      </div>
    </div>
  );
};

export default ScheduleHeader;
