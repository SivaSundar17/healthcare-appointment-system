import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  ChevronDown,
  Loader2,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL_APPOINTMENT = 'http://localhost:8004';
const API_URL_DOCTOR = 'http://localhost:8003';
const API_URL_USER = 'http://localhost:8002';

const Appointments = () => {
  const { user, userRole, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [doctorNames, setDoctorNames] = useState({});
  const [patientNames, setPatientNames] = useState({});
  const [rating, setRating] = useState({});
  const [doctorReviews, setDoctorReviews] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, [userRole, user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (userRole === 'doctor') {
        response = await axios.get(`${API_URL_APPOINTMENT}/appointments/doctor/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.get(`${API_URL_APPOINTMENT}/appointments/patient/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const appointmentsData = response.data;
      setAppointments(appointmentsData);
      
      // Fetch doctor and patient names
      await fetchNames(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNames = async (appointmentsData) => {
    const doctorIds = [...new Set(appointmentsData.map(a => a.doctor_id))];
    const patientIds = [...new Set(appointmentsData.map(a => a.patient_id))];
    
    const doctorNamesMap = {};
    const patientNamesMap = {};
    const ratingsMap = {};
    
    // Fetch doctor names and reviews
    for (const doctorId of doctorIds) {
      try {
        const res = await axios.get(`${API_URL_DOCTOR}/doctors/${doctorId}`);
        doctorNamesMap[doctorId] = `Dr. ${res.data.first_name} ${res.data.last_name}`;
        
        // Fetch reviews for this doctor
        try {
          const reviewsRes = await axios.get(`${API_URL_DOCTOR}/doctors/${doctorId}/reviews`);
          // Store reviews in ratingsMap
          ratingsMap[doctorId] = reviewsRes.data;
        } catch (err) {
          console.error('Error fetching reviews:', err);
        }
      } catch (err) {
        doctorNamesMap[doctorId] = 'Dr. Unknown';
      }
    }
    
    // Fetch patient names
    for (const patientId of patientIds) {
      try {
        const res = await axios.get(`${API_URL_USER}/patients/${patientId}`);
        patientNamesMap[patientId] = `${res.data.first_name} ${res.data.last_name}`;
      } catch (err) {
        patientNamesMap[patientId] = 'Unknown Patient';
      }
    }
    
    setDoctorNames(doctorNamesMap);
    setPatientNames(patientNamesMap);
    // Store ratings for display
    setDoctorReviews(ratingsMap);
  };

  const handleCancel = async (appointmentId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmed) return;
    
    try {
      await axios.post(`${API_URL_APPOINTMENT}/appointments/${appointmentId}/cancel`, 
        { reason: 'Cancelled by user' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment. Please try again.');
    }
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await axios.put(`${API_URL_APPOINTMENT}/appointments/${appointmentId}`, 
        { status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleRateDoctor = async (doctorId, appointmentId, ratingValue) => {
    try {
      // Set rating locally for immediate feedback
      setRating(prev => ({ ...prev, [appointmentId]: ratingValue }));
      
      // Submit rating to backend
      await axios.post(
        `http://localhost:8003/doctors/${doctorId}/reviews`,
        { patient_id: user.uid, rating: ratingValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refetch reviews for this doctor to update display
      const reviewsRes = await axios.get(`${API_URL_DOCTOR}/doctors/${doctorId}/reviews`);
      setDoctorReviews(prev => ({ ...prev, [doctorId]: reviewsRes.data }));
      
      toast.success('Thank you for rating!');
    } catch (error) {
      console.error('Error rating doctor:', error);
      toast.error('Failed to submit rating. Please try again.');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['scheduled', 'confirmed'].includes(apt.status);
    if (filter === 'completed') return apt.status === 'completed';
    if (filter === 'cancelled') return apt.status === 'cancelled';
    return apt.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="mt-2 text-gray-600">
            Manage your appointments and view your history
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-700 font-medium"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
            <ChevronDown className={`h-4 w-4 ml-2 transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {['all', 'upcoming', 'scheduled', 'confirmed', 'completed', 'cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                    filter === f
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You don't have any appointments yet."
                  : `No ${filter} appointments found.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {userRole === 'doctor' 
                              ? patientNames[appointment.patient_id] || 'Patient'
                              : doctorNames[appointment.doctor_id] || 'Dr. Unknown'
                            }
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {format(new Date(appointment.appointment_date), 'EEEE, MMMM do, yyyy')}
                          </p>
                          <p className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)}
                          </p>
                          {appointment.reason && (
                            <p className="flex items-start">
                              <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                              <span>{appointment.reason}</span>
                            </p>
                          )}
                        </div>

                        {appointment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </p>
                          </div>
                        )}

                        {appointment.cancellation_reason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-md">
                            <p className="text-sm text-red-700">
                              <span className="font-medium">Cancellation Reason:</span> {appointment.cancellation_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      {appointment.status === 'scheduled' && userRole === 'patient' && (
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      )}
                      
                      {appointment.status === 'scheduled' && userRole === 'doctor' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                            className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-md text-sm font-medium"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancel(appointment.id)}
                            className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'confirmed' && userRole === 'doctor' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                          className="flex items-center px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </button>
                      )}

                      {appointment.amount > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">${appointment.amount}</p>
                          <p className="text-xs text-gray-500">{appointment.payment_status}</p>
                        </div>
                      )}

                      {/* Rating for completed appointments by patients */}
                      {appointment.status === 'completed' && userRole === 'patient' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Rate your doctor:</p>
                          <div className="flex items-center space-x-1">
                            {(() => {
                              // Get user's latest rating for this doctor
                              const docReviews = doctorReviews[appointment.doctor_id] || [];
                              const userReviews = docReviews.filter(r => r.patient_id === parseInt(user.uid));
                              const latestReview = userReviews.length > 0 ? userReviews[userReviews.length - 1] : null;
                              const displayRating = rating[appointment.id] || (latestReview ? latestReview.rating : 0);
                              
                              return [1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRateDoctor(appointment.doctor_id, appointment.id, star)}
                                  className={`p-1 rounded ${star <= displayRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                >
                                  <Star className="h-5 w-5 fill-current" />
                                </button>
                              ));
                            })()}
                            {(() => {
                              const docReviews = doctorReviews[appointment.doctor_id] || [];
                              const userReviews = docReviews.filter(r => r.patient_id === parseInt(user.uid));
                              const latestReview = userReviews.length > 0 ? userReviews[userReviews.length - 1] : null;
                              const displayRating = rating[appointment.id] || (latestReview ? latestReview.rating : 0);
                              
                              if (displayRating > 0) {
                                return (
                                  <span className="ml-2 text-sm text-gray-600">
                                    {displayRating} star{displayRating !== 1 ? 's' : ''}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
