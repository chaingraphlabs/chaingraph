/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortType } from '@badaitech/chaingraph-types'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface Props {
  className?: string
  title: ReactNode
}

export function AddFieldDialog(props: Props) {
  const { title, className } = props

  const [keyName, setKeyName] = useState('')
  const [type, setType] = useState<PortType | undefined>()

  return (
    <Dialog>
      <DialogTrigger className={cn('bg-white/5 hover:bg-white/10 p-1 rounded transition-colors', className)}>Add property</DialogTrigger>
      <DialogContent className="flex flex-col items-start">
        <DialogTitle>{title}</DialogTitle>
        <Input
          placeholder="Key name"
          value={keyName}
          onChange={(e) => {
            setKeyName(e.target.value)
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex relative cursor-pointer">
            <Input className="text-left cursor-pointer hover:brightness-125" value={type ?? 'Select Type'} />
            <ChevronDown className="absolute top-1/2 right-3 -translate-y-1/2" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <DropdownMenuItem className="cursor-pointer" onClick={() => setType('string')}>String</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer"onClick={() => setType('boolean')}>Boolean</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setType('enum')}>Enum</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DialogContent>
    </Dialog>
  )
}
