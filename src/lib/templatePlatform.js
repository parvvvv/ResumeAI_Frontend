export function isTemplatePlatformEnabled() {
  return import.meta.env.VITE_ENABLE_TEMPLATE_PLATFORM === 'true';
}

export function canAccessTemplatePlatform(user) {
  if (!isTemplatePlatformEnabled()) return false;
  return !!user;
}

export const TEMPLATE_TAG_OPTIONS = [
  'ats',
  'minimal',
  'developer',
  'creative',
  'student',
  'executive',
];
