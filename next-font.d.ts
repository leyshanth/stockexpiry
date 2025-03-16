import { NextFont } from 'next/dist/compiled/@next/font';

declare module 'next/dist/compiled/@next/font' {
  interface NextFont {
    variable: string;
  }
} 