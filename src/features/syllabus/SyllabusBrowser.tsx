import type { SyllabusNode } from "../../domain/hscSchemas";

export function SyllabusBrowser({
  nodes,
  selectedNodeId,
  questionCountsByNode,
  onSelectNode
}: {
  nodes: SyllabusNode[];
  selectedNodeId: string;
  questionCountsByNode: Record<string, number>;
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <div className="rounded-md border border-border-default bg-surface-raised">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-h4 font-semibold">{nodes.length} syllabus nodes</h2>
      </div>
      <div className="max-h-[calc(100dvh-285px)] overflow-y-auto">
        {nodes.map((node) => {
          const selected = node.id === selectedNodeId;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node.id)}
              className={`block w-full border-b border-border-subtle px-4 py-3 text-left last:border-b-0 ${
                selected ? "bg-surface-sunken" : "hover:bg-surface-sunken"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption font-semibold uppercase text-accent-info">{node.code}</span>
                <span className="rounded-sm bg-surface-overlay px-2 py-1 text-caption text-text-secondary">
                  {questionCountsByNode[node.id] ?? 0}
                </span>
              </div>
              <p className="mt-1 text-body-sm font-semibold text-text-primary">{node.title}</p>
              <p className="mt-1 text-caption text-text-secondary">{node.topic}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
