'use client';

import Link from 'next/link';
import {
  Music,
  FileText,
  Image as ImageIcon,
  Sparkles,
  FileImage,
  Volume2,
  Video,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ConverterItem } from '@/data/converters';
import styles from './ConverterCard.module.css';

interface ConverterCardProps {
  converter: ConverterItem;
}

export default function ConverterCard({ converter }: ConverterCardProps) {
  // Map icon name to Lucide component
  const renderIcon = () => {
    switch (converter.icon) {
      case 'Music':
        return <Music size={26} />;
      case 'FileText':
        return <FileText size={26} />;
      case 'Image':
        return <ImageIcon size={26} />;
      case 'Sparkles':
        return <Sparkles size={26} />;
      case 'FileImage':
        return <FileImage size={26} />;
      case 'Volume2':
        return <Volume2 size={26} />;
      case 'Video':
        return <Video size={26} />;
      default:
        return <Sparkles size={26} />;
    }
  };

  const isActive = converter.status === 'active';

  return (
    <div className={`${styles.card} glass-panel ${!isActive ? styles.comingSoonCard : ''}`}>
      <div className={styles.cardHeader}>
        <div
          className={styles.iconBox}
          style={{ background: converter.gradient }}
        >
          {renderIcon()}
        </div>

        {converter.badge && (
          <span className={`badge badge-${converter.badgeType || 'primary'}`}>
            {converter.badge}
          </span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>{converter.name}</h3>
        <p className={styles.description}>{converter.shortDescription}</p>

        {/* Format Flow (Input -> Output) */}
        <div className={styles.formatFlow}>
          <div className={styles.formatGroup}>
            {converter.inputFormats.slice(0, 3).map((fmt) => (
              <span key={fmt} className="badge-format">
                {fmt}
              </span>
            ))}
            {converter.inputFormats.length > 3 && (
              <span className={styles.moreFormats}>+{converter.inputFormats.length - 3}</span>
            )}
          </div>

          <div className={styles.formatArrow}>
            <ArrowRight size={14} />
          </div>

          <div className={styles.formatGroup}>
            {converter.outputFormats.map((fmt) => (
              <span key={fmt} className={`${styles.outputBadge} badge-format`}>
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <ul className={styles.featureList}>
          {converter.features.slice(0, 3).map((feature, idx) => (
            <li key={idx} className={styles.featureItem}>
              <CheckCircle2 size={13} className={styles.checkIcon} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.cardFooter}>
        {isActive ? (
          <Link href={`/convert/${converter.slug}`} className={`btn btn-primary ${styles.launchBtn}`}>
            <span>Launch Converter</span>
            <ArrowRight size={16} />
          </Link>
        ) : (
          <div className={styles.comingSoonBox}>
            <Lock size={14} />
            <span>Coming in Next Update</span>
          </div>
        )}
      </div>
    </div>
  );
}
