import React from "react";
import ScheduleHeader from "../components/Planning/ScheduleHeader";
import NewScheduleForm from "../components/Planning/NewScheduleForm";
import ProductionSchedule from "../components/Planning/ProductionSchedule";
import { Layout } from "../components/Layout";

const ProductionDashboard: React.FC = () => {
  return (
    <Layout>
      <div className="flex h-screen w-full bg-white">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScheduleHeader title="Production" />

          <div className="flex flex-1 overflow-hidden">
            <NewScheduleForm />
            <ProductionSchedule />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductionDashboard;
