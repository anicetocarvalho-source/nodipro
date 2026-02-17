import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Home } from "lucide-react";
import { useProject } from "@/hooks/useProjects";

function ProjectName({ id }: { id: string }) {
  const { data: project } = useProject(id);
  return <span className="truncate max-w-[200px]">{project?.name || "..."}</span>;
}

export function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length <= 1) return null;

  const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(s);

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {pathSegments.map((segment, index) => {
        const path = "/" + pathSegments.slice(0, index + 1).join("/");
        const isLast = index === pathSegments.length - 1;
        const isId = isUUID(segment);
        const parentSegment = index > 0 ? pathSegments[index - 1] : "";

        let label: React.ReactNode;
        if (isId && parentSegment === "projects") {
          label = <ProjectName id={segment} />;
        } else if (isId && parentSegment === "programs") {
          label = t("breadcrumbs.detail");
        } else {
          label = t(`breadcrumbs.${segment}`, segment);
        }

        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get("tab");
        
        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {label}
                {tab && index === pathSegments.length - 1 && (
                  <span> / {t(`breadcrumbs.${tab}`, tab)}</span>
                )}
              </span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors truncate max-w-[200px]">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
