declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  
  function withPWA(options: any): (config: NextConfig) => NextConfig;
  export default withPWA;
} 