import { Outlet } from "react-router-dom";
import AdminSidebar from "../pages/Admin/Sidebar";
import UnifiedHeader from "../Componet/UnifiedHeader";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <UnifiedHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
