import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Activity,
  ChevronRight,
  Plus,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL_USER = import.meta.env.VITE_USER_URL || 'http://localhost:8002';
const API_URL_APPOINTMENT = import.meta.env.VITE_APPOINTMENT_URL || 'http://localhost:8004';

const PatientDashboard = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    medicalRecords: 0
  });
  const [doctorNames, setDoctorNames] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments (with auth header)
      const appointmentsRes = await axios.get(`${API_URL_APPOINTMENT}/appointments/patient/${user.uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const appointmentsData = appointmentsRes.data;
      setAppointments(appointmentsData);
      
      // Fetch doctor names
      await fetchDoctorNames(appointmentsData);
      
      // Calculate stats
      const upcoming = appointmentsData.filter(a => ['scheduled', 'confirmed'].includes(a.status));
      const completed = appointmentsData.filter(a => a.status === 'completed');
      
      setStats({
        totalAppointments: appointmentsData.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        medicalRecords: 0 // Will be fetched separately
      });

      // Fetch medical records (with auth header)
      try {
        const recordsRes = await axios.get(`${API_URL_USER}/patients/${user.uid}/medical-records`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMedicalRecords(recordsRes.data);
        setStats(prev => ({ ...prev, medicalRecords: recordsRes.data.length }));
      } catch (err) {
        console.log('Medical records not available yet');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCancel = async (appointmentId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmed) return;
    
    try {
      await axios.post(`${API_URL_APPOINTMENT}/appointments/${appointmentId}/cancel`, 
        { reason: 'Cancelled by patient' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const fetchDoctorNames = async (appointmentsData) => {
    const doctorIds = [...new Set(appointmentsData.map(a => a.doctor_id))];
    const doctorNamesMap = {};
    
    for (const doctorId of doctorIds) {
      try {
        const res = await axios.get(`http://localhost:8003/doctors/${doctorId}`);
        doctorNamesMap[doctorId] = `Dr. ${res.data.first_name} ${res.data.last_name}`;
      } catch (err) {
        doctorNamesMap[doctorId] = 'Dr. Unknown';
      }
    }
    
    setDoctorNames(doctorNamesMap);
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
            Welcome back, {user?.displayName?.split(' ')[0] || 'Patient'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your health journey
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
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Medical Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.medicalRecords}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                <Link 
                  to="/doctors" 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book New
                </Link>
              </div>
              
              <div className="divide-y divide-gray-200">
                {appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                    <p className="text-gray-600 mb-4">Schedule a visit with your doctor today.</p>
                    <Link 
                      to="/doctors" 
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                    >
                      Find a Doctor
                    </Link>
                  </div>
                ) : (
                  appointments
                    .filter(a => ['scheduled', 'confirmed'].includes(a.status))
                    .slice(0, 5)
                    .map((appointment) => (
                      <div key={appointment.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-primary-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {doctorNames[appointment.doctor_id] || `Dr. ${appointment.doctor_id}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(appointment.appointment_date), 'MMMM dd, yyyy')} at {appointment.start_time}
                              </p>
                              <p className="text-sm text-gray-500">{appointment.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                              {appointment.status}
                            </span>
                            {['scheduled', 'confirmed'].includes(appointment.status) && (
                              <button
                                onClick={() => handleCancel(appointment.id)}
                                className="ml-3 text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                            <Link 
                              to={`/appointments`}
                              className="ml-4 text-primary-600 hover:text-primary-900"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
              
              {appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length > 5 && (
                <div className="p-4 border-t border-gray-200 text-center">
                  <Link to="/appointments" className="text-primary-600 hover:text-primary-700 font-medium">
                    View all appointments
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Recent Records */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link 
                  to="/doctors"
                  className="flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-primary-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Book Appointment</span>
                </Link>
                <Link 
                  to="/appointments"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Clock className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View History</span>
                </Link>
                <Link 
                  to="/profile"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Update Profile</span>
                </Link>
              </div>
            </div>

            {/* Recent Medical Records */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Records</h2>
              </div>
              <div className="p-6">
                {medicalRecords.length === 0 ? (
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No medical records yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalRecords.slice(0, 3).map((record) => (
                      <div key={record.id} className="flex items-start space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.title}</p>
                          <p className="text-xs text-gray-500">{record.record_type}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(record.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
