"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart2, Compass, Book, User, MessageSquare } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  darkMode: boolean
}

export default function BottomNav({ darkMode }: BottomNavProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark" || darkMode

  const navItems = [
    {
      name: "首页",
      icon: Home,
      href: "/"
    },
    {
      name: "市场",
      icon: BarChart2,
      href: "/market"
    },
    {
      name: "发现",
      icon: Compass,
      href: "/discover"
    },
    {
      name: "聊天",
      icon: MessageSquare,
      href: "/forum"
    },
    {
      name: "我的",
      icon: User,
      href: "/profile"
    }
  ]

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t",
      isDark 
        ? "bg-card border-border/30" 
        : "bg-background border-border/20"
    )}>
      <div className="max-w-md mx-auto grid grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link 
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2",
                isActive 
                  ? "text-primary" 
                  : isDark 
                    ? "text-muted-foreground hover:text-foreground/80" 
                    : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : "text-inherit"
              )} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}