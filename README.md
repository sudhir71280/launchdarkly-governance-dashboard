# LaunchDarkly Governance Dashboard - React

A comprehensive React application for managing LaunchDarkly feature flag lifecycle, cleanup, and governance at enterprise scale.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Open dashboard:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Configure credentials:**
   - Click the menu button (≡) in the top-left
   - Enter your LaunchDarkly API token and project key
   - Save configuration

## 📊 Features

- **Interactive Dashboard**: Real-time visualization of flag metrics
- **Advanced Charts**: Lifecycle, age distribution
- **Flag Management**: Cleanup recommendations and archival
- **Governance Alerts**: Smart notifications for flag maintenance
- **CSV Export**: Download cleanup reports
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Technology Stack

- React 18 with Material-UI v5
- Recharts for data visualization
- Axios for API integration
- Notistack for notifications

## 📦 Build for Production

```bash
npm run build
```

## 🔧 Configuration

Set your LaunchDarkly credentials either:
1. Through the dashboard sidebar configuration panel, or
2. Via environment variables in a `.env` file:

```bash
REACT_APP_LAUNCHDARKLY_API_TOKEN=your-api-token
REACT_APP_LAUNCHDARKLY_PROJECT_KEY=your-project-key
```

## 📄 License

MIT License
