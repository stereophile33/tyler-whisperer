'use client';
import { useState, useRef } from 'react';

const CTX = `Tyler Palmer profile: CEO PayClearly merging with Interopay. Conclusion-first communicator. Lettered options with tradeoffs. Precise numbers. Zero corporate fluff. Terse when not ready = processing. Pre-empts counterarguments. Root cause not symptoms. Casual channels: lowercase, action-first, no pleasantries. Responds to: numbers first, clear ask, dense brevity, proactive FYIs. Known Jonathan Ortiz-Myers since 2019. Genuine warmth under directness. Payments savant, likely on spectrum.`;

const NO_HALLUCINATE = `CRITICAL: Do NOT invent, fabricate, or add ANY factual information not explicitly present in the original text. No made-up numbers, KPIs, revenue figures, role titles, names, dates, or metrics. Only rewrite tone, structure, and phrasing. All original facts must remain exactly as stated.`;

async function api(prompt) {
  const r = await fetch('/api/whisper', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || 'API error');
  return d.content?.[0]?.text || '';
}

function Loader({ msg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b6866', fontSize: 12, fontFamily: 'monospace' }}>
      <div style={{ width: 11, height: 11, border: '1.5px solid rgba(255,255,255,0.08)', borderTopColor: '#c8a96e', borderRadius: '50%', animation: 'sp 0.7s linear infinite' }} />
      {msg}
    </div>
  );
}

