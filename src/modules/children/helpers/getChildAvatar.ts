import type { Sex } from '../children.types';

const AVATARS: Record<Sex, string> = {
  male: 'assets/img/boy.png',
  female: 'assets/img/girl.png',
};

export function getChildAvatar(sex: Sex | null): string {
  return sex ? AVATARS[sex] : '';
}
