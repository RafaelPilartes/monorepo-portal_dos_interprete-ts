import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Star, User, Calendar, MessageSquare } from "lucide-react";

// Mock data
const reviews = [
  {
    id: "1",
    interpreterName: "Maria Silva",
    interpreterPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    service: "Interpretação em Consulta Médica",
    rating: 5,
    comment: "Excelente profissional! Muito atenciosa e competente. Recomendo vivamente.",
    date: "2024-01-16",
    requestId: "REQ-003",
  },
  {
    id: "2",
    interpreterName: "João Pedro António",
    interpreterPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    service: "Interpretação em Aula Universitária",
    rating: 4,
    comment: "Bom serviço. Muito pontual e profissional.",
    date: "2024-01-12",
    requestId: "REQ-004",
  },
];

const pendingReviews = [
  {
    id: "1",
    interpreterName: "Ana Beatriz Fernandes",
    interpreterPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    service: "Interpretação em Conferência",
    date: "2024-01-15",
    requestId: "REQ-006",
  },
];

export default function MyReviews() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Avaliações"
        description="Visualize e gerencie as avaliações que você fez aos intérpretes."
      />

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              Avaliações Pendentes ({pendingReviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.map((pending) => (
              <div
                key={pending.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={pending.interpreterPhoto}
                    alt={pending.interpreterName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{pending.interpreterName}</h4>
                    <p className="text-sm text-muted-foreground">{pending.service}</p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(pending.date).toLocaleDateString('pt-AO')}
                    </p>
                  </div>
                </div>
                <Button>
                  <Star className="h-4 w-4" />
                  Avaliar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Reviews */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Avaliações Realizadas</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={review.interpreterPhoto}
                      alt={review.interpreterName}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{review.interpreterName}</h4>
                          <p className="text-sm text-muted-foreground">{review.service}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('pt-AO')}
                        </span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= review.rating
                                ? 'text-warning fill-warning'
                                : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Star}
            title="Nenhuma avaliação"
            description="Você ainda não fez nenhuma avaliação. Após concluir um serviço, poderá avaliar o intérprete."
          />
        )}
      </div>
    </div>
  );
}
