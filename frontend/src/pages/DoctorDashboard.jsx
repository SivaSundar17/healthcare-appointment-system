import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Star,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL_DOCTOR = 'http://localhost:8003';
const API_URL_APPOINTMENT = 'http://localhost:8004';
const API_URL_USER = 'http://localhost:8002';

const DoctorDashboard = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patientNames, setPatientNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    rating: 0,
    totalEarnings: 0,
    todayEarnings: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch doctor profile (with auth header)
      const profileRes = await axios.get(`${API_URL_DOCTOR}/doctors/${user.uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDoctorProfile(profileRes.data);
      
      // Fetch all appointments (with auth header)
      const appointmentsRes = await axios.get(
        `${API_URL_APPOINTMENT}/appointments/doctor/${user.uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const appointmentsData = appointmentsRes.data;
      setAppointments(appointmentsData);
      
      // Fetch patient names (with auth header)
      await fetchPatientNames(appointmentsData);
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsData.filter(a => a.appointment_date === today);
      const pending = appointmentsData.filter(a => a.status === 'scheduled');
      const completed = appointmentsData.filter(a => a.status === 'completed');
      
      // Earnings calculations
      const totalEarnings = completed
        .filter(a => a.payment_status === 'paid')
        .reduce((sum, a) => sum + (a.amount || 0), 0);
      
      const todayEarnings = completed
        .filter(a => a.appointment_date === today && a.payment_status === 'paid')
        .reduce((sum, a) => sum + (a.amount || 0), 0);
      
      setStats({
        totalPatients: new Set(appointmentsData.map(a => a.patient_id)).size,
        todayAppointments: todayAppts.length,
        pendingAppointments: pending.length,
        completedAppointments: completed.length,
        rating: profileRes.data.rating || 0,
        totalEarnings: totalEarnings,
        todayEarnings: todayEarnings
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientNames = async (appointmentsData) => {
    const patientIds = [...new Set(appointmentsData.map(a => a.patient_id))];
    const patientNamesMap = {};
    
    for (const patientId of patientIds) {
      try {
        const res = await axios.get(`${API_URL_USER}/patients/${patientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        patientNamesMap[patientId] = `${res.data.first_name} ${res.data.last_name}`;
      } catch (err) {
        patientNamesMap[patientId] = 'Unknown Patient';
      }
    }
    
    setPatientNames(patientNamesMap);
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    if (newStatus === 'cancelled') {
      const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
      if (!confirmed) return;
    }
    
    try {
      await axios.put(`${API_URL_APPOINTMENT}/appointments/${appointmentId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleMarkAsPaid = async (appointmentId) => {
    try {
      await axios.put(`${API_URL_APPOINTMENT}/appointments/${appointmentId}`, 
        { payment_status: 'paid' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Dr. {user?.displayName?.split(' ')[0] || 'Doctor'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's your practice overview for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingAppointments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.todayEarnings?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                <Link 
                  to="/appointments" 
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View All
                </Link>
              </div>
              
              <div className="divide-y divide-gray-200">
                {appointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
                    <p className="text-gray-600">You have a free day!</p>
                  </div>
                ) : (
                  appointments.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {patientNames[appointment.patient_id] || 'Patient'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)}
                            </p>
                            <p className="text-sm text-gray-500">{appointment.reason}</p>
                            {appointment.payment_status && (
                              <p className={`text-xs mt-1 ${appointment.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                Payment: {appointment.payment_status}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          
                          {appointment.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                                title="Confirm"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                                title="Cancel"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}

                          {appointment.status === 'completed' && appointment.payment_status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(appointment.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700"
                            >
                              Mark as Paid
                            </button>
                          )}

                          {appointment.status === 'completed' && appointment.payment_status === 'paid' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md">
                              Paid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Profile & Quick Stats */}
          <div className="space-y-8">
            {/* Doctor Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {user?.displayName}
                  </h3>
                  <p className="text-sm text-gray-500">{doctorProfile?.specialization}</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {doctorProfile?.rating || 0} ({doctorProfile?.review_count || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium">{doctorProfile?.experience_years || 0} years</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Consultation Fee</span>
                  <span className="font-medium">${doctorProfile?.consultation_fee || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${doctorProfile?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {doctorProfile?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <Link 
                to="/profile" 
                className="mt-4 w-full block text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit Profile
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/doctor/availability"
                  className="w-full flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-primary-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Manage Availability</span>
                </Link>
                <Link 
                  to="/appointments"
                  className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Activity className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View All Appointments</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
