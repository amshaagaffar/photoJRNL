import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Heart, Smile, Meh, Frown, Plus, X, Bell, Flame, ChevronLeft, ChevronRight, Cat } from 'lucide-react';

export default function PhotoJournal() {
  const [entries, setEntries] = useState([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [view, setView] = useState('timeline');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: 'neutral',
    photo: null,
    photoPreview: null
  });

  useEffect(() => {
    loadEntries();
    requestNotificationPermission();
    scheduleNotificationCheck();
  }, []);

  useEffect(() => {
    calculateStreak();
  }, [entries]);

  const calculateStreak = () => {
    if (entries.length === 0) {
      setStreak(0);
      return;
    }

    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const uniqueDays = new Set();
    
    sortedEntries.forEach(entry => {
      const date = new Date(entry.date).toDateString();
      uniqueDays.add(date);
    });

    const daysArray = Array.from(uniqueDays).sort((a, b) => new Date(b) - new Date(a));
    
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (daysArray[0] === today || daysArray[0] === yesterday) {
      currentStreak = 1;
      let expectedDate = new Date(daysArray[0]);
      
      for (let i = 1; i < daysArray.length; i++) {
        expectedDate = new Date(expectedDate.getTime() - 86400000);
        const expectedDateStr = expectedDate.toDateString();
        
        if (daysArray[i] === expectedDateStr) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    setStreak(currentStreak);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const scheduleNotificationCheck = () => {
    const checkAndNotify = () => {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour === 20) {
        const today = now.toDateString();
        const hasEntryToday = entries.some(entry => {
          const entryDate = new Date(entry.date).toDateString();
          return entryDate === today;
        });

        if (!hasEntryToday && Notification.permission === 'granted') {
          new Notification('📸 Journal Reminder', {
            body: "You haven't journaled today! Capture a moment before the day ends.",
            icon: '📔',
            tag: 'daily-journal-reminder'
          });
        }
      }
    };

    const interval = setInterval(checkAndNotify, 3600000);
    checkAndNotify();
    
    return () => clearInterval(interval);
  };

  const loadEntries = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('journal:'));
      const loadedEntries = keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch {
          return null;
        }
      }).filter(e => e !== null);
      
      loadedEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEntries(loadedEntries);
    } catch (error) {
      console.log('Loading entries for first time');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEntry({
          ...newEntry,
          photo: reader.result,
          photoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    const entry = {
      id: Date.now().toString(),
      title: newEntry.title,
      content: newEntry.content,
      mood: newEntry.mood,
      photo: newEntry.photo,
      date: new Date().toISOString()
    };

    try {
      localStorage.setItem(`journal:${entry.id}`, JSON.stringify(entry));
      const updatedEntries = [entry, ...entries];
      setEntries(updatedEntries);
      setNewEntry({ title: '', content: '', mood: 'neutral', photo: null, photoPreview: null });
      setShowNewEntry(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    }
  };

  const deleteEntry = (id) => {
    try {
      localStorage.removeItem(`journal:${id}`);
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getMoodIcon = (mood) => {
    switch(mood) {
      case 'happy': return <Smile className="w-5 h-5 text-gray-700" />;
      case 'sad': return <Frown className="w-5 h-5 text-gray-600" />;
      case 'love': return <Heart className="w-5 h-5 text-gray-700" />;
      default: return <Meh className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEntriesForDate = (year, month, day) => {
    const dateStr = new Date(year, month, day).toDateString();
    return entries.filter(entry => {
      const entryDate = new Date(entry.date).toDateString();
      return entryDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEntries = getEntriesForDate(year, month, day);
      const hasEntries = dayEntries.length > 0;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square border border-gray-400 p-2 transition-all duration-300 hover:scale-105 hover:bg-white hover:border-black ${
            isToday ? 'bg-gray-300 border-black' : 'bg-gray-200'
          } ${hasEntries ? 'cursor-pointer' : ''}`}
        >
          <div className="text-sm font-semibold text-black mb-1">{day}</div>
          {hasEntries && (
            <div className="grid grid-cols-2 gap-1">
              {dayEntries.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="relative transform transition-transform duration-200 hover:scale-110">
                  {entry.photo ? (
                    <img
                      src={entry.photo}
                      alt={entry.title}
                      className="w-full h-12 object-cover rounded border border-gray-500"
                    />
                  ) : (
                    <div className="w-full h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded flex items-center justify-center border border-gray-500">
                      {getMoodIcon(entry.mood)}
                    </div>
                  )}
                </div>
              ))}
              {dayEntries.length > 4 && (
                <div className="w-full h-12 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-700 border border-gray-500">
                  +{dayEntries.length - 4}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <button onClick={previousMonth} className="p-2 hover:bg-white rounded-lg transition-all duration-200 transform hover:scale-110">
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>
          <h2 className="text-2xl font-semibold text-black">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all duration-200 transform hover:scale-110">
            <ChevronRight className="w-6 h-6 text-black" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-400 to-gray-300">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        .slide-in { animation: slideIn 0.4s ease-out; }
        .float { animation: float 3s ease-in-out infinite; }
      `}</style>
      
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8 fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-black p-3 rounded-full float">
              <Cat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-black mb-1 tracking-tight">My Journal</h1>
              <p className="text-gray-700">Capture your moments, one entry at a time</p>
            </div>
          </div>
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg transform transition-all duration-300 hover:scale-105 hover:bg-white border-2 border-black group">
                <Flame className="w-5 h-5 text-white group-hover:text-black transition-colors duration-300" />
                <span className="font-semibold text-white group-hover:text-black transition-colors duration-300">{streak} day{streak !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg hover:bg-white border-2 border-black transition-all duration-300 text-sm transform hover:scale-105 group"
              >
                <Bell className="w-4 h-4 text-white group-hover:text-black transition-colors duration-300" />
                <span className="text-white group-hover:text-black transition-colors duration-300">{Notification.permission === 'granted' ? 'Notifications On' : 'Enable Reminders'}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('timeline')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 border-2 border-black ${
                view === 'timeline'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-black hover:bg-white'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 border-2 border-black ${
                view === 'calendar'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-black hover:bg-white'
              }`}
            >
              Calendar
            </button>
          </div>
        </header>

        {view === 'timeline' && (
          <>
            {!showNewEntry && (
              <button
                onClick={() => setShowNewEntry(true)}
                className="w-full bg-black text-white py-4 rounded-lg mb-8 flex items-center justify-center gap-2 hover:bg-white hover:text-black border-2 border-black transition-all duration-300 font-semibold transform hover:scale-[1.02] fade-in"
              >
                <Plus className="w-5 h-5" />
                New Entry
              </button>
            )}

            {showNewEntry && (
              <div className="bg-gray-200 rounded-lg border-2 border-black p-6 mb-8 slide-in hover:bg-white transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-black">New Entry</h2>
                  <button onClick={() => setShowNewEntry(false)} className="text-gray-600 hover:text-black transition-colors duration-200 transform hover:scale-110">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Give your entry a title..."
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                  className="w-full p-3 bg-white border-2 border-black rounded-lg mb-4 text-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-black transition-all duration-200"
                />

                <textarea
                  placeholder="What's on your mind today?"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                  className="w-full p-3 bg-white border-2 border-black rounded-lg mb-4 h-32 text-black placeholder-gray-500 focus:ring-2 focus:ring-black transition-all duration-200"
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                  <div className="flex gap-4">
                    {['happy', 'neutral', 'sad', 'love'].map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setNewEntry({...newEntry, mood})}
                        className={`p-3 rounded-lg border-2 border-black transition-all duration-200 transform hover:scale-110 ${
                          newEntry.mood === mood 
                            ? 'bg-black' 
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {getMoodIcon(mood)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add a photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-black rounded-lg cursor-pointer hover:bg-white transition-all duration-200 bg-gray-100"
                  >
                    <Camera className="w-5 h-5 text-black" />
                    <span className="text-black">Choose a photo</span>
                  </label>
                  {newEntry.photoPreview && (
                    <img src={newEntry.photoPreview} alt="Preview" className="mt-4 rounded-lg max-h-64 object-cover border-2 border-black fade-in" />
                  )}
                </div>

                <button
                  onClick={saveEntry}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-white hover:text-black border-2 border-black transition-all duration-300 font-semibold transform hover:scale-[1.02]"
                >
                  Save Entry
                </button>
              </div>
            )}

            <div className="space-y-6">
              {entries.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className="bg-gray-200 rounded-lg border-2 border-black overflow-hidden hover:bg-white transition-all duration-300 transform hover:scale-[1.01] fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {entry.photo && (
                    <img src={entry.photo} alt={entry.title} className="w-full h-64 object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-semibold text-black">{entry.title}</h3>
                      <div className="flex items-center gap-3">
                        {getMoodIcon(entry.mood)}
                        <button 
                          onClick={() => deleteEntry(entry.id)}
                          className="text-gray-600 hover:text-red-600 transition-all duration-200 transform hover:scale-110"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      {formatDate(entry.date)}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {entries.length === 0 && !showNewEntry && (
              <div className="text-center py-12 fade-in">
                <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-700 text-lg">No entries yet. Start journaling!</p>
              </div>
            )}
          </>
        )}

        {view === 'calendar' && (
          <div className="bg-gray-200 rounded-lg border-2 border-black p-6 fade-in hover:bg-white transition-all duration-300">
            {renderCalendar()}
          </div>
        )}
      </div>
    </div>
  );
}