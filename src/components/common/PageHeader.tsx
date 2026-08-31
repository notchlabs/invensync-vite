import type { ReactNode } from 'react'
import { useSetHeader } from '../../context/HeaderContext'

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  useSetHeader({
    title,
    description,
    actions,
  })

  return null
}
