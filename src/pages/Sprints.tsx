import { Navigate } from "react-router-dom";

// Sprints functionality is accessed via project detail - redirect to projects
export default function Sprints() {
  return <Navigate to="/projects" replace />;
}
