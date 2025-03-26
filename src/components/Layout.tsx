
import React from "react";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={cn("container px-4 py-6 pb-16 animate-fade-in", className)}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
