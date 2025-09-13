// School Weekly Planner (single-file React component)
// Usage notes (read before running):
// 1) This is a single React component (default export). Drop it into a Create React App / Vite project as App.jsx
// 2) Tailwind CSS is used for styling. Make sure your project has Tailwind set up (or replace classes with your own CSS).
// 3) Google Calendar integration:
//    - Replace CLIENT_ID below with your OAuth2 client ID from Google Cloud Console.
//    - The app loads Google's gapi library at runtime and requests calendar scopes.
//    - On sign-in, this will create events in the user's primary calendar.
// 4) Local storage fallback: assignments are stored in localStorage so the app works without Google signed-in.
// 5) This app focuses on 4 classes: French, English, Math, Chemistry. You can add events/assignments quickly.

import React, {useEffect, useState, useMemo} from 'react';

// === CONFIG ===
const CLIENT_ID = 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
// =================

const SUBJECTS = [
  {id: 'french', name: 'French'},
  {id: 'english', name: 'English'},
  {id: 'math', name: 'Math'},
  {id: 'chemistry', name: 'Chemistry'},
];

const storageKey = 'school_planner_assignments_v1';

function loadGapiScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) return resolve(window.gapi);
    const s = document.createElement('script');
    s.src = 'https://apis.google.com/js/api.js';
    s.onload = () => resolve(window.gapi);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

