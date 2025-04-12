import { Ingredient, Recipe, Supplier } from "@/lib/data";

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
  getAll: () => apiRequest<Recipe[]>("/recipes"),

  create: (data: {
    name: string;
    ingredients: {
      ingredientId: string;
      amount: number;
    }[];
  }) => apiRequest<Recipe>("/recipes", "POST", data),

  update: (
    id: string,
    data: {
      name: string;
      ingredients: {
        ingredientId: string;
        amount: number;
      }[];
    }
  ) => apiRequest<Recipe>(`/recipes/${id}`, "PUT", data),

  delete: (id: string) => apiRequest<void>(`/recipes/${id}`, "DELETE"),
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
  getAll() {
    return apiRequest("/production-plans");
  },
  getOne(id: string) {
    return apiRequest(`/production-plans/${id}`);
  },
  create(data: {
    name: string;
    weekStartDate: Date;
    recipes?: { recipeId: string; plannedAmount: number }[];
    notes?: string;
  }) {
    return apiRequest("/production-plans", "POST", data);
  },
  update(
    id: string,
    data: {
      name?: string;
      notes?: string;
      status?: string;
      recipes?: { recipeId: string; plannedAmount: number }[];
    }
  ) {
    return apiRequest(`/production-plans/${id}`, "PUT", data);
  },
  delete(id: string) {
    return apiRequest(`/production-plans/${id}`, "DELETE");
  },
  complete(id: string) {
    return apiRequest(`/production-plans/${id}/complete`, "PUT");
  },
  export(id: string) {
    return apiRequest(`/production-plans/${id}/export`);
  },
  import(importData: any) {
    return apiRequest("/production-plans/import", "POST", { importData });
  },
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
    blockType: "prep" | "production" | "cleaning";
    machineId: string;
    employeeId: string;
    recipeId?: string;
    quantity?: number;
    planId: string;
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
  addMaintenance(id: string, data: {
    startTime: Date;
    endTime: Date;
    description: string;
    performed?: boolean;
    technician?: string;
  }) {
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
    schedule?: {
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
      schedule?: {
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
    return apiRequest(`/employees/${id}/availability?startDate=${startDate}&endDate=${endDate}`);
  },
  updateAvailability(id: string, data: {
    date: Date;
    timeSlots: {
      startTime: Date;
      endTime: Date;
      status: "available" | "unavailable" | "tentative";
    }[];
  }) {
    return apiRequest(`/employees/${id}/availability`, "PUT", data);
  },
  addCertification(id: string, data: {
    machineId: string;
    certificationDate: Date;
  }) {
    return apiRequest(`/employees/${id}/certifications`, "POST", data);
  },
  removeCertification(id: string, machineId: string) {
    return apiRequest(`/employees/${id}/certifications/${machineId}`, "DELETE");
  },
};
