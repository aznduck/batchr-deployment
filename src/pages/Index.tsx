import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import Stats from "@/components/Dashboard/Stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CircularGauge } from "@/components/ui/CircularGauge";
import {
  BarChart,
  BarChart3,
  Clock,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Settings,
  User,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import RecipeCarousel from "@/components/Dashboard/RecipeCarousel";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ingredientsApi, recipesApi, productionApi } from "@/lib/api";
import { Ingredient, Recipe } from "@/lib/data";

interface Production {
  _id: string;
  date: string;
  recipeId: string;
  quantity: number;
  notes?: string;
  supervisor: string;
}

const Index = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [productionLogs, setProductionLogs] = useState<Production[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  // redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingData, recData, prodData] = await Promise.all([
          ingredientsApi.getAll(),
          recipesApi.getAll(),
          productionApi.getAll(),
        ]);

        // make sure these are arrays
        if (!Array.isArray(ingData)) {
          console.error("Ingredients response is not an array:", ingData);
          setIngredients([]); // fallback
        } else {
          setIngredients(ingData);
        }

        if (!Array.isArray(recData)) {
          console.error("Recipes response is not an array:", recData);
          setRecipes([]); // fallback
        } else {
          setRecipes(recData);
        }

        if (!Array.isArray(prodData)) {
          console.error("Production logs response is not an array:", prodData);
          setProductionLogs([]); // fallback
        } else {
          setProductionLogs(prodData);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const lowStockIngredients = Array.isArray(ingredients)
    ? ingredients
        .filter((ingredient) => ingredient.stock < ingredient.threshold)
        .sort((a, b) => a.stock / a.threshold - b.stock / b.threshold)
        .slice(0, 3)
    : [];

  const recipeProductionData = recipes
    .map((recipe) => {
      // Get all production logs for this recipe
      const recipeProduction = productionLogs
        .filter((log) => log.recipeId === recipe._id)
        .reduce((sum, log) => sum + log.quantity, 0);

      return {
        name: recipe.name,
        production: recipeProduction,
      };
    })
    .filter((data) => data.production > 0); // Only show recipes with production

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
        <div className="grid grid-cols-1 gap-6 flex-1 overflow-hidden">
          {/* Production Overview Graph - Full Width */}
          <Card className="hover-scale flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart size={18} className="text-primary" />
                Production Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                {recipeProductionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={recipeProductionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="barGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#DCADFF" />
                          <stop offset="100%" stopColor="#A8AFFF" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="production"
                        name="Units Produced"
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No production data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recipe Card Carousel */}
          <div className="flex-1 min-h-0 pb-4 overflow-hidden">
            <RecipeCarousel />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
