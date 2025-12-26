import React, { useState, useEffect } from 'react';
import { Booking, User, Court, BookingType, UserRole, VMType } from '../types';
import { StorageService, COURTS } from '../services/storage';
import { Button } from './Button';

interface BookingCalendarProps {
  currentUser: User;
}

// Configuration for Booking Types
const BOOKING_TYPES_CONFIG = {
  [BookingType.FREE]: { label: 'Freies Spielen', color: 'bg-blue-100 border-blue-300 text-blue-800', short: 'Frei' },
  [BookingType.VM]: { label: 'Vereinsmeisterschaft', color: 'bg-orange-100 border-orange-300 text-orange-800', short: 'VM' },
  [BookingType.TRAINING]: { label: 'Training', color: 'bg-green-100 border-green-300 text-green-800', short: 'Train' },
  [BookingType.MATCH]: { label: 'Spieltag', color: 'bg-purple-100 border-purple-300 text-purple-800', short: 'Spiel' },
  [BookingType.MAINTENANCE]: { label: 'Platzpflege', color: 'bg-gray-200 border-gray-400 text-gray-800', short: 'Pflege' },
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ currentUser }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Move Logic State
  const [moveSourceBooking, setMoveSourceBooking] = useState<Booking | null>(null);

  // Modal & Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ courtId: number, hour: number } | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  
  // Form State
  const [selectedType, setSelectedType] = useState<BookingType>(BookingType.FREE);
  const [duration, setDuration] = useState<number>(1); // New Duration State
  const [selectedVMType, setSelectedVMType] = useState<VMType>(VMType.SINGLES);
  const [opponentName, setOpponentName] = useState('');
  const [opponent2Name, setOpponent2Name] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [description, setDescription] = useState('');
  const [matchOpponent, setMatchOpponent] = useState(''); // Opponent name for MATCH bookings
  
  // State to store row height for accurate block height calculation
  const [rowHeight, setRowHeight] = useState<{ 
    mobile: { firstRow: number; rowSpacing: number }; 
    desktop: { firstRow: number; rowSpacing: number } 
  }>({ 
    mobile: { firstRow: 64, rowSpacing: 64 }, 
    desktop: { firstRow: 80, rowSpacing: 80 } 
  });

  useEffect(() => {
    const allBookings = StorageService.getBookings();
    setBookings(allBookings);
  }, [selectedDate, message]);

  // Measure actual row height on mount and resize
  useEffect(() => {
    const measureRowHeight = () => {
      // Find multiple consecutive rows to measure the total height including borders
      const allRows = Array.from(document.querySelectorAll('.divide-y > .grid'));
      
      if (allRows.length >= 2) {
        const firstRow = allRows[0] as HTMLElement;
        const secondRow = allRows[1] as HTMLElement;
        
        if (firstRow && secondRow) {
          const firstRowRect = firstRow.getBoundingClientRect();
          const secondRowRect = secondRow.getBoundingClientRect();
          
          // Measure the height of the first row
          const firstRowHeight = firstRowRect.height;
          
          // Calculate spacing between rows (includes border)
          // This is the distance from top of first row to top of second row
          const rowSpacing = secondRowRect.top - firstRowRect.top;
          
          const isMobile = window.innerWidth < 640;
          if (isMobile) {
            setRowHeight(prev => ({ 
              ...prev, 
              mobile: { firstRow: firstRowHeight, rowSpacing } 
            }));
          } else {
            setRowHeight(prev => ({ 
              ...prev, 
              desktop: { firstRow: firstRowHeight, rowSpacing } 
            }));
          }
        }
      }
    };

    // Measure after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(measureRowHeight, 100);
    window.addEventListener('resize', measureRowHeight);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureRowHeight);
    };
  }, [bookings, selectedDate]);

  // Determine available hours (8 - 21)
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); 

  // Helpers
  const getBooking = (courtId: number, hour: number) => {
    return bookings.find(b => b.courtId === courtId && b.hour === hour && b.date === selectedDate);
  };

  // Find all bookings that belong to the same block (same user, court, date, type, consecutive hours)
  const getBookingBlock = (courtId: number, startHour: number): Booking[] => {
    const startBooking = getBooking(courtId, startHour);
    if (!startBooking) return [];

    const block: Booking[] = [startBooking];
    let currentHour = startHour + 1;

    // Find consecutive bookings that belong to the same block
    while (currentHour <= 21) {
      const nextBooking = getBooking(courtId, currentHour);
      if (
        nextBooking &&
        nextBooking.userId === startBooking.userId &&
        nextBooking.type === startBooking.type &&
        nextBooking.vmType === startBooking.vmType &&
        nextBooking.opponent === startBooking.opponent &&
        nextBooking.partner === startBooking.partner &&
        nextBooking.opponent2 === startBooking.opponent2
      ) {
        block.push(nextBooking);
        currentHour++;
      } else {
        break;
      }
    }

    return block;
  };

  // Check if a booking is part of a multi-hour block and if it's the first hour
  const getBookingBlockInfo = (courtId: number, hour: number): { isBlock: boolean; isFirstHour: boolean; blockLength: number } => {
    const booking = getBooking(courtId, hour);
    if (!booking) return { isBlock: false, isFirstHour: false, blockLength: 0 };

    // Check if there's a booking in the previous hour that could be part of the same block
    const prevBooking = getBooking(courtId, hour - 1);
    if (
      prevBooking &&
      prevBooking.userId === booking.userId &&
      prevBooking.type === booking.type &&
      prevBooking.vmType === booking.vmType &&
      prevBooking.opponent === booking.opponent &&
      prevBooking.partner === booking.partner &&
      prevBooking.opponent2 === booking.opponent2
    ) {
      // This is not the first hour of a block
      return { isBlock: true, isFirstHour: false, blockLength: 0 };
    }

    // Check if this is the start of a block
    const block = getBookingBlock(courtId, hour);
    const isBlock = block.length > 1;
    return {
      isBlock,
      isFirstHour: true,
      blockLength: block.length
    };
  };

  const getAllowedTypes = (role: UserRole): BookingType[] => {
    switch (role) {
      case UserRole.ADMIN:
        return Object.values(BookingType); 
      case UserRole.TRAINER:
        return [BookingType.FREE, BookingType.VM, BookingType.TRAINING, BookingType.MATCH];
      case UserRole.MEMBER:
        return [BookingType.FREE, BookingType.VM];
      default:
        return [];
    }
  };

  // Open modal for NEW booking
  const openBookingModal = (courtId: number, hour: number) => {
    // If we are in "Move Mode", execute the move instead of opening modal
    if (moveSourceBooking) {
      executeMove(courtId, hour);
      return;
    }

    setModalData({ courtId, hour });
    setEditingBookingId(null); // Not editing
    setSelectedType(BookingType.FREE);
    setDuration(1); // Reset duration
    setSelectedVMType(VMType.SINGLES);
    setOpponentName('');
    setOpponent2Name('');
    setPartnerName('');
    setDescription('');
    setMatchOpponent('');
    setIsModalOpen(true);
  };

  // Open modal for EDITING existing booking
  const openEditModal = (booking: Booking) => {
    setModalData({ courtId: booking.courtId, hour: booking.hour });
    setEditingBookingId(booking.id);
    
    // Pre-fill fields
    setSelectedType(booking.type);
    setDuration(1); // Editing duration of existing block is complex, keep at 1 for simplicity of edit mode
    if (booking.vmType) setSelectedVMType(booking.vmType);
    setOpponentName(booking.opponent || '');
    setOpponent2Name(booking.opponent2 || '');
    setPartnerName(booking.partner || '');
    setDescription(booking.description || '');
    setMatchOpponent(booking.type === BookingType.MATCH ? (booking.opponent || booking.description || '') : '');

    setIsModalOpen(true);
  };

  const checkRestrictions = (userId: string, dateStr: string, role: UserRole, type: BookingType, checkDuration: number): string | null => {
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay(); 
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // 1. Check for Collisions first (is the slot free?)
      if (modalData && !editingBookingId) {
          for (let i = 0; i < checkDuration; i++) {
              const targetHour = modalData.hour + i;
              if (targetHour > 21) return "Die Buchung überschreitet die Öffnungszeiten (bis 22 Uhr).";
              
              const existing = bookings.find(b => 
                  b.courtId === modalData.courtId && 
                  b.date === dateStr && 
                  b.hour === targetHour
              );
              if (existing) {
                  return `Der Platz ist um ${targetHour}:00 Uhr bereits belegt. Bitte wählen Sie eine kürzere Dauer oder einen anderen Startzeitpunkt.`;
              }
          }
      }

      // 2. Check User Limits
      let isLimitExempt = false;
      if (role === UserRole.ADMIN) isLimitExempt = true;
      else if (role === UserRole.TRAINER && (type === BookingType.TRAINING || type === BookingType.MATCH)) isLimitExempt = true;
      else if (isWeekend) isLimitExempt = true;

      if (!isLimitExempt) {
          const myBookingsToday = bookings.filter(b => 
              b.userId === userId && 
              b.date === dateStr &&
              b.id !== moveSourceBooking?.id && 
              b.id !== editingBookingId 
          );
          
          const currentDuration = editingBookingId ? 0 : checkDuration; // If editing, we ignore the current slot count logic for simplicity or treat as 0 added
          
          if (myBookingsToday.length + currentDuration > 1) {
              return 'Mo-Fr ist maximal 1 Stunde Buchung erlaubt (außer am Wochenende)!';
          }
      }
      return null;
  };

  const confirmBooking = () => {
    if (!modalData) return;

    setMessage(null);
    const restrictionError = checkRestrictions(currentUser.id, selectedDate, currentUser.role, selectedType, duration);
    if (restrictionError) {
       setMessage({ type: 'error', text: restrictionError });
       // Do not close modal so user can fix it
       return;
    }

    // VM Validation
    if (selectedType === BookingType.VM) {
       if (!opponentName.trim()) {
         alert('Bitte geben Sie einen Gegner an.');
         return;
       }
       if ((selectedVMType === VMType.DOUBLES || selectedVMType === VMType.MIXED)) {
         if (!partnerName.trim() || !opponent2Name.trim()) {
           alert('Bitte geben Sie Partner und zweiten Gegner an.');
           return;
         }
       }
    }

    // Helpers for ID generation - Robust unique ID
    const generateId = (index: number) => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2) + index;
    };

    // Prepare bookings array (for multiple hours)
    const newBookings: Booking[] = [];
    const loopCount = editingBookingId ? 1 : duration; // If editing, only update the single slot

    for (let i = 0; i < loopCount; i++) {
        const targetHour = modalData.hour + i;
        
        const bookingData: Booking = {
            id: editingBookingId && i === 0 ? editingBookingId : generateId(i),
            courtId: modalData.courtId,
            userId: currentUser.id,
            userName: currentUser.fullName,
            date: selectedDate,
            hour: targetHour,
            timestamp: Date.now(),
            type: selectedType,
            vmType: selectedType === BookingType.VM ? selectedVMType : undefined,
            opponent: selectedType === BookingType.VM ? opponentName : (selectedType === BookingType.MATCH ? matchOpponent : undefined),
            partner: (selectedType === BookingType.VM && selectedVMType !== VMType.SINGLES) ? partnerName : undefined,
            opponent2: (selectedType === BookingType.VM && selectedVMType !== VMType.SINGLES) ? opponent2Name : undefined,
            description: selectedType === BookingType.TRAINING ? description : undefined
        };
        newBookings.push(bookingData);
    }

    if (editingBookingId) {
        // Update single existing booking
        StorageService.updateBooking(newBookings[0]);
        setBookings(bookings.map(b => b.id === editingBookingId ? newBookings[0] : b));
        setMessage({ type: 'success', text: 'Buchung aktualisiert!' });
    } else {
        // Create new booking(s)
        newBookings.forEach(b => StorageService.addBooking(b));
        setBookings([...bookings, ...newBookings]);
        setMessage({ type: 'success', text: `${duration} Stunde(n) erfolgreich gebucht!` });
    }

    setIsModalOpen(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCancel = (bookingId: string) => {
      const bookingToDelete = bookings.find(b => b.id === bookingId);
      if (!bookingToDelete) return;

      // Find all bookings that belong to the same block
      const blockBookings = getBookingBlock(bookingToDelete.courtId, bookingToDelete.hour);
      const blockLength = blockBookings.length;
      
      const confirmMessage = blockLength > 1 
        ? `Möchten Sie die komplette ${blockLength}-Stunden-Buchung wirklich löschen?`
        : 'Buchung wirklich löschen?';
      
      if (confirm(confirmMessage)) {
          // Delete all bookings in the block
          blockBookings.forEach(blockBooking => {
              StorageService.removeBooking(blockBooking.id);
          });
          
          setBookings(prev => prev.filter(b => !blockBookings.some(bb => bb.id === b.id)));
          setMessage({ 
            type: 'success', 
            text: blockLength > 1 
              ? `${blockLength}-Stunden-Buchung gelöscht.` 
              : 'Buchung gelöscht.' 
          });
          
          // Clear move source if it was part of the deleted block
          if (moveSourceBooking && blockBookings.some(bb => bb.id === moveSourceBooking.id)) {
            setMoveSourceBooking(null); 
          }
      }
  };

  const handleDeleteFromModal = () => {
    if (!editingBookingId) return;
    handleCancel(editingBookingId);
    setIsModalOpen(false);
  };

  const initMove = (booking: Booking) => {
    setMoveSourceBooking(booking);
    setMessage({ type: 'success', text: 'Verschieben-Modus: Wähle jetzt einen freien Slot.' });
  };

  const cancelMove = () => {
    setMoveSourceBooking(null);
    setMessage(null);
  };

  const executeMove = (targetCourtId: number, targetHour: number) => {
    if (!moveSourceBooking) return;

    // Check restrictions (1 hour check for move)
    const restrictionError = checkRestrictions(currentUser.id, selectedDate, currentUser.role, moveSourceBooking.type, 1);
    if (restrictionError) {
      setMessage({ type: 'error', text: restrictionError });
      setMoveSourceBooking(null);
      return;
    }

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const newBooking: Booking = {
      ...moveSourceBooking,
      id: generateId(),
      courtId: targetCourtId,
      hour: targetHour,
      timestamp: Date.now()
    };

    StorageService.removeBooking(moveSourceBooking.id);
    StorageService.addBooking(newBooking);
    
    setBookings(prev => {
        const filtered = prev.filter(b => b.id !== moveSourceBooking.id);
        return [...filtered, newBooking];
    });

    setMoveSourceBooking(null);
    setMessage({ type: 'success', text: 'Buchung verschoben!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Controls & Legend */}
      <div className="mb-4 flex flex-col space-y-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center space-x-4 mb-2 sm:mb-0 w-full sm:w-auto">
                <label className="font-medium text-gray-700 whitespace-nowrap">Datum:</label>
                <div className="relative rounded-md shadow-sm w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <input 
                        type="date" 
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-white block w-full sm:w-auto rounded-md border-gray-300 pl-10 focus:border-tennis-500 focus:ring-tennis-500 text-sm p-2 border"
                    />
                </div>
            </div>
            {moveSourceBooking && (
              <div className="flex items-center space-x-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-md border border-blue-200 animate-pulse">
                <span className="text-xs font-bold">Verschieben aktiv...</span>
                <button onClick={cancelMove} className="text-xs underline hover:text-blue-600">Abbrechen</button>
              </div>
            )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 border-t pt-2">
          {Object.entries(BOOKING_TYPES_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center space-x-1">
              <span className={`w-2.5 h-2.5 rounded-full ${config.color.split(' ')[0]}`}></span>
              <span className="text-[10px] sm:text-xs text-gray-600">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
          </div>
      )}

      {/* Grid - Responsive Wrapper */}
      <div className={`overflow-x-auto bg-white rounded-lg shadow border border-gray-200 ${moveSourceBooking ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
          <div className="min-w-[320px] sm:min-w-[600px] md:min-w-full">
              {/* Header */}
              <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <div className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider border-r">
                      Zeit
                  </div>
                  {COURTS.map(court => (
                      <div key={court.id} className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-tennis-800 uppercase tracking-wider border-r last:border-r-0 truncate">
                          <span className="hidden sm:inline">{court.name}</span>
                          <span className="sm:hidden">P{court.id}</span>
                      </div>
                  ))}
              </div>

              {/* Body */}
              <div className="divide-y divide-gray-100 relative" style={{ overflow: 'visible' }}>
                  {hours.map((hour, hourIndex) => (
                      <div key={hour} className="grid grid-cols-5 hover:bg-gray-50 transition-colors relative" data-hour-row={hour}>
                          <div className="p-1 sm:p-2 text-center text-[10px] sm:text-sm text-gray-500 font-mono border-r flex items-center justify-center">
                              {hour.toString().padStart(2, '0')}:00
                          </div>
                          {COURTS.map((court, courtIndex) => {
                              // Add data attribute to first cell for height measurement
                              const isFirstCell = hourIndex === 0 && courtIndex === 0;
                              const booking = getBooking(court.id, hour);
                              const blockInfo = getBookingBlockInfo(court.id, hour);
                              const isMyBooking = booking?.userId === currentUser.id;
                              const canModify = isMyBooking || currentUser.role === UserRole.ADMIN;
                              const isMovingThis = moveSourceBooking?.id === booking?.id;
                              
                              const typeConfig = booking ? BOOKING_TYPES_CONFIG[booking.type] || BOOKING_TYPES_CONFIG[BookingType.FREE] : null;
                              const cellClass = booking 
                                ? `${typeConfig?.color} border` 
                                : `border-dashed border-transparent ${moveSourceBooking ? 'hover:bg-blue-100 cursor-pointer animate-pulse' : 'hover:bg-tennis-50 hover:border-tennis-300'}`;

                              // If this booking is part of a block but not the first hour, don't render it (it's part of the block above)
                              if (blockInfo.isBlock && !blockInfo.isFirstHour) {
                                return (
                                  <div key={court.id} className="p-0.5 sm:p-1 h-16 sm:h-20 border-r last:border-r-0 relative">
                                    {/* Empty cell - content is in the block above */}
                                  </div>
                                );
                              }

                              // Calculate height for multi-hour blocks to match row height exactly
                              // Formula: firstRowHeight + (blockLength - 1) * rowSpacing
                              // This accounts for the first row plus additional rows with borders
                              const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                              const rowHeightData = isMobile ? rowHeight.mobile : rowHeight.desktop;
                              const blockTotalHeight = blockInfo.isBlock && blockInfo.isFirstHour 
                                ? rowHeightData.firstRow + (blockInfo.blockLength - 1) * rowHeightData.rowSpacing
                                : 0;

                              return (
                                  <div 
                                    key={court.id} 
                                    data-sample-row={isFirstCell ? 'true' : undefined}
                                    data-court-cell={`${court.id}-${hour}`}
                                    className={`p-0.5 sm:p-1 border-r last:border-r-0 relative h-16 sm:h-20`}
                                  >
                                      {booking && blockInfo.isBlock && blockInfo.isFirstHour ? (
                                          // Multi-hour block: render absolutely positioned block that spans multiple rows
                                          // The block is positioned relative to its cell and extends over following rows
                                          <div 
                                            className={`rounded p-1 text-[10px] sm:text-xs relative group shadow-sm overflow-hidden ${cellClass} ${isMovingThis ? 'opacity-50' : ''}`}
                                            style={{
                                              position: 'absolute',
                                              top: '0.125rem',
                                              left: '0.125rem',
                                              right: '0.125rem',
                                              height: `${blockTotalHeight}px`,
                                              zIndex: 10
                                            }}
                                          >
                                              <div className="leading-tight mb-4">
                                                <div className="font-bold truncate">
                                                    {typeConfig?.label} {booking.vmType ? `(${booking.vmType === VMType.SINGLES ? 'E' : booking.vmType === VMType.DOUBLES ? 'D' : 'M'})` : ''}
                                                    {blockInfo.isBlock && blockInfo.blockLength > 1 && (
                                                      <span className="ml-1 text-[9px] opacity-75">({blockInfo.blockLength}h)</span>
                                                    )}
                                                </div>
                                                <div className="truncate opacity-90">
                                                    {booking.userName}
                                                    {booking.partner && <span className="block truncate text-[9px]">+ {booking.partner}</span>}
                                                </div>
                                                {booking.opponent && booking.type === BookingType.VM && (
                                                  <div className="truncate text-gray-600 mt-0.5 italic text-[9px]">
                                                    vs {booking.opponent}
                                                    {booking.opponent2 && <span> + {booking.opponent2}</span>}
                                                  </div>
                                                )}
                                                {booking.opponent && booking.type === BookingType.MATCH && (
                                                  <div className="truncate text-gray-600 mt-0.5 text-[9px]">
                                                    Gegner: {booking.opponent}
                                                  </div>
                                                )}
                                                {booking.type === BookingType.TRAINING && booking.description && (
                                                   <div className="truncate text-gray-700 mt-0.5 font-medium text-[9px]">
                                                     {booking.description}
                                                   </div>
                                                )}
                                              </div>
                                              
                                              {canModify && !moveSourceBooking && (
                                                  <div className="absolute bottom-0.5 right-0.5 flex space-x-0.5 sm:space-x-1 z-20">
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(booking); }}
                                                        className="bg-white text-gray-700 hover:text-gray-900 border border-gray-200 shadow-sm font-medium p-1.5 sm:p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
                                                        title="Bearbeiten"
                                                        aria-label="Bearbeiten"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
                                                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                      </button>
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); initMove(booking); }}
                                                        className="bg-white text-blue-700 hover:text-blue-900 border border-gray-200 shadow-sm font-medium p-1.5 sm:p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
                                                        title="Verschieben"
                                                        aria-label="Verschieben"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
                                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" transform="rotate(45 10 10)" />
                                                        </svg>
                                                      </button>
                                                      <button 
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleCancel(booking.id);
                                                        }}
                                                        className="bg-white text-red-700 hover:text-red-900 border border-gray-200 shadow-sm font-medium p-1.5 sm:p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
                                                        title="Stornieren"
                                                        aria-label="Stornieren"
                                                      >
                                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                          </svg>
                                                      </button>
                                                  </div>
                                              )}
                                          </div>
                                      ) : booking ? (
                                          // Single-hour booking: render normally
                                          <div className={`w-full h-full rounded p-1 text-[10px] sm:text-xs relative group shadow-sm overflow-hidden ${cellClass} ${isMovingThis ? 'opacity-50' : ''}`}>
                                              <div className="leading-tight mb-4">
                                                <div className="font-bold truncate">
                                                    {typeConfig?.label} {booking.vmType ? `(${booking.vmType === VMType.SINGLES ? 'E' : booking.vmType === VMType.DOUBLES ? 'D' : 'M'})` : ''}
                                                </div>
                                                <div className="truncate opacity-90">
                                                    {booking.userName}
                                                    {booking.partner && <span className="block truncate text-[9px]">+ {booking.partner}</span>}
                                                </div>
                                                {booking.opponent && booking.type === BookingType.VM && (
                                                  <div className="truncate text-gray-600 mt-0.5 italic text-[9px]">
                                                    vs {booking.opponent}
                                                    {booking.opponent2 && <span> + {booking.opponent2}</span>}
                                                  </div>
                                                )}
                                                {booking.opponent && booking.type === BookingType.MATCH && (
                                                  <div className="truncate text-gray-600 mt-0.5 text-[9px]">
                                                    Gegner: {booking.opponent}
                                                  </div>
                                                )}
                                                {booking.type === BookingType.TRAINING && booking.description && (
                                                   <div className="truncate text-gray-700 mt-0.5 font-medium text-[9px]">
                                                     {booking.description}
                                                   </div>
                                                )}
                                              </div>
                                              
                                              {canModify && !moveSourceBooking && (
                                                  <div className="absolute bottom-0.5 right-0.5 flex space-x-0.5 sm:space-x-1 z-20">
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(booking); }}
                                                        className="bg-white text-gray-700 hover:text-gray-900 border border-gray-200 shadow-sm font-medium p-1.5 sm:p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
                                                        title="Bearbeiten"
                                                        aria-label="Bearbeiten"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
                                                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                      </button>
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); initMove(booking); }}
                                                        className="bg-white text-blue-700 hover:text-blue-900 border border-gray-200 shadow-sm font-medium p-1.5 sm:p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
                                                        title="Verschieben"
                                                        aria-label="Verschieben"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
                                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" transform="rotate(45 10 10)" />
                                                        </svg>
                                                      </button>
                                                      <button 
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleCancel(booking.id);
                                                        }}
                                                        className="bg-white text-red-700 hover:text-red-900 border border-gray-200 shadow-sm font-medium p-1.5 sm:p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
                                                        title="Stornieren"
                                                        aria-label="Stornieren"
                                                      >
                                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                          </svg>
                                                      </button>
                                                  </div>
                                              )}
                                          </div>
                                      ) : (
                                          <button 
                                              onClick={() => openBookingModal(court.id, hour)}
                                              className={`w-full h-full rounded border-2 flex items-center justify-center text-xs transition-all ${cellClass} ${moveSourceBooking ? 'text-blue-400 font-bold' : 'text-transparent hover:text-tennis-400'}`}
                                          >
                                              {moveSourceBooking ? 'Hier' : '+'}
                                          </button>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Booking Modal Overlay */}
      {isModalOpen && modalData && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {editingBookingId ? 'Buchung bearbeiten' : 'Platz buchen'}
                </h3>
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-gray-500">
                    {COURTS.find(c => c.id === modalData.courtId)?.name}, {modalData.hour}:00 Uhr
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                      <select 
                        value={selectedType} 
                        onChange={(e) => setSelectedType(e.target.value as BookingType)}
                        className="bg-white block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm rounded-md border"
                      >
                        {getAllowedTypes(currentUser.role).map(type => (
                          <option key={type} value={type}>{BOOKING_TYPES_CONFIG[type].label}</option>
                        ))}
                      </select>
                    </div>

                    {!editingBookingId && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Stunden)</label>
                        <select 
                          value={duration} 
                          onChange={(e) => setDuration(parseInt(e.target.value))}
                          className="bg-white block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm rounded-md border"
                        >
                          <option value={1}>1 Stunde</option>
                          <option value={2}>2 Stunden</option>
                          <option value={3}>3 Stunden</option>
                          <option value={4}>4 Stunden</option>
                          <option value={5}>5 Stunden</option>
                          <option value={6}>6 Stunden</option>
                          <option value={7}>7 Stunden</option>
                          <option value={8}>8 Stunden</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {selectedType === BookingType.TRAINING && (
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Training Details</label>
                        <input 
                            type="text" 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="z.B. Jugendtraining, Herren 30"
                            className="bg-white shadow-sm focus:ring-tennis-500 focus:border-tennis-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                        />
                    </div>
                  )}

                  {selectedType === BookingType.MATCH && (
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gegner</label>
                        <input 
                            type="text" 
                            value={matchOpponent}
                            onChange={(e) => setMatchOpponent(e.target.value)}
                            placeholder="Name des Gegners"
                            className="bg-white shadow-sm focus:ring-tennis-500 focus:border-tennis-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                        />
                    </div>
                  )}

                  {selectedType === BookingType.VM && (
                    <div className="bg-orange-50 p-3 rounded-md space-y-3 border border-orange-200 animate-fade-in">
                        <div>
                          <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Spielmodus</label>
                          <select 
                            value={selectedVMType}
                            onChange={(e) => setSelectedVMType(e.target.value as VMType)}
                            className="bg-white block w-full text-sm border-orange-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                          >
                            <option value={VMType.SINGLES}>Einzel (1 vs 1)</option>
                            <option value={VMType.DOUBLES}>Doppel (2 vs 2)</option>
                            <option value={VMType.MIXED}>Mixed (2 vs 2)</option>
                          </select>
                        </div>

                        {/* Singles Inputs */}
                        {selectedVMType === VMType.SINGLES && (
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Gegner</label>
                              <input 
                                  type="text" 
                                  value={opponentName}
                                  onChange={(e) => setOpponentName(e.target.value)}
                                  placeholder="Name des Gegners"
                                  className="bg-white shadow-sm focus:ring-tennis-500 focus:border-tennis-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                              />
                           </div>
                        )}

                        {/* Doubles/Mixed Inputs */}
                        {(selectedVMType === VMType.DOUBLES || selectedVMType === VMType.MIXED) && (
                           <>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dein Partner</label>
                                <input 
                                    type="text" 
                                    value={partnerName}
                                    onChange={(e) => setPartnerName(e.target.value)}
                                    placeholder="Name deines Partners"
                                    className="bg-white shadow-sm focus:ring-tennis-500 focus:border-tennis-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gegner 1</label>
                                    <input 
                                        type="text" 
                                        value={opponentName}
                                        onChange={(e) => setOpponentName(e.target.value)}
                                        placeholder="Name"
                                        className="bg-white shadow-sm focus:ring-tennis-500 focus:border-tennis-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gegner 2</label>
                                    <input 
                                        type="text" 
                                        value={opponent2Name}
                                        onChange={(e) => setOpponent2Name(e.target.value)}
                                        placeholder="Name"
                                        className="bg-white shadow-sm focus:ring-tennis-500 focus:border-tennis-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                                    />
                                </div>
                             </div>
                           </>
                        )}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
                <Button onClick={confirmBooking} className="w-full sm:ml-3 sm:w-auto text-sm sm:text-base px-4 py-2">
                  {editingBookingId ? 'Speichern' : 'Buchen'}
                </Button>
                
                {editingBookingId && (
                   <Button variant="danger" onClick={handleDeleteFromModal} className="w-full sm:ml-3 sm:w-auto text-sm sm:text-base px-4 py-2">
                     Löschen
                   </Button>
                )}

                <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="w-full sm:ml-3 sm:w-auto bg-white text-sm sm:text-base px-4 py-2">
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};