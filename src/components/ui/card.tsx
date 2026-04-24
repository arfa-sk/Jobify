import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-white/20 bg-white/10 text-white backdrop-blur-xl shadow-lg",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }
