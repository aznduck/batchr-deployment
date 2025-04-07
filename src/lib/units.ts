export type UnitCategoryType =
  | "dairy_liquid"
  | "dry"
  | "solid_mixin"
  | "packaging";

export interface UnitDefinition {
  symbol: string;
  name: string;
  category: UnitCategoryType;
  baseUnit: string;
  conversionFactor: number;
}

export interface UnitCategoryDefinition {
  name: string;
  description: string;
  type: UnitCategoryType;
  units: UnitDefinition[];
}

export const unitCategories: UnitCategoryDefinition[] = [
  {
    name: "Dairy & Liquid Ingredients",
    description:
      "Units for milk, cream, liquid flavorings, and other liquid ingredients",
    type: "dairy_liquid",
    units: [
      {
        symbol: "cups",
        name: "Cups",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 0.236588,
      },
      {
        symbol: "gal",
        name: "Gallons",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 3.78541,
      },
      {
        symbol: "L",
        name: "Liters",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 1,
      },
      {
        symbol: "qt",
        name: "Quarts",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 0.946353,
      },
      {
        symbol: "pt",
        name: "Pints",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 0.473176,
      },
      {
        symbol: "fl_oz",
        name: "Fluid Ounces",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 0.0295735,
      },
      {
        symbol: "mL",
        name: "Milliliters",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 0.001,
      },
      {
        symbol: "tube",
        name: "Tubes",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 0.5,
      },
      {
        symbol: "drop",
        name: "Drops",
        category: "dairy_liquid",
        baseUnit: "L",
        conversionFactor: 0.001,
      },
    ],
  },
  {
    name: "Dry Ingredients",
    description:
      "Units for sugar, cocoa powder, stabilizers, and other dry ingredients",
    type: "dry",
    units: [
      {
        symbol: "kg",
        name: "Kilograms",
        category: "dry",
        baseUnit: "g",
        conversionFactor: 1000,
      },
      {
        symbol: "g",
        name: "Grams",
        category: "dry",
        baseUnit: "g",
        conversionFactor: 1,
      },
      {
        symbol: "lbs",
        name: "Pounds",
        category: "dry",
        baseUnit: "g",
        conversionFactor: 453.592,
      },
      {
        symbol: "oz",
        name: "Ounces",
        category: "dry",
        baseUnit: "g",
        conversionFactor: 28.3495,
      },
      {
        symbol: "cup",
        name: "Cups",
        category: "dry",
        baseUnit: "g",
        conversionFactor: 128,
      }, // Approximate
      {
        symbol: "tbsp",
        name: "Tablespoons",
        category: "dry",
        baseUnit: "g",
        conversionFactor: 15,
      }, // Approximate
      {
        symbol: "tsp",
        name: "Teaspoons",
        category: "dry",
        baseUnit: "g",
        conversionFactor: 5,
      }, // Approximate
    ],
  },
  {
    name: "Solid & Chunky Mix-ins",
    description:
      "Units for chocolate chips, nuts, cookie dough pieces, and other mix-ins",
    type: "solid_mixin",
    units: [
      {
        symbol: "kg",
        name: "Kilograms",
        category: "solid_mixin",
        baseUnit: "g",
        conversionFactor: 1000,
      },
      {
        symbol: "g",
        name: "Grams",
        category: "solid_mixin",
        baseUnit: "g",
        conversionFactor: 1,
      },
      {
        symbol: "lbs",
        name: "Pounds",
        category: "solid_mixin",
        baseUnit: "g",
        conversionFactor: 453.592,
      },
      {
        symbol: "oz",
        name: "Ounces",
        category: "solid_mixin",
        baseUnit: "g",
        conversionFactor: 28.3495,
      },
      {
        symbol: "case",
        name: "Cases",
        category: "solid_mixin",
        baseUnit: "case",
        conversionFactor: 1,
      },
      {
        symbol: "bag",
        name: "Bags",
        category: "solid_mixin",
        baseUnit: "bag",
        conversionFactor: 1,
      },
    ],
  },
  {
    name: "Packaging & Cones",
    description:
      "Units for waffle cones, sugar cones, cups, and packaging supplies",
    type: "packaging",
    units: [
      {
        symbol: "unit",
        name: "Units",
        category: "packaging",
        baseUnit: "unit",
        conversionFactor: 1,
      },
      {
        symbol: "box",
        name: "Boxes",
        category: "packaging",
        baseUnit: "unit",
        conversionFactor: 24,
      }, // Assuming 24 units per box
      {
        symbol: "case",
        name: "Cases",
        category: "packaging",
        baseUnit: "unit",
        conversionFactor: 144,
      }, // Assuming 6 boxes per case
      {
        symbol: "dz",
        name: "Dozens",
        category: "packaging",
        baseUnit: "unit",
        conversionFactor: 12,
      },
    ],
  },
];

export const findUnitDefinition = (
  symbol: string
): UnitDefinition | undefined => {
  for (const category of unitCategories) {
    const unit = category.units.find((u) => u.symbol === symbol);
    if (unit) return unit;
  }
  return undefined;
};

export const convertUnits = (
  value: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  const fromDef = findUnitDefinition(fromUnit);
  const toDef = findUnitDefinition(toUnit);

  if (!fromDef || !toDef || fromDef.category !== toDef.category) {
    return null;
  }

  const baseValue = value * fromDef.conversionFactor;
  return baseValue / toDef.conversionFactor;
};
