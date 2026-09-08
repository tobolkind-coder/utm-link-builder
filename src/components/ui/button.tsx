import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const variantStyles: Record<string, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-gray-300 bg-white hover:bg-gray-50",
  ghost: "hover:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  link: "text-blue-600 underline hover:underline",
}

const sizeStyles: Record<string, string> = {
  default: "h-8 px-4 py-2 text-sm",
  sm: "h-7 px-3 py-1 text-xs",
  lg: "h-10 px-6 py-2 text-base",
  icon: "h-8 w-8 p-0",
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}

export { Button }
