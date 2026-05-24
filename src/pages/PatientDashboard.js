import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctors, getSlots, bookAppointment, getMyAppointments, getMyPrescriptions } from '../api';

export default function PatientDashboard() {
  const [tab, setTab] = useState('find');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [selDoc, setSelDoc] = useState(null);
  const [selSlot, setSelSlot] = useState('');
  const [slots, setSlots] = useState({ available:[], taken:[] });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { loadDoctors(); }, [search, dept]);
  useEffect(() => { if(selDoc && date) loadSlots(); }, [selDoc, date]);

  const loadDoctors = async () => {
    try {
      const res = await getDoctors({ name: search, department: dept });
      setDoctors(res.data.doctors);
    } catch(e) {}
  };

  const loadSlots = async () => {
    try {
      const res = await getSlots(selDoc.id, date);
      setSlots(res.data);
    } catch(e) {}
  };

  const loadAppointments = async () => {
    try {
      const res = await getMyAppointments();
      setAppointments(res.data.appointments);
    } catch(e) {}
  };

  const loadPrescriptions = async () => {
    try {
      const res = await getMyPrescriptions();
      setPrescriptions(res.data.prescriptions);
    } catch(e) {}
  };

  const switchTab = (t) => {
    setTab(t); setError(''); setSuccess('');
    if(t==='my') loadAppointments();
    if(t==='rx') loadPrescriptions();
  };

  const confirmBook = async () => {
    if(!selSlot) { setError('Please select a time slot'); return; }
    if(!phone) { setError('Please enter your mobile number'); return; }
    setBooking(true); setError('');
    try {
      await bookAppointment({ doctor_id: selDoc.id, appt_date: date, appt_time: selSlot, reason });
      setSuccess(`Appointment booked with ${selDoc.name} on ${date} at ${selSlot}! Confirmation sent to your email.`);
      setSelDoc(null); setSelSlot(''); setPhone(''); setReason('');
    } catch(e) {
      setError(e.response?.data?.error || 'Booking failed');
    }
    setBooking(false);
  };

  const logout = () => { localStorage.clear(); navigate('/'); };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.brand}>🏥 MediBook</div>
        <div style={s.hright}>
          <span style={s.uname}>👤 {user.name}</span>
          <button style={s.ghost} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={s.main}>
        {/* TABS */}
        <div style={s.tabs}>
          {[['find','🔍 Find Doctor'],['my','📅 My Appointments'],['rx','📋 Prescriptions'],['profile','👤 Profile']].map(([k,v])=>(
            <button key={k} style={{...s.tab,...(tab===k?s.tabOn:{})}} onClick={()=>switchTab(k)}>{v}</button>
          ))}
        </div>

        {success && <div style={s.successBox}>✅ {success}</div>}
        {error && <div style={s.errorBox}>❌ {error}</div>}

        {/* FIND DOCTOR */}
        {tab==='find' && !selDoc && (
          <>
            <div style={s.searchRow}>
              <input style={s.searchInput} placeholder="Search doctor name..." value={search} onChange={e=>setSearch(e.target.value)} />
              <select style={s.select} value={dept} onChange={e=>setDept(e.target.value)}>
                <option value="">All departments</option>
                {['Cardiology','Neurology','Orthopedics','Dermatology','General Medicine','Pediatrics'].map(d=>(
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            {doctors.map(doc=>(
              <div key={doc.id} style={s.card}>
                <div style={s.docAv}>{doc.name.split(' ').slice(1).map(w=>w[0]).join('')}</div>
                <div style={s.docInfo}>
                  <div style={s.docName}>{doc.name}</div>
                  <div style={s.docMeta}>🏥 {doc.department} · {doc.experience}</div>
                  <span style={{...s.badge,...(doc.available?s.badgeGreen:s.badgeRed)}}>{doc.available?'Available':'Busy'}</span>
                </div>
                <button style={{...s.btn,...(!doc.available?s.btnDis:{})}} disabled={!doc.available} onClick={()=>{setSelDoc(doc);setError('');setSuccess('');}}>Book</button>
              </div>
            ))}
          </>
        )}

        {/* BOOKING */}
        {tab==='find' && selDoc && (
          <div style={s.bookBox}>
            <div style={s.bookHeader}>
              <div>
                <div style={s.docName}>{selDoc.name}</div>
                <div style={s.docMeta}>{selDoc.department}</div>
              </div>
              <button style={s.ghost} onClick={()=>setSelDoc(null)}>✕ Back</button>
            </div>
            <label style={s.label}>Choose date</label>
            <input type="date" style={s.input} value={date} min={today} onChange={e=>setDate(e.target.value)} />
            <label style={s.label}>Available slots</label>
            <div style={s.slotGrid}>
              {slots.available.map(sl=>(
                <div key={sl} style={{...s.slot,...(selSlot===sl?s.slotSel:{})}} onClick={()=>setSelSlot(sl)}>{sl}</div>
              ))}
              {slots.taken.map(sl=>(
                <div key={sl} style={{...s.slot,...s.slotTaken}}>{sl}</div>
              ))}
              {slots.available.length===0 && slots.taken.length===0 && <p style={{color:'#888',fontSize:13}}>Select a date to see slots</p>}
            </div>
            <label style={s.label}>Your mobile number</label>
            <input style={s.input} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" />
            <label style={s.label}>Reason for visit</label>
            <textarea style={{...s.input,height:64,resize:'none'}} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Brief description..." />
            <button style={s.btn} onClick={confirmBook} disabled={booking}>{booking?'Booking...':'Confirm Appointment'}</button>
          </div>
        )}

        {/* MY APPOINTMENTS */}
        {tab==='my' && (
          appointments.length===0
          ? <div style={s.empty}>📅 No appointments yet. Book one from Find Doctor!</div>
          : appointments.map(a=>(
            <div key={a.id} style={s.card}>
              <div style={s.docAv}>{(a.doctor_name||'Dr').split(' ').slice(1).map(w=>w[0]).join('')||'DR'}</div>
              <div style={s.docInfo}>
                <div style={s.docName}>{a.doctor_name}</div>
                <div style={s.docMeta}>🏥 {a.department}</div>
                <div style={s.docMeta}>📅 {a.appt_date} at {a.appt_time}</div>
              </div>
              <span style={{...s.badge,...(a.appt_date>=today?s.badgeGreen:s.badgeGray)}}>{a.status}</span>
            </div>
          ))
        )}

        {/* PRESCRIPTIONS */}
        {tab==='rx' && (
          prescriptions.length===0
          ? <div style={s.empty}>📋 No prescriptions yet. They will appear here after your doctor visit.</div>
          : prescriptions.map(p=>(
            <div key={p.id} style={s.card}>
              <div style={{...s.docAv,background:'#E6F1FB',color:'#0C447C'}}>Rx</div>
              <div style={s.docInfo}>
                <div style={s.docName}>{p.doctor_name}</div>
                <div style={s.docMeta}>📋 {p.diagnosis}</div>
                {p.followup_date && <div style={s.docMeta}>🔔 Follow-up: {p.followup_date}</div>}
              </div>
              <span style={{...s.badge,...s.badgeBlue}}>Follow-up</span>
            </div>
          ))
        )}

        {/* PROFILE */}
        {tab==='profile' && (
          <div style={s.profileBox}>
            <div style={s.profAv}>{user.name?.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
            <div style={s.docName}>{user.name}</div>
            <div style={s.docMeta}>{user.email}</div>
            <div style={s.infoBox}>
              <div style={s.infoRow}><span>📱 SMS reminders:</span><strong style={{color:'#1D9E75'}}>Enabled</strong></div>
              <div style={s.infoRow}><span>📧 Email alerts:</span><strong style={{color:'#1D9E75'}}>Enabled</strong></div>
              <div style={s.infoRow}><span>🔔 Reminder:</span><strong>24 hrs before appointment</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap:{ minHeight:'100vh', background:'#f4f4f1', fontFamily:'sans-serif' },
  header:{ background:'#fff', borderBottom:'1px solid #eee', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52 },
  brand:{ fontSize:16, fontWeight:600, color:'#0F6E56' },
  hright:{ display:'flex', alignItems:'center', gap:12 },
  uname:{ fontSize:13, color:'#555' },
  ghost:{ background:'none', border:'1px solid #ddd', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' },
  main:{ maxWidth:680, margin:'0 auto', padding:20 },
  tabs:{ display:'flex', gap:4, background:'#eee', borderRadius:8, padding:3, marginBottom:16 },
  tab:{ flex:1, padding:'7px 4px', border:'none', background:'none', borderRadius:6, fontSize:11, fontWeight:500, cursor:'pointer', color:'#666' },
  tabOn:{ background:'#fff', color:'#0F6E56', border:'1px solid #ddd' },
  searchRow:{ display:'flex', gap:8, marginBottom:12 },
  searchInput:{ flex:1, padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:13 },
  select:{ padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:12 },
  card:{ background:'#fff', borderRadius:12, padding:'12px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  docAv:{ width:42, height:42, borderRadius:10, background:'#E1F5EE', color:'#0F6E56', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, flexShrink:0 },
  docInfo:{ flex:1 },
  docName:{ fontSize:14, fontWeight:500, color:'#222' },
  docMeta:{ fontSize:12, color:'#888', marginTop:2 },
  badge:{ fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:20 },
  badgeGreen:{ background:'#E1F5EE', color:'#085041' },
  badgeRed:{ background:'#FAECE7', color:'#712B13' },
  badgeBlue:{ background:'#E6F1FB', color:'#0C447C' },
  badgeGray:{ background:'#f1f1f1', color:'#666' },
  btn:{ background:'#1D9E75', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:500, cursor:'pointer' },
  btnDis:{ background:'#ccc', cursor:'not-allowed' },
  bookBox:{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  bookHeader:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  label:{ display:'block', fontSize:12, fontWeight:500, color:'#555', marginBottom:5 },
  input:{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:13, marginBottom:12, boxSizing:'border-box', fontFamily:'inherit' },
  slotGrid:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 },
  slot:{ padding:'8px 4px', border:'1px solid #ddd', borderRadius:7, fontSize:12, textAlign:'center', cursor:'pointer' },
  slotSel:{ background:'#1D9E75', color:'#fff', borderColor:'#1D9E75' },
  slotTaken:{ background:'#f5f5f5', color:'#ccc', cursor:'not-allowed' },
  successBox:{ background:'#E1F5EE', color:'#085041', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12 },
  errorBox:{ background:'#FCEBEB', color:'#A32D2D', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12 },
  empty:{ textAlign:'center', padding:40, color:'#888', fontSize:14 },
  profileBox:{ background:'#fff', borderRadius:12, padding:24, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  profAv:{ width:60, height:60, borderRadius:'50%', background:'#E1F5EE', color:'#0F6E56', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:500, margin:'0 auto 12px' },
  infoBox:{ background:'#f9f9f9', borderRadius:10, padding:16, marginTop:16, textAlign:'left' },
  infoRow:{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid #eee' },
};