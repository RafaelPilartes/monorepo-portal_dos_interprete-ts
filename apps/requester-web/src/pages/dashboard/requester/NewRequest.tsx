import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@portal-dos-interpretes/ui/components/card";
import { Input } from "@portal-dos-interpretes/ui/components/input";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import { Textarea } from "@portal-dos-interpretes/ui/components/textarea";
import { RadioGroup, RadioGroupItem } from "@portal-dos-interpretes/ui/components/radio-group";
import { Calendar } from "@portal-dos-interpretes/ui/components/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@portal-dos-interpretes/ui/components/select";
import { Popover, PopoverContent, PopoverTrigger } from "@portal-dos-interpretes/ui/components/popover";
import { cn } from "@portal-dos-interpretes/ui/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, ArrowRight, Check, Video, MapPin, Clock, FileText, Users, User, DollarSign, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@portal-dos-interpretes/ui/components/avatar";
import { interpreters } from "@portal-dos-interpretes/features/mocks/interpretersMocks";
import { Alert, AlertDescription } from "@portal-dos-interpretes/ui/components/alert";

const serviceTypes = [
  { id: "medical", name: "Consulta Médica", description: "Interpretação em ambiente de saúde" },
  { id: "legal", name: "Audiência Jurídica", description: "Interpretação em tribunais e consultas legais" },
  { id: "education", name: "Evento Educacional", description: "Aulas, palestras e formações" },
  { id: "corporate", name: "Reunião Empresarial", description: "Reuniões corporativas e conferências" },
  { id: "religious", name: "Evento Religioso", description: "Cultos, missas e cerimónias religiosas" },
  { id: "other", name: "Outro", description: "Especifique nas observações" },
];

const durations = [
  { value: "1h", label: "1 hora" },
  { value: "2h", label: "2 horas" },
  { value: "3h", label: "3 horas" },
  { value: "4h", label: "4 horas" },
  { value: "half-day", label: "Meio dia (5h)" },
  { value: "full-day", label: "Dia inteiro (8h)" },
];

const steps = [
  { id: 1, title: "Tipo de Solicitação", icon: Users },
  { id: 2, title: "Tipo de Serviço", icon: FileText },
  { id: 3, title: "Modalidade", icon: Video },
  { id: 4, title: "Data e Hora", icon: CalendarIcon },
  { id: 5, title: "Local", icon: MapPin },
  { id: 6, title: "Duração e Orçamento", icon: Clock },
  { id: 7, title: "Confirmação", icon: Check },
];

