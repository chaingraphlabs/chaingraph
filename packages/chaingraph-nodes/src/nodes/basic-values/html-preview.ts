/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { Passthrough } from '@badaitech/chaingraph-types'
import { BaseNode, Node, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'HTMLPreviewNode',
  title: 'HTML Preview',
  description: 'Renders HTML+JavaScript in a sandboxed iframe. Allows external resources (CDN scripts, images, CSS). No access to cookies, localStorage, or sessionStorage for security.',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class HTMLPreviewNode extends BaseNode {
  @Passthrough()
  @PortString({
    title: 'HTML',
    description: 'HTML content with optional JavaScript. Scripts run in a sandboxed environment with access to window.chaingraph API.',
    ui: {
      isTextArea: true,
      renderHtml: true,
      hideEditor: false,
      htmlStyles: {
        height: 200,
        autoHeight: false,
        maxHeight: '600',
        scale: 100,
        showBorder: false,
        stripMarkdown: true,
        debounceDelay: 600,
      },
    },
  })
  public html: string = `<h3>HTML Preview</h3>
<p class="text-muted mb-3">Interactive HTML rendered in a sandboxed iframe.</p>

<div class="flex gap-2 mb-3">
  <button onclick="handleClick()">Click Me</button>
  <button class="primary" onclick="showContext()">Show Context</button>
</div>

<div id="output" class="card" style="min-height: 40px;">
  <span class="text-muted">Click a button to see output...</span>
</div>

<script>
const output = document.getElementById('output');

function handleClick() {
  output.innerHTML = '<span class="text-primary">Button clicked!</span> Theme: ' + window.chaingraphTheme;
}

function showContext() {
  if (window.chaingraph) {
    window.chaingraph.getFlowContext().then(ctx => {
      output.innerHTML = '<code>' + JSON.stringify(ctx, null, 2) + '</code>';
    });
  } else {
    output.innerHTML = '<span class="text-muted">Connecting to ChainGraph...</span>';
  }
}
</script>`

  async execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    // Pass-through node - no processing applied
    return {}
  }
}

export default HTMLPreviewNode
