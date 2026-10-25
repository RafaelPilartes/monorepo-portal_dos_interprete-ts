import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right";
  delay?: number;
  threshold?: number;
}

export function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  threshold = 0.1,
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  // If user prefers reduced motion, show content immediately
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const animationClasses = {
    "fade-up": "translate-y-8 opacity-0",
    "fade-in": "opacity-0",
    "scale-in": "scale-95 opacity-0",
    "slide-left": "-translate-x-8 opacity-0",
    "slide-right": "translate-x-8 opacity-0",
  };

  const visibleClasses = "translate-y-0 translate-x-0 scale-100 opacity-100";

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? visibleClasses : animationClasses[animation],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