export default function NewRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedInterpreter = searchParams.get("interpreter");

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    requestType: preselectedInterpreter ? "direct" : "" as "direct" | "open" | "",
    selectedInterpreter: preselectedInterpreter || "",
    serviceType: "",
    modality: "presencial" as "presencial" | "online",
    date: undefined as Date | undefined,
    time: "",
    duration: "",
    location: "",
    meetingLink: "",
    observations: "",
    estimatedBudget: "",
  });

  useEffect(() => {
    if (preselectedInterpreter) {
      setFormData(prev => ({
        ...prev,
        requestType: "direct",
        selectedInterpreter: preselectedInterpreter
      }));
    }
  }, [preselectedInterpreter]);

  const selectedInterpreterData = interpreters.find(i => i.slug === formData.selectedInterpreter);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.requestType;
      case 2: 
        if (formData.requestType === "direct" && !formData.selectedInterpreter) return false;
        return !!formData.serviceType;
      case 3: return !!formData.modality;
      case 4: return !!formData.date && !!formData.time;
      case 5: return formData.modality === "online" ? !!formData.meetingLink : !!formData.location;
      case 6: return !!formData.duration;
      case 7: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    const requestTypeLabel = formData.requestType === "direct" ? "direta" : "aberta";
    toast.success(`Solicitação ${requestTypeLabel} criada com sucesso!`, {
      description: formData.requestType === "direct" 
        ? `Aguarde a resposta de ${selectedInterpreterData?.name}.`
        : "A solicitação está disponível para todos os intérpretes elegíveis.",
    });
    navigate("/requests");
  };

  const selectedService = serviceTypes.find(s => s.id === formData.serviceType);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Solicitação"
        description="Solicite um intérprete para o seu evento"
        action={<Button variant="outline" asChild><Link to="/requests"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link></Button>}
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
              currentStep >= step.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 text-muted-foreground"
            )}>
              <step.icon className="h-5 w-5" />
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-6 sm:w-12 lg:w-16",
                currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
          {currentStep === 1 && (
            <CardDescription>Escolha como deseja solicitar o serviço de interpretação</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Request Type */}
          {currentStep === 1 && (
            <RadioGroup
              value={formData.requestType}
              onValueChange={(value) => setFormData({ ...formData, requestType: value as "direct" | "open" })}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Label
                htmlFor="direct"
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-4 rounded-lg border p-8 transition-colors hover:bg-muted",
                  formData.requestType === "direct" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="direct" id="direct" className="sr-only" />
                <User className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <span className="font-medium">Solicitação Direta</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolha um intérprete específico para o seu serviço
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="open"
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-4 rounded-lg border p-8 transition-colors hover:bg-muted",
                  formData.requestType === "open" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="open" id="open" className="sr-only" />
                <Users className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <span className="font-medium">Solicitação Aberta</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos os intérpretes elegíveis podem candidatar-se
                  </p>
                </div>
              </Label>
            </RadioGroup>
          )}

          {/* Step 2: Service Type + Interpreter Selection for Direct */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {formData.requestType === "direct" && (
                <div className="space-y-4">
                  <Label>Selecionar Intérprete</Label>
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                    {interpreters.filter(i => i.verified).map((interpreter) => (
                      <div
                        key={interpreter.slug}
                        onClick={() => setFormData({ ...formData, selectedInterpreter: interpreter.slug })}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted",
                          formData.selectedInterpreter === interpreter.slug && "border-primary bg-primary/5"
                        )}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={interpreter.photo} alt={interpreter.name} />
                          <AvatarFallback>{interpreter.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{interpreter.name}</span>
                            {interpreter.verified && (
                              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{interpreter.specialty}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {interpreter.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-warning fill-warning" />
                                <span className="text-xs">{interpreter.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {interpreter.minimumHourlyRate && (
                              <Badge variant="outline" className="text-xs">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {interpreter.minimumHourlyRate} AOA/h
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedInterpreterData && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {selectedInterpreterData.minimumHourlyRate 
                          ? `Taxa mínima: ${selectedInterpreterData.minimumHourlyRate} AOA/hora. O valor final pode ser negociado.`
                          : "Este intérprete está aberto a negociação de preço."
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <Label>Tipo de Serviço</Label>
                <RadioGroup
                  value={formData.serviceType}
                  onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {serviceTypes.map((service) => (
                    <Label
                      key={service.id}
                      htmlFor={`service-${service.id}`}
                      className={cn(
                        "flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted",
                        formData.serviceType === service.id && "border-primary bg-primary/5"
                      )}
                    >
                      <RadioGroupItem value={service.id} id={`service-${service.id}`} className="sr-only" />
                      <span className="font-medium">{service.name}</span>
                      <span className="text-sm text-muted-foreground">{service.description}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 3: Modality */}
          {currentStep === 3 && (
            <RadioGroup
              value={formData.modality}
              onValueChange={(value) => setFormData({ ...formData, modality: value as "presencial" | "online" })}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Label
                htmlFor="presencial"
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-4 rounded-lg border p-8 transition-colors hover:bg-muted",
                  formData.modality === "presencial" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="presencial" id="presencial" className="sr-only" />
                <MapPin className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <span className="font-medium">Presencial</span>
                  <p className="text-sm text-muted-foreground">O intérprete estará fisicamente presente</p>
                </div>
              </Label>
              <Label
                htmlFor="online"
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-4 rounded-lg border p-8 transition-colors hover:bg-muted",
                  formData.modality === "online" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="online" id="online" className="sr-only" />
                <Video className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <span className="font-medium">Online</span>
                  <p className="text-sm text-muted-foreground">Interpretação via videochamada</p>
                </div>
              </Label>
            </RadioGroup>
          )}

          {/* Step 4: Date and Time */}
          {currentStep === 4 && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data do Serviço</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP", { locale: pt }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData({ ...formData, date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário de Início</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 5: Location/Link */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {formData.modality === "presencial" ? (
                <div className="space-y-2">
                  <Label htmlFor="location">Endereço Completo</Label>
                  <Textarea
                    id="location"
                    placeholder="Ex: Rua Principal 123, Luanda, Angola"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    rows={3}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="meetingLink">Link da Reunião</Label>
                  <Input
                    id="meetingLink"
                    type="url"
                    placeholder="Ex: https://zoom.us/j/123456789"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Zoom, Google Meet, Microsoft Teams ou outra plataforma
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Duration and Budget */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Duração Estimada</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.requestType === "open" && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento Estimado (opcional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="budget"
                      type="number"
                      placeholder="Ex: 15000"
                      value={formData.estimatedBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Valor em AOA. O valor final pode ser negociado com o intérprete.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observations">Observações (opcional)</Label>
                <Textarea
                  id="observations"
                  placeholder="Informações adicionais sobre o serviço..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 7: Confirmation */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Resumo da Solicitação</h3>
                  <Badge variant={formData.requestType === "direct" ? "default" : "secondary"}>
                    {formData.requestType === "direct" ? "Direta" : "Aberta"}
                  </Badge>
                </div>
                
                {formData.requestType === "direct" && selectedInterpreterData && (
                  <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedInterpreterData.photo} alt={selectedInterpreterData.name} />
                      <AvatarFallback>{selectedInterpreterData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">{selectedInterpreterData.name}</span>
                      <p className="text-sm text-muted-foreground">{selectedInterpreterData.specialty}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo de Serviço</span>
                    <p className="font-medium">{selectedService?.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Modalidade</span>
                    <p className="font-medium">{formData.modality === "online" ? "Online" : "Presencial"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Data</span>
                    <p className="font-medium">{formData.date ? format(formData.date, "PPP", { locale: pt }) : "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Horário</span>
                    <p className="font-medium">{formData.time}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Duração</span>
                    <p className="font-medium">{durations.find(d => d.value === formData.duration)?.label}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{formData.modality === "online" ? "Link" : "Local"}</span>
                    <p className="font-medium">{formData.modality === "online" ? formData.meetingLink : formData.location}</p>
                  </div>
                  {formData.requestType === "open" && formData.estimatedBudget && (
                    <div>
                      <span className="text-sm text-muted-foreground">Orçamento Estimado</span>
                      <p className="font-medium">{formData.estimatedBudget} AOA</p>
                    </div>
                  )}
                </div>
                {formData.observations && (
                  <div>
                    <span className="text-sm text-muted-foreground">Observações</span>
                    <p className="font-medium">{formData.observations}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.requestType === "direct"
                  ? "Ao confirmar, a sua solicitação será enviada diretamente ao intérprete selecionado."
                  : "Ao confirmar, a sua solicitação ficará visível para todos os intérpretes elegíveis. O primeiro a aceitar garantirá o serviço."
                }
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            {currentStep < 7 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <Check className="mr-2 h-4 w-4" />
                Confirmar Solicitação
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
