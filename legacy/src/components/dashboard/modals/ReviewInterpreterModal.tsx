import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useState } from "react";

interface ReviewInterpreterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  interpreter: {
    name: string;
    photo: string;
  } | null;
  serviceName: string;
  isLoading?: boolean;
}

export function ReviewInterpreterModal({
  isOpen,
  onClose,
  onSubmit,
  interpreter,
  serviceName,
  isLoading = false,
}: ReviewInterpreterModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!interpreter) return null;

  const handleSubmit = () => {
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Intérprete</DialogTitle>
          <DialogDescription>
            Partilhe a sua experiência com o serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Interpreter Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={interpreter.photo} alt={interpreter.name} />
              <AvatarFallback>{interpreter.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{interpreter.name}</p>
              <p className="text-sm text-muted-foreground">{serviceName}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Avaliação</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating === 0 && "Clique para avaliar"}
              {rating === 1 && "Muito insatisfeito"}
              {rating === 2 && "Insatisfeito"}
              {rating === 3 && "Satisfeito"}
              {rating === 4 && "Muito satisfeito"}
              {rating === 5 && "Excelente!"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Descreva a sua experiência com o intérprete..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || isLoading}>
            {isLoading ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
