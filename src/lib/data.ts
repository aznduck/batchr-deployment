export interface Ingredient {
  _id: string;
  name: string;
  stock: number;
  unit: string;
  threshold: number;
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
  id: string;
  name: string;
  rating: number;
  preferred: boolean;
}

// Generate initial mock data
export const ingredients: Ingredient[] = [
  {
    _id: "1",
    name: "Cream",
    stock: 45,
    unit: "L",
    threshold: 50,
    history: [
      { date: "2023-06-01", level: 100 },
      { date: "2023-06-15", level: 85 },
      { date: "2023-07-01", level: 70 },
      { date: "2023-07-15", level: 55 },
      { date: "2023-08-01", level: 45 },
    ],
  },
  {
    _id: "2",
    name: "Sugar",
    stock: 120,
    unit: "kg",
    threshold: 50,
    history: [
      { date: "2023-06-01", level: 200 },
      { date: "2023-06-15", level: 180 },
      { date: "2023-07-01", level: 160 },
      { date: "2023-07-15", level: 140 },
      { date: "2023-08-01", level: 120 },
    ],
  },
  {
    _id: "3",
    name: "Vanilla Extract",
    stock: 5,
    unit: "L",
    threshold: 10,
    history: [
      { date: "2023-06-01", level: 25 },
      { date: "2023-06-15", level: 20 },
      { date: "2023-07-01", level: 15 },
      { date: "2023-07-15", level: 10 },
      { date: "2023-08-01", level: 5 },
    ],
  },
  {
    _id: "4",
    name: "Cocoa Powder",
    stock: 30,
    unit: "kg",
    threshold: 25,
    history: [
      { date: "2023-06-01", level: 50 },
      { date: "2023-06-15", level: 45 },
      { date: "2023-07-01", level: 40 },
      { date: "2023-07-15", level: 35 },
      { date: "2023-08-01", level: 30 },
    ],
  },
  {
    _id: "5",
    name: "Strawberries",
    stock: 15,
    unit: "kg",
    threshold: 30,
    history: [
      { date: "2023-06-01", level: 60 },
      { date: "2023-06-15", level: 50 },
      { date: "2023-07-01", level: 40 },
      { date: "2023-07-15", level: 30 },
      { date: "2023-08-01", level: 15 },
    ],
  },
  {
    _id: "6",
    name: "Cookie Dough",
    stock: 25,
    unit: "kg",
    threshold: 20,
    history: [
      { date: "2023-06-01", level: 45 },
      { date: "2023-06-15", level: 40 },
      { date: "2023-07-01", level: 35 },
      { date: "2023-07-15", level: 30 },
      { date: "2023-08-01", level: 25 },
    ],
  },
  {
    _id: "7",
    name: "Marshmallows",
    stock: 12,
    unit: "kg",
    threshold: 15,
    history: [
      { date: "2023-06-01", level: 30 },
      { date: "2023-06-15", level: 25 },
      { date: "2023-07-01", level: 20 },
      { date: "2023-07-15", level: 15 },
      { date: "2023-08-01", level: 12 },
    ],
  },
  {
    _id: "8",
    name: "Nuts",
    stock: 18,
    unit: "kg",
    threshold: 15,
    history: [
      { date: "2023-06-01", level: 35 },
      { date: "2023-06-15", level: 30 },
      { date: "2023-07-01", level: 25 },
      { date: "2023-07-15", level: 20 },
      { date: "2023-08-01", level: 18 },
    ],
  },
  {
    _id: "9",
    name: "Milk",
    stock: 60,
    unit: "L",
    threshold: 40,
    history: [
      { date: "2023-06-01", level: 100 },
      { date: "2023-06-15", level: 90 },
      { date: "2023-07-01", level: 80 },
      { date: "2023-07-15", level: 70 },
      { date: "2023-08-01", level: 60 },
    ],
  },
  {
    _id: "10",
    name: "Chocolate Chips",
    stock: 22,
    unit: "kg",
    threshold: 25,
    history: [
      { date: "2023-06-01", level: 40 },
      { date: "2023-06-15", level: 35 },
      { date: "2023-07-01", level: 30 },
      { date: "2023-07-15", level: 25 },
      { date: "2023-08-01", level: 22 },
    ],
  },
  {
    _id: "11",
    name: "Stabilizer",
    stock: 8,
    unit: "kg",
    threshold: 5,
    history: [
      { date: "2023-06-01", level: 15 },
      { date: "2023-06-15", level: 13 },
      { date: "2023-07-01", level: 11 },
      { date: "2023-07-15", level: 9 },
      { date: "2023-08-01", level: 8 },
    ],
  },
  {
    _id: "12",
    name: "Salt",
    stock: 30,
    unit: "kg",
    threshold: 10,
    history: [
      { date: "2023-06-01", level: 35 },
      { date: "2023-06-15", level: 34 },
      { date: "2023-07-01", level: 33 },
      { date: "2023-07-15", level: 32 },
      { date: "2023-08-01", level: 30 },
    ],
  },
];

