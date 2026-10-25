import { useState } from "react";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Input } from "@portal-dos-interpretes/ui/components/input";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portal-dos-interpretes/ui/components/tabs";
import { Upload, Link, Image, Video, X } from "lucide-react";

interface MediaUploaderProps {
  type: "image" | "video";
  value?: string | undefined;
  onChange: (url: string) => void;
  onRemove?: (() => void) | undefined;
  label?: string | undefined;
  accept?: string | undefined;
}

export function MediaUploader({
  type,
  value,
  onChange,
  onRemove,
  label,
  accept,
}: MediaUploaderProps) {
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");

  const Icon = type === "image" ? Image : Video;
  const defaultAccept = type === "image" ? "image/*" : "video/*";

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
    }
  };

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}
      
      {value ? (
        <div className="relative group">
          {type === "image" ? (
            <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
              <video src={value} className="w-full h-full object-cover" controls />
            </div>
          )}
          {onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "url")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Carregar
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-3">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept={accept || defaultAccept}
                className="hidden"
                id={`media-upload-${type}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // In a real app, this would upload to storage
                    const url = URL.createObjectURL(file);
                    onChange(url);
                  }
                }}
              />
              <label htmlFor={`media-upload-${type}`} className="cursor-pointer">
                <Icon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Clique para carregar ou arraste e solte
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {type === "image" ? "PNG, JPG até 5MB" : "MP4, WebM até 50MB"}
                </p>
              </label>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-3">
            <div className="flex gap-2">
              <Input
                placeholder={type === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button onClick={handleUrlSubmit}>Adicionar</Button>
            </div>
            {type === "video" && (
              <p className="text-xs text-muted-foreground mt-2">
                Suportamos YouTube, Vimeo e links diretos de vídeo
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}