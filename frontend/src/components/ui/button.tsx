import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold cursor-pointer transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white border border-white/20 shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/35 hover:scale-[1.02] hover:brightness-110",
        outline:
          "border border-primary/30 bg-background/80 backdrop-blur-xs shadow-xs hover:bg-primary/10 hover:border-primary/60 text-foreground hover:scale-[1.02]",
        secondary:
          "bg-secondary/90 text-secondary-foreground border border-border shadow-xs hover:bg-secondary hover:scale-[1.02]",
        ghost:
          "hover:bg-primary/10 hover:text-primary text-foreground hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-9.5 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
