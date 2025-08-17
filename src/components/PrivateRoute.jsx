// src/components/PrivateRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function PrivateRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const location = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  if (user === undefined) return null; // or spinner
  return user ? children : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}
