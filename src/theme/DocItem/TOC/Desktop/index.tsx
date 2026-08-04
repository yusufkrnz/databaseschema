import React, {type ReactNode} from 'react';
import Desktop from '@theme-original/DocItem/TOC/Desktop';
import type DesktopType from '@theme/DocItem/TOC/Desktop';
import type {WrapperProps} from '@docusaurus/types';
import WhyCard from '@site/src/components/WhyCard';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DesktopType>;

export default function DesktopWrapper(props: Props): ReactNode {
  return (
    <div className={styles.stickyGroup}>
      <Desktop {...props} />
      <WhyCard />
    </div>
  );
}
