import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { StatsCard } from "@portal-dos-interpretes/ui/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@portal-dos-interpretes/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@portal-dos-interpretes/ui/components/avatar";
import { Progress } from "@portal-dos-interpretes/ui/components/progress";
import { Star, MessageSquare, TrendingUp, Award } from "lucide-react";

const reviews = [
  {
    id: "rev-1",
    requester: { name: "João Silva", photo: "/placeholder.svg" },
    service: "Consulta Médica",
    date: "15 Jan 2026",
    rating: 5,
    comment: "Excelente profissional! Muito atenciosa e competente. Recomendo vivamente.",
  },
  {
    id: "rev-2",
    requester: { name: "Maria Costa", photo: "/placeholder.svg" },
    service: "Audiência Jurídica",
    date: "12 Jan 2026",
    rating: 5,
    comment: "Serviço impecável. A intérprete demonstrou grande conhecimento técnico.",
  },
  {
    id: "rev-3",
    requester: { name: "Empresa ABC", photo: "/placeholder.svg" },
    service: "Reunião Empresarial",
    date: "10 Jan 2026",
    rating: 4,
    comment: "Muito profissional e pontual. Boa comunicação.",
  },
  {
    id: "rev-4",
    requester: { name: "Hospital Central", photo: "/placeholder.svg" },
    service: "Conferência Médica",
    date: "5 Jan 2026",
    rating: 5,
    comment: "Interpretação de alta qualidade. Muito satisfeitos com o serviço.",
  },
];

const ratingDistribution = [
  { stars: 5, count: 45, percentage: 75 },
  { stars: 4, count: 12, percentage: 20 },
  { stars: 3, count: 3, percentage: 5 },
  { stars: 2, count: 0, percentage: 0 },
  { stars: 1, count: 0, percentage: 0 },
];

export default function InterpreterReviews() {
  const averageRating = 4.9;
  const totalReviews = 60;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliações"
        description="Veja o feedback dos seus clientes"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Avaliação Média" value={averageRating.toFixed(1)} icon={Star} />
        <StatsCard title="Total de Avaliações" value={totalReviews} icon={MessageSquare} />
        <StatsCard title="5 Estrelas" value="75%" icon={Award} />
        <StatsCard title="Tendência" value="+5%" icon={TrendingUp} trend={{ value: 5, isPositive: true }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Avaliações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-5xl font-bold">{averageRating}</span>
              <div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{totalReviews} avaliações</p>
              </div>
            </div>

            {ratingDistribution.map((rating) => (
              <div key={rating.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm">{rating.stars}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={rating.percentage} className="flex-1" />
                <span className="text-sm text-muted-foreground w-12 text-right">{rating.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Avaliações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.requester.photo} alt={review.requester.name} />
                        <AvatarFallback>{review.requester.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.requester.name}</p>
                        <p className="text-sm text-muted-foreground">{review.service}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
