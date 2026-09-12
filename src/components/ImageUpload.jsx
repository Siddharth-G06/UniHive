import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { formatFileSize } from "../utils/collegeDetect";
import "../styles/posts.css";

/**
 * Reusable drag-and-drop image upload component.
 * @param {File[]} images - current list of selected File objects
 * @param {(files: File[]) => void} onChange - callback with updated array
 * @param {number} maxImages - max images allowed (default 4)
 * @param {number} maxSizeMB - max file size in MB (default 5)
 */
export default function ImageUpload({ images = [], onChange, maxImages = 4, maxSizeMB = 5 }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);

  const maxBytes = maxSizeMB * 1024 * 1024;

  function processFiles(fileList) {
    const incoming = Array.from(fileList);
    const errs = [];
    const valid = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        errs.push(`"${file.name}" is not an image.`);
        continue;
      }
      if (file.size > maxBytes) {
        errs.push(`"${file.name}" exceeds ${maxSizeMB}MB (${formatFileSize(file.size)}).`);
        continue;
      }
      valid.push(file);
    }

    setErrors(errs);

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setErrors((e) => [...e, `Maximum ${maxImages} images allowed.`]);
      return;
    }

    const toAdd = valid.slice(0, remaining);
    onChange([...images, ...toAdd]);
  }

  function handleInputChange(e) {
    processFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }

  function handleRemove(index) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }

  return (
    <div className="image-upload">
      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          className={`image-dropzone ${dragOver ? "drag-over" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload images"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <Upload size={32} className="dropzone-icon" />
          <p className="dropzone-text">Click or drag images here</p>
          <p className="dropzone-hint">Up to {maxImages} images &middot; max {maxSizeMB}MB each</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="avatar-file-input"
        onChange={handleInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="upload-errors" role="alert">
          {errors.map((err, i) => <p key={i} className="field-error">{err}</p>)}
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <>
          <div className="image-preview-grid">
            {images.map((file, i) => (
              <div key={i} className="image-preview-item">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${i + 1}`}
                  className="image-preview-thumb"
                />
                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={() => handleRemove(i)}
                  aria-label={`Remove image ${i + 1}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="upload-count">{images.length}/{maxImages} images selected</p>
        </>
      )}
    </div>
  );
}
