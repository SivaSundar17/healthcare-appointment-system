import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Shield, 
  Users,
  ArrowRight,
  CheckCircle,
  Activity,
  FileText,
  Bell
} from 'lucide-react';

const LandingPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user && userRole) {
      // User is logged in, redirect to appropriate dashboard
      if (userRole === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } else {
      // User not logged in, go to register
      navigate('/register');
    }
  };

  const features = [
    {
      icon: <Stethoscope className="h-6 w-6 text-primary-600" />,
      title: 'Find Specialists',
      description: 'Browse and book appointments with top doctors across various specializations.'
    },
    {
      icon: <Calendar className="h-6 w-6 text-primary-600" />,
      title: 'Easy Scheduling',
      description: 'Book appointments online 24/7. View available slots and choose what works for you.'
    },
    {
      icon: <Clock className="h-6 w-6 text-primary-600" />,
      title: 'Reminders',
      description: 'Get automated reminders for upcoming appointments via email and notifications.'
    },
    {
      icon: <FileText className="h-6 w-6 text-primary-600" />,
      title: 'Medical Records',
      description: 'Access your complete medical history and prescriptions in one secure place.'
    },
    {
      icon: <Bell className="h-6 w-6 text-primary-600" />,
      title: 'Real-time Updates',
      description: 'Receive instant notifications about appointment confirmations and changes.'
    },
    {
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      title: 'Secure & Private',
      description: 'Your health data is protected with enterprise-grade security and encryption.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Verified Doctors' },
    { number: '50,000+', label: 'Happy Patients' },
    { number: '100,000+', label: 'Appointments Booked' },
    { number: '4.9', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Your Health, <span className="text-primary-600">Simplified</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Book appointments with top doctors, manage your medical records, and stay on top of your health - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/doctors"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Find a Doctor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-600 bg-white border-2 border-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl sm:text-4xl font-bold text-white">{stat.number}</div>
                <div className="text-primary-100 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose HealthCare?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make healthcare accessible, convenient, and hassle-free for everyone.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Book your appointment in just a few simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Find a Doctor',
                description: 'Search by specialty, location, or doctor name to find the right healthcare provider.'
              },
              {
                step: '02',
                title: 'Book Appointment',
                description: 'Choose an available time slot that works for your schedule.'
              },
              {
                step: '03',
                title: 'Get Care',
                description: 'Visit the doctor and receive the care you need. Manage follow-ups easily.'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="text-5xl font-bold text-primary-100 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of patients who trust HealthCare for their medical needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-600 bg-white hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign Up Now
            </button>
            <Link
              to="/doctors"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white border-2 border-white hover:bg-white hover:text-primary-600 rounded-lg transition-colors"
            >
              Browse Doctors
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Stethoscope className="h-6 w-6 text-primary-400" />
                <span className="text-xl font-bold text-white">HealthCare</span>
              </div>
              <p className="text-sm">
                Making healthcare accessible and convenient for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/doctors" className="hover:text-white">Find a Doctor</Link></li>
                <li><Link to="/register" className="hover:text-white">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Doctors</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white">Join as Doctor</Link></li>
                <li><Link to="/login" className="hover:text-white">Doctor Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@healthcare.com</li>
                <li>+91 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2024 HealthCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
