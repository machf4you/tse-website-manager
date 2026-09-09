import React, { useState, useEffect } from 'react'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../services/authApi'
import './UsersAccessPage.css'

const AVAILABLE_APPS = [
  { key: 'website_manager', label: 'Website Manager', desc: 'Manage connected websites, SEO pages & audits' },
  { key: 'site_registry',   label: 'Site Registry',   desc: 'Domain records, hosting & backlink management' },
  { key: 'lead_generator',  label: 'Lead Generator',  desc: 'Prospect discovery & outreach automation' }
]

export default function UsersAccessPage({ currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Dialog states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Form states - Add
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newShowPassword, setNewShowPassword] = useState(false)
  const [newRole, setNewRole] = useState('staff')
  const [newApps, setNewApps] = useState(['site_registry'])

  // Form states - Edit
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('staff')
  const [editApps, setEditApps] = useState([])
  const [editPassword, setEditPassword] = useState('')
  const [editShowPassword, setEditShowPassword] = useState(false)

  const showToast = (msg, isError = false) => {
    if (isError) {
      setError(msg)
      setTimeout(() => setError(null), 5000)
    } else {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getAdminUsers()
      setUsers(list)
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleOpenAdd = () => {
    setNewUsername('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('staff')
    setNewApps(['site_registry'])
    setNewShowPassword(false)
    setShowAddModal(true)
  }

  const handleOpenEdit = (user) => {
    setSelectedUser(user)
    setEditEmail(user.email || '')
    setEditRole(user.role || 'staff')
    setEditApps(Array.isArray(user.allowed_apps) ? [...user.allowed_apps] : [])
    setEditPassword('')
    setEditShowPassword(false)
    setShowEditModal(true)
  }

  const handleOpenDelete = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast('Please fill in all required fields', true)
      return
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', true)
      return
    }

    setActionLoading(true)
    try {
      const appsPayload = newRole === 'admin' ? ['*'] : newApps
      await createAdminUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        allowed_apps: appsPayload
      })
      showToast(`User '${newUsername.trim()}' created successfully`)
      setShowAddModal(false)
      loadUsers()
    } catch (err) {
      showToast(err.message || 'Failed to create user', true)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    setActionLoading(true)
    try {
      const appsPayload = editRole === 'admin' ? ['*'] : editApps
      const payload = {
        email: editEmail.trim(),
        role: editRole,
        allowed_apps: appsPayload
      }
      if (editPassword.trim()) {
        if (editPassword.trim().length < 6) {
          showToast('New password must be at least 6 characters', true)
          setActionLoading(false)
          return
        }
        payload.password = editPassword.trim()
      }

      await updateAdminUser(selectedUser.id, payload)
      showToast(`User '${selectedUser.username}' updated successfully`)
      setShowEditModal(false)
      loadUsers()
    } catch (err) {
      showToast(err.message || 'Failed to update user', true)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    try {
      await deleteAdminUser(selectedUser.id)
      showToast(`User '${selectedUser.username}' deleted`)
      setShowDeleteModal(false)
      loadUsers()
    } catch (err) {
      showToast(err.message || 'Failed to delete user', true)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleAppSelection = (list, setList, appKey) => {
    if (list.includes(appKey)) {
      setList(list.filter(k => k !== appKey))
    } else {
      setList([...list, appKey])
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const staffCount = users.filter(u => u.role === 'staff').length

  return (
    <div className="users-access-page">
      {/* Page Header */}
      <div className="uap-header">
        <div>
          <h2 className="uap-title">Users & Access Management</h2>
          <p className="uap-subtitle">
            Manage TSE Apps Platform user accounts, roles, and application-level access permissions.
          </p>
        </div>
        <div className="uap-actions">
          <button
            type="button"
            className="uap-btn uap-btn-secondary"
            onClick={loadUsers}
            disabled={loading}
            title="Refresh user list"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Refresh
          </button>
          <button
            type="button"
            className="uap-btn uap-btn-primary"
            onClick={handleOpenAdd}
            id="btn-add-user"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="uap-alert uap-alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="uap-alert uap-alert-success" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="uap-stats-row">
        <div className="uap-stat-card">
          <div className="uap-stat-label">Total Users</div>
          <div className="uap-stat-value">{users.length}</div>
          <div className="uap-stat-desc">Registered platform accounts</div>
        </div>
        <div className="uap-stat-card">
          <div className="uap-stat-label">Administrators</div>
          <div className="uap-stat-value uap-text-indigo">{adminCount}</div>
          <div className="uap-stat-desc">Full suite authority & access</div>
        </div>
        <div className="uap-stat-card">
          <div className="uap-stat-label">Staff Members</div>
          <div className="uap-stat-value uap-text-emerald">{staffCount}</div>
          <div className="uap-stat-desc">Restricted per-app access</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="uap-table-container">
        {loading ? (
          <div className="uap-loading-state">
            <div className="uap-spinner" />
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="uap-empty-state">
            <p>No user accounts found.</p>
          </div>
        ) : (
          <table className="uap-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Allowed Applications</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isAdmin = u.role === 'admin'
                const appsList = Array.isArray(u.allowed_apps) ? u.allowed_apps : []
                const hasWildcard = isAdmin || appsList.includes('*')

                return (
                  <tr key={u.id}>
                    <td>
                      <div className="uap-user-cell">
                        <div className="uap-avatar">
                          {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="uap-username">{u.username}</div>
                          <div className="uap-userid">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="uap-email">{u.email || '—'}</span>
                    </td>
                    <td>
                      <span className={`uap-badge ${isAdmin ? 'uap-badge-admin' : 'uap-badge-staff'}`}>
                        {isAdmin ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td>
                      <div className="uap-apps-list">
                        {hasWildcard ? (
                          <span className="uap-app-tag uap-app-all">All Apps (Full Access)</span>
                        ) : appsList.length === 0 ? (
                          <span className="uap-app-tag uap-app-none">No Apps Assigned</span>
                        ) : (
                          appsList.map(appKey => {
                            const appDef = AVAILABLE_APPS.find(a => a.key === appKey)
                            return (
                              <span key={appKey} className="uap-app-tag">
                                {appDef ? appDef.label : appKey}
                              </span>
                            )
                          })
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="uap-date">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="uap-row-actions">
                        <button
                          type="button"
                          className="uap-action-btn uap-action-edit"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit user & permissions"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="uap-action-btn uap-action-delete"
                          onClick={() => handleOpenDelete(u)}
                          disabled={isAdmin && adminCount <= 1}
                          title={isAdmin && adminCount <= 1 ? "Cannot delete final admin" : "Delete user"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── ADD USER MODAL ── */}
      {showAddModal && (
        <div className="uap-modal-backdrop" onClick={() => !actionLoading && setShowAddModal(false)}>
          <div className="uap-modal" onClick={e => e.stopPropagation()}>
            <div className="uap-modal-header">
              <h3 className="uap-modal-title">Add New User</h3>
              <button
                type="button"
                className="uap-modal-close"
                onClick={() => setShowAddModal(false)}
                disabled={actionLoading}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="uap-modal-body">
                <div className="uap-form-group">
                  <label htmlFor="add-username">Username <span className="uap-required">*</span></label>
                  <input
                    type="text"
                    id="add-username"
                    name="username"
                    autocomplete="off"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="e.g. john or sarah"
                    required
                    autoFocus
                  />
                </div>

                <div className="uap-form-group">
                  <label htmlFor="add-email">Email Address <span className="uap-required">*</span></label>
                  <input
                    type="email"
                    id="add-email"
                    name="email"
                    autocomplete="off"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="e.g. staff@thesearchequation.co.uk"
                    required
                  />
                </div>

                <div className="uap-form-group">
                  <label htmlFor="add-password">Initial Password <span className="uap-required">*</span></label>
                  <div className="uap-password-input-wrapper">
                    <input
                      type={newShowPassword ? 'text' : 'password'}
                      id="add-password"
                      name="password"
                      autocomplete="new-password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="uap-password-toggle"
                      onClick={() => setNewShowPassword(!newShowPassword)}
                    >
                      {newShowPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="uap-form-group">
                  <label>Account Role</label>
                  <div className="uap-role-options">
                    <label className={`uap-role-card ${newRole === 'staff' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="add-role"
                        value="staff"
                        checked={newRole === 'staff'}
                        onChange={() => setNewRole('staff')}
                      />
                      <div>
                        <strong>Staff User</strong>
                        <span>Assigned specific applications only</span>
                      </div>
                    </label>
                    <label className={`uap-role-card ${newRole === 'admin' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="add-role"
                        value="admin"
                        checked={newRole === 'admin'}
                        onChange={() => setNewRole('admin')}
                      />
                      <div>
                        <strong>Administrator</strong>
                        <span>Full access to all applications & user management</span>
                      </div>
                    </label>
                  </div>
                </div>

                {newRole === 'staff' ? (
                  <div className="uap-form-group">
                    <label>Assigned Applications</label>
                    <div className="uap-apps-picker">
                      {AVAILABLE_APPS.map(app => (
                        <label key={app.key} className="uap-app-checkbox-row">
                          <input
                            type="checkbox"
                            checked={newApps.includes(app.key)}
                            onChange={() => toggleAppSelection(newApps, setNewApps, app.key)}
                          />
                          <div className="uap-app-picker-info">
                            <strong>{app.label}</strong>
                            <span>{app.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="uap-admin-note">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>Administrator accounts automatically receive full access to all TSE applications.</span>
                  </div>
                )}
              </div>

              <div className="uap-modal-footer">
                <button
                  type="button"
                  className="uap-btn uap-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="uap-btn uap-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ── */}
      {showEditModal && selectedUser && (
        <div className="uap-modal-backdrop" onClick={() => !actionLoading && setShowEditModal(false)}>
          <div className="uap-modal" onClick={e => e.stopPropagation()}>
            <div className="uap-modal-header">
              <h3 className="uap-modal-title">Edit User: {selectedUser.username}</h3>
              <button
                type="button"
                className="uap-modal-close"
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="uap-modal-body">
                <div className="uap-form-group">
                  <label htmlFor="edit-email">Email Address <span className="uap-required">*</span></label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    autocomplete="off"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="uap-form-group">
                  <label>Account Role</label>
                  <div className="uap-role-options">
                    <label className={`uap-role-card ${editRole === 'staff' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="edit-role"
                        value="staff"
                        checked={editRole === 'staff'}
                        onChange={() => setEditRole('staff')}
                        disabled={selectedUser.role === 'admin' && adminCount <= 1}
                      />
                      <div>
                        <strong>Staff User</strong>
                        <span>Assigned specific applications only</span>
                      </div>
                    </label>
                    <label className={`uap-role-card ${editRole === 'admin' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="edit-role"
                        value="admin"
                        checked={editRole === 'admin'}
                        onChange={() => setEditRole('admin')}
                      />
                      <div>
                        <strong>Administrator</strong>
                        <span>Full access to all applications</span>
                      </div>
                    </label>
                  </div>
                </div>

                {editRole === 'staff' ? (
                  <div className="uap-form-group">
                    <label>Assigned Applications</label>
                    <div className="uap-apps-picker">
                      {AVAILABLE_APPS.map(app => (
                        <label key={app.key} className="uap-app-checkbox-row">
                          <input
                            type="checkbox"
                            checked={editApps.includes(app.key)}
                            onChange={() => toggleAppSelection(editApps, setEditApps, app.key)}
                          />
                          <div className="uap-app-picker-info">
                            <strong>{app.label}</strong>
                            <span>{app.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="uap-admin-note">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>Administrator accounts automatically receive full access to all TSE applications.</span>
                  </div>
                )}

                <div className="uap-form-group">
                  <label htmlFor="edit-password">Reset Password (Optional)</label>
                  <div className="uap-password-input-wrapper">
                    <input
                      type={editShowPassword ? 'text' : 'password'}
                      id="edit-password"
                      name="password"
                      autocomplete="new-password"
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="uap-password-toggle"
                      onClick={() => setEditShowPassword(!editShowPassword)}
                    >
                      {editShowPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <span className="uap-input-hint">Changing password will revoke existing sessions for this user.</span>
                </div>
              </div>

              <div className="uap-modal-footer">
                <button
                  type="button"
                  className="uap-btn uap-btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="uap-btn uap-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && selectedUser && (
        <div className="uap-modal-backdrop" onClick={() => !actionLoading && setShowDeleteModal(false)}>
          <div className="uap-modal uap-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="uap-modal-header">
              <h3 className="uap-modal-title">Delete User</h3>
              <button
                type="button"
                className="uap-modal-close"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
              >
                &times;
              </button>
            </div>
            <div className="uap-modal-body">
              <p style={{ color: '#e2e8f0', fontSize: '0.9375rem', lineHeight: '1.5' }}>
                Are you sure you want to delete user <strong>{selectedUser.username}</strong> ({selectedUser.email})?
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.75rem', lineHeight: '1.4' }}>
                This action will immediately delete the account and revoke all active login sessions. This action cannot be undone.
              </p>
            </div>
            <div className="uap-modal-footer">
              <button
                type="button"
                className="uap-btn uap-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="uap-btn uap-btn-danger"
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
