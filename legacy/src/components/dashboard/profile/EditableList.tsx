import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EditableListItem {
  id: string;
  [key: string]: any;
}

interface EditableListProps<T extends EditableListItem> {
  items: T[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onReorder?: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  addLabel?: string;
  emptyMessage?: string;
  draggable?: boolean;
}

export function EditableList<T extends EditableListItem>({
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  renderItem,
  addLabel = "Adicionar",
  emptyMessage = "Nenhum item adicionado",
  draggable = false,
}: EditableListProps<T>) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="group">
              <CardContent className="p-3 flex items-start gap-3">
                {draggable && (
                  <button className="mt-1 cursor-grab opacity-50 hover:opacity-100">
                    <GripVertical className="h-4 w-4" />
                  </button>
                )}
                <div className="flex-1">{renderItem(item)}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {onAdd && (
        <Button variant="outline" className="w-full" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}

interface TagListProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}

export function TagList({ tags, onAdd, onRemove, placeholder = "Adicionar..." }: TagListProps) {
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onAdd(newTag.trim());
      setNewTag("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button onClick={() => onRemove(tag)} className="hover:text-destructive ml-1">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
        />
        <Button size="icon" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}