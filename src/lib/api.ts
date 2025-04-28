import { Ingredient, Recipe, Supplier } from "@/lib/data";
import {
  RecipeMachineYield,
  RecipeMachineYieldCreateInput,
  RecipeMachineYieldUpdateInput,
  ScheduleGenerationOptions,
  ScheduleGenerationResult,
} from "./production";

// Types
export interface UserResponse {
  username: string;
  isAdmin?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface ProductionEntry {
  date: Date;
  recipeId: string;
  quantity: number;
  notes: string;
  supervisor: string;
}

// Helper functions
const API_URL = import.meta.env.VITE_API_URL || "";

async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  data?: any
): Promise<T> {
  const url = `${API_URL}/api${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    // Try to get error message from response
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.message ||
        errorData.error ||
        `Request failed with status ${response.status}`;
    } catch {
      errorMessage = `Request failed with status ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  // Check if response is JSON
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return (await response.text()) as unknown as T;
}

// Auth API
export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<{ message: string; user: UserResponse }>(
      "/auth/login",
      "POST",
      data
    ),

  register: (data: RegisterRequest) =>
    apiRequest<{ message: string }>("/auth/register", "POST", data),

  logout: () => apiRequest<{ message: string }>("/auth/logout", "POST"),

  checkSession: () => apiRequest<{ user?: UserResponse }>("/auth/session"),
};

// Ingredients API
export const ingredientsApi = {
  getAll: () => apiRequest<Ingredient[]>("/ingredients"),

  create: (data: Partial<Ingredient>) =>
    apiRequest<Ingredient>("/ingredients", "POST", data),

  update: (id: string, data: Partial<Ingredient>) =>
    apiRequest<Ingredient>(`/ingredients/${id}`, "PUT", data),

  delete: (id: string) => apiRequest<void>(`/ingredients/${id}`, "DELETE"),
};

// Recipes API
export const recipesApi = {
  getAll: () => apiRequest<Recipe[]>("/recipes", "GET"),

  getById: (id: string) => apiRequest<Recipe>(`/recipes/${id}`, "GET"),

  create: async (data: {
    name: string;
    ingredients: {
      ingredientId: string;
      amount: number;
    }[];
    currentInventory?: number;
    weeklyProductionGoal?: number;
  }) => apiRequest<Recipe>("/recipes", "POST", data),

  update: async (
    id: string,
    updatedRecipe: {
      name: string;
      ingredients: {
        ingredientId: string;
        amount: number;
      }[];
      currentInventory?: number;
      weeklyProductionGoal?: number;
      plannedProduction?: number;
    }
  ) => apiRequest<Recipe>(`/recipes/${id}`, "PUT", updatedRecipe),

  delete: (id: string) => apiRequest<void>(`/recipes/${id}`, "DELETE"),
};

// Recipe Machine Yields API
export const recipeMachineYieldsApi = {
  getAll: () =>
    apiRequest<RecipeMachineYield[]>("/recipe-machine-yields", "GET"),

  getById: (id: string) =>
    apiRequest<RecipeMachineYield>(`/recipe-machine-yields/${id}`, "GET"),

  getByRecipe: (recipeId: string) =>
    apiRequest<RecipeMachineYield[]>(
      `/recipe-machine-yields/by-recipe/${recipeId}`,
      "GET"
    ),

  getByMachine: (machineId: string) =>
    apiRequest<RecipeMachineYield[]>(
      `/recipe-machine-yields/by-machine/${machineId}`,
      "GET"
    ),

  create: (data: RecipeMachineYieldCreateInput) =>
    apiRequest<RecipeMachineYield>("/recipe-machine-yields", "POST", data),

  update: (id: string, data: RecipeMachineYieldUpdateInput) =>
    apiRequest<RecipeMachineYield>(`/recipe-machine-yields/${id}`, "PUT", data),

  delete: (id: string) =>
    apiRequest<void>(`/recipe-machine-yields/${id}`, "DELETE"),

  calculateProductionTime: (
    recipeId: string,
    machineId: string,
    tubsToMake: number
  ) =>
    apiRequest<{ minutes: number; batches: number }>(
      `/recipe-machine-yields/calculate`,
      "POST",
      { recipeId, machineId, tubsToMake }
    ),
};

