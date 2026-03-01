
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  Users, 
  Heart, 
  Map as MapIcon, 
  AlertTriangle, 
  Loader2, 
  Phone, 
  ArrowLeft,
  Stethoscope,
  Building2,
  Terminal,
  ShieldCheck,
  Fingerprint,
  Activity,
  Droplets,
  ChevronDown,
  Globe
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 
  'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 
  'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Patna', 'Vadodara'
];

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Phone State (Simplified - No Country Code dropdown)
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [role, setRole] = useState<UserRole>('community');
  const [city, setCity] = useState<string>('Mumbai');
  
  // Role specific metadata states
  const [emergencyContact, setEmergencyContact] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');

  // Vetting & Vitals
  const [idType, setIdType] = useState<string>('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [experienceYears, setExperienceYears] = useState<string>('0');
  const [bio, setBio] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Sanitize phone number (remove non-digits)
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');

    if (tab === 'register') {
      if (!city) { setError('Please select your city.'); return; }
      if (!sanitizedPhone) { setError('Phone number is required for emergency coordination.'); return; }
      if (sanitizedPhone.length < 10) { setError('Please enter a valid mobile number (10+ digits).'); return; }
      if (!idNumber) { setError('Identification number is mandatory for vetting.'); return; }
      
      // Basic validation for role-specific fields
      if (role === 'community' && !emergencyContact) { setError('Emergency contact is required for Community members.'); return; }
      if (role === 'volunteer' && !specialization) { setError('Please specify your specialization.'); return; }
      if (role === 'resource_manager' && !organization) { setError('Organization name is required for Supply Leads.'); return; }
      if (role === 'coordinator' && !department) { setError('Department/Unit is required for Coordinators.'); return; }
    }

    setIsSubmitting(true);

    try {
      if (tab === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              city: city,
              phone_number: sanitizedPhone, 
              emergency_contact: emergencyContact,
              specialization: specialization,
              organization: organization,
              department: department,
              id_type: idType,
              id_number: idNumber,
              blood_group: bloodGroup,
              experience_years: parseInt(experienceYears, 10),
              bio: bio
            }
          }
        });
        if (signUpError) throw signUpError;
        alert("Registration successful. Please proceed to login.");
        setTab('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { id: 'community', label: 'Community', icon: <Users size={18} /> },
    { id: 'volunteer', label: 'Volunteer', icon: <Heart size={18} /> },
    { id: 'resource_manager', label: 'Supply Lead', icon: <Briefcase size={18} /> },
    { id: 'coordinator', label: 'Coordinator', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative py-12">
      <button 
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-600 hover:border-red-600 hover:shadow-md transition-all active:scale-95 group z-50"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
        Back to Portal
      </button>

      <Link to="/" className="flex items-center space-x-4 mb-8 group">
        <div className="p-3 bg-red-600 rounded text-white shadow-xl">
          <Shield className="h-10 w-10" />
        </div>
        <div>
          <span className="text-2xl font-black text-[#002147] tracking-tight block leading-none">CrisisLink India</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">National Command Network</span>
        </div>
      </Link>

      <div className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 rounded-[2rem]">
        <div className="flex border-b border-slate-100">
          <button onClick={() => setTab('login')} className={`flex-1 py-4 font-black text-[11px] uppercase tracking-widest transition-colors ${tab === 'login' ? 'text-[#002147] bg-white border-b-4 border-yellow-500' : 'text-slate-400 bg-slate-50'}`}>Responder Log In</button>
          <button onClick={() => setTab('register')} className={`flex-1 py-4 font-black text-[11px] uppercase tracking-widest transition-colors ${tab === 'register' ? 'text-[#002147] bg-white border-b-4 border-yellow-500' : 'text-slate-400 bg-slate-50'}`}>New Enrollment</button>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#002147] tracking-tight uppercase">{tab === 'login' ? 'Operational Access' : 'Authority Enrollment'}</h2>
            <div className="w-12 h-1 bg-yellow-500 mt-2"></div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 text-red-700" />
              <span className="text-[10px] font-black uppercase text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {tab === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input required type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 918652334546" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Operational Sector</label>
                    <div className="relative">
                      <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select required value={city} onChange={(e) => setCity(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs appearance-none">
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Group</label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={16} />
                      <select required value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs appearance-none">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Years of Relevant Experience</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input required type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify Your Force Capacity</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((r) => (
                      <button key={r.id} type="button" onClick={() => setRole(r.id as UserRole)} className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${role === r.id ? 'bg-[#002147] border-[#002147] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                        {r.icon}
                        <span className="text-[9px] font-black uppercase tracking-widest">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Fingerprint size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Vetting</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ID Type</label>
                      <select required value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs">
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Passport">Passport</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ID Number</label>
                      <input required type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter unique ID" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Professional Bio / Mission Experience</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Briefly describe your expertise or prior relief work..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs resize-none" />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Role-Specific Credentials</span>
                  </div>
                  
                  {role === 'community' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Emergency Contact Number</label>
                      <div className="relative">
                        <Heart className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                        <input required type="tel" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Next of Kin Contact" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
                      </div>
                    </div>
                  )}

                  {role === 'volunteer' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Operational Specialization</label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                        <select required value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs appearance-none">
                          <option value="">Select Capacity</option>
                          <option value="Search & Rescue">Search & Rescue</option>
                          <option value="Medical Responder">Medical Responder</option>
                          <option value="Logistics Support">Logistics Support</option>
                          <option value="Crisis Counseling">Crisis Counseling</option>
                          <option value="Technical/IT Support">Technical/IT Support</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {role === 'resource_manager' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Associated Organization</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                        <input required type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Red Cross, Local Food Bank" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
                      </div>
                    </div>
                  )}

                  {role === 'coordinator' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Command Department / Unit</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                        <input required type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Municipal Disaster Unit" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" placeholder="responder@crisislink.in" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Passkey</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002147] outline-none font-bold text-xs" />
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-[#002147] text-white font-black rounded-xl shadow-xl hover:bg-slate-900 disabled:opacity-50 transition-all mt-4 uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-2 border-b-4 border-yellow-500 active:scale-95">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (tab === 'login' ? 'Establish Connection' : 'Validate & Enroll')}
            </button>
          </form>
        </div>
      </div>
      
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] mt-8">CrisisLink India • Secure Auth Node</p>
    </div>
  );
};

export default Auth;
