import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@portal-dos-interpretes/ui/components/dialog";

interface VideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  videoUrl: string;
}

function getEmbedUrl(url: string): string {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&autoplay=1`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  return url;
}

export function VideoModal({
  open,
  onOpenChange,
  title,
  videoUrl,
}: VideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full bg-black">
          {open && (
            <iframe
              src={getEmbedUrl(videoUrl)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
