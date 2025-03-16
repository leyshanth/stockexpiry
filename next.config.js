/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  // Copy your existing configuration here
  // For example:
  reactStrictMode: true,
  // ... other options
};

module.exports = withPWA(nextConfig); 