/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPort, IPortConfig, PortType } from '@badaitech/chaingraph-types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { PopoverContent } from '@/components/ui/popover'
import { PORT_TYPES } from '@badaitech/chaingraph-types'
import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

interface Data {
  // element: string
  config: IPortConfig
}

interface Props {
  port: ArrayPort
  onClose: () => void
  onSubmit: (data: Data) => void
}

const typeConfigMap: Record<PortType, IPortConfig> = {
  string: {
    type: 'string',
    defaultValue: '',
    ui: {
      hideEditor: false,
    },
  },
  number: {
    type: 'number',
    defaultValue: 0,
    ui: {
      hideEditor: false,
    },
  },
  enum: {
    type: 'enum',
    options: [],
    defaultValue: '',
    ui: {
      hideEditor: false,
    },
  },
  boolean: {
    type: 'boolean',
    defaultValue: false,
    ui: {
      hideEditor: false,
    },
  },
  stream: {
    type: 'stream',
    itemConfig: {},
    ui: {
      hideEditor: false,
    },
  },
  object: {
    type: 'object',
    schema: {
      properties: {},
    },
    defaultValue: {},
    isSchemaMutable: true,
    ui: {
      hideEditor: false,
      keyDeletable: true,
    },
  },
  array: {
    type: 'array',
    itemConfig: {
      type: 'string',
    },
    defaultValue: [],
    isMutable: true,
    ui: {
      hideEditor: false,
    },
  },
  any: {
    type: 'any',
    defaultValue: null,
    ui: {
      hideEditor: false,
    },
  },
  // secret: {
  //   type: 'secret',
  //   secretType: 'string',
  //   defaultValue: undefined,
  //   ui: {
  //     hideEditor: true,
  //   },
  // },
}

export function AddElementPopover(props: Props) {
  const { onClose, onSubmit, port } = props

  const [type, setType] = useState<PortType | undefined>(
    port.getConfig().itemConfig?.type || 'any',
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSubmit = () => {
    if (!type)
      return

    onSubmit({
      config: typeConfigMap[type],
    })
  }

  return (
    <PopoverContent className="flex flex-col" align="start" side="bottom">
      <header className="flex items-center justify-between mb-4">
        <h4>
          Add element
        </h4>
        <X
          className="size-4 cursor-pointer hover:brightness-125"
          onClick={onClose}
        />
      </header>

      {/* <Input */}
      {/*  value={element} */}
      {/*  onChange={e => setElement(e.target.value)} */}
      {/*  placeholder="value" */}
      {/* /> */}

      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <div className="mt-3 w-full relative">
            <Input
              value={type}
              readOnly
              className="w-full cursor-pointer"
              onClick={() => setIsDropdownOpen(true)}
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          {PORT_TYPES
            .filter(portType => portType !== 'any')// && portType !== 'secret')
            .map(portType => (
              <DropdownMenuItem
                key={portType}
                onClick={() => {
                  setType(portType)
                  setIsDropdownOpen(false)
                }}
              >
                {portType}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        disabled={!type}
        className="ml-auto mt-6"
        onClick={handleSubmit}
      >
        Add
      </Button>
    </PopoverContent>
  )
}
