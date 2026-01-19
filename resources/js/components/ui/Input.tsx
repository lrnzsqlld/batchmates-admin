import { forwardRef, ReactNode } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && <label className="label">{label}</label>}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`input ${icon ? 'pl-12' : ''} ${className}`}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1 text-sm text-danger">{error}</p>}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input