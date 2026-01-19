import { ReactNode } from 'react'

interface BadgeProps {
    children: ReactNode
    variant: 'success' | 'warning' | 'danger' | 'info'
    className?: string
}

export default function Badge({ children, variant, className = '' }: BadgeProps) {
    const capitalize = (str: string) => {
        if (typeof str !== 'string') return str
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    return (
        <span className={`badge badge-${variant} ${className}`}>
            {typeof children === 'string' ? capitalize(children) : children}
        </span>
    )
}   