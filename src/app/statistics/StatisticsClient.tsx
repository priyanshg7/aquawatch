"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { Calendar, Activity, Clock, Droplets, Info, ArrowRight } from "lucide-react";
import styles from "./Statistics.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

interface PumpEvent {
  _id: string;
  startTime: string;
  stopTime: string;
  durationSeconds: number;
  volumeFilled: number;
  startVolume?: number;
  stopVolume?: number;
  status: string;
  anomaly?: string;
  trigger?: string;
}

// Dummy Data Generator for Demo Mode
const DEMO_EVENTS: PumpEvent[] = Array.from({ length: 40 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 14)); // Spread over 14 days
  d.setHours(Math.floor(Math.random() * 24));
  d.setMinutes(Math.floor(Math.random() * 60));
  
  const isManual = Math.random() > 0.8;
  const startVol = Math.floor(Math.random() * 200);
  const fillVol = 300 + Math.floor(Math.random() * 500);
  
  return {
    _id: `demo-${i}`,
    startTime: d.toISOString(),
    stopTime: new Date(d.getTime() + (45 * 60000) + Math.random() * 15 * 60000).toISOString(),
    durationSeconds: 2700 + Math.floor(Math.random() * 900),
    startVolume: startVol,
    stopVolume: startVol + fillVol,
    volumeFilled: fillVol,
    status: isManual ? 'completed' : 'completed',
    trigger: isManual ? 'Manual' : 'Auto',
    result: isManual ? 'Manual Stop' : (Math.random() > 0.9 ? 'Max Runtime' : 'Tank Full')
  } as any;
});

