import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Calendar, Clock, Plus, Trash2, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DOCTOR_SERVICE_URL = 'http://localhost:8003';

const DoctorAvailabilityPage = () => {
  const { user, token } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'recurring', // 'recurring' or 'specific'
    dayOfWeek: '0', // 0=Monday, 1=Tuesday, etc. (Python weekday convention)
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: '30',
  });

  const daysOfWeek = [
    { value: '0', label: 'Monday' },
    { value: '1', label: 'Tuesday' },
    { value: '2', label: 'Wednesday' },
    { value: '3', label: 'Thursday' },
    { value: '4', label: 'Friday' },
    { value: '5', label: 'Saturday' },
    { value: '6', label: 'Sunday' },
  ];

  const slotDurations = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
  ];

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${DOCTOR_SERVICE_URL}/doctors/${user.uid}/availability`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        start_time: formData.startTime,
        end_time: formData.endTime,
        slot_duration: parseInt(formData.slotDuration),
        is_available: true,
      };

      if (formData.type === 'recurring') {
        payload.day_of_week = parseInt(formData.dayOfWeek);
      } else {
        payload.date = formData.date;
      }

      await axios.post(
        `${DOCTOR_SERVICE_URL}/doctors/${user.uid}/availability`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Availability added successfully!');
      setShowAddForm(false);
      setFormData({
        type: 'recurring',
        dayOfWeek: '0', // 0=Monday (Python weekday convention)
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: '30',
      });
      fetchAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
      toast.error(error.response?.data?.detail || 'Failed to add availability');
    }
  };

  const handleDelete = async (slotId) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;
    
    try {
      await axios.delete(
        `${DOCTOR_SERVICE_URL}/doctors/${user.uid}/availability/${slotId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Availability deleted');
      fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to delete availability');
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDayOfWeek = (day) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day] || 'Unknown';
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    const key = slot.day_of_week !== null && slot.day_of_week !== undefined
      ? `weekly-${slot.day_of_week}`
      : `specific-${slot.date}`;
    
    if (!acc[key]) {
      acc[key] = {
        type: slot.day_of_week !== null && slot.day_of_week !== undefined ? 'Weekly' : 'Specific Date',
        day: slot.day_of_week !== null && slot.day_of_week !== undefined
          ? formatDayOfWeek(slot.day_of_week)
          : slot.date,
        slots: [],
      };
    }
    acc[key].slots.push(slot);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-white mr-3" />
              <h1 className="text-2xl font-bold text-white">Manage Availability</h1>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Availability
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="p-6 bg-blue-50 border-b border-blue-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Availability</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="recurring"
                      checked={formData.type === 'recurring'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Weekly Recurring</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="specific"
                      checked={formData.type === 'specific'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Specific Date</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Day of Week or Date */}
                  {formData.type === 'recurring' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week *
                      </label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {daysOfWeek.map((day) => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  )}

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Slot Duration */}
                <div className="md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slot Duration *
                  </label>
                  <select
                    value={formData.slotDuration}
                    onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {slotDurations.map((duration) => (
                      <option key={duration.value} value={duration.value}>{duration.label}</option>
                    ))}
                  </select>
                </div>

                {/* Preview */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Preview:</strong> {formData.type === 'recurring' ? 
                      `${daysOfWeek.find(d => d.value === formData.dayOfWeek)?.label}s` : 
                      formData.date} from {formatTime(formData.startTime)} to {formatTime(formData.endTime)}, 
                    with {slotDurations.find(d => d.value === formData.slotDuration)?.label.toLowerCase()} slots
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Save Availability
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Current Availability List */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Availability</h3>
            
            {Object.keys(groupedAvailability).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No availability set</h3>
                <p className="text-gray-600 mb-4">Add your availability so patients can book appointments</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Availability
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedAvailability).map(([key, group]) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-gray-900">
                          {group.type}: {group.day}
                        </h4>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {group.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                        >
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-700">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 px-6 py-4 border-t border-blue-100">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Weekly Recurring:</strong> Set your regular weekly schedule (e.g., every Monday 9AM-5PM)</li>
                  <li><strong>Specific Date:</strong> Add availability for a particular date only</li>
                  <li>Patients will see available slots based on your settings</li>
                  <li>You can remove availability anytime by clicking the trash icon</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailabilityPage;
