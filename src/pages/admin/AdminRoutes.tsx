import { Route, Routes } from "react-router";
import { RequireAdmin } from "@/lib/auth";
import { AdminLayout } from "./AdminLayout";
import { LoginPage } from "./Login";
import { Dashboard } from "./Dashboard";
import { OrdersPage } from "./Orders";
import { OrderDetail } from "./OrderDetail";
import { QuotesPage } from "./Quotes";
import { AdminProducts } from "./Products";
import { EditProduct } from "./ProductEdit";
import { OffersPage } from "./Offers";
import { CustomersPage } from "./Customers";
import { PrintPage } from "./Print";
import { NotFound } from "@/pages/site/NotFound";

export default function AdminRoutes() {
  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          path="print/:id"
          element={
            <RequireAdmin>
              <PrintPage />
            </RequireAdmin>
          }
        />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/:id" element={<EditProduct />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
