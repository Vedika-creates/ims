# IMS Deployment Guide

## 🚀 Deployment Setup

### Backend & Database on Render

#### 1. Database Setup
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure:
   - Name: `ims-database`
   - Database Name: `ims_db`
   - User: `postgres`
   - Plan: Free (or paid for production)
4. Note the connection string

#### 2. Backend Deployment
1. Push your code to GitHub
2. Go to Render Dashboard → "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `ims-backend`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free` (or paid for production)

#### 3. Environment Variables for Backend
Add these in Render Dashboard → Web Service → Environment:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=your-database-connection-string
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Frontend on Vercel

#### 1. Frontend Deployment
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### 2. Environment Variables for Frontend
Add in Vercel Dashboard → Project → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-domain.onrender.com
```

## 📋 Pre-Deployment Checklist

### Backend Preparation
- [ ] Update `backend/.env.production` with actual values
- [ ] Ensure all API endpoints work correctly
- [ ] Test database connection
- [ ] Add proper error handling
- [ ] Implement CORS correctly

### Frontend Preparation
- [ ] Update API base URL in `frontend/src/services/api.js`
- [ ] Test all API calls
- [ ] Ensure responsive design works
- [ ] Optimize images and assets
- [ ] Test build process locally: `npm run build`

### Database Preparation
- [ ] Create database schema/migration scripts
- [ ] Add seed data if needed
- [ ] Set up proper indexes
- [ ] Configure backup strategy

## 🔧 Configuration Files Created

### Backend Files
- `backend/render.yaml` - Render service configuration
- `backend/.env.production` - Production environment variables

### Frontend Files
- `frontend/vercel.json` - Vercel deployment configuration
- `frontend/.env.production` - Production environment variables

## 🌐 Post-Deployment Steps

### 1. Update Domain Names
- Replace `your-backend-domain.onrender.com` with actual Render URL
- Replace `your-frontend-domain.vercel.app` with actual Vercel URL

### 2. Test Everything
- Check all API endpoints
- Test user authentication
- Verify database operations
- Test file uploads if any

### 3. Monitor & Maintain
- Set up monitoring on Render
- Configure error tracking
- Set up database backups
- Monitor performance metrics

## 🛠️ Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure `CORS_ORIGIN` matches your Vercel domain
2. **Database Connection**: Verify `DATABASE_URL` is correct
3. **Build Failures**: Check logs for missing dependencies
4. **API Timeouts**: Free plans have cold start delays

### Useful Commands
```bash
# Test frontend build locally
cd frontend
npm run build

# Test backend locally with production config
cd backend
NODE_ENV=production node server.js
```

## 📊 Cost Considerations

### Free Tier Limits
- **Render**: 750 hours/month, 512MB RAM
- **Vercel**: 100GB bandwidth/month
- **PostgreSQL**: 256MB RAM, 90 days retention

### Production Recommendations
- Upgrade to paid plans for better performance
- Set up custom domains
- Implement proper monitoring
- Configure automated backups

## 🔒 Security Best Practices
- Use strong JWT secrets
- Enable HTTPS (automatic on both platforms)
- Implement rate limiting
- Set up proper database permissions
- Regular security updates
