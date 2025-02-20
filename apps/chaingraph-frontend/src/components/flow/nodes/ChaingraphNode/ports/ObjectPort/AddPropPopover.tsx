/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig, PortType } from '@badaitech/chaingraph-types'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { PopoverContent } from '@/components/ui/popover'
import { PORT_TYPES } from '@badaitech/chaingraph-types'
import { X } from 'lucide-react'
import { useState } from 'react'

interface Data {
  key: string
  config: IPortConfig
}

interface Props {
  onClose: () => void
  onSubmit: (data: Data) => void
}

const typeConfigMap: Record<PortType, IPortConfig> = {
  string: {
    type: 'string',
  },
  number: {
    type: 'number',
  },
  enum: {
    type: 'enum',
    options: [],
  },
  boolean: {
    type: 'boolean',
  },
  stream: {
    type: 'stream',
    itemConfig: {},
  },
  object: {
    type: 'object',
    schema: {
      properties: {},
    },
  },
  array: {
    type: 'array',
    itemConfig: {
      type: 'string',
    },
  },
  any: {
    type: 'any',
  },
}

export function AddPropPopover(props: Props) {
  const { onClose, onSubmit } = props

  const [key, setKey] = useState('')
  const [type, setType] = useState<Exclude<PortType, 'array' | 'stream'> | undefined>(undefined)

  const handleSubmit = () => {
    if (!type || !key)
      return

    onSubmit({
      key,
      config: typeConfigMap[type],
    })
  }

  return (
    <PopoverContent className="flex flex-col" align="start" side="bottom">
      <header className="flex items-center justify-between mb-4">
        <h4>
          Add Key
        </h4>
        <X
          className="size-4 cursor-pointer hover:brightness-125"
          onClick={onClose}
        />
      </header>

      <Input
        value={key}
        onChange={(e) => {
          setKey(e.target.value)
        }}
        placeholder="key name"
      />
      <DropdownMenu>
        <DropdownMenuTrigger className="mt-3 w-full">
          <Input value={type} className="w-full" placeholder="Select Type" />
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          {PORT_TYPES.filter((type) => {
            return type !== 'array' && type !== 'stream'
          }).map((type) => {
            return (
              <DropdownMenuItem
                key={type}
                onClick={() => {
                  setType(type)
                }}
              >
                {type}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        disabled={!key || !type}
        className="ml-auto mt-6"
        onClick={handleSubmit}
      >
        Add
      </Button>
    </PopoverContent>
  )
}
