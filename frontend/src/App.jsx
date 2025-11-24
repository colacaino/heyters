// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import BattlePage from "./pages/BattlePage";
import ProfilePage from "./pages/ProfilePage";
import CreateBattle from "./pages/CreateBattle";
import NotificationsPage from "./pages/NotificationsPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentPending from "./pages/PaymentPending";
import NotFoundPage from "./pages/NotFoundPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminEventRequests from "./pages/admin/AdminEventRequests";
import EventsPage from "./pages/Events";

function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications global */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "16px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/home" element={<Home />} />
        <Route path="/create-battle" element={<CreateBattle />} />
        <Route path="/battle/:battleId" element={<BattlePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/leaderboards" element={<LeaderboardsPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failure" element={<PaymentFailure />} />
        <Route path="/payment-pending" element={<PaymentPending />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/event-requests" element={<AdminEventRequests />} />

        {/* 404 - Debe ir al final */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
