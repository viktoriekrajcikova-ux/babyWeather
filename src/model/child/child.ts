// TODO: enum
export type Sex = 'male' | 'female';

export interface Child {
    id: number;
    name: string;
    age: number;
    sex: Sex | null;
}