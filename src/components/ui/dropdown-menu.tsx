"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
})

function DropdownMenuTrigger({ children, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  return (
    <button {...props} onClick={() => setOpen(!open)}>
      {children}
    </button>
  )
}

function DropdownMenuContent({ children, className, align = "start", ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end" }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={cn(
          "absolute z-50 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white p-1 shadow-md",
          align === "end" && "right-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

function DropdownMenuItem({ children, className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm hover:bg-gray-100",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-200" />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
