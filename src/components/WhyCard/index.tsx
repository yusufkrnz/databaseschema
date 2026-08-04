import React, {type ReactNode} from 'react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

function getWhyList(frontMatter: Record<string, unknown>): string[] | undefined {
  const why = frontMatter.why;
  if (!Array.isArray(why)) {
    return undefined;
  }
  const items = why.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : undefined;
}

export default function WhyCard(): ReactNode {
  const {frontMatter} = useDoc();
  const why = getWhyList(frontMatter as Record<string, unknown>);

  if (!why) {
    return null;
  }

  return (
    <div className={styles.whyCard}>
      <div className={styles.whyCardTitle}>
        <span className={styles.whyCardIcon}>◆</span>
        Neden bu şekilde tasarlandı
      </div>
      <ul className={styles.whyCardList}>
        {why.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