export default function StatisticsClient({ userId }: { userId: string }) {
  const [events, setEvents] = useState<PumpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          // Normalize real data slightly if missing fields
          const realEvents = data.events.map((e: any) => ({
            ...e,
            trigger: e.trigger || 'Auto',
            result: e.anomaly || (e.status === 'completed' ? 'Tank Full' : 'Unknown'),
            startVolume: e.startVolume || 0,
            stopVolume: e.stopVolume || (e.startVolume || 0) + (e.volumeFilled || 0)
          }));
          setEvents(realEvents);
          setIsDemoMode(false);
        } else {
          setEvents(DEMO_EVENTS);
          setIsDemoMode(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const last14Days = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();
  }, []);

  const last7Days = useMemo(() => {
    return last14Days.slice(-7);
  }, [last14Days]);

  // Original Weekly Water Overview (Bar Chart)
  const volumeChartData = useMemo(() => {
    const volumes = last7Days.map(date => {
      return events
        .filter(e => e.startTime.startsWith(date))
        .reduce((sum, e) => sum + (e.volumeFilled || 0), 0);
    });

    return {
      labels: last7Days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })),
      datasets: [
        {
          label: "Water Volume Filled (Liters)",
          data: volumes,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "#2563eb",
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    };
  }, [events, last7Days]);

  // Pump Cycles Per Day (Line Chart Data)
  const cyclesChartData = useMemo(() => {
    const cycles = last14Days.map(date => {
      return events.filter(e => e.startTime.startsWith(date)).length;
    });

    const avg = cycles.reduce((a, b) => a + b, 0) / cycles.length;

    return {
      labels: last14Days.map(d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: "Cycles",
          data: cycles,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          pointBackgroundColor: "#10b981",
          tension: 0.4,
          fill: true,
        },
        {
          label: `Avg (${avg.toFixed(1)})`,
          data: Array(last14Days.length).fill(avg),
          borderColor: "#f59e0b",
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ],
    };
  }, [events, last14Days]);

  // Peak Usage Heatmap Data
  const heatmapData = useMemo(() => {
    const grid = Array(24).fill(0).map(() => Array(7).fill(0)); // 24 hours, 7 days
    let maxIntensity = 1;

    events.forEach(e => {
      const d = new Date(e.startTime);
      const hour = d.getHours();
      const day = d.getDay(); // 0 = Sun, 1 = Mon, etc.
      grid[hour][day] += 1;
      if (grid[hour][day] > maxIntensity) {
        maxIntensity = grid[hour][day];
      }
    });

    return { grid, maxIntensity };
  }, [events]);

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const hoursOfDay = Array.from({length: 24}).map((_, i) => `${i.toString().padStart(2, '0')}:00`);

  // Original Selected Date Events
  const selectedDateEvents = useMemo(() => {
    return events.filter(e => e.startTime.startsWith(selectedDate));
  }, [events, selectedDate]);

  // Recent Events Sorting
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 10);
  }, [events]);

  // Quick Stats Calculation
  const last7DaysEvents = events.filter(e => {
    const dateStr = e.startTime.split("T")[0];
    return last7Days.includes(dateStr);
  });
  
  const totalVolume7Days = last7DaysEvents.reduce((sum, e) => sum + (e.volumeFilled || 0), 0);
  const totalCycles7Days = last7DaysEvents.length;
  const avgDuration = totalCycles7Days > 0 
    ? last7DaysEvents.reduce((sum, e) => sum + (e.durationSeconds || 0), 0) / totalCycles7Days 
    : 0;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatLevel = (vol: number) => {
    // Assuming tank is 1000L max for demo purposes
    return `${Math.min(100, Math.round((vol / 1000) * 100))}%`;
  };

  if (loading) return <div className={styles.loadingState}>Loading Analytics...</div>;

  return (
    <div className={styles.container} style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {isDemoMode && (
        <div className={styles.demoBanner}>
          <Info size={18} />
          <span>No historical data found. Displaying demo statistics.</span>
        </div>
      )}

      <h1 className={styles.pageTitle} style={{ marginBottom: '24px' }}>Analytics & Statistics</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Quick Stats Row */}
        <div className={styles.quickStatsGrid}>
          <div className={`premium-card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Droplets size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Volume (7 Days)</span>
              <span className={styles.statValue}>{Math.round(totalVolume7Days)} L</span>
            </div>
          </div>
          <div className={`premium-card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Activity size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Pump Cycles (7 Days)</span>
              <span className={styles.statValue}>{totalCycles7Days}</span>
            </div>
          </div>
          <div className={`premium-card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Avg Fill Duration</span>
              <span className={styles.statValue}>{Math.round(avgDuration / 60)} mins</span>
            </div>
          </div>
        </div>
        
        {/* Top Charts Row: Bar Chart and Line Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
          {/* Weekly Water Overview (Original Bar Chart) */}
          <div className={`premium-card ${styles.chartCard}`}>
            <h3 className={styles.cardHeader}>Weekly Water Overview</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Total volume pumped per day (Liters)</p>
            <div style={{ height: '260px', width: '100%' }}>
              <Bar 
                data={volumeChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                  } 
                }} 
              />
            </div>
          </div>

          {/* Pump Cycles Line Chart (New) */}
          <div className="premium-card" style={{ padding: '24px', position: 'relative' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>Pump Cycles Trend</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Number of fill operations triggered (Last 14 Days)</p>
            <div style={{ height: '260px' }}>
              <Line 
                data={cyclesChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', align: 'end', labels: { boxWidth: 12, font: { size: 12 } } }
                  },
                  scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                  } 
                }} 
              />
            </div>
          </div>
        </div>

        {/* Middle Row: Event Calendar and Peak Usage Heatmap */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Original Event Calendar */}
          <div className={`premium-card ${styles.calendarCard}`}>
            <div className={styles.calendarHeader}>
              <h3 className={styles.cardHeader}><Calendar size={20} className="text-gradient" /> Event Calendar</h3>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.datePicker}
              />
            </div>
            
            <div className={styles.eventsList}>
              {selectedDateEvents.length === 0 ? (
                <div className={styles.noEvents}>
                  <Calendar size={32} color="var(--border-color)" />
                  <p>No pump activity found on this date.</p>
                </div>
              ) : (
                selectedDateEvents.map(event => (
                  <div key={event._id} className={styles.eventItem}>
                    <div className={styles.eventRow}>
                      <Activity size={18} color="var(--success)" />
                      <span>Started: {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={styles.eventDetails}>
                      <span className={styles.badge}><Clock size={14} /> {Math.round(event.durationSeconds / 60)} mins</span>
                      <span className={styles.badge}><Droplets size={14} /> {Math.round(event.volumeFilled)} L</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Peak Usage Heatmap (New) */}
          <div className="premium-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>Peak Usage Heatmap</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pump activation intensity by hour and day</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Low</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#e0f2fe', borderRadius: '2px' }}></div>
                  <div style={{ width: '12px', height: '12px', background: '#7dd3fc', borderRadius: '2px' }}></div>
                  <div style={{ width: '12px', height: '12px', background: '#38bdf8', borderRadius: '2px' }}></div>
                  <div style={{ width: '12px', height: '12px', background: '#0284c7', borderRadius: '2px' }}></div>
                </div>
                <span>High</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(7, 1fr)', gap: '2px', fontSize: '0.7rem' }}>
              <div style={{ height: '20px' }}></div> {/* Empty corner */}
              {daysOfWeek.map(day => (
                <div key={day} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>{day}</div>
              ))}
              
              {hoursOfDay.filter((_, i) => i % 2 === 0).map((hour, i) => {
                const actualHourIndex = i * 2;
                return (
                  <div key={hour} style={{ display: 'contents' }}>
                    <div style={{ textAlign: 'right', paddingRight: '8px', color: 'var(--text-secondary)', alignSelf: 'center', transform: 'translateY(-50%)', position: 'relative', top: '10px' }}>
                      {hour}
                    </div>
                    {daysOfWeek.map((_, dayIndex) => {
                      const intensity1 = heatmapData.grid[actualHourIndex][dayIndex];
                      const intensity2 = heatmapData.grid[actualHourIndex + 1]?.[dayIndex] || 0;
                      const avgIntensity = (intensity1 + intensity2) / 2;
                      const opacity = avgIntensity === 0 ? 0.05 : 0.2 + (0.8 * (avgIntensity / heatmapData.maxIntensity));
                      
                      return (
                        <div 
                          key={`${hour}-${dayIndex}`} 
                          title={`${daysOfWeek[dayIndex]} ${hour}: ${intensity1 + intensity2} events`}
                          style={{ 
                            background: avgIntensity === 0 ? 'rgba(0,0,0,0.03)' : `rgba(2, 132, 199, ${opacity})`, 
                            height: '24px', 
                            borderRadius: '2px',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        ></div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Events Table (New) */}
        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>RECENT PUMP EVENTS</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Date / Time</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Trigger</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Level &Delta;</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Volume</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Duration</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map(event => {
                  const d = new Date(event.startTime);
                  const isAuto = event.trigger === 'Auto' || !event.trigger;
                  const resultStr = (event as any).result || 'Tank Full';
                  
                  let resultColor = '#10b981'; // Green
                  if (resultStr === 'Max Runtime') resultColor = '#f59e0b'; // Orange
                  if (resultStr === 'Manual Stop') resultColor = '#3b82f6'; // Blue
                  if (resultStr === 'Failed') resultColor = '#ef4444'; // Red

                  return (
                    <tr key={event._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className={styles.tableRow}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500,
                          background: isAuto ? 'rgba(0,0,0,0.05)' : 'rgba(59, 130, 246, 0.1)',
                          color: isAuto ? 'var(--text-secondary)' : '#3b82f6',
                          border: `1px solid ${isAuto ? 'rgba(0,0,0,0.1)' : 'rgba(59, 130, 246, 0.2)'}`
                        }}>
                          {isAuto ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-main)' }}>
                        {formatLevel(event.startVolume || 0)} <ArrowRight size={12} style={{ display: 'inline', margin: '0 4px', color: 'var(--text-secondary)' }} /> {formatLevel(event.stopVolume || 0)}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>
                        {Math.round(event.volumeFilled)} L
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {formatDuration(event.durationSeconds || 0)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500,
                          background: `${resultColor}15`, color: resultColor, border: `1px solid ${resultColor}40`
                        }}>
                          {resultStr}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
