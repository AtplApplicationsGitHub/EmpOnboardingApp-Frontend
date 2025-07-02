import { useEffect, useState } from 'react';

// Hook for triggering animations on component mount
export const useAnimation = (delay: number = 0) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isVisible;
};

// Hook for intersection observer animations
export const useInViewAnimation = (threshold: number = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const [elementRef, setElementRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(elementRef);
        }
      },
      { threshold }
    );

    observer.observe(elementRef);

    return () => {
      if (elementRef) {
        observer.unobserve(elementRef);
      }
    };
  }, [elementRef, threshold]);

  return { isInView, ref: setElementRef };
};

// Animation utility functions
export const getStaggerDelay = (index: number, baseDelay: number = 100) => {
  return `${index * baseDelay}ms`;
};

export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  shimmer: 'animate-shimmer',
  hoverLift: 'hover-lift',
  hoverScale: 'hover-scale',
  hoverGlow: 'hover-glow',
  loadingSkeleton: 'loading-skeleton',
} as const;

export const staggerClasses = [
  'animate-stagger-1',
  'animate-stagger-2', 
  'animate-stagger-3',
  'animate-stagger-4',
  'animate-stagger-5',
] as const;
