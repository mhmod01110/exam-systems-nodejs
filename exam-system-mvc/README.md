# Exam System MVC

A secure and modern online examination system built with Node.js, Express, and EJS templating engine using MVC architecture.

## Features

- User Authentication & Authorization
  - Secure login and registration
  - Role-based access control (Student, Teacher, Admin)
  - Password reset functionality
  - Session management
  - CSRF protection

- Security
  - CSRF protection
  - XSS prevention
  - Secure headers with Helmet
  - Rate limiting
  - Input validation and sanitization
  - Secure password hashing
  - Session security
  - File upload validation

- Exam Management
  - Create and manage exams
  - Multiple question types
  - Time-based exams
  - Automatic grading
  - Result analysis

- User Interface
  - Responsive design
  - Modern Bootstrap 5 UI
  - Client-side validation
  - Real-time feedback
  - Password strength meter
  - File upload preview

## Prerequisites

- Node.js (>= 14.0.0)
- MongoDB (>= 4.4)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd exam-system-mvc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   - Set `MONGODB_URI`
   - Set `SESSION_SECRET`
   - Set `JWT_SECRET`
   - Configure SMTP settings for email
   - Adjust other settings as needed

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Visit `http://localhost:3000` in your browser

## Project Structure

```
exam-system-mvc/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # Route definitions
│   ├── utils/          # Utility functions
│   └── views/          # EJS templates
├── public/
│   ├── css/           # Stylesheets
│   ├── js/            # Client-side JavaScript
│   └── images/        # Static images
├── tests/             # Test files
├── app.js             # Application entry point
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## Security Features

1. CSRF Protection
   - CSRF tokens for all forms
   - Custom CSRF middleware
   - Token validation

2. XSS Prevention
   - Content Security Policy
   - XSS filters
   - Sanitized inputs

3. Session Security
   - Secure session configuration
   - MongoDB session store
   - Session expiration

4. Authentication
   - Secure password hashing
   - JWT for API authentication
   - Role-based authorization

5. Input Validation
   - Server-side validation
   - Client-side validation
   - Sanitization middleware

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Production Deployment

1. Set environment variables for production
2. Build assets if needed
3. Start the server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email [your-email@example.com](mailto:your-email@example.com) or create an issue in the repository. 