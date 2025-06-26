import { Button } from '@/components/ui/button';
import { UI_TEXT } from '@/constants/ui-text';

interface FindOptimalRouteButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

export function FindOptimalRouteButton({ 
  loading = false, 
  disabled = false, 
  onClick,
  type = 'submit',
  className = 'flex-1'
}: FindOptimalRouteButtonProps) {
  return (
    <Button 
      type={type}
      disabled={loading || disabled} 
      onClick={onClick}
      className={className}
    >
      {loading ? UI_TEXT.FINDING_ROUTE : UI_TEXT.FIND_OPTIMAL_ROUTE}
    </Button>
  );
}