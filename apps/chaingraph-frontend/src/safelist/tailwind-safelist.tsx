/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * This file is not meant to be imported.
 * It exists solely to ensure Tailwind generates all required CSS classes.
 */

export function TailwindSafelist() {
  return (
    <div className="bg-background text-foreground border-border">
      <div className="bg-card text-card-foreground p-4">
        <h2 className="text-xl font-bold">Card Title</h2>
        <p className="text-muted-foreground">Card content</p>
      </div>
      <button className="bg-primary text-primary-foreground px-4 py-2 rounded">
        Primary Button
      </button>
      <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded">
        Secondary Button
      </button>
      <div className="bg-muted text-muted-foreground p-4">
        Muted content
      </div>
      <div className="bg-accent text-accent-foreground p-4">
        Accent content
      </div>
      <div className="bg-destructive text-destructive-foreground p-4">
        Destructive content
      </div>
      <div className="bg-popover text-popover-foreground p-4">
        Popover content
      </div>

      {/* Flow-specific colors */}
      <div className="text-[hsl(var(--flow-execute))]">Execute color</div>
      <div className="text-[hsl(var(--flow-data))]">Data color</div>
      <div className="text-[hsl(var(--flow-stream))]">Stream color</div>

      {/* Shadow variants */}
      <div className="shadow-node dark:shadow-node-dark">Node shadow</div>
      <div className="shadow-node-selected dark:shadow-node-selected-dark">Selected node shadow</div>

      {/* Animation classes */}
      <div className="animate-glow">Glowing element</div>
      <div className="animate-accordion-down">Accordion down</div>
      <div className="animate-accordion-up">Accordion up</div>
    </div>
  )
}
