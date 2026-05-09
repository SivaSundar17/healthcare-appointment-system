import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Stethoscope, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign,
  ChevronRight,
  User,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_DOCTOR_URL || 'http://localhost:8003'; // Direct to Doctor Service

const DoctorDirectory = () => {
  const { user, userRole } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchSpecializations();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/doctors`);
      setDoctors(response.data);
    } catch (err) {
      setError('Failed to load doctors');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await axios.get(`${API_URL}/specializations`);
      setSpecializations(response.data);
    } catch (err) {
      console.error('Error fetching specializations:', err);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    // Exclude current doctor from the list (doctors shouldn't see themselves)
    if (userRole === 'doctor' && doctor.id === user?.uid) {
      return false;
    }
    
    const matchesSearch = 
      doctor.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = 
      !selectedSpecialization || doctor.specialization === selectedSpecialization;
    
    return matchesSearch && matchesSpecialization;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDoctors}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="mt-2 text-gray-600">
            Book appointments with top specialists
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Specialization Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="block w-full md:w-64 pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronRight className="h-5 w-5 text-gray-400 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
            {selectedSpecialization && ` in ${selectedSpecialization}`}
          </p>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Doctor Header */}
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {doctor.profile_image ? (
                        <img 
                          src={doctor.profile_image} 
                          alt={`Dr. ${doctor.first_name}`}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </h3>
                      <p className="text-sm text-primary-600 font-medium">
                        {doctor.specialization}
                      </p>
                      
                      {/* Rating */}
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-700 ml-1">
                          {doctor.rating || 0}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({doctor.review_count || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      <span>{doctor.qualification}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{doctor.experience_years} years experience</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>${doctor.consultation_fee || 0} per visit</span>
                    </div>
                  </div>
                  
                  {/* About */}
                  {doctor.about && (
                    <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                      {doctor.about}
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <Link
                    to={`/book-appointment/${doctor.id}`}
                    className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Book Appointment
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDirectory;
