"use client";

import React, { useEffect, useState } from "react";

interface CelebrationAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  taskTitle?: string;
}

interface Emoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
}

interface FireworkParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const celebrationEmojis = [
  "🎉",
  "🎊",
  "✨",
  "🌟",
  "💫",
  "🚀",
  "🎯",
  "👏",
  "🥳",
  "🎈",
];

const fireworkColors = [
  "#ff6b6b", // red
  "#4ecdc4", // teal
  "#45b7d1", // blue
  "#96ceb4", // green
  "#feca57", // yellow
  "#ff9ff3", // pink
  "#54a0ff", // bright blue
  "#ff6348", // orange
  "#ff7675", // light red
  "#a29bfe", // purple
];

export function CelebrationAnimation({
  isVisible,
  onComplete,
  taskTitle,
}: CelebrationAnimationProps) {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);
  const [showModal, setShowModal] = useState(false);

  const createFireworkBurst = (x: number, y: number) => {
    const particles: FireworkParticle[] = [];
    const particleCount = 20 + Math.random() * 10;
    const color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 2 + Math.random() * 4;
      particles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
    return particles;
  };

  useEffect(() => {
    if (!isVisible) return;

    // Zeige Modal
    setShowModal(true);

    // Erstelle Emojis
    const newEmojis: Emoji[] = [];
    for (let i = 0; i < 12; i++) {
      newEmojis.push({
        id: i,
        emoji:
          celebrationEmojis[
            Math.floor(Math.random() * celebrationEmojis.length)
          ],
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 50,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 8 - 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        scale: 0.8 + Math.random() * 0.4,
        opacity: 1,
      });
    }
    setEmojis(newEmojis);

    // Erstelle initial Feuerwerks-Explosionen
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const x = 100 + Math.random() * (window.innerWidth - 200);
        const y = 100 + Math.random() * 200;
        const newParticles = createFireworkBurst(x, y);
        setFireworks(prev => [...prev, ...newParticles]);
      }, i * 400);
    }

    // Animation
    let animationId: number;
    const animate = () => {
      // Update Emojis
      setEmojis((prevEmojis) =>
        prevEmojis
          .map((emoji) => ({
            ...emoji,
            x: emoji.x + emoji.vx,
            y: emoji.y + emoji.vy,
            vy: emoji.vy + 0.3, // Gravity
            rotation: emoji.rotation + emoji.rotationSpeed,
            opacity: emoji.y > window.innerHeight / 2 ? 
              Math.max(0, emoji.opacity - 0.02) : emoji.opacity,
          }))
          .filter((emoji) => emoji.y < window.innerHeight + 100 && emoji.opacity > 0)
      );

      // Update Fireworks
      setFireworks((prevFireworks) =>
        prevFireworks
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.98, // Air resistance
            vy: particle.vy * 0.98 + 0.1, // Gravity
            life: particle.life - 0.02,
          }))
          .filter((particle) => particle.life > 0)
      );

      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Zusätzliche Feuerwerks-Bursts während der Animation
    const additionalBursts = setTimeout(() => {
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          const x = 150 + Math.random() * (window.innerWidth - 300);
          const y = 80 + Math.random() * 150;
          const newParticles = createFireworkBurst(x, y);
          setFireworks(prev => [...prev, ...newParticles]);
        }, i * 600);
      }
    }, 1500);

    // Cleanup nach 3 Sekunden
    const timer = setTimeout(() => {
      cancelAnimationFrame(animationId);
      setEmojis([]);
      setFireworks([]);
      setShowModal(false);
      onComplete();
    }, 3000);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(timer);
      clearTimeout(additionalBursts);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      {/* Emoji Animation Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {emojis.map((emoji) => (
          <div
            key={emoji.id}
            className="absolute text-2xl transition-transform duration-100"
            style={{
              left: `${emoji.x}px`,
              top: `${emoji.y}px`,
              transform: `rotate(${emoji.rotation}deg)`,
            }}
          >
            {emoji.emoji}
          </div>
        ))}
        
        {/* Fireworks Particles */}
        {fireworks.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x - particle.size / 2}px`,
              top: `${particle.y - particle.size / 2}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 pointer-events-auto">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-in zoom-in-95 duration-300">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Glückwunsch!
            </h2>
            <p className="text-gray-600 mb-4">
              {taskTitle ? (
                <>
                  Du hast &ldquo;
                  <span className="font-medium">{taskTitle}</span>&rdquo;
                  erfolgreich abgeschlossen!
                </>
              ) : (
                "Aufgabe erfolgreich abgeschlossen!"
              )}
            </p>
            <div className="flex justify-center space-x-2 text-2xl">
              <span className="animate-bounce">🌟</span>
              <span className="animate-bounce delay-100">✨</span>
              <span className="animate-bounce delay-200">🎯</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
