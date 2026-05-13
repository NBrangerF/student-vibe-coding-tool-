import {
  ArrowRight,
  Combine,
  GitBranch,
  ListPlus,
  MousePointer2,
  Pencil,
  Replace,
  Route,
  Scan,
  Shuffle,
  SkipForward,
  Sparkles
} from "lucide-react";
import { ProjectPathMap as ProjectPathMapType, ProjectPathMapNode } from "@/lib/types";

interface ProjectPathMapProps {
  pathMap: ProjectPathMapType | null;
}

const toolbar = [
  { label: "Select", icon: MousePointer2, active: true },
  { label: "Add step", icon: ListPlus },
  { label: "Connect", icon: Route },
  { label: "Rename", icon: Pencil },
  { label: "Reorder", icon: Shuffle },
  { label: "Combine", icon: Combine },
  { label: "Skip", icon: SkipForward },
  { label: "Replace", icon: Replace }
];

function nodeTypeLabel(type: ProjectPathMapNode["type"]): string {
  if (type === "goal") return "Screen";
  if (type === "experience") return "Input";
  if (type === "mechanic") return "Feedback";
  if (type === "milestone") return "Current focus";
  return "Later";
}

function nodeStatusLabel(status: ProjectPathMapNode["status"]): string {
  if (status === "known") return "Set";
  if (status === "open") return "Question";
  return "Draft";
}

function nodeIcon(type: ProjectPathMapNode["type"]) {
  if (type === "milestone") return "✓";
  if (type === "later") return "+";
  if (type === "mechanic") return "↳";
  if (type === "experience") return "?";
  return "1";
}

function studentCopy(text: string): string {
  return text
    .replace(/\bp5\.js\b/gi, "the preview")
    .replace(/\bbounded milestone\b/gi, "small step")
    .replace(/\bmilestone\b/gi, "step");
}

export function ProjectPathMapView({ pathMap }: ProjectPathMapProps) {
  return (
    <section className="flowchart-card" aria-label="Project path flowchart">
      <div className="flowchart-toolbar">
        {toolbar.map((item) => {
          const Icon = item.icon;
          return (
            <button className={item.active ? "active" : ""} type="button" key={item.label} disabled={!item.active}>
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <div className="flowchart-zoom">
          <button type="button" disabled>
            -
          </button>
          <span>100%</span>
          <button type="button" disabled>
            +
          </button>
        </div>
        <button className="fit-button" type="button" disabled>
          <Scan size={15} />
          Fit
        </button>
      </div>

      <div className="flowchart-canvas">
        {!pathMap ? (
          <div className="flowchart-empty">
            <GitBranch size={28} />
            <strong>Your map will grow here.</strong>
            <span>Answer one question at a time.</span>
          </div>
        ) : (
          <>
            <div className="flowchart-title-row">
              <div>
                <span>Live map</span>
                <h2>{pathMap.title}</h2>
              </div>
              <div className="map-confidence">
                <strong>{Math.round(pathMap.confidence * 100)}%</strong>
                <i>
                  <b style={{ width: `${Math.round(pathMap.confidence * 100)}%` }} />
                </i>
              </div>
            </div>
            <p className="flowchart-summary">{studentCopy(pathMap.summary)}</p>

            <div className="flow-node-grid">
              {pathMap.nodes.map((node, index) => (
                <article className={`flow-node ${node.type} ${node.status}`} key={node.id}>
                  {node.type === "milestone" && <div className="current-focus">Current focus</div>}
                  <span className="node-index">{nodeIcon(node.type)}</span>
                  <div className="node-body">
                    <small>{nodeTypeLabel(node.type)}</small>
                    <strong>{node.label}</strong>
                    <p>{studentCopy(node.detail)}</p>
                    <em>{nodeStatusLabel(node.status)}</em>
                  </div>
                  {index < pathMap.nodes.length - 1 && (
                    <span className="node-arrow" aria-hidden="true">
                      <ArrowRight size={20} />
                    </span>
                  )}
                </article>
              ))}
              <article className="flow-node add-node">
                <span>+</span>
                <strong>Add next step</strong>
                <p>Answer the panel question to grow the map.</p>
              </article>
            </div>

            <div className="flowchart-footer">
              <div className="flow-legend">
                <span>
                  <i className="screen" /> Screen
                </span>
                <span>
                  <i className="input" /> Input
                </span>
                <span>
                  <i className="feedback" /> Feedback
                </span>
                <span>
                  <i className="data" /> Data
                </span>
                <span>
                  <i className="flow" /> Flow
                </span>
              </div>
              <span className="autosave">
                <Sparkles size={15} />
                Map saved
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
