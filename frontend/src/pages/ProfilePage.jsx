import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL_USER = import.meta.env.VITE_USER_URL || 'http://localhost:8002';
const API_URL_DOCTOR = import.meta.env.VITE_DOCTOR_URL || 'http://localhost:8003';

const ProfilePage = () => {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [userRole, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let response;
      
      if (userRole === 'doctor') {
        response = await axios.get(`${API_URL_DOCTOR}/doctors/${user.uid}`);
      } else {
        response = await axios.get(`${API_URL_USER}/patients/${user.uid}`);
      }
      
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (userRole === 'doctor') {
        await axios.put(`${API_URL_DOCTOR}/doctors/${user.uid}`, formData);
      } else {
        await axios.put(`${API_URL_USER}/patients/${user.uid}`, formData);
      }
      
      setProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your personal information and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userRole === 'doctor' ? 'Dr. ' : ''}
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-gray-500 capitalize">{userRole}</p>
                {userRole === 'doctor' && profile?.specialization && (
                  <p className="text-primary-600 font-medium">{profile.specialization}</p>
                )}
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || user?.email || ''}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
              </div>

              {/* Role-specific fields */}
              {userRole === 'doctor' ? (
                <>
                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      Specialization
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Consultation Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consultation Fee ($)
                    </label>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={formData.consultation_fee || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Qualification */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* About */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      About
                    </label>
                    <textarea
                      name="about"
                      rows={4}
                      value={formData.about || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      name="blood_group"
                      value={formData.blood_group || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Address
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Allergies */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allergies
                    </label>
                    <textarea
                      name="allergies"
                      rows={2}
                      value={formData.allergies || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="List any allergies..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Name and phone number"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Account Type:</span>
              <p className="font-medium text-gray-900 capitalize">{userRole}</p>
            </div>
            <div>
              <span className="text-gray-500">Member Since:</span>
              <p className="font-medium text-gray-900">
                {profile?.created_at ? format(new Date(profile.created_at), 'MMMM dd, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <p className="font-medium text-gray-900">
                {profile?.updated_at ? format(new Date(profile.updated_at), 'MMMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
