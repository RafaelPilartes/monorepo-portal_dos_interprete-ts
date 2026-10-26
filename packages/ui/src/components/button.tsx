import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 panel:rounded-md panel:font-medium panel:shadow-none panel:hover:shadow-none panel:active:scale-100 panel:transition-colors panel:duration-150",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground panel:border panel:border-input panel:bg-card panel:text-foreground panel:hover:bg-muted panel:hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90 hover:shadow-lg active:scale-[0.98]",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 active:scale-[0.98] text-base px-8 py-6",
        "hero-secondary": "bg-card text-foreground border-2 border-border shadow-md hover:shadow-lg hover:border-primary/30 active:scale-[0.98] text-base px-8 py-6",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** The denser sizes of the dashboards (`panel:`, <html class="app-panel">). */
const PANEL_SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "panel:h-9 panel:px-4",
  sm: "panel:h-8 panel:px-3",
  lg: "panel:h-10 panel:px-5 panel:text-sm",
  xl: "",
  icon: "panel:h-9 panel:w-9",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // A button that sets its own height keeps it: the panel size would win over it otherwise.
    const ownHeight = /(^|\s)(h-|min-h-|py-)/.test(className ?? "");
    const panelSize = ownHeight ? "" : PANEL_SIZES[size ?? "default"];
    return <Comp className={cn(buttonVariants({ variant, size }), panelSize, className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
