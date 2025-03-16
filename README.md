# Stock & Expiry Tracker PWA

A Progressive Web App for tracking product stock and expiry dates.

## Features

- User authentication (login/register)
- Product management
- Expiry date tracking
- Barcode scanning
- Deleted items history with CSV export
- PWA support for offline use and mobile installation

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- PostgreSQL
- NextAuth.js for authentication
- Shadcn UI components
- Tailwind CSS for styling
- Quagga2 for barcode scanning

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stock-expiry-tracker.git
   cd stock-expiry-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/stock_expiry
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   ```

4. Set up the database:
   ```bash
   psql -U username -d stock_expiry -f db/schema.sql
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This app can be deployed to any platform that supports Next.js applications, such as Vercel, Netlify, or a custom server.

### Building for Production

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License.
