import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../Redux/toastSlice';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorAvailability = () => {
  const dispatch = useDispatch();
  const [availability, setAvailability] = useState({
    consultationDuration: 40,
    bufferTime: 10,
    weekly: [],
    exceptions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'exceptions' | 'preview'

  // Exception Form State
  const [exDate, setExDate] = useState('');
  const [exIsUnavailable, setExIsUnavailable] = useState(false);
  const [exStart, setExStart] = useState('09:00');
  const [exEnd, setExEnd] = useState('17:00');
  const [exHasBreak, setExHasBreak] = useState(false);
  const [exBreakStart, setExBreakStart] = useState('13:00');
  const [exBreakDuration, setExBreakDuration] = useState(60);

  // Preview State
  const [previewDate, setPreviewDate] = useState('');
  const [previewSlots, setPreviewSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const api = useMemo(() => axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const fetchAvailability = useCallback(async () => {
    try {
      const { data } = await api.get('/doctors/profile');
      
      // Initialize weekly schedule if empty
      let weekly = data.availability?.weekly || [];
      if (!Array.isArray(weekly) || weekly.length === 0) {
        weekly = DAYS.map(day => ({
          day,
          isActive: false,
          startTime: '09:00',
          endTime: '17:00',
          hasBreak: false,
          breakStart: '13:00',
          breakDuration: 60
        }));
      } else {
        // Ensure all days are present
        weekly = DAYS.map(day => {
          const existing = weekly.find(w => w.day === day);
          return existing || {
            day,
            isActive: false,
            startTime: '09:00',
            endTime: '17:00',
            hasBreak: false,
            breakStart: '13:00',
            breakDuration: 60
          };
        });
      }

      setAvailability({
        consultationDuration: 40, // Fixed
        bufferTime: 10, // Fixed
        weekly,
        exceptions: data.availability?.exceptions || []
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching availability:", error);
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleSave = async () => {
    try {
      await api.put('/doctors/availability', { availability });
      dispatch(showToast({ message: 'Availability updated successfully!', type: 'success' }));
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Failed to save', type: 'error' }));
    }
  };

  const handleWeeklyChange = (index, field, value) => {
    const newWeekly = [...availability.weekly];
    newWeekly[index] = { ...newWeekly[index], [field]: value };
    setAvailability({ ...availability, weekly: newWeekly });
  };

  const addException = () => {
    if (!exDate) return;
    
    const newException = {
      date: exDate,
      isUnavailable: exIsUnavailable,
      startTime: exStart,
      endTime: exEnd,
      hasBreak: exHasBreak,
      breakStart: exBreakStart,
      breakDuration: Number(exBreakDuration)
    };

    // Remove existing exception for this date
    const filtered = availability.exceptions.filter(ex => ex.date !== exDate);
    setAvailability({ ...availability, exceptions: [...filtered, newException] });
    
    // Reset form
    setExDate('');
    setExIsUnavailable(false);
    dispatch(showToast({ message: 'Exception added (Save to apply)', type: 'info' }));
  };

  const removeException = (date) => {
    const filtered = availability.exceptions.filter(ex => ex.date !== date);
    setAvailability({ ...availability, exceptions: filtered });
  };

  const fetchPreviewSlots = async () => {
    if (!previewDate) return;
    setLoadingSlots(true);
    try {
      const { data } = await api.get(`/doctors/slots?date=${previewDate}`);
      setPreviewSlots(data.slots || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSlots(false);
    }
  };

  if (loading) return <div className="p-4">Loading availability...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Availability Settings</h2>
        <button 
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {['weekly', 'exceptions', 'preview'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'weekly' ? 'Weekly Schedule' : tab === 'exceptions' ? 'Date Exceptions' : 'Preview Slots'}
          </button>
        ))}
      </div>

      {/* Global Settings - Read Only */}
      <div className="mb-8 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Standard Appointment Rules</h3>
          <p className="text-sm mt-1">
            Consultation: <span className="font-bold">40 mins</span> | 
            Buffer: <span className="font-bold">10 mins</span> | 
            Total Slot: <span className="font-bold">50 mins</span>
          </p>
        </div>
        <div className="text-xs bg-white px-3 py-1 rounded border border-blue-200 text-blue-600">
          Fixed System Setting
        </div>
      </div>

      {/* Weekly Schedule Tab */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {availability.weekly.map((day, index) => (
            <div key={day.day} className={`p-4 border rounded-lg ${day.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={day.isActive} 
                    onChange={(e) => handleWeeklyChange(index, 'isActive', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-lg w-24">{day.day}</span>
                </div>
                {day.isActive && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={day.startTime} onChange={(e) => handleWeeklyChange(index, 'startTime', e.target.value)} className="p-1 border rounded" />
                    <span>to</span>
                    <input type="time" value={day.endTime} onChange={(e) => handleWeeklyChange(index, 'endTime', e.target.value)} className="p-1 border rounded" />
                  </div>
                )}
              </div>
              
              {day.isActive && (
                <div className="ml-8 pl-4 border-l-2 border-gray-100">
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={day.hasBreak} 
                        onChange={(e) => handleWeeklyChange(index, 'hasBreak', e.target.checked)}
                      />
                      <span>Add Break</span>
                    </label>
                    {day.hasBreak && (
                      <>
                        <div className="flex items-center gap-2">
                          <span>Start:</span>
                          <input type="time" value={day.breakStart} onChange={(e) => handleWeeklyChange(index, 'breakStart', e.target.value)} className="p-1 border rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Duration (min):</span>
                          <input type="number" value={day.breakDuration} onChange={(e) => handleWeeklyChange(index, 'breakDuration', Number(e.target.value))} className="p-1 border rounded w-20" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Exceptions Tab */}
      {activeTab === 'exceptions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg h-fit">
            <h3 className="font-semibold mb-4">Add Exception</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={exIsUnavailable} onChange={(e) => setExIsUnavailable(e.target.checked)} />
                <span>Mark as Unavailable (Day Off)</span>
              </label>
              
              {!exIsUnavailable && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Start</label>
                      <input type="time" value={exStart} onChange={(e) => setExStart(e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">End</label>
                      <input type="time" value={exEnd} onChange={(e) => setExEnd(e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                  </div>

                  <div className="mt-3 border-t pt-3">
                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={exHasBreak} 
                        onChange={(e) => setExHasBreak(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Add Break</span>
                    </label>
                    
                    {exHasBreak && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Break Start</label>
                          <input 
                            type="time" 
                            value={exBreakStart} 
                            onChange={(e) => setExBreakStart(e.target.value)} 
                            className="w-full p-2 border rounded text-sm" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
                          <input 
                            type="number" 
                            value={exBreakDuration} 
                            onChange={(e) => setExBreakDuration(Number(e.target.value))} 
                            className="w-full p-2 border rounded text-sm" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              <button onClick={addException} disabled={!exDate} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300">
                Add Exception
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold mb-4">Scheduled Exceptions</h3>
            {availability.exceptions.length === 0 ? (
              <p className="text-gray-500 italic">No exceptions added.</p>
            ) : (
              <div className="space-y-2">
                {availability.exceptions.sort((a,b) => new Date(a.date) - new Date(b.date)).map((ex, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded bg-white">
                    <div>
                      <span className="font-medium">{ex.date}</span>
                      <span className={`ml-3 text-sm px-2 py-1 rounded ${ex.isUnavailable ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {ex.isUnavailable ? 'Unavailable' : `Working: ${ex.startTime} - ${ex.endTime}`}
                      </span>
                      {!ex.isUnavailable && ex.hasBreak && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Break: {ex.breakStart} for {ex.breakDuration}m)
                        </span>
                      )}
                    </div>
                    <button onClick={() => removeException(ex.date)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="text-center">
          <div className="flex justify-center items-end gap-4 mb-8">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Date to Preview</label>
              <input type="date" value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} className="p-2 border rounded-lg" />
            </div>
            <button onClick={fetchPreviewSlots} disabled={!previewDate} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
              Check Slots
            </button>
          </div>

          {loadingSlots ? (
            <div className="text-gray-500">Generating slots...</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {previewSlots.length > 0 ? previewSlots.map(slot => (
                <div key={slot} className="p-2 bg-blue-50 text-blue-700 rounded border border-blue-100 text-sm font-medium">
                  {slot}
                </div>
              )) : previewDate && <p className="col-span-full text-gray-500">No slots available for this date.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;