// Production API
export const productionApi = {
  getAll: () => apiRequest<any[]>("/production"),

  create: (data: ProductionEntry) =>
    apiRequest<any>("/production", "POST", data),
};

// Suppliers API
export const suppliersApi = {
  getAll() {
    return apiRequest<Supplier[]>("/suppliers");
  },
  create(data: Partial<Supplier>) {
    return apiRequest<Supplier>("/suppliers", "POST", data);
  },
  update(id: string, data: Partial<Supplier>) {
    return apiRequest<Supplier>(`/suppliers/${id}`, "PUT", data);
  },
  delete(id: string) {
    return apiRequest<void>(`/suppliers/${id}`, "DELETE");
  },
};

// Production Plans API
export const productionPlansApi = {
  getAll: () => apiRequest<any[]>("/production-plans"),

  getById: (id: string) => apiRequest<any>(`/production-plans/${id}`),

  create: (data: {
    name: string;
    weekStartDate: Date;
    notes?: string;
    recipes?: Array<{ recipeId: string; plannedAmount: number }>;
  }) => apiRequest<any>("/production-plans", "POST", data),

  update: (id: string, data: any) =>
    apiRequest<any>(`/production-plans/${id}`, "PUT", data),

  delete: (id: string) => apiRequest<void>(`/production-plans/${id}`, "DELETE"),

  // Generate a production schedule for an existing plan
  generateSchedule: (options: ScheduleGenerationOptions) =>
    apiRequest<ScheduleGenerationResult>(
      `/production-plans/${options.planId}/generate-schedule`,
      "POST",
      options
    ),

  // Add recipes to an existing plan
  addRecipes: (
    planId: string,
    recipes: Array<{ recipeId: string; plannedAmount: number }>
  ) =>
    apiRequest<any>(`/production-plans/${planId}/recipes`, "PUT", { recipes }),

  // Get production schedule for a specific plan
  getSchedule: (planId: string) =>
    apiRequest<any>(`/production-plans/${planId}/schedule`, "GET"),

  // Get all blocks associated with a production plan
  getBlocks: (planId: string) =>
    apiRequest<any>(`/production-plans/${planId}/blocks`, "GET"),

  // For backward compatibility
  getOne: (id: string) => apiRequest<any>(`/production-plans/${id}`, "GET"),

  // Complete a production plan
  complete: (id: string) =>
    apiRequest<any>(`/production-plans/${id}/complete`, "PUT"),
};

// Production Blocks API
export const productionBlocksApi = {
  getAll(params?: { planId?: string; startDate?: string; endDate?: string }) {
    let query = "";
    if (params) {
      const queryParams = [];
      if (params.planId) queryParams.push(`planId=${params.planId}`);
      if (params.startDate) queryParams.push(`startDate=${params.startDate}`);
      if (params.endDate) queryParams.push(`endDate=${params.endDate}`);
      if (queryParams.length > 0) {
        query = `?${queryParams.join("&")}`;
      }
    }
    return apiRequest(`/production-blocks${query}`);
  },
  getOne(id: string) {
    return apiRequest(`/production-blocks/${id}`);
  },
  create(data: {
    startTime: Date;
    endTime: Date;
    blockType: "prep" | "production" | "cleaning" | "maintenance";
    machineId: string;
    employeeId: string;
    day: string;
    recipeId?: string;
    quantity?: number;
    planId?: string;
    notes?: string;
  }) {
    return apiRequest("/production-blocks", "POST", data);
  },
  update(
    id: string,
    data: {
      startTime?: Date;
      endTime?: Date;
      machineId?: string;
      employeeId?: string;
      recipeId?: string;
      quantity?: number;
      status?: "scheduled" | "in-progress" | "completed" | "cancelled";
      notes?: string;
      actualStartTime?: Date;
      actualEndTime?: Date;
      actualQuantity?: number;
    }
  ) {
    return apiRequest(`/production-blocks/${id}`, "PUT", data);
  },
  delete(id: string) {
    return apiRequest(`/production-blocks/${id}`, "DELETE");
  },
  // Specialized endpoints
  calculateTime(data: { machineId: string; quantity: number }) {
    return apiRequest("/production-blocks/calculate-time", "POST", data);
  },
  suggestSchedule(data: {
    machineId: string;
    employeeId: string;
    quantity: number;
    preferredStartTime: Date;
  }) {
    return apiRequest("/production-blocks/suggest-schedule", "POST", data);
  },
  checkAvailability(data: {
    machineId: string;
    employeeId: string;
    startTime: Date;
    endTime: Date;
    day: string;
    blockId?: string;
  }) {
    return apiRequest("/production-blocks/check-availability", "POST", data);
  },
  createProductionSet(data: {
    machineId: string;
    employeeId: string;
    recipeId: string;
    quantity: number;
    planId: string;
    startTime: Date;
    notes?: string;
  }) {
    return apiRequest("/production-blocks/create-production-set", "POST", data);
  },
};

