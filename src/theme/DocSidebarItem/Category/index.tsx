import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Category from '@theme-original/DocSidebarItem/Category';
import type CategoryType from '@theme/DocSidebarItem/Category';
import type {WrapperProps} from '@docusaurus/types';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type Props = WrapperProps<typeof CategoryType>;

function getIconPath(customProps: unknown): string | undefined {
  if (!customProps || typeof customProps !== 'object') return undefined;
  const icon = (customProps as Record<string, unknown>).icon;
  return typeof icon === 'string' ? icon : undefined;
}

export default function CategoryWrapper(props: Props): ReactNode {
  const iconPath = getIconPath(props.item.customProps);
  const iconSrc = useBaseUrl(iconPath ?? '');

  if (!iconPath) {
    return <Category {...props} />;
  }

  return (
    // Infima'nın ".menu__list-item:not(:first-child)" boşluk kuralı,
    // burada eklediğimiz sarmalayıcı <div> yüzünden ilk-eleman gibi
    // görüneceğinden devre dışı kalır — index > 0 ise aynı boşluğu
    // (0.25rem) elle telafi ediyoruz.
    <div className={styles.categoryWithIcon} style={props.index > 0 ? {marginTop: '0.25rem'} : undefined}>
      <img
        src={iconSrc}
        alt=""
        className={clsx(styles.categoryIcon, iconPath.includes('mongodb') && styles.categoryIconMongo)}
      />
      <Category {...props} />
    </div>
  );
}
