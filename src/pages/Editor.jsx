import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineSave, HiOutlineSparkles, HiOutlineTrash, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';
import api from '../api/client';

export default function Editor() {
  const { resumeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(location.state?.resumeData || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!data && resumeId) {
      api.get(`/resume/${resumeId}`).then(res => setData(res.data.resumeData)).catch(() => navigate('/dashboard'));
    }
  }, [resumeId]);

  const updateField = (path, value) => {
    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
        obj = obj[key];
      }
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const addItem = (path) => {
    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let arr = copy;
      for (const k of keys) arr = arr[isNaN(k) ? k : parseInt(k)];
      if (path.includes('workExperience')) arr.push({ company: '', role: '', location: '', startDate: '', endDate: '', description: '', points: [], techStack: [] });
      else if (path.includes('projects')) arr.push({ name: '', description: '', points: [], techStack: [] });
      else if (path.includes('education')) arr.push({ institution: '', degree: '', field: '', startYear: '', endYear: '', score: '' });
      else arr.push('');
      return copy;
    });
  };

  const removeItem = (path, index) => {
    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let arr = copy;
      for (const k of keys) arr = arr[isNaN(k) ? k : parseInt(k)];
      arr.splice(index, 1);
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/resume/${resumeId}`, data);
      setMessage('Saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="loading-overlay"><div className="loading-pulse" /></div>;

  const { personalInfo, workExperience = [], skills = {}, projects = [], education = [] } = data;

  return (
    <div className="page fade-in" style={{ maxWidth: '900px' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="display-sm">Edit Resume</h1>
        <div className="flex gap-3 items-center">
          {message && <span className={message.includes('Failed') ? 'text-error' : 'text-success'} style={{ fontSize: '0.85rem' }}>{message}</span>}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : <><HiOutlineSave /> Save</>}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/tailor/${resumeId}`)}>
            <HiOutlineSparkles /> Tailor for Job
          </button>
        </div>
      </div>

      {/* Personal Info */}
      <Section title="Personal Info">
        <div className="grid-2">
          <Field label="Full Name" value={personalInfo.fullName} onChange={v => updateField('personalInfo.fullName', v)} />
          <Field label="Email" value={personalInfo.email} onChange={v => updateField('personalInfo.email', v)} />
          <Field label="Phone" value={personalInfo.phone} onChange={v => updateField('personalInfo.phone', v)} />
          <Field label="LinkedIn" value={personalInfo.linkedin} onChange={v => updateField('personalInfo.linkedin', v)} />
          <Field label="GitHub" value={personalInfo.github} onChange={v => updateField('personalInfo.github', v)} />
        </div>
      </Section>

      {/* Work Experience */}
      <Section title="Work Experience" onAdd={() => addItem('workExperience')}>
        {workExperience.map((exp, i) => (
          <div key={i} className="card mb-4 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-center mb-4">
              <span className="title-md">Experience #{i + 1}</span>
              <button className="btn btn-sm btn-danger" onClick={() => removeItem('workExperience', i)}>
                <HiOutlineTrash /> Remove
              </button>
            </div>
            <div className="grid-2">
              <Field label="Company" value={exp.company} onChange={v => updateField(`workExperience.${i}.company`, v)} />
              <Field label="Role" value={exp.role} onChange={v => updateField(`workExperience.${i}.role`, v)} />
              <Field label="Location" value={exp.location} onChange={v => updateField(`workExperience.${i}.location`, v)} />
              <Field label="Start Date" value={exp.startDate} onChange={v => updateField(`workExperience.${i}.startDate`, v)} />
              <Field label="End Date" value={exp.endDate} onChange={v => updateField(`workExperience.${i}.endDate`, v)} />
            </div>
            <ArrayField label="Bullet Points" items={exp.points} path={`workExperience.${i}.points`} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <TagField label="Tech Stack" value={(exp.techStack || []).join(', ')} onChange={v => updateField(`workExperience.${i}.techStack`, v.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        ))}
      </Section>

      {/* Skills */}
      <Section title="Skills">
        {['languages', 'frameworks', 'databases', 'tools', 'cloud', 'other'].map(cat => (
          <TagField key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={(skills[cat] || []).join(', ')} onChange={v => updateField(`skills.${cat}`, v.split(',').map(s => s.trim()).filter(Boolean))} />
        ))}
      </Section>

      {/* Projects */}
      <Section title="Projects" onAdd={() => addItem('projects')}>
        {projects.map((proj, i) => (
          <div key={i} className="card mb-4 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-center mb-4">
              <span className="title-md">Project #{i + 1}</span>
              <button className="btn btn-sm btn-danger" onClick={() => removeItem('projects', i)}>
                <HiOutlineTrash /> Remove
              </button>
            </div>
            <Field label="Name" value={proj.name} onChange={v => updateField(`projects.${i}.name`, v)} />
            <Field label="Description" value={proj.description} onChange={v => updateField(`projects.${i}.description`, v)} />
            <ArrayField label="Bullet Points" items={proj.points} path={`projects.${i}.points`} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <TagField label="Tech Stack" value={(proj.techStack || []).join(', ')} onChange={v => updateField(`projects.${i}.techStack`, v.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        ))}
      </Section>

      {/* Education */}
      <Section title="Education" onAdd={() => addItem('education')}>
        {education.map((edu, i) => (
          <div key={i} className="card mb-4 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-center mb-4">
              <span className="title-md">Education #{i + 1}</span>
              <button className="btn btn-sm btn-danger" onClick={() => removeItem('education', i)}>
                <HiOutlineTrash /> Remove
              </button>
            </div>
            <div className="grid-2">
              <Field label="Institution" value={edu.institution} onChange={v => updateField(`education.${i}.institution`, v)} />
              <Field label="Degree" value={edu.degree} onChange={v => updateField(`education.${i}.degree`, v)} />
              <Field label="Field" value={edu.field} onChange={v => updateField(`education.${i}.field`, v)} />
              <Field label="Start Year" value={edu.startYear} onChange={v => updateField(`education.${i}.startYear`, v)} />
              <Field label="End Year" value={edu.endYear} onChange={v => updateField(`education.${i}.endYear`, v)} />
              <Field label="Score/CGPA" value={edu.score} onChange={v => updateField(`education.${i}.score`, v)} />
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

/* ── Helper Components ── */

function Section({ title, children, onAdd }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="title-lg text-primary">{title}</h2>
        {onAdd && (
          <button className="btn btn-sm btn-secondary" onClick={onAdd}>
            <HiOutlinePlus /> Add
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className="input-group" style={{ marginBottom: '0.75rem' }}>
      <label>{label}</label>
      <input className="input" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={label} />
    </div>
  );
}

function ArrayField({ label, items = [], path, updateField, addItem, removeItem }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div className="flex justify-between items-center mb-2">
        <label className="label-md">{label}</label>
        <button className="btn btn-sm btn-secondary" onClick={() => addItem(path)}>
          <HiOutlinePlus /> Add
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input className="input" value={item} onChange={e => updateField(`${path}.${i}`, e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-icon btn-danger" onClick={() => removeItem(path, i)}>
            <HiOutlineX />
          </button>
        </div>
      ))}
    </div>
  );
}

function TagField({ label, value, onChange }) {
  return (
    <div className="input-group" style={{ marginBottom: '0.75rem' }}>
      <label>{label} <span className="text-muted" style={{ fontWeight: 400 }}>(comma-separated)</span></label>
      <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder="React, Node.js, Python" />
    </div>
  );
}
