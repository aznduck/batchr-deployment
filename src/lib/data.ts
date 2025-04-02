import { UnitCategoryType } from "./units";

export interface Ingredient {
  _id: string;
  name: string;
  stock: number;
  unit: string;
  unitCategory?: UnitCategoryType;
  threshold: number;
  minimumOrderQuantity?: number;
  supplierId?: string;
  upc?: string;
  history: {
    date: string;
    level: number;
  }[];
  owner?: string;
}

export interface Recipe {
  _id: string;
  name: string;
  ingredients: {
    ingredientId: string;
    amount: number;
  }[];
  batches: {
    date: string;
    supervisor: string;
    quantity: number;
    notes?: string;
  }[];
  owner?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  preferred: boolean;
  supplierLink?: string;
  minimumOrderRequirements?: {
    quantity: number;
    unit: string;
    value?: number;
  };
  leadTime?: number; // in days
}

export interface OrderItem {
  ingredientId: string;
  ingredient: Ingredient;
  quantity: number;
  unit: string;
  supplier?: Supplier;
  minimumOrderQuantity?: number;
}

export interface Order {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  items: OrderItem[];
  status: "pending" | "ordered" | "partial" | "received";
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  packingSlipNumber?: string;
}

// Generate initial mock data
export const ingredients: Ingredient[] = [
  {
    _id: "1",
    name: "Milk",
    stock: 50,
    unit: "L",
    unitCategory: "dairy_liquid",
    threshold: 10,
    history: [
      { date: "2023-06-01", level: 100 },
      { date: "2023-06-15", level: 90 },
      { date: "2023-07-01", level: 80 },
      { date: "2023-07-15", level: 70 },
      { date: "2023-08-01", level: 50 },
    ],
  },
  {
    _id: "2",
    name: "Sugar",
    stock: 100,
    unit: "kg",
    unitCategory: "dry",
    threshold: 20,
    history: [
      { date: "2023-06-01", level: 200 },
      { date: "2023-06-15", level: 180 },
      { date: "2023-07-01", level: 160 },
      { date: "2023-07-15", level: 140 },
      { date: "2023-08-01", level: 100 },
    ],
  },
  {
    _id: "3",
    name: "Cream",
    stock: 30,
    unit: "L",
    unitCategory: "dairy_liquid",
    threshold: 5,
    history: [
      { date: "2023-06-01", level: 60 },
      { date: "2023-06-15", level: 55 },
      { date: "2023-07-01", level: 50 },
      { date: "2023-07-15", level: 45 },
      { date: "2023-08-01", level: 30 },
    ],
  },
  {
    _id: "4",
    name: "Cocoa Powder",
    stock: 25,
    unit: "kg",
    unitCategory: "dry",
    threshold: 5,
    history: [
      { date: "2023-06-01", level: 50 },
      { date: "2023-06-15", level: 45 },
      { date: "2023-07-01", level: 40 },
      { date: "2023-07-15", level: 35 },
      { date: "2023-08-01", level: 25 },
    ],
  },
  {
    _id: "5",
    name: "Chocolate Chips",
    stock: 40,
    unit: "kg",
    unitCategory: "solid_mixin",
    threshold: 10,
    history: [
      { date: "2023-06-01", level: 80 },
      { date: "2023-06-15", level: 70 },
      { date: "2023-07-01", level: 60 },
      { date: "2023-07-15", level: 50 },
      { date: "2023-08-01", level: 40 },
    ],
  },
  {
    _id: "6",
    name: "Vanilla Extract",
    stock: 15,
    unit: "L",
    unitCategory: "dairy_liquid",
    threshold: 3,
    history: [
      { date: "2023-06-01", level: 30 },
      { date: "2023-06-15", level: 25 },
      { date: "2023-07-01", level: 20 },
      { date: "2023-07-15", level: 15 },
      { date: "2023-08-01", level: 15 },
    ],
  },
  {
    _id: "7",
    name: "Waffle Cones",
    stock: 500,
    unit: "unit",
    unitCategory: "packaging",
    threshold: 100,
    history: [
      { date: "2023-06-01", level: 1000 },
      { date: "2023-06-15", level: 900 },
      { date: "2023-07-01", level: 800 },
      { date: "2023-07-15", level: 700 },
      { date: "2023-08-01", level: 500 },
    ],
  },
  {
    _id: "8",
    name: "Sprinkles",
    stock: 20,
    unit: "kg",
    unitCategory: "solid_mixin",
    threshold: 5,
    history: [
      { date: "2023-06-01", level: 40 },
      { date: "2023-06-15", level: 35 },
      { date: "2023-07-01", level: 30 },
      { date: "2023-07-15", level: 25 },
      { date: "2023-08-01", level: 20 },
    ],
  },
  {
    _id: "9",
    name: "Cookie Dough",
    stock: 30,
    unit: "kg",
    unitCategory: "solid_mixin",
    threshold: 8,
    history: [
      { date: "2023-06-01", level: 60 },
      { date: "2023-06-15", level: 55 },
      { date: "2023-07-01", level: 50 },
      { date: "2023-07-15", level: 45 },
      { date: "2023-08-01", level: 30 },
    ],
  },
  {
    _id: "10",
    name: "Nuts",
    stock: 25,
    unit: "kg",
    unitCategory: "solid_mixin",
    threshold: 5,
    history: [
      { date: "2023-06-01", level: 50 },
      { date: "2023-06-15", level: 45 },
      { date: "2023-07-01", level: 40 },
      { date: "2023-07-15", level: 35 },
      { date: "2023-08-01", level: 25 },
    ],
  },
  {
    _id: "11",
    name: "Ice Cream Cups",
    stock: 1000,
    unit: "unit",
    unitCategory: "packaging",
    threshold: 200,
    history: [
      { date: "2023-06-01", level: 2000 },
      { date: "2023-06-15", level: 1800 },
      { date: "2023-07-01", level: 1600 },
      { date: "2023-07-15", level: 1400 },
      { date: "2023-08-01", level: 1000 },
    ],
  },
  {
    _id: "12",
    name: "Stabilizer",
    stock: 10,
    unit: "kg",
    unitCategory: "dry",
    threshold: 2,
    history: [
      { date: "2023-06-01", level: 20 },
      { date: "2023-06-15", level: 18 },
      { date: "2023-07-01", level: 16 },
      { date: "2023-07-15", level: 14 },
      { date: "2023-08-01", level: 10 },
    ],
  },
];

