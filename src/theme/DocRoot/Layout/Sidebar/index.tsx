import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import {useLocation} from '@docusaurus/router';
import DocSidebar from '@theme/DocSidebar';
import type {Props} from '@theme/DocRoot/Layout/Sidebar';

import styles from './styles.module.css';

// Reset sidebar state when sidebar changes
// Use React key to unmount/remount the children
// See https://github.com/facebook/docusaurus/issues/3414
function ResetOnSidebarChange({children}: {children: ReactNode}) {
  const sidebar = useDocsSidebar();
  return (
    <React.Fragment key={sidebar?.name ?? 'noSidebar'}>
      {children}
    </React.Fragment>
  );
}

export default function DocRootLayoutSidebar({sidebar}: Props): ReactNode {
  const {pathname} = useLocation();

  return (
    <aside className={clsx(ThemeClassNames.docs.docSidebarContainer, styles.docSidebarContainer)}>
      <ResetOnSidebarChange>
        <div className={styles.sidebarViewport}>
          <DocSidebar sidebar={sidebar} path={pathname} onCollapse={() => {}} isHidden={false} />
        </div>
      </ResetOnSidebarChange>
    </aside>
  );
}
