'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Sparkles, Layers, Music, FileText, Image as ImageIcon, Video } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        {/* Brand Logo */}
        <Link href="/" className={styles.brand}>
          <div className={styles.logoIcon}>
            <Sparkles size={20} className={styles.sparkleIcon} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>
              Omni<span className="text-gradient">Convert</span>
            </span>
            <span className={styles.brandBadge}>Zero Limit</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={styles.nav}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === '/' ? styles.navLinkActive : ''}`}
          >
            <Layers size={16} />
            <span>All Converters</span>
          </Link>
          <Link
            href="/convert/mov-to-mp4"
            className={`${styles.navLink} ${pathname === '/convert/mov-to-mp4' ? styles.navLinkActive : ''}`}
          >
            <Video size={16} />
            <span>MOV to MP4</span>
          </Link>
          <Link
            href="/convert/mp4-to-mp3"
            className={`${styles.navLink} ${pathname === '/convert/mp4-to-mp3' ? styles.navLinkActive : ''}`}
          >
            <Music size={16} />
            <span>MP4 to MP3</span>
          </Link>
          <Link
            href="/convert/images-to-pdf"
            className={`${styles.navLink} ${pathname === '/convert/images-to-pdf' ? styles.navLinkActive : ''}`}
          >
            <FileText size={16} />
            <span>Images to PDF</span>
          </Link>
          <Link
            href="/convert/image-converter"
            className={`${styles.navLink} ${pathname === '/convert/image-converter' ? styles.navLinkActive : ''}`}
          >
            <ImageIcon size={16} />
            <span>Image Converter</span>
          </Link>
        </nav>

        {/* Privacy Pill */}
        <div className={styles.privacyBadge} title="All file conversions happen 100% locally on your computer inside your browser. No files are ever uploaded to any server.">
          <span className={styles.pulseDot} />
          <ShieldCheck size={16} className={styles.shieldIcon} />
          <span className={styles.privacyText}>100% Private (Local)</span>
        </div>
      </div>
    </header>
  );
}
