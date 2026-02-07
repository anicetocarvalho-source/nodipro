import { Navigate } from "react-router-dom";

// Sprints page now lives inside Projects - redirect for backward compatibility
export default function Sprints() {
  return <Navigate to="/projects?tab=sprints" replace />;
}