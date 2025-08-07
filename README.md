# Shoal Intelligence Dashboard

A modern, dark-themed crypto analytics dashboard built with Next.js and Tailwind CSS. This project provides a comprehensive set of reusable UI components for building professional dashboard applications.

## Features

- 🎨 **Dark Theme Design** - Professional dark theme optimized for data visualization
- 📊 **Reusable Components** - Comprehensive set of dashboard UI components
- 📱 **Responsive Design** - Mobile-friendly layout with adaptive components
- ⚡ **Performance Optimized** - Built with Next.js 14 and optimized for speed
- 🎯 **Accessibility** - WCAG compliant components with proper focus management

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Dashboard UI Components

### Layout Components

#### `.dashboard-layout`
Main container for the dashboard application.

```jsx
<div className="dashboard-layout">
  {/* Your dashboard content */}
</div>
```

#### `.dashboard-sidebar`
Left sidebar navigation component.

```jsx
<div className="dashboard-sidebar">
  <div className="dashboard-sidebar-icon active">
    <BarChart3 />
  </div>
  <div className="dashboard-sidebar-icon">
    <Search />
  </div>
  {/* More icons */}
</div>
```

#### `.dashboard-header`
Top header bar with title and search.

```jsx
<div className="dashboard-header">
  <div>
    <h1>Dashboard Title</h1>
    <p>Subtitle</p>
  </div>
  <div className="flex items-center space-x-4">
    {/* Search and buttons */}
  </div>
</div>
```

#### `.dashboard-main`
Main content area.

```jsx
<div className="dashboard-main">
  {/* Dashboard content */}
</div>
```

### Card Components

#### `.dashboard-card`
Standard card container with dark theme styling.

```jsx
<div className="dashboard-card">
  <div className="dashboard-card-header">
    <div>
      <h3 className="dashboard-card-title">Card Title</h3>
      <p className="dashboard-card-subtitle">Card subtitle</p>
    </div>
    <button className="dashboard-btn dashboard-btn-secondary">
      Action
    </button>
  </div>
  {/* Card content */}
</div>
```

#### `.dashboard-metric-card`
Specialized card for displaying metrics.

```jsx
<div className="dashboard-metric-card">
  <div className="dashboard-metric-label">Metric Label</div>
  <div className="dashboard-metric-value">$2.8T</div>
  <div className="dashboard-metric-change positive">
    <TrendingUp className="dashboard-icon-sm inline mr-1" />
    +12.5%
  </div>
</div>
```

### Button Components

#### Primary Button
```jsx
<button className="dashboard-btn dashboard-btn-primary">
  Primary Action
</button>
```

#### Secondary Button
```jsx
<button className="dashboard-btn dashboard-btn-secondary">
  Secondary Action
</button>
```

#### Success Button
```jsx
<button className="dashboard-btn dashboard-btn-success">
  Success Action
</button>
```

#### Danger Button
```jsx
<button className="dashboard-btn dashboard-btn-danger">
  Delete
</button>
```

#### Button Sizes
```jsx
<button className="dashboard-btn dashboard-btn-primary dashboard-btn-sm">Small</button>
<button className="dashboard-btn dashboard-btn-primary">Default</button>
<button className="dashboard-btn dashboard-btn-primary dashboard-btn-lg">Large</button>
```

### Filter Buttons

#### Default State
```jsx
<button className="dashboard-filter-btn default">
  Filter Option
</button>
```

#### Selected State
```jsx
<button className="dashboard-filter-btn selected">
  Selected Filter
</button>
```

### Form Components

#### Search Input
```jsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--dashboard-text-muted)] w-4 h-4" />
  <input
    type="text"
    placeholder="Search..."
    className="dashboard-search pl-10 pr-4"
  />
</div>
```

#### Checkbox
```jsx
<input type="checkbox" className="dashboard-checkbox" />
```

#### Radio Button
```jsx
<input type="radio" className="dashboard-radio" />
```

### Progress Components

#### Progress Bar
```jsx
<div className="dashboard-progress">
  <div className="dashboard-progress-bar success" style={{ width: '73%' }}></div>
</div>
```

#### Progress Bar Variants
```jsx
<div className="dashboard-progress-bar success"></div>   {/* Green */}
<div className="dashboard-progress-bar warning"></div>   {/* Orange */}
<div className="dashboard-progress-bar error"></div>     {/* Red */}
```

