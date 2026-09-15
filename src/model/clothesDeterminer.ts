import type { Sex } from './child';

export type BodySlot = 'head' | 'torso' | 'legs' | 'feet' | 'hands' | 'wholeBody';

export type ClothesItem = {
    name: string
    imageUrl: string
    slot: BodySlot
    // teplotní pásmo se porovnává proti POCITOVÉ teplotě (feels_like)
    tempFrom: number | null
    tempTo: number | null
    ageFrom: number | null
    ageTo: number | null
    sex: Sex | null
    layer: 'base' | 'mid' | 'outer'
}

export const CLOTHES: ClothesItem[] = [
    // summer
    {name: 'shirt', imageUrl: 'assets/img/shirt.png', slot: 'torso', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'shorts', imageUrl: 'assets/img/shorts.png', slot: 'legs', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: 'male', layer: 'base'},
    {name: 'skirt', imageUrl: 'assets/img/skirt.png', slot: 'legs', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: 'female', layer: 'base'},
    {name: 'hat', imageUrl: 'assets/img/hat.png', slot: 'head', tempFrom: 20, tempTo: null, ageFrom: 0, ageTo: null, sex: null, layer: 'base'},
    {name: 'sandals', imageUrl: 'assets/img/sandals.png', slot: 'feet', tempFrom: 25, tempTo: null, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'baby clothes', imageUrl: 'assets/img/babyClothes.png', slot: 'torso', tempFrom: 20, tempTo: null, ageFrom: 0, ageTo: 1, sex: null, layer: 'base'},
    {name: 'shoes', imageUrl: 'assets/img/boots.png', slot: 'feet', tempFrom: 10, tempTo: 25, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'shorts', imageUrl: 'assets/img/shorts.png', slot: 'legs', tempFrom: 20, tempTo: null, ageFrom: 0, ageTo: 1, sex: null, layer: 'base'},

    // winter
    {name: 'sweater', imageUrl: 'assets/img/sweater.png', slot: 'torso', tempFrom: null, tempTo: 0, ageFrom: 1, ageTo: null, sex: null, layer: 'mid'},
    {name: 'warm sweatpants', imageUrl: 'assets/img/warmSweatpants.svg', slot: 'legs', tempFrom: null, tempTo: 0, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'snow boots', imageUrl: 'assets/img/boots.png', slot: 'feet', tempFrom: null, tempTo: 10, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'long shirt', imageUrl: 'assets/img/longShirt.png', slot: 'torso', tempFrom: null, tempTo: 20, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'long sleeve body', imageUrl: 'assets/img/babyClothes.png', slot: 'torso', tempFrom: null, tempTo: 20, ageFrom: 0, ageTo: 1, sex: null, layer: 'base'},
    {name: 'sweater', imageUrl: 'assets/img/sweater.png', slot: 'torso', tempFrom: null, tempTo: 15, ageFrom: 0, ageTo: 1, sex: null, layer: 'mid'},
    {name: 'snowsuit', imageUrl: 'assets/img/snowsuit.png', slot: 'wholeBody', tempFrom: null, tempTo: 10, ageFrom: 0, ageTo: 1, sex: null, layer: 'outer'},
    {name: 'tights', imageUrl: 'assets/img/tights.png', slot: 'legs', tempFrom: null, tempTo: 20, ageFrom: 0, ageTo: 1, sex: null, layer: 'base'},
    {name: 'thin sweatpants', imageUrl: 'assets/img/warmSweatpants.svg', slot: 'legs', tempFrom: 0, tempTo: 15, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'winter hat', imageUrl: 'assets/img/winterHat.png', slot: 'head', tempFrom: null, tempTo: 10, ageFrom: null, ageTo: null, sex: null, layer: 'base'},
    {name: 'glove', imageUrl: 'assets/img/glove.png', slot: 'hands', tempFrom: null, tempTo: 0, ageFrom: 0, ageTo: null, sex: null, layer: 'base'},
    {name: 'winter jacket', imageUrl: 'assets/img/winterJacket.png', slot: 'torso', tempFrom: null, tempTo: 10, ageFrom: 1, ageTo: null, sex: null, layer: 'outer'},
    {name: 'winter pants', imageUrl: 'assets/img/winterPants.png', slot: 'legs', tempFrom: null, tempTo: 10, ageFrom: 1, ageTo: null, sex: null, layer: 'outer'},

    // autumn, spring
    {name: 'hat', imageUrl: 'assets/img/hat.png', slot: 'head', tempFrom: 10, tempTo: 20, ageFrom: 0, ageTo: null, sex: null, layer: 'base'},
    {name: 'transition suit', imageUrl: 'assets/img/snowsuit.png', slot: 'wholeBody', tempFrom: 10, tempTo: 20, ageFrom: 0, ageTo: 1, sex: null, layer: 'outer'},
    {name: 'transition jacket', imageUrl: 'assets/img/winterJacket.png', slot: 'torso', tempFrom: 10, tempTo: 15, ageFrom: 1, ageTo: null, sex: null, layer: 'outer'},
    {name: 'insulated pants', imageUrl: 'assets/img/winterPants.png', slot: 'legs', tempFrom: 10, tempTo: 15, ageFrom: 1, ageTo: null, sex: null, layer: 'outer'},
    {name: 'warm sweatpants', imageUrl: 'assets/img/warmSweatpants.svg', slot: 'legs', tempFrom: 15, tempTo: 20, ageFrom: 1, ageTo: null, sex: null, layer: 'base'},
    {name: 'sweater', imageUrl: 'assets/img/sweater.png', slot: 'torso', tempFrom: 15, tempTo: 20, ageFrom: 1, ageTo: null, sex: null, layer: 'mid'},

];


function matches(item: ClothesItem, feelsLike: number, age: number, sex: Sex | null): boolean {
    return (item.tempFrom === null || item.tempFrom <= feelsLike) &&
        (item.tempTo === null || item.tempTo > feelsLike) &&
        (item.ageFrom === null || item.ageFrom <= age) &&
        (item.ageTo === null || item.ageTo > age) &&
        (item.sex === null || item.sex === sex);
}

function lowerBound(item: ClothesItem): number {
    return item.tempFrom ?? -Infinity;
}
function upperBound(item: ClothesItem): number {
    return item.tempTo ?? Infinity;
}

function isBetterFit(candidate: ClothesItem, current: ClothesItem): boolean {
    if (lowerBound(candidate) !== lowerBound(current)) {
        return lowerBound(candidate) > lowerBound(current);
    }
    return upperBound(candidate) < upperBound(current);
}

export function getOutfit(feelsLike: number, age: number, sex: Sex | null, catalog: ClothesItem[] = CLOTHES): ClothesItem[] {
    const sexFilter = sex ?? 'male';
    const bySlot = new Map<string, ClothesItem>();

    for (const item of catalog) {
        if (!matches(item, feelsLike, age, sexFilter)) continue;

        const keySlot = item.slot + ':' + item.layer;
        const current = bySlot.get(keySlot);
        if (!current || isBetterFit(item, current)) {
            bySlot.set(keySlot, item);
        }
    }

    
    if (bySlot.has('wholeBody:outer')) {
        bySlot.delete('torso:outer');
        bySlot.delete('legs:outer');
    }

    return [...bySlot.values()];
}
