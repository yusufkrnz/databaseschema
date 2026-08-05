import React, {type ReactNode} from 'react';
import Content from '@theme/DocSidebar/Desktop/Content';
import type {Props} from '@theme/DocSidebar/Desktop';

import styles from './styles.module.css';

function DocSidebarDesktop({path, sidebar}: Props): ReactNode {
  return (
    <div className={styles.sidebar}>
      <Content path={path} sidebar={sidebar} />
    </div>
  );
}

export default React.memo(DocSidebarDesktop);