export const recipes: Recipe[] = [
  {
    _id: "1",
    name: "Vanilla",
    ingredients: [
      { ingredientId: "3", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2 }, // Sugar
      { ingredientId: "6", amount: 0.1 }, // Vanilla Extract
      { ingredientId: "1", amount: 2 }, // Milk
      { ingredientId: "12", amount: 0.05 }, // Stabilizer
    ],
    batches: [
      {
        date: "2023-07-15",
        supervisor: "Jane Smith",
        quantity: 50,
        notes: "Standard batch",
      },
      {
        date: "2023-07-22",
        supervisor: "John Doe",
        quantity: 55,
        notes: "Extra creamy",
      },
    ],
  },
  {
    _id: "2",
    name: "Chocolate",
    ingredients: [
      { ingredientId: "3", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2.5 }, // Sugar
      { ingredientId: "4", amount: 1 }, // Cocoa Powder
      { ingredientId: "1", amount: 1.5 }, // Milk
      { ingredientId: "5", amount: 0.5 }, // Chocolate Chips
      { ingredientId: "12", amount: 0.05 }, // Stabilizer
    ],
    batches: [
      {
        date: "2023-07-16",
        supervisor: "Mike Johnson",
        quantity: 45,
        notes: "Dark chocolate variant",
      },
      {
        date: "2023-07-23",
        supervisor: "Jane Smith",
        quantity: 50,
        notes: "Standard batch",
      },
    ],
  },
  {
    _id: "3",
    name: "Strawberry",
    ingredients: [
      { ingredientId: "3", amount: 5 }, // Cream
      { ingredientId: "2", amount: 3 }, // Sugar
      { ingredientId: "1", amount: 1 }, // Milk
      { ingredientId: "12", amount: 0.05 }, // Stabilizer
    ],
    batches: [
      {
        date: "2023-07-17",
        supervisor: "Sarah Wilson",
        quantity: 40,
        notes: "Fresh strawberries",
      },
      {
        date: "2023-07-24",
        supervisor: "John Doe",
        quantity: 45,
        notes: "Extra berries",
      },
    ],
  },
  {
    _id: "4",
    name: "Cookie Dough",
    ingredients: [
      { ingredientId: "3", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2 }, // Sugar
      { ingredientId: "9", amount: 2 }, // Cookie Dough
      { ingredientId: "1", amount: 1.5 }, // Milk
      { ingredientId: "5", amount: 0.3 }, // Chocolate Chips
      { ingredientId: "12", amount: 0.05 }, // Stabilizer
    ],
    batches: [
      {
        date: "2023-07-18",
        supervisor: "Mike Johnson",
        quantity: 35,
        notes: "Extra cookie chunks",
      },
      {
        date: "2023-07-25",
        supervisor: "Sarah Wilson",
        quantity: 40,
        notes: "Standard batch",
      },
    ],
  },
  {
    _id: "5",
    name: "Rocky Road",
    ingredients: [
      { ingredientId: "3", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2.5 }, // Sugar
      { ingredientId: "4", amount: 0.8 }, // Cocoa Powder
      { ingredientId: "7", amount: 1 }, // Marshmallows
      { ingredientId: "10", amount: 1 }, // Nuts
      { ingredientId: "1", amount: 1 }, // Milk
      { ingredientId: "5", amount: 0.5 }, // Chocolate Chips
      { ingredientId: "12", amount: 0.05 }, // Stabilizer
    ],
    batches: [
      {
        date: "2023-07-19",
        supervisor: "John Doe",
        quantity: 30,
        notes: "Extra nuts",
      },
      {
        date: "2023-07-26",
        supervisor: "Jane Smith",
        quantity: 35,
        notes: "Standard batch",
      },
    ],
  },
];

