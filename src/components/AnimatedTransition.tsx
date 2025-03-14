
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  show,
  children,
  className,
  duration = 300,
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
    let timeoutId: NodeJS.Timeout;
    
    if (!show && shouldRender) {
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [show, shouldRender, duration]);

  return shouldRender ? (
    <div 
      className={cn(
        "transition-all duration-300 ease-in-out",
        show ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4",
        className
      )}
    >
      {children}
    </div>
  ) : null;
};

export default AnimatedTransition;
