import { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
}

export default function Card({ children, className = '', hover = true }: CardProps) {
    return (
        <div className={`card overflow-hidden ${hover ? '' : 'hover:bg-bg-card'} ${className}`}>
            {children}
        </div>
    )
}

export function CardHeader({ children, className = '' }: CardProps) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    )
}

export function CardTitle({ children, className = '' }: CardProps) {
    return (
        <h3 className={`text-lg font-semibold text-text-primary ${className}`}>
            {children}
        </h3>
    )
}

export function CardContent({ children, className = '' }: CardProps) {
    return (
        <div className={className}>
            {children}
        </div>
    )
}