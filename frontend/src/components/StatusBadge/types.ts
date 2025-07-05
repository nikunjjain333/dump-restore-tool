export interface StatusBadgeProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  size?: number;
  className?: string;
}