export const suppliers: Supplier[] = [
  {
    _id: "1",
    name: "Dairy Direct",
    email: "orders@dairydirect.com",
    phone: "555-0123",
    rating: 4.8,
    preferred: true,
    minimumOrderRequirements: {
      quantity: 100,
      unit: "L",
      value: 500,
    },
    leadTime: 2,
  },
  {
    _id: "2",
    name: "Sweet Supplies Co",
    email: "orders@sweetsupplies.com",
    phone: "555-0124",
    rating: 4.5,
    preferred: true,
    minimumOrderRequirements: {
      quantity: 50,
      unit: "kg",
      value: 250,
    },
    leadTime: 3,
  },
  {
    _id: "3",
    name: "Package Plus",
    email: "sales@packageplus.com",
    phone: "555-0125",
    rating: 4.2,
    preferred: false,
    minimumOrderRequirements: {
      quantity: 500,
      unit: "unit",
      value: 1000,
    },
    leadTime: 5,
  },
];

export const orders: Order[] = [];

export const getIngredientById = (id: string): Ingredient | undefined => {
  return ingredients.find((ingredient) => ingredient._id === id);
};

export const getStockStatus = (
  ingredient: Ingredient
): "critical" | "warning" | "normal" => {
  const percentage = (ingredient.stock / ingredient.threshold) * 100;
  if (percentage <= 50) return "critical";
  if (percentage <= 80) return "warning";
  return "normal";
};

export const getIngredientsByUrgency = (): Ingredient[] => {
  return [...ingredients].sort((a, b) => {
    const aPercentage = (a.stock / a.threshold) * 100;
    const bPercentage = (b.stock / b.threshold) * 100;
    return aPercentage - bPercentage;
  });
};

export const getRecipeById = (id: string): Recipe | undefined => {
  return recipes.find((recipe) => recipe._id === id);
};

export const getSupplierById = (id: string): Supplier | undefined => {
  return suppliers.find((supplier) => supplier._id === id);
};

export const convertUnit = (
  value: number,
  fromUnit: string,
  toUnit: string
): number => {
  // Simplified unit conversion - would be more complex in a real app
  if (fromUnit === toUnit) return value;

  // Weight conversions
  if (fromUnit === "kg" && toUnit === "g") return value * 1000;
  if (fromUnit === "g" && toUnit === "kg") return value / 1000;

  // Volume conversions
  if (fromUnit === "L" && toUnit === "mL") return value * 1000;
  if (fromUnit === "mL" && toUnit === "L") return value / 1000;

  // Unsupported conversion
  console.warn(`Conversion from ${fromUnit} to ${toUnit} not supported`);
  return value;
};
