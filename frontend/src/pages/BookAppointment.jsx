import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Stethoscope
} from 'lucide-react';
import axios from 'axios';
import { format, addDays, isSameDay } from 'date-fns';

const API_URL_DOCTOR = 'http://localhost:8003';
const API_URL_APPOINTMENT = 'http://localhost:8004';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate, doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL_DOCTOR}/doctors/${doctorId}`);
      setDoctor(response.data);
    } catch (err) {
      setError('Failed to load doctor details');
      console.error('Error fetching doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = format(selectedDate, 'EEEE');
      console.log(`Fetching slots for date: ${dateStr} (${dayOfWeek})`);
      
      // Fetch available slots from doctor service
      const slotsResponse = await axios.get(
        `${API_URL_DOCTOR}/doctors/${doctorId}/slots?date=${dateStr}`
      );
      console.log(`Slots API response:`, slotsResponse.data);
      
      // Fetch existing appointments for this doctor and date (with auth header)
      const appointmentsResponse = await axios.get(
        `${API_URL_APPOINTMENT}/appointments/doctor/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const allSlots = slotsResponse.data.slots || [];
      const appointments = appointmentsResponse.data || [];
      console.log(`Total slots from API: ${allSlots.length}`);
      console.log(`Total appointments: ${appointments.length}`);
      
      // Filter out already booked slots for this date
      const bookedTimes = appointments
        .filter(apt => apt.appointment_date === dateStr)
        .filter(apt => ['scheduled', 'confirmed'].includes(apt.status))
        .map(apt => apt.start_time);
      
      console.log(`Booked times for ${dateStr}:`, bookedTimes);
      
      // Mark slots as unavailable if already booked
      const filteredSlots = allSlots.map(slot => ({
        ...slot,
        available: slot.available && !bookedTimes.includes(slot.start_time)
      }));
      
      console.log(`Available slots after filtering:`, filteredSlots.filter(s => s.available).length);
      
      setAvailableSlots(filteredSlots);
      setBookedSlots(bookedTimes);
      setSelectedSlot(null);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the appointment');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const appointmentData = {
        patient_id: user.uid,
        doctor_id: doctorId,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        reason: reason,
        symptoms: symptoms
      };

      await axios.post(`${API_URL_APPOINTMENT}/appointments`, appointmentData);
      
      setSuccess(true);
      
      // Refresh slots to show updated availability
      if (selectedDate) {
        fetchAvailableSlots();
      }
      
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
          <p className="text-gray-600 mb-4">
            Your appointment with Dr. {doctor?.first_name} {doctor?.last_name} has been scheduled successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/doctors')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Doctors
        </button>

        {/* Doctor Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Book Appointment
              </h1>
              <p className="text-lg text-gray-700">
                with Dr. {doctor?.first_name} {doctor?.last_name}
              </p>
              <p className="text-primary-600 font-medium">{doctor?.specialization}</p>
              <p className="text-gray-500 text-sm mt-1">
                ${doctor?.consultation_fee} per visit
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Select Date
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {dates.map((date, index) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const dayName = format(date, 'EEE');
                const dayNum = format(date, 'd');
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs uppercase">{dayName}</div>
                    <div className="text-lg font-semibold">{dayNum}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Available Time Slots
              </h2>
              
              {availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No slots available for this date</p>
                  <p className="text-sm text-gray-500 mt-1">Please select another date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => slot.available && setSelectedSlot(slot)}
                      disabled={!slot.available}
                      className={`p-3 rounded-lg text-center text-sm font-medium transition-colors ${
                        selectedSlot?.start_time === slot.start_time
                          ? 'bg-primary-600 text-white'
                          : slot.available
                          ? 'bg-gray-50 text-gray-700 hover:bg-primary-100 border border-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.start_time.substring(0, 5)}
                      {!slot.available && <span className="block text-xs">(Booked)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appointment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Regular checkup, Fever, Consultation"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms (Optional)
                </label>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  placeholder="Describe any symptoms you're experiencing..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {(selectedDate || selectedSlot || reason) && (
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                {selectedDate && (
                  <p className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date: {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                  </p>
                )}
                {selectedSlot && (
                  <p className="flex items-center text-gray-700">
                    <Clock className="h-4 w-4 mr-2" />
                    Time: {selectedSlot.start_time.substring(0, 5)} - {selectedSlot.end_time.substring(0, 5)}
                  </p>
                )}
                {reason && (
                  <p className="flex items-center text-gray-700">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Reason: {reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedDate || !selectedSlot || !reason}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
