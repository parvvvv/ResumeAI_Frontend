import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineTrendingUp,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import api from '../api/client';
import { PageShell, ResponsiveCardList, SectionHeader } from '../components/ui';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'most_active', label: 'Most active' },
  { value: 'most_tailored', label: 'Most tailored' },
];

function formatDate(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString();
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div>
        <div className="label-md text-muted">{label}</div>
        <div className="admin-stat-value">{value}</div>
        {hint && <div className="admin-stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

function ActivityBars({ title, data }) {
  const max = Math.max(...data.map(item => item.count), 1);

  return (
    <div className="admin-activity-card">
      <div className="label-md">{title}</div>
      <div className="admin-bars" aria-label={title}>
        {data.map(item => (
          <div
            key={item.date}
            className="admin-bar"
            title={`${item.date}: ${item.count}`}
            style={{ height: `${Math.max(8, (item.count / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingTemplates, setPendingTemplates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0, limit: 20 });
  const [range, setRange] = useState('30d');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, activityRes, usersRes, templatesRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/activity', { params: { range } }),
        api.get('/admin/users', { params: { page: nextPage, limit: 20, search, sort } }),
        api.get('/admin/templates', { params: { status: 'pending_review' } }).catch(() => ({ data: { templates: [] } })),
      ]);

      setOverview(overviewRes.data);
      setActivity(activityRes.data);
      setUsers(usersRes.data.users || []);
      setPendingTemplates(templatesRes.data?.templates || []);
      setPagination(usersRes.data.pagination || { page: nextPage, pages: 0, total: 0, limit: 20 });
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.response?.data?.detail || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, [range, search, sort]);

  useEffect(() => {
    fetchAdminData(1);
  }, [fetchAdminData]);

  const handleTemplateAction = async (templateId, action, reason = '') => {
    try {
      const endpoint = `/admin/templates/${templateId}/${action}`;
      await api.post(endpoint, { reason });
      fetchAdminData(pagination.page); // Refresh data
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} template.`);
    }
  };

  const totals = overview?.totals || {};
  const recent = overview?.recent || {};

  const tableSummary = useMemo(() => {
    if (!pagination.total) return 'No users found';
    return `${pagination.total} user${pagination.total === 1 ? '' : 's'}`;
  }, [pagination.total]);

  if (loading && !overview) {
    return <div className="loading-overlay"><div className="loading-pulse" /><p>Loading admin dashboard...</p></div>;
  }

  return (
    <PageShell className="admin-page" wide>
      <SectionHeader
        eyebrow="Platform overview"
        title="Admin Dashboard"
        description="Monitor usage, resume generation, and user activity from one mobile-friendly console."
        actions={(
          <button className="btn btn-secondary" onClick={() => fetchAdminData(pagination.page)}>
            Refresh
          </button>
        )}
      />

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <ResponsiveCardList className="admin-stat-grid">
        <StatCard icon={<HiOutlineUserGroup />} label="Users" value={totals.users ?? 0} hint={`+${recent.users7d ?? 0} in 7d`} />
        <StatCard icon={<HiOutlineDocumentText />} label="Original resumes" value={totals.originalResumes ?? 0} hint={`+${recent.resumes7d ?? 0} in 7d`} />
        <StatCard icon={<HiOutlineSparkles />} label="Tailored resumes" value={totals.tailoredResumes ?? 0} hint={`+${recent.tailored7d ?? 0} in 7d`} />
        <StatCard icon={<HiOutlineDownload />} label="PDFs ready" value={totals.pdfsReady ?? 0} hint={`${overview?.pdfStatusCounts?.processing ?? 0} processing`} />
        <StatCard icon={<HiOutlineTrendingUp />} label="Average ATS" value={overview?.averageAtsScore ? `${overview.averageAtsScore}%` : 'N/A'} hint={`${totals.jobCacheRecords ?? 0} job records`} />
      </ResponsiveCardList>

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="title-md">Activity</h2>
            <p className="text-muted">Daily platform usage, grouped by the selected range.</p>
          </div>
          <select className="input admin-select" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
        </div>

        {activity && (
          <ResponsiveCardList className="admin-activity-grid">
            <ActivityBars title="Users created" data={activity.usersCreated || []} />
            <ActivityBars title="Resumes uploaded" data={activity.resumesUploaded || []} />
            <ActivityBars title="Tailored created" data={activity.tailoredCreated || []} />
            <ActivityBars title="PDFs completed" data={activity.pdfsCompleted || []} />
          </ResponsiveCardList>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="title-md">Template Governance</h2>
            <p className="text-muted">Review templates submitted for the public catalog.</p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Author ID</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTemplates.map(template => (
                <tr key={template.id}>
                  <td data-label="Title">{template.title}</td>
                  <td data-label="Description" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {template.description}
                  </td>
                  <td data-label="Author ID">{template.ownerUserId}</td>
                  <td data-label="Submitted">{formatDate(template.updatedAt || template.createdAt)}</td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-primary" onClick={() => handleTemplateAction(template.id, 'approve')}>
                        Approve
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleTemplateAction(template.id, 'reject', 'Does not meet guidelines.')}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingTemplates.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-empty-cell">No templates pending review.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="title-md">Users</h2>
            <p className="text-muted">{tableSummary}</p>
          </div>
          <div className="admin-table-controls">
            <div className="admin-search">
              <HiOutlineSearch />
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email"
              />
            </div>
            <select className="input admin-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Originals</th>
                <th>Tailored</th>
                <th>PDFs</th>
                <th>Avg ATS</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const lastActivity = user.lastTailoredCreatedAt || user.lastResumeCreatedAt || user.createdAt;
                return (
                  <tr key={user.id}>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Role"><span className={`admin-role-pill ${user.role}`}>{user.role}</span></td>
                    <td data-label="Joined">{formatDate(user.createdAt)}</td>
                    <td data-label="Originals">{user.originalResumeCount}</td>
                    <td data-label="Tailored">{user.tailoredResumeCount}</td>
                    <td data-label="PDFs">{user.pdfReadyCount}</td>
                    <td data-label="Avg ATS">{user.averageAtsScore ? `${user.averageAtsScore}%` : 'N/A'}</td>
                    <td data-label="Last activity">{formatDate(lastActivity)}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="8" className="admin-empty-cell">No users match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="admin-pagination">
            <button className="btn btn-sm btn-secondary" disabled={pagination.page <= 1} onClick={() => fetchAdminData(pagination.page - 1)}>
              Previous
            </button>
            <span className="text-muted">Page {pagination.page} of {pagination.pages}</span>
            <button className="btn btn-sm btn-secondary" disabled={pagination.page >= pagination.pages} onClick={() => fetchAdminData(pagination.page + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
