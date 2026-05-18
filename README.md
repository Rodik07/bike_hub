# BikeHub – Explore Your Dream Ride

A complete MERN stack web application for exploring and comparing motorcycles in Nepal. Features include virtual bike showroom, 360° bike view, comparison tool, EMI calculator, test ride booking, dealer locator, and an intelligent chatbot.

## 🚀 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Local)
- **Authentication**: JWT, Google OAuth 2.0
- **Maps**: Leaflet + OpenStreetMap
- **3D Models**: Three.js, React Three Fiber
- **Animations**: Framer Motion, Lottie React

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (Local Community Edition)
- **npm** or **yarn**

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bike_hub
```

### 2. Install Dependencies

Install dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set Up Environment Variables

#### Server Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bike_hub

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000

# Session Secret
SESSION_SECRET=your-session-secret-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Email Configuration (Optional - for dealer welcome emails)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**Important**: Replace `JWT_SECRET` with a strong, random string. You can generate one using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Client Environment Variables

Create a `.env` file in the `client` directory (optional, defaults are set):

```env
VITE_API_URL=http://localhost:5001
VITE_FRONTEND_URL=http://localhost:3000
```

### 4. Start MongoDB

Make sure MongoDB is running on your local machine:

```bash
# On macOS (if installed via Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
# Start MongoDB service from Services panel
```

### 5. Create Admin User (Optional)

Create an admin user to access admin features:

```bash
cd server
node create-admin.js
```

Follow the prompts to create an admin account.

## 🏃 Running the Application

### Development Mode

You need to run both the server and client in separate terminals:

#### Terminal 1 - Start Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5001`

#### Terminal 2 - Start Frontend Client

```bash
cd client
npm run dev
```

The client will start on `http://localhost:3000`

### Production Build

To build the application for production:

```bash
# Build client
cd client
npm run build

# The built files will be in client/dist/
```

## 📁 Project Structure

```
bike_hub/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context providers
│   │   ├── utils/         # Utility functions
│   │   └── assets/        # Static assets (images, Lottie files)
│   ├── public/            # Public assets
│   └── package.json
│
├── server/                 # Node.js backend application
│   ├── config/            # Configuration files (passport, etc.)
│   ├── middleware/        # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── uploads/           # Uploaded files (images, 3D models)
│   └── server.js          # Main server file
│
├── .gitignore
└── README.md
```

## 🔑 Default Routes

### Frontend Routes
- `/` - Home page
- `/bikes` - Browse all bikes
- `/bikes/:id` - Bike details page
- `/compare` - Bike comparison page
- `/dealers` - Dealer locator
- `/login` - Login page (also available as modal)
- `/register` - Registration page (also available as modal)
- `/dashboard` - User dashboard
- `/admin` - Admin dashboard
- `/dealer` - Dealer dashboard

### API Routes
- `GET /api/bikes` - Get all bikes
- `GET /api/bikes/:id` - Get bike by ID
- `GET /api/dealers` - Get all dealers
- `GET /api/dealers/:id/bikes` - Get bikes listed by a dealer
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login
- `POST /api/bookings` - Book test ride
- `POST /api/chatbot` - Chatbot query

## 👥 User Roles

1. **User** - Browse bikes, compare, book test rides, view dealers
2. **Dealer** - Manage bike listings, view bookings, respond to inquiries
3. **Admin** - Full access to manage bikes, dealers, promotions, and users

## 🎯 Key Features

- ✅ Virtual bike showroom with 360° view
- ✅ Bike comparison tool
- ✅ EMI calculator
- ✅ Test ride booking system
- ✅ Dealer and service center locator with map
- ✅ Intelligent chatbot with bike specs and comparisons
- ✅ Search and filter bikes
- ✅ Google OAuth authentication
- ✅ Responsive design with animations
- ✅ Multi-step forms for bike management
- ✅ Image and 3D model uploads

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check service status
- Verify `MONGODB_URI` in `.env` is correct
- Check MongoDB is listening on port 27017

### Port Already in Use
- Change `PORT` in `server/.env` if 5001 is taken
- Update `VITE_API_URL` in `client/.env` to match
- Update Vite proxy in `client/vite.config.js` if needed

### Module Not Found Errors
- Run `npm install` in both `client` and `server` directories
- Delete `node_modules` and `package-lock.json`, then reinstall

### Google OAuth Not Working
- Google OAuth is optional - the app works without it
- If configured, ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Verify callback URL matches in Google Console

## 📝 Notes

- This is a local-only application (no cloud deployment)
- MongoDB must be running locally
- All file uploads are stored in `server/uploads/`
- The application uses JWT for authentication
- Chatbot is rule-based (no AI/LLM services)

## 🤝 Contributing

This is an academic project. For questions or issues, please refer to the project documentation.

## Security Features

- **Helmet**: Secures HTTP headers.
- **XSS Protection**: Sanitizes user input to prevent Cross-Site Scripting.
- **NoSQL Injection Prevention**: Sanitizes data to prevent MongoDB operator injection.
- **CSRF Protection**: Custom middleware verifies Origin/Referer for state-changing requests.
- **Rate Limiting**: Protects against brute-force and DoS attacks.

## 📄 License

This project is for academic purposes.

---

**Happy Coding! 🏍️**
