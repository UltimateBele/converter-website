'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  Flame,
  Music,
  FileText,
  Video,
} from 'lucide-react';
import { CONVERTERS, ConverterItem } from '@/data/converters';
import ConverterCard from '@/components/ConverterCard';
import styles from './page.module.css';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter converters by search query and category
  const filteredConverters = useMemo(() => {
    return CONVERTERS.filter((conv) => {
      const matchesCategory =
        selectedCategory === 'all' || conv.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        conv.name.toLowerCase().includes(q) ||
        conv.shortDescription.toLowerCase().includes(q) ||
        conv.inputFormats.some((fmt) => fmt.toLowerCase().includes(q)) ||
        conv.outputFormats.some((fmt) => fmt.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  const categories = [
    { id: 'all', label: 'All Converters', count: CONVERTERS.length },
    { id: 'audio-video', label: '🎵 Audio & Video', count: CONVERTERS.filter(c => c.category === 'audio-video').length },
    { id: 'documents', label: '📄 Documents & PDF', count: CONVERTERS.filter(c => c.category === 'documents').length },
    { id: 'images', label: '🖼️ Images', count: CONVERTERS.filter(c => c.category === 'images').length },
  ];

  return (
    <div className={styles.mainContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroInner}`}>
          {/* Eyebrow Badge */}
          <div className={styles.eyebrowBadge}>
            <span className={styles.pulseDot} />
            <span className={styles.eyebrowText}>
              The Zero-Limit, Zero-BS File Converter Hub
            </span>
          </div>

          {/* Main Title */}
          <h1 className={styles.heroTitle}>
            Convert Anything.
            <br />
            <span className="text-gradient">Zero Limits. Zero Sign-Ups.</span>
          </h1>

          {/* Subtitle */}
          <p className={styles.heroSubtitle}>
            Tired of converter sites that demand your email, cap you at 50MB, or make you wait in queues?
            OmniConvert runs <strong>100% locally in your browser</strong> using WebAssembly and Web Audio.
            Fast, private, and permanently free.
          </p>

          {/* Quick Action CTA Buttons */}
          <div className={styles.heroCtaGroup}>
            <Link href="/convert/mov-to-mp4" className="btn btn-primary btn-lg">
              <Video size={20} />
              <span>Convert MOV to MP4</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/convert/mp4-to-mp3" className="btn btn-secondary btn-lg">
              <Music size={20} />
              <span>MP4 to MP3</span>
            </Link>
            <Link href="/convert/images-to-pdf" className="btn btn-secondary btn-lg">
              <FileText size={20} />
              <span>Images to PDF</span>
            </Link>
          </div>

          {/* Trust Highlights Bar */}
          <div className={styles.trustBar}>
            <div className={styles.trustItem}>
              <Shield size={16} className={styles.trustIconGreen} />
              <span>100% Private (No server uploads)</span>
            </div>
            <div className={styles.trustItem}>
              <Zap size={16} className={styles.trustIconIndigo} />
              <span>Unlimited file sizes</span>
            </div>
            <div className={styles.trustItem}>
              <Lock size={16} className={styles.trustIconCyan} />
              <span>No sign-up or accounts</span>
            </div>
            <div className={styles.trustItem}>
              <Sparkles size={16} className={styles.trustIconAmber} />
              <span>Zero watermarks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Converters Catalog Section */}
      <section id="converters" className={styles.catalogSection}>
        <div className="container">
          {/* Section Header with Search & Filters */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by format (e.g. mp3, pdf, webp, mp4)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className={styles.categoryPills}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.catPill} ${
                    selectedCategory === cat.id ? styles.catPillActive : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span>{cat.label}</span>
                  <span className={styles.catCount}>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Converters Grid */}
          {filteredConverters.length > 0 ? (
            <div className="grid-converters">
              {filteredConverters.map((conv) => (
                <ConverterCard key={conv.id} converter={conv} />
              ))}
            </div>
          ) : (
            <div className={`glass-panel ${styles.emptySearchBox}`}>
              <Search size={40} className={styles.emptyIcon} />
              <h3>No converters found for &quot;{searchQuery}&quot;</h3>
              <p>Try searching for formats like &quot;mp4&quot;, &quot;mp3&quot;, &quot;pdf&quot;, &quot;image&quot;, or reset your filters.</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Comparison Matrix: OmniConvert vs. The Others */}
      <section id="comparison" className={styles.comparisonSection}>
        <div className="container">
          <div className={styles.sectionHeaderCentered}>
            <span className="badge badge-primary">The Transparent Truth</span>
            <h2 className={styles.sectionTitle}>
              OmniConvert vs. Traditional Converter Sites
            </h2>
            <p className={styles.sectionSubtitle}>
              Why put up with deceptive download buttons, 50MB file size limits, and email collection when you can convert directly in your browser?
            </p>
          </div>

          <div className={`glass-panel ${styles.matrixCard}`}>
            <div className={styles.matrixTableWrapper}>
              <table className={styles.matrixTable}>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th className={styles.highlightCol}>OmniConvert</th>
                    <th>CloudConvert / Zamzar / ILovePDF</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Maximum File Size</strong>
                      <span className={styles.tableRowDesc}>How big of a file you can convert</span>
                    </td>
                    <td className={styles.highlightCol}>
                      <span className={styles.goodSpan}>
                        <CheckCircle2 size={16} /> Unlimited (Device RAM)
                      </span>
                    </td>
                    <td>
                      <span className={styles.badSpan}>
                        <XCircle size={16} /> Capped at 25MB - 50MB (Free tier)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Account &amp; Sign-Up</strong>
                      <span className={styles.tableRowDesc}>Forced registration hurdles</span>
                    </td>
                    <td className={styles.highlightCol}>
                      <span className={styles.goodSpan}>
                        <CheckCircle2 size={16} /> Zero sign-up, zero email needed
                      </span>
                    </td>
                    <td>
                      <span className={styles.badSpan}>
                        <XCircle size={16} /> Forces login after 2-3 conversions
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Data Privacy &amp; Security</strong>
                      <span className={styles.tableRowDesc}>Where your confidential files travel</span>
                    </td>
                    <td className={styles.highlightCol}>
                      <span className={styles.goodSpan}>
                        <CheckCircle2 size={16} /> 100% In-Browser (0 bytes uploaded)
                      </span>
                    </td>
                    <td>
                      <span className={styles.badSpan}>
                        <XCircle size={16} /> Uploaded &amp; stored on remote servers
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Daily &amp; Hourly Limits</strong>
                      <span className={styles.tableRowDesc}>Artificial waiting blocks</span>
                    </td>
                    <td className={styles.highlightCol}>
                      <span className={styles.goodSpan}>
                        <CheckCircle2 size={16} /> Unlimited, convert 1,000 files
                      </span>
                    </td>
                    <td>
                      <span className={styles.badSpan}>
                        <XCircle size={16} /> 2 files / hour, then asks for subscription
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Annoying Ads &amp; Fake Buttons</strong>
                      <span className={styles.tableRowDesc}>User experience integrity</span>
                    </td>
                    <td className={styles.highlightCol}>
                      <span className={styles.goodSpan}>
                        <CheckCircle2 size={16} /> Clean, ad-free, direct download
                      </span>
                    </td>
                    <td>
                      <span className={styles.badSpan}>
                        <XCircle size={16} /> Plastered with deceptive adware banners
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Price</strong>
                      <span className={styles.tableRowDesc}>Ongoing subscription cost</span>
                    </td>
                    <td className={styles.highlightCol}>
                      <span className={styles.goodSpan}>
                        <CheckCircle2 size={16} /> 100% Free Forever
                      </span>
                    </td>
                    <td>
                      <span className={styles.badSpan}>
                        <XCircle size={16} /> $9.99 to $24.99 / month
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className="container">
          <div className={styles.sectionHeaderCentered}>
            <span className="badge badge-success">Client-Side Architecture</span>
            <h2 className={styles.sectionTitle}>How Does Local Conversion Work?</h2>
            <p className={styles.sectionSubtitle}>
              Modern web browsers are capable of running near-native compiled code. Here is how OmniConvert keeps your data safe.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={`glass-panel ${styles.stepCard}`}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.stepIconBox}>
                <Layers size={24} />
              </div>
              <h3 className={styles.stepTitle}>In-Memory File Loading</h3>
              <p className={styles.stepDesc}>
                When you drag and drop a file, it is read directly into your device&apos;s local RAM via standard HTML5 File APIs. No network packets leave your computer.
              </p>
            </div>

            <div className={`glass-panel ${styles.stepCard}`}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.stepIconBox}>
                <Cpu size={24} />
              </div>
              <h3 className={styles.stepTitle}>WASM &amp; Web Audio Engine</h3>
              <p className={styles.stepDesc}>
                High-speed algorithms decode video, audio, vector, and image data using hardware-accelerated Web Audio and client-side encoders.
              </p>
            </div>

            <div className={`glass-panel ${styles.stepCard}`}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.stepIconBox}>
                <Flame size={24} />
              </div>
              <h3 className={styles.stepTitle}>Instant Direct Export</h3>
              <p className={styles.stepDesc}>
                The converted binary (MP3, PDF, PNG, WebP) is packaged into a local memory Blob and downloaded straight to your storage disk with zero server roundtrips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className={styles.sectionHeaderCentered}>
            <span className="badge badge-purple">FAQ</span>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          </div>

          <div className={styles.faqGrid}>
            <div className={`glass-panel ${styles.faqCard}`}>
              <h4>Are my files really not uploaded to any server?</h4>
              <p>
                Yes, 100%! You can even disconnect your Wi-Fi or turn on Airplane Mode once the page is loaded, and your conversions will continue to work flawlessly. Everything processes inside your browser sandbox.
              </p>
            </div>

            <div className={`glass-panel ${styles.faqCard}`}>
              <h4>Why is there no file size limit?</h4>
              <p>
                Cloud converter companies impose file size limits because server bandwidth and cloud storage cost them money. Since OmniConvert runs on your computer&apos;s own processor and memory, there is no server bill, which means no file size limit for you!
              </p>
            </div>

            <div className={`glass-panel ${styles.faqCard}`}>
              <h4>What video formats can the MP4 to MP3 tool handle?</h4>
              <p>
                It extracts audio from MP4, MOV, WebM, MKV, AVI, and M4V files. You can choose output bitrates up to 320 kbps or lossless WAV format, trim clips, boost volume, and edit ID3 tags.
              </p>
            </div>

            <div className={`glass-panel ${styles.faqCard}`}>
              <h4>Can I reorder pages in the Images to PDF converter?</h4>
              <p>
                Absolutely. You can move pages up or down, rotate scans by 90 degrees, delete unwanted photos, and select page sizing (A4, US Letter, or Fit-to-image).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
