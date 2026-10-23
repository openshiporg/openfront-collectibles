import type { OptionForEditor } from "../types/variant";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { TagInput } from "./TagInput";

export function OptionCard({ option, readOnly = false, onUpdate }: { option: OptionForEditor; readOnly?: boolean; onUpdate?: (option: OptionForEditor) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(option?.title || '');
  const [values, setValues] = useState(option?.values || []);

  // Update local state when option changes
  useEffect(() => {
    setTitle(option?.title || '');
    setValues(option?.values || []);
  }, [option]);

  const handleSave = () => {
    onUpdate?.({
      ...option,
      title,
      values,
    });
    setIsEditing(false);
  };

  // Update parent immediately when values change
  const handleValuesChange = (newValues: OptionForEditor['values']) => {
    setValues(newValues);
    onUpdate?.({
      ...option,
      title,
      values: newValues,
    });
  };

  return (
    <div className="space-y-3 rounded-xl bg-background p-4 ring-1 ring-border">
      <div className="flex flex-wrap justify-between items-center gap-2">
        {isEditing && !readOnly ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-48 h-8 text-sm"
            placeholder="Option name..."
          />
        ) : (
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-sm font-medium text-foreground">{option?.title || 'Untitled'}</h3>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {(option?.values || []).length} values
            </span>
          </div>
        )}
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3.5 max-sm:h-10"
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
          </div>
        )}
      </div>
      <TagInput
        placeholder={`${(option.title || 'option').toLowerCase()} values...`}
        value={values}
        onChange={!readOnly ? handleValuesChange : undefined}
        readOnly={readOnly}
        className="bg-background"
      />
    </div>
  );
}