export const recipes: Recipe[] = [
  {
    _id: "1",
    name: "Vanilla",
    ingredients: [
      { ingredientId: "1", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2 }, // Sugar
      { ingredientId: "3", amount: 0.1 }, // Vanilla Extract
      { ingredientId: "9", amount: 2 }, // Milk
      { ingredientId: "11", amount: 0.05 }, // Stabilizer
      { ingredientId: "12", amount: 0.01 }, // Salt
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
      { ingredientId: "1", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2.5 }, // Sugar
      { ingredientId: "4", amount: 1 }, // Cocoa Powder
      { ingredientId: "9", amount: 1.5 }, // Milk
      { ingredientId: "10", amount: 0.5 }, // Chocolate Chips
      { ingredientId: "11", amount: 0.05 }, // Stabilizer
      { ingredientId: "12", amount: 0.01 }, // Salt
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
      { ingredientId: "1", amount: 5 }, // Cream
      { ingredientId: "2", amount: 3 }, // Sugar
      { ingredientId: "5", amount: 2 }, // Strawberries
      { ingredientId: "9", amount: 1 }, // Milk
      { ingredientId: "11", amount: 0.05 }, // Stabilizer
      { ingredientId: "12", amount: 0.01 }, // Salt
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
      { ingredientId: "1", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2 }, // Sugar
      { ingredientId: "6", amount: 2 }, // Cookie Dough
      { ingredientId: "9", amount: 1.5 }, // Milk
      { ingredientId: "10", amount: 0.3 }, // Chocolate Chips
      { ingredientId: "11", amount: 0.05 }, // Stabilizer
      { ingredientId: "12", amount: 0.01 }, // Salt
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
      { ingredientId: "1", amount: 5 }, // Cream
      { ingredientId: "2", amount: 2.5 }, // Sugar
      { ingredientId: "4", amount: 0.8 }, // Cocoa Powder
      { ingredientId: "7", amount: 1 }, // Marshmallows
      { ingredientId: "8", amount: 1 }, // Nuts
      { ingredientId: "9", amount: 1 }, // Milk
      { ingredientId: "10", amount: 0.5 }, // Chocolate Chips
      { ingredientId: "11", amount: 0.05 }, // Stabilizer
      { ingredientId: "12", amount: 0.01 }, // Salt
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
  { id: "1", name: "Dairy Delight", rating: 4.8, preferred: true },
  { id: "2", name: "Sweet Supplies", rating: 4.5, preferred: true },
  { id: "3", name: "Flavor Factory", rating: 4.2, preferred: false },
  { id: "4", name: "Fresh Ingredients Inc.", rating: 4.6, preferred: true },
  { id: "5", name: "Wholesale Foods", rating: 3.9, preferred: false },
];

export const getIngredientById = (id: string): Ingredient | undefined => {
  return ingredients.find((ingredient) => ingredient._id === id);
};

export const getStockStatus = (ingredient: Ingredient): 'critical' | 'warning' | 'normal' => {
  const percentage = (ingredient.stock / ingredient.threshold) * 100;
  if (percentage <= 50) return 'critical';
  if (percentage <= 80) return 'warning';
  return 'normal';
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
  return suppliers.find((supplier) => supplier.id === id);
};

export const convertUnit = (value: number, fromUnit: string, toUnit: string): number => {
  // Simplified unit conversion - would be more complex in a real app
  if (fromUnit === toUnit) return value;
  
  // Weight conversions
  if (fromUnit === 'kg' && toUnit === 'g') return value * 1000;
  if (fromUnit === 'g' && toUnit === 'kg') return value / 1000;
  
  // Volume conversions
  if (fromUnit === 'L' && toUnit === 'mL') return value * 1000;
  if (fromUnit === 'mL' && toUnit === 'L') return value / 1000;
  
  // Unsupported conversion
  console.warn(`Conversion from ${fromUnit} to ${toUnit} not supported`);
  return value;
};
