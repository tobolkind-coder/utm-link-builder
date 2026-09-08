"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: string
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function TooltipTrigger({ children, render, ...props }: { children?: React.ReactNode; render?: React.ReactElement }) {
  return <>{render ?? children}</>
}

function TooltipContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <>{children}</>
}

function TooltipWrapper({ children, content }: TooltipProps) {
  const [show, setShow] = React.useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={cn(
          "absolute z-50 mt-1 max-w-xs rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md",
          "bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal break-all"
        )}>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipWrapper }
