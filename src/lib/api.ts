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
  getAll: () => apiRequest<Supplier[]>("/suppliers"),

  create: (data: Partial<Supplier>) =>
    apiRequest<Supplier>("/suppliers", "POST", data),

  update: (id: string, data: Partial<Supplier>) =>
    apiRequest<Supplier>(`/suppliers/${id}`, "PUT", data),

  delete: (id: string) => apiRequest<void>(`/suppliers/${id}`, "DELETE"),
};
