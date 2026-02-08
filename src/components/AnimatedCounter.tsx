import { useCountUp } from '@/hooks/useCountUp';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix = '', className = '', duration = 1500 }: AnimatedCounterProps) {
  const { count, ref } = useCountUp(value, duration);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {count}{suffix}
    </span>
  );
}
