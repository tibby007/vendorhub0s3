# 🚀 VendorHub - Quick Reference Guide

## 🎭 **Demo Access (Copy & Paste Ready)**

### **Partner Admin (Broker)**
```
URL: https://vendorhubos.com/demo-login
Email: demo-partner@vendorhub.com
Password: DemoPass123!
```

### **Vendor**
```
URL: https://vendorhubos.com/demo-login  
Email: demo-vendor@vendorhub.com
Password: DemoPass123!
```

---

## 🔥 **If Something Breaks**

### **Demo Not Working?**
1. Go to `/demo-login` directly
2. Clear browser cache/storage
3. Check console for error messages
4. Try incognito/private browser

### **Performance Issues?**
- Check for new dynamic imports in code
- Look for components not using demo mode detection
- Verify no real API calls in network tab

### **API Errors in Demo?**
Search codebase for: `sessionStorage.getItem('demoCredentials') !== null`
- Every data fetching component should have this check
- If missing, add it before any `supabase.` calls

---

## 🛠️ **Quick Fixes**

### **Add Demo Mode to New Component**
```javascript
const fetchData = async () => {
  // Always add this first!
  const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
  if (isDemoMode) {
    console.log('[ComponentName] Demo mode - using mock data');
    setData(mockData);
    setLoading(false);
    return; // Exit early!
  }
  
  // Real API calls only after demo check
  const { data } = await supabase.from('table').select('*');
}
```

### **Deploy Changes**
```bash
git add -A
git commit -m "Fix: Description"
git push origin main
# Auto-deploys to Netlify in ~2 minutes
```

---

## 📱 **Demo Features Working**

### **Partner Admin**
- ✅ Vendor management (add/edit/delete)
- ✅ Resource management 
- ✅ Subscription management
- ✅ Billing status
- ✅ Dashboard analytics
- ✅ Settings management

### **Vendor**
- ✅ Submission management
- ✅ Document uploads (simulated)
- ✅ Vendor portal features
- ✅ Statistics dashboard
- ✅ Resource access

---

## 🚨 **Red Flags to Watch For**

- **Console Errors**: Should be zero in demo mode
- **API Calls**: Network tab should show no real API calls
- **Loading States**: No infinite loading spinners
- **404 Errors**: No failed resource requests
- **CORS Errors**: No cross-origin request failures

---

## 📞 **Emergency Contacts**

**Issue Type**: Demo broken, performance problems, API errors
**Action**: Check this documentation first, then implement quick fixes above

**Status Check**: Go to `/demo-login` and test both roles - should work perfectly.

---

*Keep this file handy for quick troubleshooting!*