### Table Components

#### Basic Table
```jsx
<table className="dashboard-table">
  <thead>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

### Status Indicators

#### Success Status
```jsx
<span className="dashboard-status success">Success</span>
```

#### Warning Status
```jsx
<span className="dashboard-status warning">Warning</span>
```

#### Error Status
```jsx
<span className="dashboard-status error">Error</span>
```

#### Info Status
```jsx
<span className="dashboard-status info">Info</span>
```

### Grid Layouts

#### 2-Column Grid
```jsx
<div className="dashboard-grid-2">
  <div className="dashboard-card">Content 1</div>
  <div className="dashboard-card">Content 2</div>
</div>
```

#### 3-Column Grid
```jsx
<div className="dashboard-grid-3">
  <div className="dashboard-card">Content 1</div>
  <div className="dashboard-card">Content 2</div>
  <div className="dashboard-card">Content 3</div>
</div>
```

#### 4-Column Grid
```jsx
<div className="dashboard-grid-4">
  <div className="dashboard-card">Content 1</div>
  <div className="dashboard-card">Content 2</div>
  <div className="dashboard-card">Content 3</div>
  <div className="dashboard-card">Content 4</div>
</div>
```

### Chart Components

#### Chart Container
```jsx
<div className="dashboard-chart">
  {/* Chart content */}
</div>
```

#### Mini Chart
```jsx
<div className="dashboard-chart-mini">
  {/* Mini chart content */}
</div>
```

### Loading States

#### Skeleton Text
```jsx
<div className="dashboard-skeleton-text"></div>
```

#### Skeleton Card
```jsx
<div className="dashboard-skeleton-card"></div>
```

### Animation Classes

#### Fade In
```jsx
<div className="dashboard-fade-in">
  {/* Animated content */}
</div>
```

#### Slide In
```jsx
<div className="dashboard-slide-in">
  {/* Animated content */}
</div>
```

#### Scale In
```jsx
<div className="dashboard-scale-in">
  {/* Animated content */}
</div>
```

### Icon Components

#### Standard Icon
```jsx
<Search className="dashboard-icon" />
```

#### Small Icon
```jsx
<Search className="dashboard-icon-sm" />
```

#### Large Icon
```jsx
<Search className="dashboard-icon-lg" />
```

## CSS Custom Properties

The dashboard uses CSS custom properties for consistent theming:

### Colors
```css
--dashboard-bg: #1A1A1A;                    /* Main background */
--dashboard-card-bg: #2C2C2C;               /* Card background */
--dashboard-border: #404040;                 /* Border color */
--dashboard-text-primary: #E0E0E0;          /* Primary text */
--dashboard-text-secondary: #A0A0A0;        /* Secondary text */
--dashboard-text-muted: #808080;            /* Muted text */
--dashboard-green: #4CAF50;                 /* Success green */
--dashboard-blue: #2196F3;                  /* Primary blue */
--dashboard-red: #F44336;                   /* Error red */
--dashboard-orange: #FF9800;                /* Warning orange */
```

### Typography
```css
--dashboard-font-family: 'Inter', sans-serif;
--dashboard-font-size-xs: 0.75rem;
--dashboard-font-size-sm: 0.875rem;
--dashboard-font-size-base: 1rem;
--dashboard-font-size-lg: 1.125rem;
--dashboard-font-size-xl: 1.25rem;
--dashboard-font-size-2xl: 1.5rem;
--dashboard-font-size-3xl: 1.875rem;
--dashboard-font-size-4xl: 2.25rem;
```

### Spacing
```css
--dashboard-spacing-xs: 0.25rem;
--dashboard-spacing-sm: 0.5rem;
--dashboard-spacing-md: 1rem;
--dashboard-spacing-lg: 1.5rem;
--dashboard-spacing-xl: 2rem;
--dashboard-spacing-2xl: 3rem;
```

## Responsive Design

The dashboard components are fully responsive:

- **Mobile (< 768px)**: Single column layouts, smaller icons, reduced padding
- **Tablet (768px - 1024px)**: 2-column grids, medium spacing
- **Desktop (> 1024px)**: Full layouts, 3-4 column grids, optimal spacing

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub.
