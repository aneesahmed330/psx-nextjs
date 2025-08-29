# 📈 PSX Portfolio Dashboard

A modern, full-stack Next.js application for tracking Pakistan Stock Exchange (PSX) investments. Built with TypeScript, MongoDB, and shadcn/ui for a professional portfolio management experience.

![PSX Portfolio Dashboard](https://img.shields.io/badge/Next.js-15.5.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.8.0-green)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-orange)

## ✨ Features

### 🎯 Core Functionality

- **Portfolio Tracking**: Real-time portfolio value, P/L, and performance metrics
- **Trade Management**: Log buy/sell transactions with detailed history
- **Price Alerts**: Set custom price alerts with trigger notifications
- **Analytics Dashboard**: Interactive charts and performance analysis
- **Stock Management**: Add/remove PSX stock symbols for tracking

### 🎨 User Experience

- **Modern Dark Theme**: Professional, eye-friendly interface
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-time Updates**: Live data with automatic refresh
- **Fast Performance**: Intelligent caching with SWR
- **Export Functionality**: Download data as CSV

### 🔧 Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: shadcn/ui with Tailwind CSS
- **Database**: MongoDB with optimized queries
- **Charts**: Recharts for interactive visualizations
- **Authentication**: JWT-based auth system
- **Caching**: SWR for intelligent data caching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd psx-nextjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` in the root directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/psx-portfolio
   DB_NAME=psx-portfolio
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ADMIN_EMAIL=123
   ADMIN_PASSWORD=123
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with: Email: `123`, Password: `123`

## 📊 Dashboard Overview

### Portfolio Metrics

- **Total Investment**: Sum of all buy transactions
- **Market Value**: Current portfolio worth
- **Unrealized P/L**: Paper profit/loss
- **Realized Profit**: Actual profit from sales
- **% Change**: Overall portfolio performance

### Main Sections

#### 📈 Portfolio Tab

- Holdings table with sortable columns
- Performance indicators (green/red)
- Export to CSV functionality
- Real-time price updates

#### 📊 Analytics Tab

- Portfolio allocation pie chart
- Performance bar charts
- Best/worst performer metrics
- Interactive visualizations

#### 💼 Trades Tab

- Complete trade history
- Advanced filtering by symbol/date
- Trade statistics dashboard
- Buy/sell transaction management

#### 🔔 Alerts Tab

- Price alert configuration
- Enable/disable notifications
- Trigger status tracking
- Alert management interface

## 🏗️ Architecture

### API Routes

```
/api/
├── auth/
│   ├── login       # User authentication
│   ├── logout      # Session termination
│   └── verify      # Token validation
├── portfolio       # Portfolio calculations
├── prices          # Price data management
├── trades          # Trade operations
├── alerts          # Alert management
└── stocks          # Stock symbol management
```

### Database Schema

```
Collections:
├── prices          # Historical price data
├── trades          # Buy/sell transactions
├── alerts          # Price alert configurations
├── stocks          # Stock symbols and metadata
└── users           # User accounts (future)
```

### Component Structure

```
components/
├── ui/             # shadcn/ui base components
├── dashboard.tsx   # Main dashboard layout
├── sidebar.tsx     # Navigation and quick actions
├── portfolio-*.tsx # Portfolio-related components
├── trade-*.tsx     # Trade management components
└── alerts-*.tsx    # Alert management components
```

## 🔧 Development

### Key Technologies

- **Next.js 15**: App Router, Server Components
- **TypeScript**: Full type safety
- **MongoDB**: Document database with aggregation
- **SWR**: Data fetching and caching
- **Recharts**: Chart library
- **shadcn/ui**: Component system
- **Tailwind CSS**: Utility-first CSS

### Performance Optimizations

- **SWR Caching**: Intelligent data caching with TTL
- **MongoDB Indexes**: Optimized database queries
- **Component Lazy Loading**: Reduced bundle size
- **Image Optimization**: Next.js image optimization

### Data Flow

1. **API Routes**: Handle CRUD operations
2. **SWR Hooks**: Manage data fetching and caching
3. **Components**: Display data with real-time updates
4. **MongoDB**: Store and aggregate data efficiently

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 768px (stacked layout)
- **Tablet**: 768px - 1024px (adapted grid)
- **Desktop**: > 1024px (full layout)

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **HTTP-Only Cookies**: Secure token storage
- **Input Validation**: Server-side validation
- **CORS Protection**: API route protection
- **Environment Variables**: Secure configuration

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variables
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

### Environment Setup

- Set production MongoDB URI
- Generate secure NEXTAUTH_SECRET
- Configure domain in NEXTAUTH_URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation in `/setup.md`
- Review the API documentation

## 🔮 Future Roadmap

- [ ] Real-time PSX price integration
- [ ] Company fundamentals data
- [ ] Advanced portfolio analytics
- [ ] Email/SMS notifications
- [ ] Mobile application
- [ ] PDF report generation
- [ ] Multi-user support
- [ ] Dark/light theme toggle

---

Built with ❤️ for the Pakistan Stock Exchange community