function Section({ label, content, type }) {
  const s = {
    rewrite: { borderLeft: '2px solid #5b8fc8', paddingLeft: 12, color: '#e8e6e1' },
    plain: { color: '#e8e6e1' },
    red: { borderLeft: '2px solid #c06060', padding: '8px 12px', background: 'rgba(192,96,96,0.07)', color: '#e8c4c4', fontSize: 13 },
    green: { borderLeft: '2px solid #6a9e78', padding: '8px 12px', background: 'rgba(106,158,120,0.07)', color: '#c4e8cc', fontSize: 13 },
    suggest: { borderLeft: '2px solid #c8a030', padding: '6px 12px', background: 'rgba(200,160,48,0.08)', color: '#e8d4a0', fontSize: 13 },
    voice: { borderLeft: '2px solid rgba(255,255,255,0.15)', paddingLeft: 10, color: '#6b6866', fontSize: 12, fontStyle: 'italic' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6866' }}>{label}</span>
      <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', ...s[type] }}>{content}</div>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState('draft');
  const [ctx, setCtx] = useState('email');
  const [goal, setGoal] = useState('');
  const [draft, setDraft] = useState('');
  const [decodeMsg, setDecodeMsg] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef(null);

  function addSection(sec) { setSections(prev => [...prev, sec]); }
  function updateLast(sec) { setSections(prev => { const n = [...prev]; n[n.length - 1] = sec; return n; }); }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true); setFileName(file.name); setDraft('');
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/parse', { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDraft(d.text);
      if (file.name.endsWith('.pptx')) setCtx('presentation');
      else if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) setCtx('doc');
    } catch (err) { alert('Could not read file: ' + err.message); setFileName(null); }
    setFileLoading(false); e.target.value = '';
  }

  function clearFile() { setFileName(null); setDraft(''); }

  const inp = { background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#e8e6e1', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.65, padding: '8px 12px', outline: 'none', width: '100%' };
  const chip = (on) => ({ background: on ? 'rgba(200,169,110,0.12)' : 'none', border: on ? '1px solid #c8a96e' : '1px solid rgba(255,255,255,0.08)', borderRadius: 3, color: on ? '#c8a96e' : '#6b6866', fontFamily: 'monospace', fontSize: 10, padding: '3px 8px', cursor: 'pointer' });
  const tab = (on) => ({ background: on ? 'rgba(200,169,110,0.12)' : 'none', border: on ? '1px solid #c8a96e' : '1px solid rgba(255,255,255,0.08)', color: on ? '#c8a96e' : '#6b6866', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 16px', cursor: 'pointer' });

  async function runDraft() {
    if (!draft.trim()) return;
    setLoading(true); setSections([]);
    const g = goal ? `
Goal: ${goal}` : '';
    const snippet = draft.substring(0, 600);
    try {
      addSection({ label: 'Detecting voice...', content: null, type: 'loader' });
      const voice = await api(`Read this text and identify the narrative voice in one sentence. First person (I/we/my/our) or third person (he/she/they/by name)? TEXT: ${snippet}`);
      updateLast({ label: 'Voice detected', content: voice, type: 'voice' });

      addSection({ label: 'Rewriting...', content: null, type: 'loader' });
      const rewrite = await api(`${CTX}${g}
${NO_HALLUCINATE}

Rewrite this ${ctx} for Tyler. Lead with conclusions, tight structure, crisp asks.

VOICE RULE: Text is written in ${voice} — preserve this exact voice throughout. Do not switch perspective.

ORIGINAL:
${draft}

Return ONLY the rewritten text.`);
      updateLast({ label: 'Rewritten version', content: rewrite, type: 'rewrite' });

      addSection({ label: 'Changes...', content: null, type: 'loader' });
      const changes = await api(`${CTX}${g}
Original: ${draft.substring(0,400)}
Rewritten: ${rewrite.substring(0,400)}

List 3 most important changes for Tyler. Numbered, one sentence each. Your own voice. Stop after 3.`);
      updateLast({ label: 'What changed & why', content: changes, type: 'plain' });

      addSection({ label: 'Risks...', content: null, type: 'loader' });
      const risk = await api(`${CTX}${g}
Content: ${snippet}

Biggest risk before sending this to Tyler? One sentence. Your own voice.`);
      updateLast({ label: 'Watch out for', content: risk, type: 'red' });

      for (const s of [
        { label: 'Framing', q: `${CTX}${g}
Content: ${snippet}

One piece of framing Jonathan should add before Tyler reads this? One sentence.` },
        { label: 'Timing', q: `${CTX}${g}
Content: ${snippet}

When should Jonathan send this for max receptivity from Tyler? One sentence.` },
        { label: 'If no reply', q: `${CTX}${g}
Content: ${snippet}

If Tyler doesn't engage within 48hrs, what should Jonathan do? One sentence.` },
      ]) {
        addSection({ label: s.label + '...', content: null, type: 'loader' });
        const ans = await api(s.q);
        updateLast({ label: s.label, content: ans.trim(), type: 'suggest' });
      }
    } catch (err) { addSection({ label: 'Error', content: err.message, type: 'red' }); }
    setLoading(false);
  }

  async function runDecode() {
    if (!decodeMsg.trim()) return;
    setLoading(true); setSections([]);
    const base = `${CTX}
Tyler's message: "${decodeMsg}"`;
    try {
      for (const s of [
        { label: 'What he means', type: 'rewrite', q: `${base}

What is Tyler actually communicating? Two sentences max. Start directly.` },
        { label: 'Tone read', type: 'plain', q: `${base}

Tyler's tone? Name it and one specific signal. Two sentences max.` },
        { label: 'Friction signals', type: 'friction', q: `${base}

Friction signals? If yes: one sentence. If no: say exactly "None detected."` },
        { label: 'Suggested next move', type: 'plain', q: `${base}

Best next move for Jonathan? Two sentences max. Complete both.` },
      ]) {
        addSection({ label: s.label + '...', content: null, type: 'loader' });
        const ans = await api(s.q);
        const t = s.type === 'friction' ? (ans.toLowerCase().includes('none') ? 'green' : 'red') : s.type;
        updateLast({ label: s.label, content: ans.trim(), type: t });
      }
    } catch (err) { addSection({ label: 'Error', content: err.message, type: 'red' }); }
    setLoading(false);
  }

  return (
    <>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}body{background:#0d0d0d;color:#e8e6e1;font-family:'Helvetica Neue',sans-serif;font-weight:300;min-height:100vh}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}.drop-zone{border:1px dashed rgba(255,255,255,0.12);border-radius:6px;padding:14px 12px;text-align:center;cursor:pointer;transition:border-color 0.2s}.drop-zone:hover{border-color:rgba(200,169,110,0.4)}`}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#c8a96e' }}>The <em>Tyler</em> Whisperer</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b6866', letterSpacing: '0.1em', textTransform: 'uppercase' }}>PayClearly · Interopay · Confidential</div>
        </header>
        <div style={{ display: 'flex', padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button style={{ ...tab(mode==='draft'), borderRadius: '4px 0 0 4px' }} onClick={() => { setMode('draft'); setSections([]); }}>Draft review</button>
          <button style={{ ...tab(mode==='decode'), borderRadius: '0 4px 4px 0', borderLeft: 'none' }} onClick={() => { setMode('decode'); setSections([]); }}>Decode Tyler</button>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            {mode==='draft' ? (<>
              <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: '#6b6866', textTransform: 'uppercase' }}>Channel / format</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['email','slack','imessage','doc','proposal','presentation'].map(c => (
                  <button key={c} style={chip(ctx===c)} onClick={() => setCtx(c)}>{c}</button>
                ))}
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: '#6b6866', textTransform: 'uppercase' }}>What are you trying to achieve?</span>
              <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Get Tyler aligned on my role without it feeling like I'm staking territory..." style={{ ...inp, minHeight: 52, resize: 'none' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: '#6b6866', textTransform: 'uppercase' }}>Upload or paste</span>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.pptx,.txt,.md" style={{ display: 'none' }} onChange={handleFile} />
              {fileName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(200,169,110,0.07)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 6, padding: '8px 12px' }}>
                  <span style={{ fontSize: 12, color: '#c8a96e', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {fileName}</span>
                  <button onClick={clearFile} style={{ background: 'none', border: 'none', color: '#6b6866', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ) : (
                <div className="drop-zone" onClick={() => fileRef.current?.click()}>
                  {fileLoading ? <span style={{ color: '#6b6866', fontSize: 12 }}>Reading file...</span>
                    : <span style={{ color: '#6b6866', fontSize: 12 }}>Click to upload <span style={{ color: '#c8a96e' }}>PDF · DOCX · PPTX · TXT</span></span>}
                </div>
              )}
              <textarea value={draft} onChange={e => { setDraft(e.target.value); if (fileName) setFileName(null); }} placeholder="Or paste your draft here..." style={{ ...inp, flex: 1, minHeight: 130, resize: 'vertical' }} />
              <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#6b6866' }}>
                <strong style={{ color: '#c8a96e', fontWeight: 500 }}>Tyler model v2.</strong> Detects and preserves voice. Never invents data.
              </div>
              <button onClick={runDraft} disabled={loading || !draft.trim()} style={{ alignSelf: 'flex-start', background: '#c8a96e', border: 'none', color: '#0d0d0d', fontFamily: 'monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 18px', borderRadius: 4, cursor: (loading || !draft.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !draft.trim()) ? 0.4 : 1 }}>Whisper it</button>
            </>) : (<>
              <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: '#6b6866', textTransform: 'uppercase' }}>Tyler's message</span>
              <textarea value={decodeMsg} onChange={e => setDecodeMsg(e.target.value)} placeholder="Paste what Tyler wrote — email, Slack, iMessage, anything..." style={{ ...inp, flex: 1, minHeight: 220, resize: 'vertical' }} />
              <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#6b6866' }}>
                <strong style={{ color: '#c8a96e', fontWeight: 500 }}>Decode mode.</strong> What he means, tone, friction, next move.
              </div>
              <button onClick={runDecode} disabled={loading} style={{ alignSelf: 'flex-start', background: '#c8a96e', border: 'none', color: '#0d0d0d', fontFamily: 'monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 18px', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.4 : 1 }}>Decode</button>
            </>)}
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: '#6b6866', textTransform: 'uppercase' }}>{mode==='draft' ? 'Tyler-optimised output' : 'Reading'}</span>
            {sections.length===0 && <span style={{ color: '#6b6866', fontStyle: 'italic', fontSize: 13 }}>Output appears here.</span>}
            {sections.map((s,i) => s.type==='loader' ? <Loader key={i} msg={s.label} /> : <Section key={i} label={s.label} content={s.content} type={s.type} />)}
          </div>
        </div>
      </div>
    </>
  );
}
