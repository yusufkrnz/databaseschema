import React, {useState, type ReactNode} from 'react';
import styles from './styles.module.css';

interface Props {
  code: string;
  label?: string;
}

export default function CopyCodeButton({code, label = '📋 Kodu Kopyala'}: Props): ReactNode {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <button type="button" className={styles.copyBtn} onClick={handleClick}>
      {copied ? 'Kopyalandı ✓' : label}
    </button>
  );
}
