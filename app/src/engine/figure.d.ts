/* eslint-disable @typescript-eslint/no-explicit-any */
export const L: any;
export const FIG: Record<string, any>;
export const PROP: Record<string, (p: any, s: any, t: number) => string>;
export function skel(pose: any): any;
export function lerp(a: any, b: any, t: number): any;
export function hero(s: any, mus: { p: string[]; s: string[] }, op: number): string;
export function maps(p: string[], s: string[]): string;
export function onMap(name: string): boolean;
export function render(ex: any, pose: any, ph: number, ghost?: any): string;
