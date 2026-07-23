import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function InteractiveLogo() {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [clickPulse, setClickPulse] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate rotation (-15 to 15 degrees)
    const rY = ((mouseX / width) - 0.5) * 30;
    const rX = ((mouseY / height) - 0.5) * -30;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleClick = () => {
    setClickPulse(true);
    setTimeout(() => setClickPulse(false), 600);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`interactive-logo-container ${isHovered ? 'hovered' : ''} ${clickPulse ? 'clicked' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      animate={{
        rotateX,
        rotateY,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
    >
      {/* Neon Cyber Backglow */}
      <div className="logo-glow-ring" />
      <div className="logo-glow-ring glow-purple" />

      {/* Main Interactive Logo Image */}
      <div className="logo-img-wrapper">
        <img
          src="/logo.png"
          alt="AI Frontier Club Logo"
          className="interactive-logo-img"
        />
      </div>

      {/* Floating Interactive Badge Label */}
      <div className="logo-interactive-badge">
        <span className="sparkle">✨</span> Department of AI & DS
      </div>
    </motion.div>
  );
}
