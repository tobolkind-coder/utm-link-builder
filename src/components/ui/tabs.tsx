"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  children: React.ReactNode
  className?: string
}

const TabsContext = React.createContext<{ activeTab: string; setActiveTab: (tab: string) => void }>({
  activeTab: "",
  setActiveTab: () => {},
})

function Tabs({ value, onValueChange, defaultValue = "", children, className }: TabsProps) {
  const [activeTab, setActiveTabInternal] = React.useState(defaultValue)
  const currentTab = value ?? activeTab
  const setActiveTab = (tab: string) => {
    if (onValueChange) onValueChange(tab)
    else setActiveTabInternal(tab)
  }
  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab }}>
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex gap-1 bg-gray-100 rounded-lg p-1", className)}>{children}</div>
}

function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext)
  return (
    <button
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
        activeTab === value ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900",
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { activeTab } = React.useContext(TabsContext)
  if (activeTab !== value) return null
  return <div className={cn("text-sm", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
