'use client';

import Link from 'next/link';
import { ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.topRow}>
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <div className={styles.logoIcon}>
                <Sparkles size={18} />
              </div>
              <span className={styles.brandName}>
                Omni<span className="text-gradient">Convert</span>
              </span>
            </div>
            <p className={styles.brandTagline}>
              The zero-nonsense file converter. No file size limits, no waiting lines, no email signups, and zero cloud uploads. Powered by in-browser WebAssembly &amp; Web Audio.
            </p>
            <div className={styles.featurePills}>
              <div className={styles.pill}>
                <Lock size={12} />
                <span>100% In-Browser</span>
              </div>
              <div className={styles.pill}>
                <Zap size={12} />
                <span>Unlimited Conversions</span>
              </div>
              <div className={styles.pill}>
                <ShieldCheck size={12} />
                <span>Zero Server Logs</span>
              </div>
            </div>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Popular Converters</h4>
            <ul className={styles.linksList}>
              <li>
                <Link href="/convert/mov-to-mp4">MOV to MP4 (iPhone &amp; QuickTime)</Link>
              </li>
              <li>
                <Link href="/convert/mp4-to-mp3">MP4 to MP3 (Audio Extractor)</Link>
              </li>
              <li>
                <Link href="/convert/images-to-pdf">Images to PDF (Document Merger)</Link>
              </li>
              <li>
                <Link href="/convert/image-converter">Universal Image Converter (WebP/PNG/JPG)</Link>
              </li>
              <li>
                <Link href="/convert/svg-to-png">SVG to High-Res PNG</Link>
              </li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Privacy &amp; Architecture</h4>
            <ul className={styles.linksList}>
              <li>
                <a href="#how-it-works">How Client-Side Conversion Works</a>
              </li>
              <li>
                <a href="#comparison">Why Avoid Cloud Converters?</a>
              </li>
              <li>
                <span className={styles.dimmedText}>Local Memory &amp; Web Audio API</span>
              </li>
              <li>
                <span className={styles.dimmedText}>WASM Hardware Acceleration</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <p className={styles.copyright}>
            © {currentYear} OmniConvert. Built with pride for creators, developers, and everyone tired of conversion limits.
          </p>
          <div className={styles.badgePrivacy}>
            <span>No Cookies • No Trackers • 100% Client-Side</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
