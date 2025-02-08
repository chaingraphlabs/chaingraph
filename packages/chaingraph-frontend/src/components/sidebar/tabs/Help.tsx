/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'

export function Help() {
  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="getting-started">
          <AccordionTrigger>Getting Started</AccordionTrigger>
          <AccordionContent>
            Learn how to create your first flow and add nodes.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="nodes">
          <AccordionTrigger>Working with Nodes</AccordionTrigger>
          <AccordionContent>
            Understanding different node types and how to connect them.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shortcuts">
          <AccordionTrigger>Keyboard Shortcuts</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Delete Node</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Delete</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span>Copy Node</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Ctrl + C</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span>Paste Node</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Ctrl + V</kbd>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  )
}
