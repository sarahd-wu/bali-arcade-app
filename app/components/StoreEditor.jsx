"use client";

import { useEffect, useRef, useState } from "react";

// Edits a store's database fields and keeps its image in this browser.
export default function StoreEditor({
  feature,
  initialName,
  initialCategory,
  initialImage,
  onClose,
  onSave,
}) {
  const dialogRef = useRef(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function closeEditor() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    onClose();
  }

  function cancelEditor(event) {
    event.preventDefault();
    closeEditor();
  }

  // Keep the native dialog open state in sync with the selected feature.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (feature && dialog && !dialog.open) dialog.showModal();
    if (!feature && dialog?.open) dialog.close();
  }, [feature, initialName, initialCategory, initialImage]);

  useEffect(() => {
    if (!feature) return;
    setName(initialName || "");
    setCategory(initialCategory || "");
    setImage(initialImage || null);
    setStatus("");
  }, [feature]);

  function readImage(event) {
    const [file] = event.target.files;
    if (!file) return;

    // Images stay in this browser; only text fields are sent to the API.
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.onerror = () => setStatus("The selected image could not be read.");
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    if (!feature || !name.trim()) return;

    setSaving(true);
    // Leave the dialog open on failure so the user can retry.
    setStatus("Saving directly to PostgreSQL database...");
    try {
      await onSave(feature, {
        name: name.trim(),
        category: category.trim() || "retail",
        image,
      });
      setStatus(`Saved to database: "${name.trim()}"`);
      setTimeout(closeEditor, 500);
    } catch (error) {
      setStatus(`Could not save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      className="store-dialog"
      ref={dialogRef}
      onCancel={cancelEditor}
    >
      <form onSubmit={submit}>
        <div className="dialog-header">
          <div>
            <span className="dialog-eyebrow">Store editor</span>
            <h2>Edit store</h2>
          </div>
          <button
            className="dialog-close"
            type="button"
            aria-label="Close editor"
            onClick={closeEditor}
          >
            ×
          </button>
        </div>
        <label>
          Store name
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Category
          <input
            name="category"
            placeholder="e.g. retail"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </label>
        <label>
          Store image
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={readImage}
          />
        </label>
        <div className="upload-preview">
          {image ? (
            <img src={image} alt="Store image preview" />
          ) : (
            "No image selected"
          )}
        </div>
        <p
          className="dialog-note"
          role="status"
          style={{ color: status.startsWith("Could not") ? "#c62828" : undefined }}
        >
          {status ||
            "Store name and category changes are saved in PostgreSQL. Images are saved in this browser."}
        </p>
        <div className="dialog-actions">
          <button
            className="dialog-cancel"
            type="button"
            onClick={closeEditor}
            disabled={saving}
          >
            Cancel
          </button>
          <button className="dialog-save" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
