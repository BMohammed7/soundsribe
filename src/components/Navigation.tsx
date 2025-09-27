import { Button } from "@/components/ui/button";
import { Mic, FileText } from "lucide-react";

interface NavigationProps {
  currentPage: 'captions' | 'notes';
  onPageChange: (page: 'captions' | 'notes') => void;
  notesCount: number;
}

const Navigation = ({ currentPage, onPageChange, notesCount }: NavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-border shadow-strong z-50">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-around gap-4">
          <Button
            variant={currentPage === 'captions' ? 'default' : 'ghost'}
            onClick={() => onPageChange('captions')}
            className={`flex-1 gap-2 transition-all duration-200 ${
              currentPage === 'captions' 
                ? 'gradient-primary text-primary-foreground shadow-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic className="h-4 w-4" />
            Live Captions
          </Button>
          
          <Button
            variant={currentPage === 'notes' ? 'default' : 'ghost'}
            onClick={() => onPageChange('notes')}
            className={`flex-1 gap-2 relative transition-all duration-200 ${
              currentPage === 'notes' 
                ? 'gradient-primary text-primary-foreground shadow-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            Notes
            {notesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-success text-success-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notesCount > 99 ? '99+' : notesCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;