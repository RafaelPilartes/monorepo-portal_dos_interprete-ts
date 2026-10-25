import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slots: TimeSlot[]) => void;
  day: string;
  slots: TimeSlot[];
}

export function AvailabilityEditorModal({
  isOpen,
  onClose,
  onSave,
  day,
  slots: initialSlots,
}: AvailabilityEditorModalProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(initialSlots);

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  const addSlot = () => {
    setSlots([...slots, { start: "09:00", end: "12:00" }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: "start" | "end", value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleSave = () => {
    onSave(slots);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Horários - {day}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum horário definido
            </p>
          ) : (
            slots.map((slot, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(index, "start", e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Fim</Label>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(index, "end", e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-5"
                  onClick={() => removeSlot(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}

          <Button variant="outline" onClick={addSlot} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Período
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
