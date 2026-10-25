import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProfileSectionEditor } from "@/components/dashboard/profile/ProfileSectionEditor";
import { EditableList, TagList } from "@/components/dashboard/profile/EditableList";
import { MediaUploader } from "@/components/dashboard/profile/MediaUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Video, FileText, Play, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { VideoContent, Article, initialVideos, initialArticles } from '@/core/mocks/interpreterProfileMocks';

export default function InterpreterProfileContent() {
  const [videos, setVideos] = useState<VideoContent[]>(initialVideos);
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showArticleDialog, setShowArticleDialog] = useState(false);

  const handleSave = () => {
    toast.success("Conteúdos atualizados com sucesso!");
  };

  const saveVideo = () => {
    if (editingVideo) {
      if (videos.find((v) => v.id === editingVideo.id)) {
        setVideos(videos.map((v) => (v.id === editingVideo.id ? editingVideo : v)));
      } else {
        setVideos([...videos, editingVideo]);
      }
      setShowVideoDialog(false);
      setEditingVideo(null);
    }
  };

  const saveArticle = () => {
    if (editingArticle) {
      if (articles.find((a) => a.id === editingArticle.id)) {
        setArticles(articles.map((a) => (a.id === editingArticle.id ? editingArticle : a)));
      } else {
        setArticles([...articles, editingArticle]);
      }
      setShowArticleDialog(false);
      setEditingArticle(null);
    }
  };

  const videoTypeLabels = {
    apresentacao: "Apresentação",
    trabalho: "Exemplo de Trabalho",
    palestra: "Palestra",
    aula: "Aula",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conteúdos"
        description="Gerencie os seus vídeos e artigos"
        action={
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        }
      />

      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            Vídeos
          </TabsTrigger>
          <TabsTrigger value="articles" className="gap-2">
            <FileText className="h-4 w-4" />
            Artigos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <ProfileSectionEditor
            title="Os Meus Vídeos"
            description="Vídeos que demonstram o seu trabalho"
            publicNote="Exibido na aba 'Conteúdos' do seu perfil"
          >
            <EditableList
              items={videos}
              onAdd={() => {
                setEditingVideo({
                  id: Date.now().toString(),
                  title: "",
                  description: "",
                  url: "",
                  tags: [],
                  type: "apresentacao",
                });
                setShowVideoDialog(true);
              }}
              onEdit={(video) => {
                setEditingVideo(video);
                setShowVideoDialog(true);
              }}
              onDelete={(id) => setVideos(videos.filter((v) => v.id !== id))}
              addLabel="Adicionar Vídeo"
              emptyMessage="Nenhum vídeo adicionado"
              draggable
              renderItem={(video) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-primary" />
                    <span className="font-medium">{video.title}</span>
                    <Badge variant="outline">{videoTypeLabels[video.type]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                  {video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </ProfileSectionEditor>
        </TabsContent>

        <TabsContent value="articles">
          <ProfileSectionEditor
            title="Os Meus Artigos"
            description="Artigos e publicações"
            publicNote="Exibido na aba 'Conteúdos' do seu perfil"
          >
            <EditableList
              items={articles}
              onAdd={() => {
                setEditingArticle({
                  id: Date.now().toString(),
                  title: "",
                  content: "",
                  excerpt: "",
                  status: "draft",
                  createdAt: new Date().toISOString().split("T")[0],
                });
                setShowArticleDialog(true);
              }}
              onEdit={(article) => {
                setEditingArticle(article);
                setShowArticleDialog(true);
              }}
              onDelete={(id) => setArticles(articles.filter((a) => a.id !== id))}
              addLabel="Criar Artigo"
              emptyMessage="Nenhum artigo criado"
              renderItem={(article) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{article.title}</span>
                    <Badge
                      variant={article.status === "published" ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {article.status === "published" ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Publicado
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Rascunho
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(article.createdAt).toLocaleDateString("pt-PT")}
                  </p>
                </div>
              )}
            />
          </ProfileSectionEditor>
        </TabsContent>
      </Tabs>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVideo?.id && videos.find((v) => v.id === editingVideo.id)
                ? "Editar Vídeo"
                : "Novo Vídeo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={editingVideo?.title || ""}
                onChange={(e) =>
                  setEditingVideo((prev) => prev && { ...prev, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editingVideo?.description || ""}
                onChange={(e) =>
                  setEditingVideo((prev) => prev && { ...prev, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <MediaUploader
              type="video"
              label="Vídeo"
              value={editingVideo?.url}
              onChange={(url) =>
                setEditingVideo((prev) => prev && { ...prev, url })
              }
              onRemove={() =>
                setEditingVideo((prev) => prev && { ...prev, url: "" })
              }
            />
            <div className="space-y-2">
              <Label>Tipo de Vídeo</Label>
              <Select
                value={editingVideo?.type || "apresentacao"}
                onValueChange={(v) =>
                  setEditingVideo((prev) => prev && { ...prev, type: v as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apresentacao">Apresentação</SelectItem>
                  <SelectItem value="trabalho">Exemplo de Trabalho</SelectItem>
                  <SelectItem value="palestra">Palestra</SelectItem>
                  <SelectItem value="aula">Aula</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagList
                tags={editingVideo?.tags || []}
                onAdd={(tag) =>
                  setEditingVideo((prev) =>
                    prev && { ...prev, tags: [...(prev.tags || []), tag] }
                  )
                }
                onRemove={(tag) =>
                  setEditingVideo((prev) =>
                    prev && { ...prev, tags: prev.tags.filter((t) => t !== tag) }
                  )
                }
                placeholder="Adicionar tag..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVideoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveVideo}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingArticle?.id && articles.find((a) => a.id === editingArticle.id)
                ? "Editar Artigo"
                : "Novo Artigo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={editingArticle?.title || ""}
                onChange={(e) =>
                  setEditingArticle((prev) => prev && { ...prev, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Resumo</Label>
              <Textarea
                value={editingArticle?.excerpt || ""}
                onChange={(e) =>
                  setEditingArticle((prev) => prev && { ...prev, excerpt: e.target.value })
                }
                rows={2}
                placeholder="Breve resumo do artigo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={editingArticle?.content || ""}
                onChange={(e) =>
                  setEditingArticle((prev) => prev && { ...prev, content: e.target.value })
                }
                rows={8}
                placeholder="Escreva o seu artigo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={editingArticle?.status || "draft"}
                onValueChange={(v) =>
                  setEditingArticle((prev) => prev && { ...prev, status: v as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArticleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveArticle}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}