// Machines API
export const machinesApi = {
  getAll() {
    return apiRequest("/machines");
  },
  getOne(id: string) {
    return apiRequest(`/machines/${id}`);
  },
  create(data: {
    name: string;
    tubCapacity: number;
    productionTime: number;
    status?: "available" | "in-use" | "maintenance";
    notes?: string;
  }) {
    return apiRequest("/machines", "POST", data);
  },
  update(
    id: string,
    data: {
      name?: string;
      tubCapacity?: number;
      productionTime?: number;
      status?: "available" | "in-use" | "maintenance";
      notes?: string;
    }
  ) {
    return apiRequest(`/machines/${id}`, "PUT", data);
  },
  delete(id: string) {
    return apiRequest(`/machines/${id}`, "DELETE");
  },
  // Specialized endpoints
  getMaintenance(id: string) {
    return apiRequest(`/machines/${id}/maintenance`);
  },
  addMaintenance(
    id: string,
    data: {
      startTime: Date;
      endTime: Date;
      description: string;
      performed?: boolean;
      technician?: string;
    }
  ) {
    return apiRequest(`/machines/${id}/maintenance`, "POST", data);
  },
  assignEmployee(id: string, employeeId: string | null) {
    return apiRequest(`/machines/${id}/assign`, "PUT", { employeeId });
  },
};

// Employees API
export const employeesApi = {
  getAll() {
    return apiRequest("/employees");
  },
  getOne(id: string) {
    return apiRequest(`/employees/${id}`);
  },
  create(data: {
    name: string;
    role: string;
    email: string;
    phone?: string;
    shifts?: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  }) {
    return apiRequest("/employees", "POST", data);
  },
  update(
    id: string,
    data: {
      name?: string;
      role?: string;
      email?: string;
      phone?: string;
      shifts?: {
        day: string;
        startTime: string;
        endTime: string;
      }[];
    }
  ) {
    return apiRequest(`/employees/${id}`, "PUT", data);
  },
  delete(id: string) {
    return apiRequest(`/employees/${id}`, "DELETE");
  },
  // Specialized endpoints
  getAvailability(id: string, startDate: string, endDate: string) {
    return apiRequest(
      `/employees/${id}/availability?startDate=${startDate}&endDate=${endDate}`
    );
  },
  updateAvailability(
    id: string,
    data: {
      date: Date;
      timeSlots: {
        startTime: Date;
        endTime: Date;
        status: "available" | "unavailable" | "tentative";
      }[];
    }
  ) {
    return apiRequest(`/employees/${id}/availability`, "PUT", data);
  },
  addCertification(
    id: string,
    data: {
      machineId: string;
      certificationDate: Date;
    }
  ) {
    return apiRequest(`/employees/${id}/certifications`, "POST", data);
  },
  removeCertification(id: string, machineId: string) {
    return apiRequest(`/employees/${id}/certifications/${machineId}`, "DELETE");
  },
};
