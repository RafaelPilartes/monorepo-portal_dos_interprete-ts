import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { AvailabilityEditorModal } from "@/components/dashboard/modals/AvailabilityEditorModal";

const weekDays = [
  { id: "monday", label: "Segunda-feira" },
  { id: "tuesday", label: "Terça-feira" },
  { id: "wednesday", label: "Quarta-feira" },
  { id: "thursday", label: "Quinta-feira" },
  { id: "friday", label: "Sexta-feira" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];

const initialSchedule = {
  monday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  tuesday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  wednesday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  thursday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  friday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export default function InterpreterAvailability() {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);

  const toggleDay = (dayId: string) => {
    setSchedule({
      ...schedule,
      [dayId]: {
        ...schedule[dayId as keyof typeof schedule],
        enabled: !schedule[dayId as keyof typeof schedule].enabled,
      },
    });
  };

  const handleSave = () => {
    toast.success("Disponibilidade atualizada com sucesso!");
  };

  const openEditor = (dayId: string) => {
    setEditingDay(dayId);
    setShowEditorModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disponibilidade"
        description="Configure os seus horários de trabalho"
        action={
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Horário Semanal</CardTitle>
            <CardDescription>Defina os seus horários de disponibilidade para cada dia da semana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekDays.map((day) => {
              const daySchedule = schedule[day.id as keyof typeof schedule];
              return (
                <div key={day.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={() => toggleDay(day.id)}
                    />
                    <Label className={!daySchedule.enabled ? "text-muted-foreground" : ""}>
                      {day.label}
                    </Label>
                  </div>
                  {daySchedule.enabled && (
                    <div className="flex items-center gap-2">
                      {daySchedule.slots.map((slot, index) => (
                        <Badge key={index} variant="secondary">
                          {slot.start} - {slot.end}
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => openEditor(day.id)}>
                        Editar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Blocked Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Datas Bloqueadas</CardTitle>
            <CardDescription>Selecione datas em que não estará disponível</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="multiple"
              selected={blockedDates}
              onSelect={(dates) => setBlockedDates(dates || [])}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
            {blockedDates.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Datas selecionadas:</Label>
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((date, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {date.toLocaleDateString("pt-PT")}
                      <button
                        onClick={() => setBlockedDates(blockedDates.filter((_, i) => i !== index))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Preferences */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preferências de Serviço</CardTitle>
            <CardDescription>Configure as suas preferências para novos pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tempo mínimo de antecedência</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue={24} min={1} className="w-20" />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempo mínimo entre a solicitação e o início do serviço
                </p>
              </div>
              <div className="space-y-2">
                <Label>Duração máxima por serviço</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue={8} min={1} max={12} className="w-20" />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Duração máxima que aceita para um único serviço
                </p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Aceitar serviços online</Label>
                  <p className="text-xs text-muted-foreground">Videochamadas (Zoom, Meet, etc.)</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Aceitar serviços presenciais</Label>
                  <p className="text-xs text-muted-foreground">Serviços no local do cliente</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AvailabilityEditorModal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        day={editingDay ? weekDays.find(d => d.id === editingDay)?.label || "" : ""}
        slots={editingDay ? schedule[editingDay as keyof typeof schedule]?.slots || [] : []}
        onSave={(slots) => {
          if (editingDay) {
            setSchedule({
              ...schedule,
              [editingDay]: { ...schedule[editingDay as keyof typeof schedule], slots },
            });
          }
          setShowEditorModal(false);
        }}
      />
    </div>
  );
}
