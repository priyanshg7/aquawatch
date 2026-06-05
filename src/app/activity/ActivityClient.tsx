"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, Activity, Clock, Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";
import styles from "./Activity.module.css";

interface PumpEvent {
  _id: string;
  startTime: string;
  stopTime: string;
  durationSeconds: number;
  volumeFilled: number;
  startVolume: number;
  stopVolume: number;
  status: string;
  anomaly?: string;
  trigger: string;
  result: string;
}

// Dummy Data Generator
const generateDemoEvents = () => {
  const events: PumpEvent[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 30));
    d.setHours(Math.floor(Math.random() * 24));
    d.setMinutes(Math.floor(Math.random() * 60));
    
    const isManual = Math.random() > 0.8;
    const isAborted = Math.random() > 0.9;
    const startVol = Math.floor(Math.random() * 200);
    const fillVol = isAborted ? Math.floor(Math.random() * 100) : 300 + Math.floor(Math.random() * 500);
    const durSecs = isAborted ? 300 + Math.floor(Math.random() * 600) : 2700 + Math.floor(Math.random() * 900);
    
    events.push({
      _id: `pump-event-0${i + 10}`,
      startTime: d.toISOString(),
      stopTime: new Date(d.getTime() + durSecs * 1000).toISOString(),
      durationSeconds: durSecs,
      startVolume: startVol,
      stopVolume: startVol + fillVol,
      volumeFilled: fillVol,
      status: isAborted ? 'aborted' : 'completed',
      trigger: isManual ? 'Manual' : 'Auto',
      result: isAborted ? 'Max Runtime' : 'Tank Full'
    });
  }
  return events;
};

