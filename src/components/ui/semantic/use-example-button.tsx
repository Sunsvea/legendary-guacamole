import { Button } from '@/components/ui/button';
import { UI_TEXT } from '@/constants/ui-text';

interface UseExampleButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

export function UseExampleButton({ 
  loading = false, 
  disabled = false, 
  onClick,
  className
}: UseExampleButtonProps) {
  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={onClick}
      disabled={loading || disabled}
      className={className}
    >
      {UI_TEXT.USE_EXAMPLE}
    </Button>
  );
}