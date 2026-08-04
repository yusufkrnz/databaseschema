import React, {useState, type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Props {
  path: string;
  label: string;
}

export default function CopyRemoteFileButton({path, label}: Props): ReactNode {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const url = useBaseUrl(path);

  const handleClick = async () => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  const text =
    status === 'copied' ? 'Panoya kopyalandı ✓' : status === 'error' ? `Kopyalanamadı — ${path}'i elle indirin` : label;

  return (
    <button type="button" className={styles.remoteBtn} onClick={handleClick}>
      {text}
    </button>
  );
}
