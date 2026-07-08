'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize dates from search params or default
  const paramStart = searchParams.get('start') || '';
  const paramEnd = searchParams.get('end') || '';

  // Internal states
  const [startDate, setStartDate] = useState(paramStart ? paramStart.split('T')[0] : '');
  const [startTime, setStartTime] = useState(paramStart && paramStart.includes('T') ? paramStart.split('T')[1].slice(0, 5) : '12:30');
  const [endDate, setEndDate] = useState(paramEnd ? paramEnd.split('T')[0] : '');
  const [endTime, setEndTime] = useState(paramEnd && paramEnd.includes('T') ? paramEnd.split('T')[1].slice(0, 5) : '12:30');

  // Calendar render constants (July 2026 as show in user request)
  const currentMonthYear = 'July 2026';
  const daysInMonth = 31;
  const startDayOfWeek = 3; // July 1, 2026 is a Wednesday (0=Sun, 1=Mon, 2=Tue, 3=Wed, etc.)
  const weeks: (number | null)[][] = [];

  let currentWeek: (number | null)[] = Array(startDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayClick = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const dateString = `2026-07-${formattedDay}`;
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateString);
      setEndDate('');
    } else {
      // If clicked date is before start date, set as start
      if (new Date(dateString) < new Date(startDate)) {
        setStartDate(dateString);
      } else {
        setEndDate(dateString);
      }
    }
  };

  const handleApply = () => {
    const params = new URLSearchParams(window.location.search);
    if (startDate) {
      params.set('start', `${startDate}T${startTime}:00Z`);
    } else {
      params.delete('start');
    }
    if (endDate) {
      params.set('end', `${endDate}T${endTime}:00Z`);
    } else {
      params.delete('end');
    }
    router.push(`/admin?${params.toString()}`);
    setIsOpen(false);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const getDayStyle = (day: number | null) => {
    if (!day) return { color: 'transparent', cursor: 'default' };
    const dateString = `2026-07-${day < 10 ? `0${day}` : day}`;
    const isSelectedStart = startDate === dateString;
    const isSelectedEnd = endDate === dateString;
    const isRange = startDate && endDate && new Date(dateString) > new Date(startDate) && new Date(dateString) < new Date(endDate);

    let style: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '32px',
      width: '32px',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: 500,
      userSelect: 'none',
      color: '#cbd5e1'
    };

    if (isSelectedStart || isSelectedEnd) {
      style.background = '#e2e8f0';
      style.color = '#020617';
      style.fontWeight = 700;
    } else if (isRange) {
      style.background = 'rgba(226, 232, 240, 0.15)';
      style.borderRadius = '0';
    }

    return style;
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }} ref={popoverRef}>
      {/* Date trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(71, 85, 105, 0.4)',
          borderRadius: '8px',
          padding: '8px 16px',
          color: '#e2e8f0',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(4px)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        {startDate ? `${startDate}${endDate ? ` — ${endDate}` : ''}` : 'Select Date Range'}
      </button>

      {/* Refresh Trigger */}
      <button
        onClick={handleRefresh}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: '1.5px solid #d97706',
          borderRadius: '8px',
          padding: '8px 16px',
          color: '#d97706',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
        Refresh
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            zIndex: 999,
            width: '280px',
            background: '#090d16',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4)',
            color: '#e2e8f0'
          }}
        >
          {/* Calendar header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{currentMonthYear}</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ cursor: 'pointer', color: '#94a3b8' }}>&lt;</span>
              <span style={{ cursor: 'pointer', color: '#94a3b8' }}>&gt;</span>
            </div>
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '16px' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', height: '20px' }}>{dayName}</span>
            ))}
            {weeks.map((week, wIdx) =>
              week.map((day, dIdx) => (
                <div 
                  key={`${wIdx}-${dIdx}`} 
                  onClick={() => day && handleDayClick(day)}
                  style={getDayStyle(day)}
                >
                  {day}
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(71, 85, 105, 0.3)', paddingTop: '12px' }}>
            {/* Start timestamp row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Start</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={startDate ? startDate.split('-')[2] : '-'} 
                  readOnly 
                  style={{ width: '40px', background: '#1e293b', border: 'none', borderRadius: '4px', padding: '4px 0', textAlign: 'center', fontSize: '0.85rem', color: '#cbd5e1' }}
                />
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: '90px', background: '#1e293b', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* End timestamp row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>End</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={endDate ? endDate.split('-')[2] : '-'} 
                  readOnly 
                  style={{ width: '40px', background: '#1e293b', border: 'none', borderRadius: '4px', padding: '4px 0', textAlign: 'center', fontSize: '0.85rem', color: '#cbd5e1' }}
                />
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ width: '90px', background: '#1e293b', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Apply button */}
            <button
              onClick={handleApply}
              style={{
                width: '100%',
                background: '#1e293b',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 0',
                color: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Apply ↵
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
