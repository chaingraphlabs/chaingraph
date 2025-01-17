import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

interface ErrorMessageProps {
  title?: string
  children: React.ReactNode
}

export function ErrorMessage({ title = 'Error', children }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mx-4">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {children}
      </AlertDescription>
    </Alert>
  )
}