export default function PlannerApp() {
  const [view, setView] = useState('week'); // week | month | subject
  const [date, setDate] = useState(new Date());
  const [assignments, setAssignments] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });
  const [filterSubject, setFilterSubject] = useState('all');
  const [gapiReady, setGapiReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    // load gapi and initialize client
    loadGapiScript().then((gapi) => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES,
          });
          setGapiReady(true);
          const auth = gapi.auth2.getAuthInstance();
          const signed = auth.isSignedIn.get();
          setSignedIn(signed);
          if (signed) setUserProfile(auth.currentUser.get().getBasicProfile());
          auth.isSignedIn.listen((s) => {
            setSignedIn(s);
            if (s) setUserProfile(auth.currentUser.get().getBasicProfile()); else setUserProfile(null);
          });
        } catch (err) {
          console.error('gapi init failed', err);
        }
      });
    }).catch(err => console.error('gapi load error', err));
  }, []);

  // Helpers for date math
  const startOfWeek = (d) => {
    const day = new Date(d);
    const diff = day.getDate() - day.getDay() + 1; // Monday as start
    day.setDate(diff);
    day.setHours(0,0,0,0);
    return day;
  };

  const nextWeek = () => setDate(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; });
  const prevWeek = () => setDate(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextMonth = () => setDate(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n; });
  const prevMonth = () => setDate(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n; });

  const addAssignment = async (payload, pushToGoogle=false) => {
    setAssignments(prev => {
      const item = {...payload, id: cryptoRandomId(), createdAt: new Date().toISOString()};
      return [...prev, item];
    });
    if (pushToGoogle && gapiReady && signedIn) {
      try { await createGoogleEvent(payload); }
      catch(e){ console.error('Google event failed', e); }
    }
  };

  const updateAssignment = (id, patch) => {
    setAssignments(prev => prev.map(a => a.id===id ? {...a, ...patch} : a));
  };
  const deleteAssignment = (id) => setAssignments(prev => prev.filter(a=>a.id!==id));

  const assignmentsForRange = (start, end) => {
    return assignments.filter(a => {
      const d = new Date(a.due);
      return d >= start && d <= end && (filterSubject==='all' || a.subject===filterSubject);
    }).sort((x,y)=> new Date(x.due) - new Date(y.due));
  };

  // Google Calendar functions
  async function signIn() {
    const auth = window.gapi.auth2.getAuthInstance();
    await auth.signIn();
  }
  async function signOut() {
    const auth = window.gapi.auth2.getAuthInstance();
    await auth.signOut();
  }

  async function createGoogleEvent({title, description, due, durationMinutes=60}) {
    const g = window.gapi;
    if (!g || !g.client) throw new Error('gapi not ready');
    const start = new Date(due);
    const end = new Date(start.getTime() + durationMinutes*60000);
    const event = {
      summary: title,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    };
    const res = await g.client.calendar.events.insert({ calendarId: 'primary', resource: event });
    return res;
  }

  // UI data
  const weekStart = startOfWeek(date);
  const weekDays = useMemo(()=>{
    const days = [];
    for (let i=0;i<7;i++){ const d = new Date(weekStart); d.setDate(weekStart.getDate()+i); days.push(d); }
    return days;
  },[date]);

  // generate a unique id
  function cryptoRandomId() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16)
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">School Planner</h1>

          <div className="flex gap-3 items-center">
            <div className="text-sm text-gray-600">View:</div>
            <select value={view} onChange={e=>setView(e.target.value)} className="border rounded p-1">
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="subject">By Subject</option>
            </select>

            <div className="flex items-center gap-2">
              {gapiReady ? (
                signedIn ? (
                  <div className="flex items-center gap-2">
                    <img alt="avatar" src={userProfile ? userProfile.getImageUrl() : ''} className="w-8 h-8 rounded-full" />
                    <button onClick={signOut} className="px-3 py-1 border rounded">Sign out</button>
                  </div>
                ) : (
                  <button onClick={signIn} className="px-3 py-1 border rounded">Sign in with Google</button>
                )
              ) : (<div className="text-xs text-gray-500">Google loading…</div>)}
            </div>
          </div>
        </header>

        <main className="bg-white p-4 rounded shadow">
          <Toolbar
            date={date}
            setDate={setDate}
            prevWeek={prevWeek}
            nextWeek={nextWeek}
            prevMonth={prevMonth}
            nextMonth={nextMonth}
            view={view}
          />

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-2">
              {view==='week' && (
                <WeekView days={weekDays} assignments={assignments} onEdit={updateAssignment} onDelete={deleteAssignment} filterSubject={filterSubject} setFilterSubject={setFilterSubject} addAssignment={addAssignment} gapiReady={gapiReady} signedIn={signedIn} />
              )}
              {view==='month' && (
                <MonthView date={date} assignments={assignments} addAssignment={addAssignment} filterSubject={filterSubject} setFilterSubject={setFilterSubject} />
              )}
              {view==='subject' && (
                <SubjectView assignments={assignments} subjects={SUBJECTS} filterSubject={filterSubject} setFilterSubject={setFilterSubject} onEdit={updateAssignment} onDelete={deleteAssignment} addAssignment={addAssignment} />
              )}
            </div>

            <div>
              <QuickAdd subjects={SUBJECTS} onAdd={addAssignment} gapiReady={gapiReady} signedIn={signedIn} />

              <div className="mt-4 p-3 border rounded">
                <h3 className="font-medium">Filters</h3>
                <label className="block mt-2 text-sm">Subject</label>
                <select value={filterSubject} onChange={e=>setFilterSubject(e.target.value)} className="w-full border rounded p-1">
                  <option value="all">All</option>
                  {SUBJECTS.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <div className="mt-4 text-sm text-gray-600">Assignments saved locally and optionally pushed to Google Calendar when you choose "Create in Google".</div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-4 text-xs text-gray-500">Simple school planner built with React. Replace CLIENT_ID at top with your Google OAuth client ID to enable calendar pushes.</footer>
      </div>
    </div>
  );
}

function Toolbar({date, prevWeek, nextWeek, prevMonth, nextMonth, view}){
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={prevWeek} className="px-2 py-1 border rounded">◀</button>
        <button onClick={nextWeek} className="px-2 py-1 border rounded">▶</button>
        <div className="ml-2 text-sm text-gray-700">{date.toDateString()}</div>
      </div>
      <div className="text-sm text-gray-600">{view==='month' ? 'Month view' : view==='week' ? 'Week view' : 'Subject view'}</div>
    </div>
  );
}

