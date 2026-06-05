"use client";

import styles from "./TankVisualization.module.css";

interface TankVisualizationProps {
  percentage: number; // 0 to 100
  shape: 'cylindrical' | 'rectangular';
  isPumpOn: boolean;
}

export default function TankVisualization({ percentage, shape, isPumpOn }: TankVisualizationProps) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  
  return (
    <div className={styles.container}>
      <div className={`${styles.tank} ${styles[shape]}`}>
        {/* Water layer */}
        <div 
          className={styles.water} 
          style={{ height: `${safePercentage}%` }}
        >
          {/* Waves */}
          <div className={styles.wave1}></div>
          <div className={styles.wave2}></div>
        </div>
        
        {/* Fill animation if pump is ON */}
        {isPumpOn && (
          <div className={styles.waterDrop}></div>
        )}
      </div>
      
      <div className={styles.label}>
        <span className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          {safePercentage.toFixed(1)}%
        </span>
        <span style={{ color: 'var(--text-muted)' }}>Full</span>
      </div>
    </div>
  );
}
