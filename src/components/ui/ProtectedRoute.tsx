import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../api/axiosInstance";

interface ProtectedRouteProps {
  children: React.JSX.Element;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        fail();
        return;
      }

      try {
        await api.get("/auth/verify");

        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;

        if (!user) {
          fail();
          return;
        }

        if (requireAdmin && user.role !== "admin") {
          // не админ — домой
          setIsValid(false);
          return;
        }

        setIsValid(true);
      } catch {
        fail();
      }
    };

    const fail = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsValid(false);
    };

    checkAuth();
  }, [requireAdmin]);

  if (isValid === null) {
    return <p className="p-6 text-text">Checking auth...</p>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
