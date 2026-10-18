'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck, Shield, Sparkles } from 'lucide-react';
import styles from './DropZone.module.css';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  description?: string;
  supportedFormatsText?: string;
  disabled?: boolean;
}

export default function DropZone({
  onFilesSelected,
  accept,
  multiple = false,
  title = 'Drop your files here',
  description = 'or click to browse from your computer',
  supportedFormatsText,
  disabled = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const filteredFiles = multiple ? droppedFiles : [droppedFiles[0]];
      onFilesSelected(filteredFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
    }
    // reset input so same file can be re-selected if deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`${styles.dropZone} ${isDragging ? styles.isDragging : ''} ${
        disabled ? styles.isDisabled : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload files by dropping them here or clicking"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className={styles.hiddenInput}
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className={styles.iconWrapper}>
        <div className={styles.iconCircle}>
          <UploadCloud size={36} className={styles.uploadIcon} />
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        
        {supportedFormatsText && (
          <div className={styles.supportedFormats}>
            <span className={styles.formatLabel}>Supported:</span>
            <span className={styles.formatTags}>{supportedFormatsText}</span>
          </div>
        )}

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <Shield size={14} className={styles.featureIcon} />
            <span>Zero server upload (100% private)</span>
          </div>
          <div className={styles.featureItem}>
            <Sparkles size={14} className={styles.featureIcon} />
            <span>No file size limits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
