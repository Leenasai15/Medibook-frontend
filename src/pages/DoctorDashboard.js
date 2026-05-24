import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayAppointments, updateAppointmentStatus, savePrescription, getFollowups, getNotifications } from '../api';

export default function DoctorDashboard() {
  const [tab, setTab] = useState('appts');
  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selPt, setSelPt] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [fuDate, setFuDate] = useState('');
  const [meds, setMeds] = useState([]);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medDur, setMedDur] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadAppts(); }, []);

  const loadAppts = async () => {
    try {
      const res = await getTodayAppointments();
      setAppointments(res.data.appointments);
    } catch(e) {}
  };

  const loadFollowups = async () => {
    try {
      const res = await getFollowups();
      setFollowups(res.data.followups);
    } catch(e) {}
  };

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
    } catch(e) {}
  };

  const switchTab = (t) => {
    setTab(t); setError(''); setSuccess('');
    if(t==='followups') loadFollowups();
    if(t==='notif') loadNotifications();
  };

  const markDone = async (id) => {
    try {
      await updateAppointmentStatus(id, 'done');
      setAppointments(appointments.map(a => a.id===id ? {...a, status:'done'} : a));
    } catch(e) {}
  };

  const openRx = (appt) => {
    setSelPt(appt);
    setTab('rx');
    setDiagnosis(''); setNotes(''); setFuDate(''); setMeds([]);
    setError(''); setSuccess('');
  };

  const addMed = () => {
    if(!medName) return;
    setMeds([...meds, { name:medName, dosage:medDose, duration:medDur }]);
    setMedName(''); setMedDose(''); setMedDur('');
  };

  const saveRx = async () => {
    if(!selPt) { setError('No patient selected'); return; }
    setSaving(true); setError('');
    try {
      await savePrescription({
        appointment_id: selPt.id,
        patient_id: selPt.patient_user_id,
        diagnosis, medicines: meds, notes,
        followup_date: fuDate || null,
        followup_reason: 'Follow-up visit',
      });
      setSuccess(`Prescription saved for ${selPt.patient_name}! ${fuDate ? 'Follow-up reminder scheduled for '+fuDate : ''}`);
      setSelPt(null); setMeds([]);
    } catch(e) {
      setError(e.response?.data?.error || 'Failed to save prescription');
    }
    setSaving(false);
  };

  const logout = () => { localStorage.clear(); navigate('/'); };

  const statusColor = (s) => s==='done' ? '#085041' : s==='waiting' ? '#633806' : '#0C447C';
  const statusBg = (s) => s==='done' ? '#E1F5EE' : s==='waiting' ? '#FAEEDA' : '#E6F1FB';

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.brand}>🏥 MediBook <span style={s.docTag}>Doctor Portal</span></div>
        <div style={s.hright}>
          <span style={s.uname}>🩺 {user.name}</span>
          <button style={s.ghost} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={s.main}>
        {/* STATS */}
        <div style={s.stats}>
          {[
            ['Today', appointments.length],
            ['Done', appointments.filter(a=>a.status==='done').length],
            ['Waiting', appointments.filter(a=>a.status==='waiting').length],
            ['Confirmed', appointments.filter(a=>a.status==='confirmed').length],
          ].map(([l,n])=>(
            <div key={l} style={s.stat}><div style={s.statN}>{n}</div><div style={s.statL}>{l}</div></div>
          ))}
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          {[['appts','📅 Appointments'],['rx','📋 Write Rx'],['followups','🔔 Follow-ups'],['notif','🔔 Alerts']].map(([k,v])=>(
            <button key={k} style={{...s.tab,...(tab===k?s.tabOn:{})}} onClick={()=>switchTab(k)}>{v}</button>
          ))}
        </div>

        {success && <div style={s.successBox}>✅ {success}</div>}
        {error && <div style={s.errorBox}>❌ {error}</div>}

        {/* APPOINTMENTS */}
        {tab==='appts' && (
          appointments.length===0
          ? <div style={s.empty}>📅 No appointments today</div>
          : appointments.map(a=>(
            <div key={a.id} style={s.card}>
              <div style={s.ptAv}>{a.patient_name?.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
              <div style={s.ptInfo}>
                <div style={s.ptName}>{a.patient_name}</div>
                <div style={s.ptMeta}>⏰ {a.appt_time} · {a.reason}</div>
                <div style={s.ptMeta}>📱 {a.patient_phone}</div>
              </div>
              <div style={s.ptRight}>
                <span style={{...s.badge, background:statusBg(a.status), color:statusColor(a.status)}}>{a.status}</span>
                <div style={{display:'flex',gap:6,marginTop:6}}>
                  <button style={s.smBtn} onClick={()=>openRx(a)}>📋 Rx</button>
                  {a.status!=='done' && <button style={{...s.smBtn,...s.smBtnG}} onClick={()=>markDone(a.id)}>Done</button>}
                </div>
              </div>
            </div>
          ))
        )}

        {/* WRITE RX */}
        {tab==='rx' && (
          <div style={s.rxBox}>
            {!selPt ? (
              <>
                <p style={{color:'#888',fontSize:13,marginBottom:12}}>Select a patient from Appointments tab to write prescription</p>
                {appointments.map(a=>(
                  <div key={a.id} style={{...s.card,cursor:'pointer'}} onClick={()=>openRx(a)}>
                    <div style={s.ptAv}>{a.patient_name?.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
                    <div style={s.ptInfo}>
                      <div style={s.ptName}>{a.patient_name}</div>
                      <div style={s.ptMeta}>⏰ {a.appt_time}</div>
                    </div>
                    <button style={s.smBtn}>Select →</button>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={s.rxHeader}>
                  <div><div style={s.ptName}>{selPt.patient_name}</div><div style={s.ptMeta}>{selPt.appt_time} · {selPt.reason}</div></div>
                  <button style={s.ghost} onClick={()=>setSelPt(null)}>✕ Change</button>
                </div>
                <label style={s.label}>Diagnosis</label>
                <textarea style={{...s.input,height:56,resize:'none'}} value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="e.g. Hypertension Grade II" />
                <label style={s.label}>Medications</label>
                {meds.map((m,i)=>(
                  <div key={i} style={s.medItem}>
                    <span>💊 {m.name} · {m.dosage} · {m.duration}</span>
                    <button style={s.rmBtn} onClick={()=>setMeds(meds.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                ))}
                <div style={s.addMedRow}>
                  <input style={s.miniInput} value={medName} onChange={e=>setMedName(e.target.value)} placeholder="Medicine name" />
                  <input style={s.miniInput} value={medDose} onChange={e=>setMedDose(e.target.value)} placeholder="1-0-1" />
                  <input style={s.miniInput} value={medDur} onChange={e=>setMedDur(e.target.value)} placeholder="30 days" />
                  <button style={s.smBtnG2} onClick={addMed}>+ Add</button>
                </div>
                <label style={s.label}>Doctor's notes</label>
                <textarea style={{...s.input,height:56,resize:'none'}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Diet, lifestyle advice..." />
                <label style={s.label}>Schedule follow-up date</label>
                <input type="date" style={s.input} value={fuDate} min={today} onChange={e=>setFuDate(e.target.value)} />
                {fuDate && <div style={s.smsBox}>📱 Patient will receive an SMS reminder 1 day before {fuDate}</div>}
                <button style={s.saveBtn} onClick={saveRx} disabled={saving}>{saving?'Saving...':'💾 Save Prescription & Schedule Reminder'}</button>
              </>
            )}
          </div>
        )}

        {/* FOLLOW-UPS */}
        {tab==='followups' && (
          followups.length===0
          ? <div style={s.empty}>🔔 No follow-ups scheduled</div>
          : followups.map(f=>(
            <div key={f.id} style={s.card}>
              <div style={s.ptAv}>{f.patient_name?.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
              <div style={s.ptInfo}>
                <div style={s.ptName}>{f.patient_name}</div>
                <div style={s.ptMeta}>📅 {f.followup_date} · {f.reason}</div>
                <div style={s.ptMeta}>📱 {f.patient_phone}</div>
              </div>
              <span style={{...s.badge, background: f.sms_status==='sent'?'#E1F5EE':'#FAEEDA', color: f.sms_status==='sent'?'#085041':'#633806'}}>
                SMS {f.sms_status}
              </span>
            </div>
          ))
        )}

        {/* NOTIFICATIONS */}
        {tab==='notif' && (
          notifications.length===0
          ? <div style={s.empty}>🔔 No notifications</div>
          : notifications.map(n=>(
            <div key={n.id} style={s.notifItem}>
              <div style={s.notifIcon}>{n.type==='new_booking'?'🆕':'🔔'}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:'#222'}}>{n.message}</div>
                <div style={{fontSize:11,color:'#999',marginTop:2}}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  wrap:{ minHeight:'100vh', background:'#f4f4f1', fontFamily:'sans-serif' },
  header:{ background:'#fff', borderBottom:'1px solid #eee', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52 },
  brand:{ fontSize:16, fontWeight:600, color:'#0F6E56' },
  docTag:{ fontSize:11, color:'#378ADD', fontWeight:400, marginLeft:6 },
  hright:{ display:'flex', alignItems:'center', gap:12 },
  uname:{ fontSize:13, color:'#555' },
  ghost:{ background:'none', border:'1px solid #ddd', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' },
  main:{ maxWidth:680, margin:'0 auto', padding:20 },
  stats:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 },
  stat:{ background:'#fff', borderRadius:8, padding:12, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  statN:{ fontSize:22, fontWeight:500, color:'#222' },
  statL:{ fontSize:11, color:'#888', marginTop:2 },
  tabs:{ display:'flex', gap:4, background:'#eee', borderRadius:8, padding:3, marginBottom:16 },
  tab:{ flex:1, padding:'7px 4px', border:'none', background:'none', borderRadius:6, fontSize:11, fontWeight:500, cursor:'pointer', color:'#666' },
  tabOn:{ background:'#fff', color:'#0F6E56', border:'1px solid #ddd' },
  card:{ background:'#fff', borderRadius:12, padding:'12px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  ptAv:{ width:40, height:40, borderRadius:10, background:'#E1F5EE', color:'#0F6E56', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, flexShrink:0 },
  ptInfo:{ flex:1 },
  ptName:{ fontSize:14, fontWeight:500, color:'#222' },
  ptMeta:{ fontSize:12, color:'#888', marginTop:2 },
  ptRight:{ display:'flex', flexDirection:'column', alignItems:'flex-end' },
  badge:{ fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:20 },
  smBtn:{ background:'none', border:'1px solid #ddd', borderRadius:6, padding:'4px 9px', fontSize:11, cursor:'pointer' },
  smBtnG:{ background:'#1D9E75', color:'#fff', border:'none', borderRadius:6, padding:'4px 9px', fontSize:11, cursor:'pointer' },
  smBtnG2:{ background:'#1D9E75', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' },
  rxBox:{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  rxHeader:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #eee' },
  label:{ display:'block', fontSize:12, fontWeight:500, color:'#555', marginBottom:5 },
  input:{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:13, marginBottom:12, boxSizing:'border-box', fontFamily:'inherit' },
  medItem:{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f9f9f9', borderRadius:8, padding:'7px 10px', marginBottom:6, fontSize:13 },
  rmBtn:{ background:'none', border:'none', cursor:'pointer', color:'#E24B4A', fontSize:14 },
  addMedRow:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:12, alignItems:'end' },
  miniInput:{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, fontFamily:'inherit' },
  smsBox:{ background:'#FAEEDA', color:'#854F0B', borderRadius:8, padding:'10px 14px', fontSize:12, marginBottom:12 },
  saveBtn:{ width:'100%', padding:11, background:'#1D9E75', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  successBox:{ background:'#E1F5EE', color:'#085041', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12 },
  errorBox:{ background:'#FCEBEB', color:'#A32D2D', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12 },
  empty:{ textAlign:'center', padding:40, color:'#888', fontSize:14 },
  notifItem:{ background:'#fff', borderRadius:10, padding:'12px 16px', marginBottom:8, display:'flex', gap:10, alignItems:'flex-start', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  notifIcon:{ fontSize:20, flexShrink:0 },
};