import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Edit, MoreVertical } from "lucide-react";

const NewScheduleForm: React.FC = () => {
  return (
    <div className="w-[450px] border-r border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4">New Schedule</h2>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Title"
          className="border-gray-300 focus:border-black focus:ring-0"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Employees</h3>
          <Button variant="ghost" size="sm" className="p-1">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <EmployeeItem
            name="Maria T."
            status="Reg. Hours"
            avatarColor="bg-purple-400"
          />
          <EmployeeItem
            name="John H."
            status="Reg. Hours"
            avatarColor="bg-blue-400"
          />
          <EmployeeItem
            name="Mark F."
            status="Reg. Hours"
            avatarColor="bg-teal-400"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Machines</h3>
          <Button variant="ghost" size="sm" className="p-1">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <MachineItem name="Machine 1" capacity="8 Gallon" />
          <MachineItem name="Machine 1" capacity="4 Gallon" />
          <MachineItem name="Machine 1" capacity="4 Gallon" />
          <MachineItem name="Machine 1" capacity="2 Gallon" />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Product</h3>
          <Button variant="ghost" size="sm" className="p-1">
            <Edit className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
          <div className="text-sm font-medium">Caramel Crack</div>
          <div className="text-sm text-gray-500">4 Tubs</div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button className="flex-1 bg-black hover:bg-gray-800">Save</Button>
        <Button className="flex-1 bg-purple-500 hover:bg-purple-600">
          Generate
        </Button>
      </div>
    </div>
  );
};

type EmployeeItemProps = {
  name: string;
  status: string;
  avatarColor: string;
};

const EmployeeItem: React.FC<EmployeeItemProps> = ({
  name,
  status,
  avatarColor,
}) => {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white mr-3`}
        >
          {name.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-gray-500">{status}</div>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  );
};

type MachineItemProps = {
  name: string;
  capacity: string;
};

const MachineItem: React.FC<MachineItemProps> = ({ name, capacity }) => {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
      <div className="flex items-center">
        <div className="w-8 h-8 flex items-center justify-center mr-3">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="6" x2="12" y2="10"></line>
            <line x1="12" y1="14" x2="12" y2="18"></line>
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-gray-500">{capacity}</div>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default NewScheduleForm;
