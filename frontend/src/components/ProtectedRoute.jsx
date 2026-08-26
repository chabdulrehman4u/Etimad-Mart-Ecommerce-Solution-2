import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const { user } = useSelector((state) => state.auth);
  console.log("User in redux---->", user);

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
