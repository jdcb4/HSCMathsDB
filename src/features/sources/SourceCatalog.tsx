import { ExternalLink } from "lucide-react";
import type { SourcePack } from "../../domain/hscSchemas";

export function SourceCatalog({ packs }: { packs: SourcePack[] }) {
  return (
    <div className="rounded-md border border-border-default bg-surface-raised">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-h4 font-semibold">{packs.length} source packs</h2>
      </div>
      <div className="max-h-[calc(100dvh-285px)] overflow-y-auto">
        {packs.map((pack) => (
          <a
            key={pack.id}
            href={pack.packPageUrl}
            target="_blank"
            rel="noreferrer"
            className="block border-b border-border-subtle px-4 py-3 last:border-b-0 hover:bg-surface-sunken"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption text-text-subtle">{pack.year}</p>
                <p className="mt-1 text-body-sm font-semibold text-text-primary">{pack.title}</p>
              </div>
              <ExternalLink size={15} className="mt-1 shrink-0 text-text-subtle" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-caption">
              <StatusPill value={pack.importStatus} />
              <StatusPill value={pack.assetStatus} subdued />
              <span className="rounded-sm bg-surface-overlay px-2 py-1 text-text-secondary">
                {pack.importedQuestionCount} questions
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ value, subdued = false }: { value: string; subdued?: boolean }) {
  return (
    <span
      className={`rounded-sm px-2 py-1 ${
        subdued ? "bg-surface-overlay text-text-secondary" : "bg-accent-info text-text-onAccent"
      }`}
    >
      {value}
    </span>
  );
}
