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

export function CelebrationAnimation({
  isVisible,
  onComplete,
  taskTitle,
}: CelebrationAnimationProps) {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Zeige Modal
    setShowModal(true);

    // Erstelle Emojis
    const newEmojis: Emoji[] = [];
    for (let i = 0; i < 15; i++) {
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
      });
    }
    setEmojis(newEmojis);

    // Animation
    let animationId: number;
    const animate = () => {
      setEmojis((prevEmojis) =>
        prevEmojis
          .map((emoji) => ({
            ...emoji,
            x: emoji.x + emoji.vx,
            y: emoji.y + emoji.vy,
            vy: emoji.vy + 0.3, // Gravity
            rotation: emoji.rotation + emoji.rotationSpeed,
          }))
          .filter((emoji) => emoji.y < window.innerHeight + 100)
      );

      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup nach 3 Sekunden
    const timer = setTimeout(() => {
      cancelAnimationFrame(animationId);
      setEmojis([]);
      setShowModal(false);
      onComplete();
    }, 3000);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(timer);
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
