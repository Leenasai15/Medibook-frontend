import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', department:'', experience:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const data = isLogin
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({ ...form, role });
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      navigate(data.data.user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>🏥</div>
          <h1 style={styles.brandName}>MediBook</h1>
          <p style={styles.brandSub}>Hospital Appointment System</p>
        </div>

        <div style={styles.roleSwitch}>
          <button style={{...styles.roleBtn, ...(role==='patient'?styles.roleBtnActive:{})}} onClick={()=>setRole('patient')}>👤 Patient</button>
          <button style={{...styles.roleBtn, ...(role==='doctor'?styles.roleBtnActiveDoc:{})}} onClick={()=>setRole('doctor')}>🩺 Doctor</button>
        </div>

        {!isLogin && <input style={styles.input} name="name" placeholder="Full name" onChange={handle} />}
        <input style={styles.input} name="email" placeholder="Email address" onChange={handle} />
        <input style={styles.input} name="password" type="password" placeholder="Password" onChange={handle} />
        {!isLogin && <input style={styles.input} name="phone" placeholder="Mobile number" onChange={handle} />}
        {!isLogin && role==='doctor' && <>
          <input style={styles.input} name="department" placeholder="Department (e.g. Cardiology)" onChange={handle} />
          <input style={styles.input} name="experience" placeholder="Experience (e.g. 10 years)" onChange={handle} />
        </>}

        {error && <div style={styles.error}>{error}</div>}

        <button style={{...styles.btn, background: role==='doctor'?'#378ADD':'#1D9E75'}} onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : isLogin ? `Sign in as ${role}` : `Register as ${role}`}
        </button>

        <p style={styles.toggle}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={styles.link} onClick={()=>setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f4f1' },
  card:{ background:'#fff', borderRadius:16, padding:32, width:'100%', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  brand:{ textAlign:'center', marginBottom:24 },
  brandIcon:{ fontSize:40, marginBottom:8 },
  brandName:{ fontSize:24, fontWeight:600, color:'#0F6E56', margin:0 },
  brandSub:{ fontSize:13, color:'#888', marginTop:4 },
  roleSwitch:{ display:'flex', gap:8, marginBottom:16 },
  roleBtn:{ flex:1, padding:'8px 0', border:'1px solid #ddd', borderRadius:8, background:'none', cursor:'pointer', fontSize:13, fontWeight:500 },
  roleBtnActive:{ background:'#E1F5EE', borderColor:'#1D9E75', color:'#0F6E56' },
  roleBtnActiveDoc:{ background:'#E6F1FB', borderColor:'#378ADD', color:'#0C447C' },
  input:{ width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:13, marginBottom:10, boxSizing:'border-box', fontFamily:'inherit' },
  btn:{ width:'100%', padding:11, border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', marginTop:4 },
  error:{ background:'#FCEBEB', color:'#A32D2D', padding:'8px 12px', borderRadius:8, fontSize:12, marginBottom:10 },
  toggle:{ textAlign:'center', fontSize:13, color:'#888', marginTop:16 },
  link:{ color:'#1D9E75', cursor:'pointer', fontWeight:500 },
};