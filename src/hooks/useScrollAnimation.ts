import { useState, useEffect, useCallback } from 'react';

export const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Scroll handler
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all animated elements after component mounts
    setTimeout(() => {
      document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const observeElements = useCallback(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
      observer.observe(el);
    });

    return observer;
  }, []);

  return { scrollY, isLoading, observeElements };
};