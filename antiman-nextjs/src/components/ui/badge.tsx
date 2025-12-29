'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'
}

export function Badge({
    className,
    variant = 'default',
    ...props
}: BadgeProps) {
    const variants = {
        default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/80',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
        outline: 'text-slate-950 border border-slate-200 hover:bg-slate-100/50',
        destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/80',
        success: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    }

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
                variants[variant],
                className
            )}
            {...props}
        />
    )
}
