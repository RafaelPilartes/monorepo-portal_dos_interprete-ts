import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProfileSectionEditor } from "@/components/dashboard/profile/ProfileSectionEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, Quote, Send, Check } from "lucide-react";
import { toast } from "sonner";

import { Review, initialReviews } from '@/core/mocks/interpreterProfileMocks';

export default function InterpreterProfileReviews() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const averageRating =
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  const handleSave = () => {
    toast.success("Avaliações atualizadas com sucesso!");
  };

  const toggleFeatured = (id: string) => {
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r))
    );
  };

  const submitReply = (id: string) => {
    if (replyText.trim()) {
      setReviews(
        reviews.map((r) => (r.id === id ? { ...r, reply: replyText.trim() } : r))
      );
      setReplyText("");
      setReplyingTo(null);
      toast.success("Resposta enviada!");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliações"
        description="Gerencie as avaliações recebidas"
        action={
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-warning fill-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Média de avaliação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="text-sm text-muted-foreground">Total de avaliações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Quote className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reviews.filter((r) => r.featured).length}
                </p>
                <p className="text-sm text-muted-foreground">Em destaque</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <ProfileSectionEditor
        title="Avaliações Recebidas"
        description="Visualize e responda às avaliações dos clientes"
        publicNote="Avaliações em destaque aparecem no seu perfil público"
      >
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{review.author}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "text-warning fill-warning"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {review.service}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(review.date).toLocaleDateString("pt-PT")}
                      </p>
                      <p className="mt-2">{review.comment}</p>

                      {/* Reply */}
                      {review.reply && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">A sua resposta:</p>
                          <p className="text-sm">{review.reply}</p>
                        </div>
                      )}

                      {/* Reply Form */}
                      {replyingTo === review.id && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Escreva a sua resposta..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => submitReply(review.id)}
                              disabled={!replyText.trim()}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Enviar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {!review.reply && replyingTo !== review.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setReplyingTo(review.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Responder
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Label htmlFor={`featured-${review.id}`} className="text-xs">
                      Destaque
                    </Label>
                    <Switch
                      id={`featured-${review.id}`}
                      checked={review.featured}
                      onCheckedChange={() => toggleFeatured(review.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ProfileSectionEditor>
    </div>
  );
}