export default function ActivityClient({ userId }: { userId: string }) {
  const [events, setEvents] = useState<PumpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [triggerFilter, setTriggerFilter] = useState('All'); // All, Auto, Manual
  const [statusFilter, setStatusFilter] = useState('All'); // All, Completed, Aborted

  useEffect(() => {
    // In a real app, fetch from /api/stats
    setEvents(generateDemoEvents());
    setLoading(false);
  }, []);

  const daysInMonth = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedDate]);

  const startDayOfWeek = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  const eventsOnSelectedDate = useMemo(() => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    return events.filter(e => e.startTime.startsWith(dateStr));
  }, [events, selectedDate]);

  const filteredEvents = useMemo(() => {
    let result = eventsOnSelectedDate;
    if (triggerFilter !== 'All') result = result.filter(e => e.trigger === triggerFilter);
    if (statusFilter !== 'All') result = result.filter(e => e.status === statusFilter.toLowerCase());
    return result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [eventsOnSelectedDate, triggerFilter, statusFilter]);

  const summary = useMemo(() => {
    const completed = eventsOnSelectedDate.filter(e => e.status === 'completed').length;
    const aborted = eventsOnSelectedDate.filter(e => e.status === 'aborted').length;
    const volume = eventsOnSelectedDate.reduce((sum, e) => sum + e.volumeFilled, 0);
    const runtime = eventsOnSelectedDate.reduce((sum, e) => sum + e.durationSeconds, 0);
    return { completed, aborted, volume, runtime };
  }, [eventsOnSelectedDate]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const hasEventsOnDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.some(e => e.startTime.startsWith(dateStr));
  };

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    
    const headers = ["Event ID", "Start Time", "Stop Time", "Duration (sec)", "Trigger", "Status", "Volume Filled (L)", "Start Level (%)", "Stop Level (%)", "Result"];
    const rows = filteredEvents.map(e => {
      const startLvl = Math.round((e.startVolume / 1000) * 100);
      const stopLvl = Math.round((e.stopVolume / 1000) * 100);
      return [
        e._id,
        new Date(e.startTime).toLocaleString(),
        new Date(e.stopTime).toLocaleString(),
        e.durationSeconds,
        e.trigger,
        e.status,
        e.volumeFilled,
        startLvl,
        stopLvl,
        e.result || ''
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PumpActivity_${selectedDate.toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Loading Activity Log...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Pump Activity Log</h1>
          <p className={styles.pageSubtitle}>Full audit trail of every pump start/stop event with sensor readings</p>
        </div>
        <button className={styles.exportBtn} onClick={handleExportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className={styles.mainGrid}>
        
        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          
          {/* Calendar Widget */}
          <div className={`premium-card ${styles.calendarCard}`}>
            <div className={styles.calendarHeader}>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)'}} 
                      onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}>&lt;</button>
              <span>{selectedDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)'}}
                      onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}>&gt;</button>
            </div>
            
            <div className={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className={styles.dayName}>{d}</div>)}
              {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className={styles.dayCell + ' ' + styles.empty}></div>)}
              
              {daysInMonth.map(date => {
                const isSelected = date.getDate() === selectedDate.getDate();
                const hasEvt = hasEventsOnDate(date);
                return (
                  <div 
                    key={date.toISOString()} 
                    className={`${styles.dayCell} ${isSelected ? styles.selected : ''} ${hasEvt ? styles.hasEvents : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
            
            <div style={{display:'flex', gap:'16px', marginTop:'16px', fontSize:'0.75rem', color:'var(--text-secondary)'}}>
              <span style={{display:'flex', alignItems:'center', gap:'4px'}}>
                <span style={{width:'6px', height:'6px', background:'var(--primary-color)', borderRadius:'50%'}}></span> Has events
              </span>
            </div>
          </div>

          {/* Selected Date Summary */}
          <div className={`premium-card ${styles.summaryCard}`}>
            <h4 style={{margin:'0 0 16px 0', fontSize:'0.9rem', color:'var(--text-muted)', textTransform:'uppercase'}}>Selected Date</h4>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total events</span>
              <span className={styles.summaryVal}>{eventsOnSelectedDate.length}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Completed</span>
              <span className={`${styles.summaryVal} ${styles.highlightVal}`} style={{color:'#10b981'}}>{summary.completed}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Aborted</span>
              <span className={`${styles.summaryVal} ${styles.highlightVal}`} style={{color:'#f59e0b'}}>{summary.aborted}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total volume</span>
              <span className={`${styles.summaryVal} ${styles.highlightVal}`}>{summary.volume} L</span>
            </div>
          </div>

          {/* Device Info */}
          <div className={`premium-card ${styles.deviceCard}`}>
            <h4 style={{margin:'0 0 16px 0', fontSize:'0.9rem', color:'var(--text-muted)', textTransform:'uppercase'}}>Device</h4>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>ID</span>
              <span className={styles.summaryVal}>ESP-123456</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Tank</span>
              <span className={styles.summaryVal}>Cylindrical</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Capacity</span>
              <span className={styles.summaryVal}>1000.0 L</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Low threshold</span>
              <span className={styles.summaryVal}>5%</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Full threshold</span>
              <span className={styles.summaryVal}>95%</span>
            </div>
          </div>

        </div>

        {/* MAIN CONTENT */}
        <div className={styles.mainContent}>
          
          {/* Daily Summary Headers */}
          <div>
            <div className={styles.dailySummaryHeader}>
              <h2 style={{margin:0, fontSize:'1.4rem'}}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
              <div style={{display:'flex', gap:'8px'}}>
                {summary.aborted > 0 && <span style={{display:'flex', alignItems:'center', gap:'4px', background:'rgba(245, 158, 11, 0.1)', color:'#f59e0b', padding:'4px 12px', borderRadius:'12px', fontSize:'0.8rem', fontWeight:600}}><AlertTriangle size={14} /> {summary.aborted} aborted</span>}
                {summary.completed > 0 && <span style={{display:'flex', alignItems:'center', gap:'4px', background:'rgba(16, 185, 129, 0.1)', color:'#10b981', padding:'4px 12px', borderRadius:'12px', fontSize:'0.8rem', fontWeight:600}}><CheckCircle2 size={14} /> {summary.completed} completed</span>}
              </div>
            </div>
            
            <div className={styles.dailyStatsGrid}>
              <div className={styles.dailyStatBox}>
                <div className={styles.dailyStatLabel}><Activity size={14}/> Cycles</div>
                <div className={styles.dailyStatVal}>{eventsOnSelectedDate.length}</div>
              </div>
              <div className={styles.dailyStatBox}>
                <div className={styles.dailyStatLabel}><Droplets size={14}/> Volume</div>
                <div className={styles.dailyStatVal}>{summary.volume}</div>
                <div className={styles.dailyStatSub}>liters</div>
              </div>
              <div className={styles.dailyStatBox}>
                <div className={styles.dailyStatLabel}><Clock size={14}/> Runtime</div>
                <div className={styles.dailyStatVal}>{formatDuration(summary.runtime)}</div>
              </div>
            </div>
          </div>

          {/* Events Table Section */}
          <div className={`premium-card ${styles.eventsCard}`} style={{padding:0}}>
            <div style={{padding:'20px 24px', borderBottom:'1px solid var(--border-color)'}}>
              <div className={styles.filters}>
                <span style={{color:'var(--text-secondary)', fontSize:'0.9rem', marginRight:'8px'}}>Filter:</span>
                <div className={styles.filterGroup}>
                  <button className={`${styles.filterBtn} ${triggerFilter === 'All' ? styles.active : ''}`} onClick={() => setTriggerFilter('All')}>All Triggers</button>
                  <button className={`${styles.filterBtn} ${triggerFilter === 'Auto' ? styles.active : ''}`} onClick={() => setTriggerFilter('Auto')}>Auto</button>
                  <button className={`${styles.filterBtn} ${triggerFilter === 'Manual' ? styles.active : ''}`} onClick={() => setTriggerFilter('Manual')}>Manual</button>
                </div>
                <span style={{color:'var(--border-color)'}}>|</span>
                <div className={styles.filterGroup}>
                  <button className={`${styles.filterBtn} ${statusFilter === 'All' ? styles.active : ''}`} onClick={() => setStatusFilter('All')}>All Status</button>
                  <button className={`${styles.filterBtn} ${statusFilter === 'Completed' ? styles.active : ''}`} onClick={() => setStatusFilter('Completed')}>Completed</button>
                  <button className={`${styles.filterBtn} ${statusFilter === 'Aborted' ? styles.active : ''}`} onClick={() => setStatusFilter('Aborted')}>Aborted</button>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.eventsTable}>
                  <thead>
                    <tr>
                      <th>Event ID</th>
                      <th>Start</th>
                      <th>Stop</th>
                      <th>Duration</th>
                      <th>Trigger</th>
                      <th>Level Start</th>
                      <th>Level End</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => {
                      const startLvl = Math.round((event.startVolume / 1000) * 100);
                      const stopLvl = Math.round((event.stopVolume / 1000) * 100);
                      return (
                        <tr key={event._id}>
                          <td style={{fontFamily:'monospace', color:'var(--text-muted)'}}>{event._id}</td>
                          <td style={{fontWeight:600}}>{new Date(event.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}</td>
                          <td style={{color:'var(--text-secondary)'}}>{new Date(event.stopTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}</td>
                          <td>{Math.round(event.durationSeconds / 60)}m</td>
                          <td>
                            <span className={`${styles.badge} ${event.trigger === 'Auto' ? styles.badgeAuto : styles.badgeManual}`}>
                              {event.trigger}
                            </span>
                          </td>
                          <td>
                            <div className={styles.levelBarContainer}>
                              <span style={{width:'30px', textAlign:'right'}}>{startLvl}%</span>
                              <div className={styles.levelBarTrack}>
                                <div className={styles.levelBarFill} style={{width:`${startLvl}%`, background:'#ef4444'}}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.levelBarContainer}>
                              <span style={{width:'30px', textAlign:'right'}}>{stopLvl}%</span>
                              <div className={styles.levelBarTrack}>
                                <div className={styles.levelBarFill} style={{width:`${stopLvl}%`, background: event.status === 'aborted' ? '#f59e0b' : '#10b981'}}></div>
                              </div>
                            </div>
                          </td>
                          <td style={{fontWeight:600, color:'var(--primary-color)'}}>{event.volumeFilled} L</td>
                        </tr>
                      )
                    })}
                    {filteredEvents.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>No events found for selected filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{padding:'16px 24px', display:'flex', justifyContent:'space-between', color:'var(--text-muted)', fontSize:'0.85rem'}}>
              <span>{filteredEvents.length} events on this date</span>
              <span>Total: {summary.volume} L pumped</span>
            </div>
          </div>

          {/* 24-Hour Timeline */}
          <div className={`premium-card ${styles.timelineCard}`}>
            <h3 style={{margin:'0 0 8px 0', fontSize:'1.1rem'}}>24-Hour Timeline</h3>
            <div className={styles.timelineBar}>
              {eventsOnSelectedDate.map(event => {
                const s = new Date(event.startTime);
                const startPct = ((s.getHours() * 3600 + s.getMinutes() * 60 + s.getSeconds()) / 86400) * 100;
                const widthPct = (event.durationSeconds / 86400) * 100;
                return (
                  <div 
                    key={event._id}
                    className={`${styles.timelineSegment} ${event.status === 'aborted' ? styles.aborted : styles.completed}`}
                    style={{ left: `${startPct}%`, width: `${Math.max(0.5, widthPct)}%` }}
                    title={`${event.status} (${formatDuration(event.durationSeconds)})`}
                  ></div>
                );
              })}
            </div>
            <div className={styles.timelineLabels}>
              <span>00:00</span>
              <span>03:00</span>
              <span>06:00</span>
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
              <span>21:00</span>
              <span>24:00</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'24px', fontSize:'0.8rem', color:'var(--text-muted)'}}>
              <div style={{display:'flex', gap:'16px'}}>
                <span style={{display:'flex', alignItems:'center', gap:'6px'}}><span style={{width:'10px', height:'10px', background:'var(--primary-color)', borderRadius:'2px'}}></span> Completed cycle</span>
                <span style={{display:'flex', alignItems:'center', gap:'6px'}}><span style={{width:'10px', height:'10px', background:'#f59e0b', borderRadius:'2px'}}></span> Aborted cycle</span>
              </div>
              <span>Hover bars for details</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
