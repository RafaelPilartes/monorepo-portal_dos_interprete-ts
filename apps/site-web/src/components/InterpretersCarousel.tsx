import { interpreterProfileLoginUrl } from '@/lib/links'
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { InterpreterCard } from "@portal-dos-interpretes/features/components/InterpreterCard";
import { AnimatedSection } from "@portal-dos-interpretes/ui/components/animated-section";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { InterpreterData } from "@portal-dos-interpretes/features/components/InterpreterCard";

interface InterpretersCarouselProps {
  interpreters: InterpreterData[];
  title?: string;
  subtitle?: string;
}

export function InterpretersCarousel({ 
  interpreters, 
  title = "Nossos Intérpretes",
  subtitle = "Conheça alguns dos profissionais qualificados que fazem parte da nossa rede"
}: InterpretersCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <section className="section-padding bg-muted/50 overflow-hidden">
      <div className="container-wide">
        <AnimatedSection animation="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-2">
              {title.split(" ").map((word, i) => 
                i === title.split(" ").length - 1 ? (
                  <span key={i} className="text-gradient">{word}</span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              {subtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-in" delay={100}>
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {interpreters.map((interpreter) => (
              <div
                key={interpreter.slug}
                className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
              >
                {/* No wrapping link: the card has its own "Ver Perfil" link, and an <a> inside an <a> is invalid (AD-009). */}
                <div className="block h-full">
                  <InterpreterCard interpreter={interpreter} compact profileHref={interpreterProfileLoginUrl} />
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={200} className="mt-8 text-center">
          <Button size="lg" asChild>
            <Link to="/interpreters">
              Ver Todos os Intérpretes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
