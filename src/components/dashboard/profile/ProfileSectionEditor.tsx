import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Eye } from "lucide-react";

interface ProfileSectionEditorProps {
  title: string;
  description?: string;
  children: ReactNode;
  onSave?: () => void;
  onPreview?: () => void;
  saving?: boolean;
  publicNote?: string;
}

export function ProfileSectionEditor({
  title,
  description,
  children,
  onSave,
  onPreview,
  saving,
  publicNote = "Informações visíveis publicamente",
}: ProfileSectionEditorProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          {publicNote && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Eye className="h-3 w-3" />
              {publicNote}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Pré-visualizar
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}