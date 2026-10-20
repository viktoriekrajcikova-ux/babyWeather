import { atom } from 'jotai';

import { readStoredCoords } from '../helpers/selectedLocationStorage';
import type { SelectedLocation } from '../types';

export const selectedLocationAtom = atom<SelectedLocation>(readStoredCoords());
