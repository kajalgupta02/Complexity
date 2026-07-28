import type { SelectHTMLAttributes } from 'react';

type Size = 'sm' | 'md';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  size?: Size;
}

export function Select({ size = 'md', className = '', children, ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      className={[
        'select-native',
        size === 'sm' ? 'select-sm' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </select>
  );
}