function WeekView({days, assignments, onEdit, onDelete, filterSubject, setFilterSubject, addAssignment, gapiReady, signedIn}){
  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {days.map(d=> (
          <div key={d.toDateString()} className="p-2 border rounded bg-gray-50">
            <div className="font-medium text-sm">{d.toLocaleDateString(undefined,{weekday:'short'})} {d.getDate()}</div>
            <div className="mt-2 space-y-2">
              {assignments.filter(a=> sameDay(new Date(a.due), d)).map(a=> (
                <div key={a.id} className="p-1 border rounded bg-white">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-gray-500">{SUBJECTS.find(s=>s.id===a.subject)?.name || a.subject} • {new Date(a.due).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div className="mt-1 flex gap-2">
                    <button className="text-xs underline" onClick={()=> onEdit(a.id, {done: !a.done})}>{a.done ? 'Mark undone' : 'Mark done'}</button>
                    <button className="text-xs underline" onClick={()=> onDelete(a.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthView({date, assignments, addAssignment, filterSubject, setFilterSubject}){
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth()+1, 0);
  const daysInMonth = end.getDate();
  const firstWeekday = start.getDay();
  const blanks = (firstWeekday + 6) % 7; // shift to Monday start
  const cells = [];
  for (let i=0;i<blanks;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(date.getFullYear(), date.getMonth(), d));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-600">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(h=> <div key={h} className="text-center font-medium">{h}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mt-2">
        {cells.map((c, i)=> (
          <div key={i} className={`p-2 min-h-[80px] border rounded ${c ? 'bg-white' : 'bg-gray-50'}`}>
            {c && (
              <>
                <div className="text-sm font-medium">{c.getDate()}</div>
                <div className="mt-1 text-xs space-y-1">
                  {assignments.filter(a=> sameDay(new Date(a.due), c) && (filterSubject==='all' || a.subject===filterSubject)).slice(0,3).map(a=> (
                    <div key={a.id} className="text-xs">• {a.title} <span className="text-gray-400">({SUBJECTS.find(s=>s.id===a.subject)?.name||a.subject})</span></div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectView({assignments, subjects, filterSubject, setFilterSubject, onEdit, onDelete, addAssignment}){
  return (
    <div>
      <div className="flex gap-2">
        {['all', ...subjects.map(s=>s.id)].map(sid => (
          <button key={sid} onClick={()=>setFilterSubject(sid)} className={`px-2 py-1 rounded ${filterSubject===sid ? 'bg-blue-600 text-white' : 'border'}`}>
            {sid==='all' ? 'All' : subjects.find(x=>x.id===sid).name}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {assignments.filter(a=> filterSubject==='all' || a.subject===filterSubject).sort((x,y)=> new Date(x.due)-new Date(y.due)).map(a=> (
          <div key={a.id} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-gray-500">{SUBJECTS.find(s=>s.id===a.subject)?.name || a.subject} • {new Date(a.due).toLocaleString()}</div>
                {a.description && <div className="mt-2 text-sm">{a.description}</div>}
              </div>
              <div className="flex flex-col gap-2">
                <button className="text-sm underline" onClick={()=> onEdit(a.id, {done: !a.done})}>{a.done ? 'Undone' : 'Done'}</button>
                <button className="text-sm underline" onClick={()=> onDelete(a.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

function QuickAdd({subjects, onAdd, gapiReady, signedIn}){
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(subjects[0].id);
  const [due, setDue] = useState(() => {
    const d = new Date(); d.setHours(18,0,0,0); return d.toISOString().slice(0,16);
  });
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');
  const [pushToGoogle, setPushToGoogle] = useState(false);

  const submit = (e) => {
    e && e.preventDefault();
    if (!title) return alert('Please enter a title');
    const payload = {title, subject, due: new Date(due).toISOString(), durationMinutes: Number(duration), description};
    onAdd(payload, pushToGoogle);
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={submit} className="p-3 border rounded bg-white">
      <h3 className="font-medium mb-2">Quick add</h3>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Assignment title" className="w-full border rounded p-1 mb-2" />
      <div className="flex gap-2 mb-2">
        <select value={subject} onChange={e=>setSubject(e.target.value)} className="border rounded p-1 flex-1">
          {subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} className="border rounded p-1" />
      </div>
      <input type="number" min={0} value={duration} onChange={e=>setDuration(e.target.value)} className="w-full border rounded p-1 mb-2" placeholder="Duration minutes" />
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional notes" className="w-full border rounded p-1 mb-2" rows={3} />

      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={pushToGoogle} onChange={e=>setPushToGoogle(e.target.checked)} /> Create in Google
        </label>
        {pushToGoogle && !gapiReady && <div className="text-xs text-red-500">Google not ready</div>}
        {pushToGoogle && gapiReady && !signedIn && <div className="text-xs text-yellow-600">You will be prompted to sign in</div>}
      </div>

      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1 border rounded">Add</button>
      </div>
    </form>
  );
}

// Small util
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
