import { useParams, Link } from "react-router-dom";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { AnimatedSection } from "@portal-dos-interpretes/ui/components/animated-section";
import { interpreters } from "../mocks/interpretersMocks";
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark } from "lucide-react";

export default function ArticlePage() {
  const { slug, articleSlug } = useParams<{ slug: string; articleSlug: string }>();
  const interpreter = interpreters.find((i) => i.slug === slug);

  if (!interpreter) {
    return (
      <div className="container-wide py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Intérprete não encontrado</h1>
        <Button asChild>
          <Link to="/interpreters">Voltar aos intérpretes</Link>
        </Button>
      </div>
    );
  }

  // Find article by index (since we don't have slugs for articles)
  const articleIndex = parseInt(articleSlug || "0");
  const article = interpreter.publications?.[articleIndex];

  if (!article) {
    return (
      <div className="container-wide py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
        <Button asChild>
          <Link to={`/interpreters/${slug}/articles`}>Ver todos os artigos</Link>
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-AO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Generate full article content (in a real app, this would come from DB)
  const fullContent = `
    ${article.excerpt}

    ## Introdução

    A interpretação de Língua Gestual Angolana (LGA) desempenha um papel fundamental na promoção da inclusão e acessibilidade para pessoas surdas em Angola. Este artigo explora os desafios e oportunidades nesta área especializada.

    ## Contexto Atual

    Em Angola, a comunidade surda enfrenta diversos desafios no acesso a serviços essenciais, educação e oportunidades de emprego. A presença de intérpretes qualificados é crucial para garantir que estas barreiras sejam superadas.

    ## Importância da Formação

    A formação contínua de intérpretes é essencial para manter a qualidade dos serviços prestados. Programas de certificação e actualização profissional garantem que os intérpretes estejam preparados para os diversos contextos de actuação.

    ## Conclusão

    O trabalho dos intérpretes de LGA vai além da simples tradução - é um acto de inclusão social que permite que pessoas surdas participem plenamente na sociedade angolana.
  `;

  const relatedArticles = interpreter.publications?.filter((_, i) => i !== articleIndex).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
        <div className="container-wide">
          <Link
            to={`/interpreters/${slug}/articles`}
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos artigos
          </Link>
        </div>
      </div>

      <div className="container-wide py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatedSection animation="fade-up">
              <article className="rounded-2xl bg-card p-8 shadow-md border border-border/50">
                {/* Article Header */}
                <div className="mb-8">
                  <Badge className="mb-4 bg-secondary/10 text-secondary border-0">
                    Artigo
                  </Badge>
                  <h1 className="text-3xl font-bold text-foreground mb-4">
                    {article.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(article.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>5 min de leitura</span>
                    </div>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <img
                      src={interpreter.photo}
                      alt={interpreter.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <Link 
                        to={`/interpreters/${slug}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {interpreter.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{interpreter.specialty}</p>
                    </div>
                  </div>
                </div>

                {/* Featured Image */}
                <div className="aspect-video rounded-xl overflow-hidden mb-8 bg-gradient-to-br from-primary/20 to-secondary/20">
                  <img
                    src={`https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop`}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none">
                  {fullContent.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('##')) {
                      return (
                        <h2 key={index} className="text-xl font-bold text-foreground mt-8 mb-4">
                          {paragraph.replace('## ', '')}
                        </h2>
                      );
                    }
                    return (
                      <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                        {paragraph.trim()}
                      </p>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-8 pt-8 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Partilhar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              </article>
            </AnimatedSection>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Author Card */}
            <AnimatedSection animation="fade-up" delay={100}>
              <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Sobre o Autor
                </h3>
                <div className="flex flex-col items-center text-center">
                  <img
                    src={interpreter.photo}
                    alt={interpreter.name}
                    className="h-20 w-20 rounded-full object-cover mb-4"
                  />
                  <h4 className="font-semibold text-foreground">{interpreter.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{interpreter.specialty}</p>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/interpreters/${slug}`}>Ver Perfil Completo</Link>
                  </Button>
                </div>
              </div>
            </AnimatedSection>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <AnimatedSection animation="fade-up" delay={200}>
                <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                  <h3 className="font-semibold text-foreground mb-4">Mais Artigos</h3>
                  <div className="space-y-4">
                    {relatedArticles.map((related, index) => {
                      const originalIndex = interpreter.publications?.findIndex(p => p.title === related.title);
                      return (
                        <Link
                          key={index}
                          to={`/interpreters/${slug}/articles/${originalIndex}`}
                          className="block group"
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={`https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&h=200&fit=crop`}
                                alt={related.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                {related.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(related.date)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
