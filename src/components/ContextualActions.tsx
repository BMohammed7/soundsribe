import { Button } from "@/components/ui/button";
import { Save, Languages, FileText } from "lucide-react";

interface ContextualActionsProps {
  action: 'save' | 'translate' | 'summarize';
  onSave: () => void;
  onTranslate: () => void;
  onSummarize: () => void;
}

export const ContextualActions = ({ 
  action, 
  onSave, 
  onTranslate, 
  onSummarize 
}: ContextualActionsProps) => {
  const getActionButton = () => {
    switch (action) {
      case 'save':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            className="bg-success/10 border-success/30 text-success hover:bg-success/20"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Action Item
          </Button>
        );
      case 'translate':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={onTranslate}
            className="bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
          >
            <Languages className="h-4 w-4 mr-2" />
            Translate
          </Button>
        );
      case 'summarize':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={onSummarize}
            className="bg-warning/10 border-warning/30 text-warning hover:bg-warning/20"
          >
            <FileText className="h-4 w-4 mr-2" />
            Summarize
          </Button>
        );
    }
  };

  return (
    <div className="flex justify-start mt-2 ml-4">
      {getActionButton()}
    </div>
  );
};