import type { Field } from './fields';

export type SelectF = Extract<Field, { kind: 'select' }>;
export type TextF = Extract<Field, { kind: 'text' }>;
export type CheckboxF = Extract<Field, { kind: 'checkbox' }>;
export type NumberF = Extract<Field, { kind: 'number' }>;
export type RulesF = Extract<Field, { kind: 'rules' }>;
