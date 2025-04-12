import React from "react";
import { SideNav } from "@/components/SideNav";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-background flex">
      <SideNav />
      <main
        className={cn(
          "flex-1 ml-[240px] px-8 py-6 pb-16 animate-fade-in w-[calc(100%-240px)]",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
