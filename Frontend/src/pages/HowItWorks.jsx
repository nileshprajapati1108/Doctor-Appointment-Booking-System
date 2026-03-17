import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Users, Calendar, CreditCard, Shield, Smartphone } from "lucide-react";

export default function HowItWorks() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">H</div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Happy Health</h1>
              <p className="text-xs text-gray-500">Care that makes you smile</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/" className="text-sm text-gray-700 hover:text-gray-900">← Back</Link>
            <Link to="/login" className="btn-primary text-sm">Sign In</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">How Happy Health Works</h1>
          <p className="text-xl text-gray-600 mb-8">
            Our platform makes healthcare accessible and convenient for patients, doctors, and administrators. 
            Here's how we make it work seamlessly.
          </p>
        </div>
      </section>

      {/* For Patients Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Users className="text-blue-500" size={40} />
              For Patients
            </h2>
            <p className="text-lg text-gray-600">Book appointments with qualified doctors in just 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 border-2 border-blue-200">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">1</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Sign Up</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Create your account with email and password</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Verify your email address</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Complete your patient profile</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-8 border-2 border-yellow-200">
              <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">2</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Browse & Search</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Browse doctors by specialty</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>View doctor profiles and ratings</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Check available time slots</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-8 border-2 border-green-200">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">3</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Book & Pay</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Select your preferred time slot</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Complete secure payment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Get instant confirmation & reminders</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Patient Features */}
          <div className="bg-blue-50 rounded-lg p-8 border-l-4 border-blue-500">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Patient Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Manage multiple appointments</span>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Secure online payments</span>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Mobile-friendly interface</span>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">HIPAA-compliant privacy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Users className="text-blue-500" size={40} />
              For Doctors
            </h2>
            <p className="text-lg text-gray-600">Manage your practice efficiently and reach more patients</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Register */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Register Your Practice</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Create a professional doctor profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Add qualifications and certifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Set your specialization and services</span>
                </li>
              </ul>
            </div>

            {/* Manage */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">2. Manage Your Schedule</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Set available time slots</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Manage cancellations easily</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>View real-time calendar updates</span>
                </li>
              </ul>
            </div>

            {/* Accept */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Accept Bookings</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Receive patient booking requests</span>
                </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>Review patient profiles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>Confirm appointments instantly</span>
                  </li>
              </ul>
            </div>

            {/* Track */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">4. Track Earnings</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>View all completed appointments</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Track payments and earnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <span>Generate revenue reports</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Doctor Features */}
          <div className="bg-blue-50 rounded-lg p-8 border-l-4 border-blue-500">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Doctor Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Users className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Expand your patient base</span>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Better schedule management</span>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Automated billing system</span>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Data security & privacy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Admins Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Users className="text-red-500" size={40} />
              For Admins
            </h2>
            <p className="text-lg text-gray-600">Complete control over platform operations and monitoring</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Dashboard */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-red-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Dashboard</h3>
              <p className="text-gray-700 mb-4">Get real-time insights into platform activity:</p>
              <ul className="space-y-2 text-gray-700">
                <li>• Total appointments & revenue</li>
                <li>• Active users and doctors</li>
                <li>• System performance metrics</li>
                <li>• Upcoming appointments</li>
              </ul>
            </div>

            {/* User Management */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-red-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">👥 User Management</h3>
              <p className="text-gray-700 mb-4">Manage all users on the platform:</p>
              <ul className="space-y-2 text-gray-700">
                <li>• Approve/reject doctor registrations</li>
                <li>• View patient profiles</li>
                <li>• Handle user complaints & support</li>
                <li>• Manage user account status</li>
              </ul>
            </div>

            {/* Appointment Management */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-red-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📅 Appointment Control</h3>
              <p className="text-gray-700 mb-4">Oversee all bookings and appointments:</p>
              <ul className="space-y-2 text-gray-700">
                <li>• Monitor all appointments</li>
                <li>• Cancel or reschedule if needed</li>
                <li>• Track no-shows & cancellations</li>
                <li>• Generate appointment reports</li>
              </ul>
            </div>

            {/* Payment Management */}
            <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-red-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">💳 Payment Control</h3>
              <p className="text-gray-700 mb-4">Manage financial transactions:</p>
              <ul className="space-y-2 text-gray-700">
                <li>• View all payments & invoices</li>
                <li>• Verify payment status</li>
                <li>• Generate financial reports</li>
                <li>• Commission management</li>
              </ul>
            </div>
          </div>

          {/* Admin Features */}
          <div className="bg-red-50 rounded-lg p-8 border-l-4 border-red-500">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Admin Capabilities</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Shield className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Full platform oversight</span>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">Financial tracking & reports</span>
              </div>
              <div className="flex items-start gap-3">
                <Users className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">User approval workflows</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700">System quality assurance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Platform Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🔐",
                title: "Secure & Safe",
                desc: "End-to-end encryption and HIPAA-compliant data handling"
              },
              {
                icon: "⚡",
                title: "Fast & Reliable",
                desc: "Real-time updates and 99.9% uptime guarantee"
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                desc: "Seamless experience on desktop, tablet, and mobile"
              },
              {
                icon: "💬",
                title: "24/7 Support",
                desc: "Round-the-clock customer support for all users"
              },
              {
                icon: "🔔",
                title: "Smart Notifications",
                desc: "Automated reminders for appointments and updates"
              },
              {
                icon: "📊",
                title: "Analytics",
                desc: "Detailed reports for doctors and admins"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-50">
            Join thousands of patients and doctors using Happy Health today!
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-50 transition inline-block"
          >
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Happy Health</h3>
              <p className="text-gray-400">Care that makes you smile</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How it Works</Link></li>
                <li><Link to="/signup" className="hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Users</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📧 support@happyhealth.com</li>
                <li>📞 1-800-HEALTH-1</li>
                <li>📍 Available 24/7</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Happy Health. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
