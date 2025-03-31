import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  unitCategories,
  convertUnits,
  UnitDefinition,
  UnitCategoryType,
  UnitCategoryDefinition,
} from "@/lib/units";

interface UnitConverterProps {
  category?: UnitCategoryType;
  initialUnit?: string;
  value?: number;
  onUnitChange?: (unit: string) => void;
  onValueChange?: (value: number) => void;
  showConverter?: boolean;
}

export const UnitConverter: React.FC<UnitConverterProps> = ({
  category,
  initialUnit,
  value = 0,
  onUnitChange,
  onValueChange,
  showConverter = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<UnitCategoryType>(
    category || "dairy_liquid"
  );
  const [fromUnit, setFromUnit] = useState<string>(initialUnit || "");
  const [toUnit, setToUnit] = useState<string>("");
  const [fromValue, setFromValue] = useState<number>(value);
  const [toValue, setToValue] = useState<number>(0);

  // Get available units for the selected category
  const getUnitsForCategory = (categoryType: UnitCategoryType): UnitDefinition[] => {
    const category = unitCategories.find((c) => c.type === categoryType);
    return category ? category.units : [];
  };

  // Update conversion when values change
  useEffect(() => {
    if (fromUnit && toUnit && fromValue) {
      const converted = convertUnits(fromValue, fromUnit, toUnit);
      if (converted !== null) {
        setToValue(Number(converted.toFixed(3)));
      }
    }
  }, [fromUnit, toUnit, fromValue]);

  // Handle unit selection
  const handleUnitChange = (unit: string) => {
    setFromUnit(unit);
    if (onUnitChange) {
      onUnitChange(unit);
    }
  };

  // Handle value input
  const handleValueChange = (value: number) => {
    setFromValue(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value: UnitCategoryType) => setSelectedCategory(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {unitCategories.map((category) => (
                <SelectItem
                  key={category.type}
                  value={category.type}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={fromUnit} onValueChange={handleUnitChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {getUnitsForCategory(selectedCategory).map((unit) => (
                <SelectItem key={unit.symbol} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showConverter && (
        <div className="border rounded-lg p-4 mt-4 space-y-4">
          <h3 className="font-medium">Convert Units</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={fromValue}
                  onChange={(e) => setFromValue(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="py-2 px-3 bg-muted rounded text-sm">
                  {fromUnit}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex gap-2">
                <Select value={toUnit} onValueChange={setToUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUnitsForCategory(selectedCategory).map((unit) => (
                      <SelectItem key={unit.symbol} value={unit.symbol}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {toUnit && (
                  <div className="py-2 px-3 bg-muted rounded text-sm min-w-[100px] text-right">
                    {toValue} {toUnit}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
