import { useState } from 'react'
import { createRestorePoint } from '../services/restorePointService'
import './CreateRestorePointDialog.css'

export default function CreateRestorePointDialog({ isOpen, onClose, onSuccess }) {
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  if (!isOpen) return null

  function resetForm() {
    setVersion('')
    setTitle('')
    setDescription('')
    setIsSubmitting(false)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  function handleClose() {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isSubmitting) return
    setErrorMsg(null)
    setSuccessMsg(null)

    // 1. Validation
    if (!version.trim()) {
      setErrorMsg('Please enter a Version (e.g. v1.3).')
      return
    }
    if (!title.trim()) {
      setErrorMsg('Please enter a Title.')
      return
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a Description.')
      return
    }

    setIsSubmitting(true)

    // 2. Create Restore Point
    const res = await createRestorePoint({
      version: version.trim(),
      title: title.trim(),
      description: description.trim(),
    })

    if (res.success) {
      setSuccessMsg(`Restore point ${res.item.version} created successfully!`)
      if (onSuccess) {
        onSuccess(res.allPoints)
      }
      setTimeout(() => {
        resetForm()
        onClose()
      }, 600)
    } else {
      setErrorMsg(res.error || 'Failed to create restore point.')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="crp-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Create Restore Point"
      onClick={handleBackdrop}
    >
      <div className="crp-dialog">

        {/* Header */}
        <div className="crp-header">
          <h2 className="crp-title">Create Restore Point</h2>
          <button
            type="button"
            className="crp-close"
            aria-label="Close dialog"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form id="crp-form" className="crp-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="crp-error-banner" role="alert">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="crp-success-banner" role="status">
              {successMsg}
            </div>
          )}

          {/* Version input */}
          <div className="crp-field">
            <label className="crp-label" htmlFor="crp-version">
              Version
            </label>
            <input
              className="crp-input"
              id="crp-version"
              type="text"
              placeholder="e.g. v1.3"
              value={version}
              onChange={e => setVersion(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          {/* Title input */}
          <div className="crp-field">
            <label className="crp-label" htmlFor="crp-title">
              Title
            </label>
            <input
              className="crp-input"
              id="crp-title"
              type="text"
              placeholder="e.g. WordPress Synchronisation Engine"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          {/* Description input */}
          <div className="crp-field">
            <label className="crp-label" htmlFor="crp-desc">
              Description
            </label>
            <textarea
              className="crp-input crp-textarea"
              id="crp-desc"
              rows={4}
              placeholder="Summary of changes, features completed, and verified milestone targets..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="crp-footer">
          <button
            type="button"
            className="crp-btn-cancel"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="crp-form"
            className="crp-btn-submit"
            id="btn-confirm-create-rp"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating…' : 'Create Restore Point'}
          </button>
        </div>

      </div>
    </div>
  )
}
