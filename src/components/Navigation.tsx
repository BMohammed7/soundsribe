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
      <div className="w-full max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-center gap-1 sm:gap-3 max-w-lg mx-auto">
          <Button
            variant={currentPage === 'captions' ? 'default' : 'ghost'}
            onClick={() => onPageChange('captions')}
            className={`flex-1 gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm min-h-[2.5rem] sm:min-h-[2.75rem] ${
              currentPage === 'captions' 
                ? 'gradient-primary text-primary-foreground shadow-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="hidden xs:inline">Live Captions</span>
            <span className="xs:hidden">Live</span>
          </Button>
          
          <Button
            variant={currentPage === 'notes' ? 'default' : 'ghost'}
            onClick={() => onPageChange('notes')}
            className={`flex-1 gap-1 sm:gap-2 relative transition-all duration-200 text-xs sm:text-sm min-h-[2.5rem] sm:min-h-[2.75rem] ${
              currentPage === 'notes' 
                ? 'gradient-primary text-primary-foreground shadow-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span>Notes</span>
            {notesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-success text-success-foreground text-[0.625rem] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center min-w-[1rem] sm:min-w-[1.25rem]">
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