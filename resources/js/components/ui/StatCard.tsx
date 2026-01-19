import { ReactNode } from 'react'
import Card from './Card'

interface StatCardProps {
    title: string
    value: string | number
    icon: ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
    return (
        <Card>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-text-secondary mb-1">{title}</p>
                    <p className="text-3xl font-bold text-text-primary">{value}</p>
                    {trend && (
                        <p className={`text-sm mt-2 ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {icon}
                </div>
            </div>
        </Card>
    )
}