import { useState } from "react";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@portal-dos-interpretes/ui/components/card";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Calendar } from "@portal-dos-interpretes/ui/components/calendar";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { Clock, MapPin, Video, User } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const scheduledServices = [
  { id: "srv-1", service: "Audiência Jurídica", date: new Date(2026, 0, 18), time: "09:00", duration: "4h", location: "Tribunal de Luanda", modality: "presencial", requester: "Maria Costa" },
  { id: "srv-2", service: "Conferência Médica", date: new Date(2026, 0, 19), time: "14:00", duration: "3h", location: "Zoom", modality: "online", requester: "Hospital ABC" },
  { id: "srv-3", service: "Reunião Empresarial", date: new Date(2026, 0, 22), time: "10:00", duration: "2h", location: "Sede Empresa XYZ", modality: "presencial", requester: "Empresa XYZ" },
  { id: "srv-4", service: "Consulta Médica", date: new Date(2026, 0, 25), time: "08:30", duration: "1h30", location: "Clínica Central", modality: "presencial", requester: "Dr. António" },
];

export default function InterpreterSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const servicesOnDate = selectedDate
    ? scheduledServices.filter(
        (s) => format(s.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
      )
    : [];

  const datesWithServices = scheduledServices.map((s) => format(s.date, "yyyy-MM-dd"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Agenda"
        description="Visualize e gerencie os seus serviços agendados"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasService: (date) => datesWithServices.includes(format(date, "yyyy-MM-dd")),
              }}
              modifiersStyles={{
                hasService: { backgroundColor: "hsl(var(--primary) / 0.1)", fontWeight: "bold" },
              }}
            />
          </CardContent>
        </Card>

        {/* Services for Selected Date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
                : "Selecione uma data"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {servicesOnDate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum serviço agendado para esta data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {servicesOnDate.map((service) => (
                  <div key={service.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      {service.modality === "online" ? (
                        <Video className="h-6 w-6 text-primary" />
                      ) : (
                        <MapPin className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{service.service}</h4>
                        <Badge variant="outline">{service.modality}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {service.time} ({service.duration})
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {service.requester}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{service.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Services List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Próximos Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{format(service.date, "d")}</div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(service.date, "MMM", { locale: pt })}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">{service.service}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.time} • {service.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={service.modality === "online" ? "secondary" : "outline"}>
                      {service.modality}
                    </Badge>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
