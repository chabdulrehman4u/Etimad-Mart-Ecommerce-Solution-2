import React, { Suspense } from "react";
import { sectionsRegistry } from "./registry";

// No section skeleton - let individual components handle their own loading states
const SectionRenderer = ({ layout }) => {
  if (!layout || !Array.isArray(layout.sections)) return null;

  return (
    <div>
      {layout.sections.map((section, idx) => {
        const def = sectionsRegistry[section.type];
        const Component = def?.component;
        if (!Component) return null;
        return (
          <Suspense key={section.id || `${section.type}-${idx}`} fallback={null}>
            <Component settings={section.settings || {}} blocks={section.blocks || []} />
          </Suspense>
        );
      })}
    </div>
  );
};

export default SectionRenderer;
