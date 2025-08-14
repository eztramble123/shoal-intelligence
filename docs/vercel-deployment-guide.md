# Vercel Deployment Best Practices & Workflow Guide

## 🎯 Understanding Vercel's Deployment Types

### **1. Production Deployment**
- **URL**: `your-project.vercel.app` (stable)
- **When**: Deploys from your main/master branch
- **Use for**: Live users, OAuth callbacks, stable APIs
- **Environment**: Production env vars

### **2. Preview Deployments**
- **URL**: `your-project-git-branch-name-team.vercel.app` (changes)
- **When**: Every push to non-production branches
- **Use for**: Testing features, sharing with team
- **Environment**: Preview env vars (can differ from production)

### **3. Development**
- **URL**: `localhost:3000`
- **When**: Local development
- **Use for**: Active development, debugging
- **Environment**: `.env.local` file

## 📋 Proper Git Workflow with Vercel

### **Standard Flow:**
```
main (production) 
  └── dev/staging (preview)
      └── feature/fix branches (preview)
```

### **Step-by-Step Workflow:**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   # or
   git checkout -b fix/bug-fix
   ```

2. **Develop Locally**
   ```bash
   npm run dev
   # Test at localhost:3000
   ```

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```
   - ✅ Vercel creates preview deployment automatically
   - 🔗 Get preview URL from Vercel dashboard or GitHub PR

4. **Test Preview Deployment**
   - Share preview URL with team
   - Test features in production-like environment
   - ⚠️ Don't use for OAuth testing (URL changes)

5. **Merge to Main**
   ```bash
   # Create PR on GitHub
   # Review and approve
   # Merge PR
   ```
   - ✅ Vercel deploys to production automatically
   - 🔗 Stable URL: `your-project.vercel.app`

## 🔧 Environment Variables Best Practices

### **Set Different Variables per Environment:**

1. **Development** (`.env.local`):
   ```env
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL=postgresql://dev-database
   ```

2. **Preview** (Vercel Dashboard):
   ```env
   NEXTAUTH_URL=https://your-project.vercel.app  # Use production URL
   DATABASE_URL=postgresql://staging-database
   ```

3. **Production** (Vercel Dashboard):
   ```env
   NEXTAUTH_URL=https://your-project.vercel.app
   DATABASE_URL=postgresql://production-database
   ```

### **Vercel Environment Variable Settings:**
- Go to: Project Settings → Environment Variables
- Set scope: 
  - ✅ Production (for main branch)
  - ✅ Preview (for all other branches)
  - ✅ Development (pulled by `vercel env pull`)

## 🚀 OAuth & Authentication Setup

### **The Right Way:**

1. **Use Production URL for OAuth**
   ```
   Google OAuth Redirect URI:
   https://shoal-intelligence.vercel.app/api/auth/callback/google
   ```

2. **Set NEXTAUTH_URL Properly**
   - Production: `https://shoal-intelligence.vercel.app`
   - Preview: Still use production URL for OAuth
   - Local: `http://localhost:3000`

3. **Why Not Preview URLs?**
   - Preview URLs change: `project-abc123-team.vercel.app`
   - Next deployment: `project-xyz789-team.vercel.app`
   - OAuth breaks every time!

## 📁 Recommended Project Structure

```
your-project/
├── .env.local          # Local dev (git ignored)
├── .env.example        # Template for team
├── main branch         # → Production
├── staging branch      # → Preview (optional)
└── feature/* branches  # → Preview (temporary)
```

## ✅ Deployment Checklist

### **Before First Deployment:**
- [ ] Set up GitHub repo
- [ ] Connect to Vercel
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)

### **For Each Feature:**
- [ ] Create feature branch
- [ ] Develop and test locally
- [ ] Push to GitHub (auto-preview)
- [ ] Test preview deployment
- [ ] Create PR
- [ ] Merge to main (auto-production)

## 🔑 Your Specific Setup

### **For Shoal Intelligence:**

1. **Production Setup:**
   - URL: `https://shoal-intelligence.vercel.app`
   - Branch: `main`
   - Use for: Real users, OAuth

2. **Environment Variables to Set:**
   ```env
   # Both Production & Preview
   DATABASE_URL=your-neon-db-url
   NEXTAUTH_SECRET=generate-secret
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   BLAKE_API_KEY=6lQDLdhe4i1KrGTJCAM68LXGcSet82FE
   STRIPE_SECRET_KEY=your-stripe-key
   
   # Production Only
   NEXTAUTH_URL=https://shoal-intelligence.vercel.app
   
   # Preview (still use production URL for OAuth)
   NEXTAUTH_URL=https://shoal-intelligence.vercel.app
   ```

3. **Google OAuth Setup:**
   Only add production URL:
   ```
   https://shoal-intelligence.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

## 🎯 Immediate Action Items

1. **Switch to main branch for testing OAuth**
   ```bash
   git checkout main
   git merge ui-todos  # When ready
   git push origin main
   ```

2. **Set environment variables in Vercel dashboard**
   - Go to Vercel → Project Settings → Environment Variables
   - Add all required variables
   - Set appropriate scopes (Production/Preview/Development)

3. **Update Google OAuth Console**
   - Remove preview/branch URLs
   - Only keep production and localhost URLs

4. **Test on Production**
   - Deploy to main branch
   - Test OAuth with stable URL
   - Verify all features work

## 💡 Pro Tips

### **Do's:**
- ✅ Use feature branches for development
- ✅ Test locally first
- ✅ Use production URL for OAuth
- ✅ Keep env vars organized by environment
- ✅ Use GitHub PR reviews before merging
- ✅ Tag releases for version tracking

### **Don'ts:**
- ❌ Don't test OAuth on preview deployments
- ❌ Don't commit `.env.local` files
- ❌ Don't use preview URLs in OAuth configs
- ❌ Don't deploy directly to main without testing
- ❌ Don't share production secrets in preview

### **Useful Vercel CLI Commands:**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Deploy to production
vercel --prod

# Deploy preview
vercel

# View logs
vercel logs
```

## 🔒 Security Best Practices

1. **Separate Databases**
   - Production: Production data only
   - Preview/Dev: Test data only

2. **API Keys**
   - Use different keys for prod/dev when possible
   - Rotate keys regularly
   - Never commit secrets to git

3. **Access Control**
   - Limit production deployments to main branch
   - Use GitHub branch protection
   - Review PRs before merging

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Environment Variables Best Practices](https://vercel.com/docs/environment-variables)

## 🆘 Troubleshooting Common Issues

### **OAuth Redirect Mismatch**
- **Cause**: URL in Google doesn't match NextAuth
- **Fix**: Use production URL only

### **Environment Variables Not Working**
- **Cause**: Wrong scope or not set
- **Fix**: Check Vercel dashboard settings

### **Build Failing on Vercel**
- **Cause**: Missing env vars or dependencies
- **Fix**: Check build logs, ensure all vars set

### **Database Connection Issues**
- **Cause**: Wrong DATABASE_URL or network restrictions
- **Fix**: Verify connection string, check IP allowlist

---

This workflow ensures stable deployments, working OAuth, and proper separation between development, preview, and production environments!