interface PageHeaderProps {
  title: string
  description?: string
  className?: string
}

export function PageHeader({ title, description, className = '' }: PageHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-[24px] font-bold text-primary-text tracking-tight leading-none">{title}</h1>
      {description && (
        <p className="text-[13px] font-medium text-secondary-text mt-1.5">{description}</p>
      )}
    </div>
  )
}
