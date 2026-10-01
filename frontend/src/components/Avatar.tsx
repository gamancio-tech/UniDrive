import React from 'react';

interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PALETTE = [
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#16a34a', // Green
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#ea580c', // Orange
  '#059669', // Emerald
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  photoUrl,
  size = 'md',
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';
  const bgColor = getColorForName(name || '');
  const initials = getInitials(name || '');

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`avatar ${sizeClass} ${className}`.trim()}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      className={`avatar ${sizeClass} ${className}`.trim()}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {initials}
    </div>
  );
};
