import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = 'http://localhost:8001'; // Auth Service (local)
const USER_SERVICE_URL = 'http://localhost:8002'; // User Service (local)
const DOCTOR_SERVICE_URL = 'http://localhost:8003'; // Doctor Service (local)

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  // Load cached user on mount and check profile
  useEffect(() => {
    const loadUserAndCheckProfile = async () => {
      const cachedUser = localStorage.getItem('auth_user');
      const cachedRole = localStorage.getItem('auth_role');
      const cachedToken = localStorage.getItem('auth_token');
      
      if (cachedUser && cachedToken) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          setUserRole(cachedRole);
          setToken(cachedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${cachedToken}`;
          
          // Check if profile exists
          try {
            if (cachedRole === 'patient') {
              await axios.get(`${USER_SERVICE_URL}/patients/${parsedUser.uid}`);
              setProfileComplete(true);
            } else if (cachedRole === 'doctor') {
              await axios.get(`${DOCTOR_SERVICE_URL}/doctors/${parsedUser.uid}`);
              setProfileComplete(true);
            }
          } catch (error) {
            // Any error (404, 500, network) means profile doesn't exist or can't verify
            // Force user to complete profile page
            setProfileComplete(false);
          }
        } catch (e) {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_role');
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };
    
    loadUserAndCheckProfile();
  }, []);

  // Register with email/password
  const register = async (email, password, displayName, role = 'patient') => {
    try {
      const firstName = displayName.split(' ')[0] || displayName;
      const lastName = displayName.split(' ').slice(1).join(' ') || 'User';
      
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role
      });
      
      const { uid, token: accessToken, role: userRole, first_name, last_name } = response.data;
      
      const userObj = {
        uid,
        email,
        displayName: `${first_name} ${last_name}`,
        role: userRole
      };
      
      setUser(userObj);
      setUserRole(userRole);
      setToken(accessToken);
      
      localStorage.setItem('auth_user', JSON.stringify(userObj));
      localStorage.setItem('auth_role', userRole);
      localStorage.setItem('auth_token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      toast.success('Registration successful!');
      return { ...userObj, role: userRole };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });
      
      const { uid, token: accessToken, role, first_name, last_name } = response.data;
      
      const userObj = {
        uid,
        email,
        displayName: `${first_name} ${last_name}`,
        role
      };
      
      setUser(userObj);
      setUserRole(role);
      setToken(accessToken);
      
      localStorage.setItem('auth_user', JSON.stringify(userObj));
      localStorage.setItem('auth_role', role);
      localStorage.setItem('auth_token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      toast.success('Login successful!');
      return { ...userObj, role };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  // Google login placeholder
  const loginWithGoogle = async () => {
    toast.error('Google login not implemented yet. Please use email/password.');
    throw new Error('Google login not implemented');
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    setUserRole(null);
    toast.success('Logged out successfully');
  };

  // Check if user profile exists (patient or doctor)
  const checkProfileExists = async (userId, role) => {
    try {
      if (role === 'patient') {
        await axios.get(`${USER_SERVICE_URL}/patients/${userId}`);
      } else if (role === 'doctor') {
        await axios.get(`${DOCTOR_SERVICE_URL}/doctors/${userId}`);
      }
      setProfileComplete(true);
      return true;
    } catch (error) {
      // Any error (404, 500, etc.) means profile doesn't exist or service error
      // Return false to redirect to profile completion
      setProfileComplete(false);
      return false;
    }
  };

  // Create patient profile
  const createPatientProfile = async (profileData) => {
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/patients`, {
        id: user.uid,
        email: user.email,
        first_name: profileData.first_name || user.displayName?.split(' ')[0],
        last_name: profileData.last_name || user.displayName?.split(' ').slice(1).join(' '),
        ...profileData
      });
      setProfileComplete(true);
      toast.success('Profile created successfully!');
      return response.data;
    } catch (error) {
      console.error('Create profile error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create profile');
      throw error;
    }
  };

  // Create doctor profile
  const createDoctorProfile = async (profileData) => {
    try {
      const response = await axios.post(`${DOCTOR_SERVICE_URL}/doctors`, {
        id: user.uid,
        email: user.email,
        first_name: profileData.first_name || user.displayName?.split(' ')[0],
        last_name: profileData.last_name || user.displayName?.split(' ').slice(1).join(' '),
        ...profileData
      });
      setProfileComplete(true);
      toast.success('Profile created successfully!');
      return response.data;
    } catch (error) {
      console.error('Create profile error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create profile');
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    loading,
    token,
    profileComplete,
    register,
    login,
    logout,
    loginWithGoogle,
    checkProfileExists,
    createPatientProfile,
    createDoctorProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
