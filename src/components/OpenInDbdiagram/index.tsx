import React, {useState, type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

export default function OpenInDbdiagram(): ReactNode {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const dbmlUrl = useBaseUrl('/schema.dbml');

  const handleClick = async () => {
    try {
      const res = await fetch(dbmlUrl);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      window.open('https://dbdiagram.io/d', '_blank', 'noopener,noreferrer');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const label =
    status === 'copied'
      ? 'Panoya kopyalandı — açılan sekmede Cmd/Ctrl+V yapıştırın ✓'
      : status === 'error'
        ? 'Kopyalanamadı, static/schema.dbml’i elle indirin'
        : '🗺️ Tabloları dbdiagram.io’da Görüntüle';

  return (
    <button type="button" className={styles.dbdiagramBtn} onClick={handleClick}>
      {label}
    </button>
  );
}
