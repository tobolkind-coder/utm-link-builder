"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

function Select({ value = "", onValueChange = () => {}, children }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        "flex h-8 w-full items-center rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      )}
    >
      {children}
    </select>
  )
}

function SelectTrigger({ children }: { children?: React.ReactNode }) {
  return null
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return null
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  return <option value="">{placeholder}</option>
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
