import { GitBranch } from "lucide-react";
import type { ProjectPathMap } from "@/lib/types";

interface ProjectPathMapViewProps {
  pathMap?: ProjectPathMap | null;
}

export function ProjectPathMapView({ pathMap }: ProjectPathMapViewProps) {
  if (!pathMap) {
    return (
      <section className="panel">
        <GitBranch size={20} />
        <h2>Draft trail will appear here</h2>
        <p>Not final yet.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <GitBranch size={20} />
        <div>
          <h2>{pathMap.title}</h2>
          <p>{pathMap.summary}</p>
        </div>
      </div>
      <div className="mini-flow">
        {pathMap.nodes.map((node) => (
          <article className={`mini-flow-node ${node.status}`} key={node.id}>
            <strong>{node.label}</strong>
            <span>{node.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
