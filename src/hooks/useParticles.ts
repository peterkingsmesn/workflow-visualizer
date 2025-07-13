import { useEffect } from 'react';

export const useParticles = (containerId: string = 'particles', particleCount: number = 50) => {
  useEffect(() => {
    const createParticles = () => {
      const particlesContainer = document.getElementById(containerId);
      if (!particlesContainer) return;
      
      // Clear existing particles
      particlesContainer.innerHTML = '';
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
      }
    };

    createParticles();

    return () => {
      const particlesContainer = document.getElementById(containerId);
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
      }
    };
  }, [containerId, particleCount]);
};