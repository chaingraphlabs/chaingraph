import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ReactNode } from 'react'

type Props = {
  title: ReactNode
}

export const AddFieldDialog = (props: Props) => {
  const {title} = props

  return (
    <Dialog>
      <DialogTrigger>Add property</DialogTrigger>
      <DialogContent>
          <DialogTitle>{title}</DialogTitle>
          <Input placeholder='Key name' />
          <DropdownMenu>
          <DropdownMenuTrigger>
            Select type
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem>String</DropdownMenuItem>
            <DropdownMenuItem>Boolean</DropdownMenuItem>
            <DropdownMenuItem>Enum</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DialogContent>
    </Dialog>
  )
}


{/* <Input placeholder='key name' />
<DropdownMenu>
  <DropdownMenuTrigger>
    Select type
  </DropdownMenuTrigger>

  <DropdownMenuContent>
    <DropdownMenuItem>String</DropdownMenuItem>
    <DropdownMenuItem>Boolean</DropdownMenuItem>
    <DropdownMenuItem>Enum</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu> */}