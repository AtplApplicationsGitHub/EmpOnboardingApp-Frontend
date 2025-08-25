  // Check user role by email for two-step login
  checkUserRole: async (email: string): Promise<{ role: "admin" | "group_lead" | "employee"; exists: boolean }> => {
    console.log("🔍 Checking role for email using auth attempt:", email);
    
    // Validate email format first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return { role: 'employee', exists: false };
    }
    
    try {
      // Strategy: Try to login with a dummy password to determine user type
      // This will tell us if the email exists in users table vs employees table
      const dummyPassword = "dummy_password_for_role_check";
      
      try {
        // Try to login with dummy password - this will fail but give us info about the user type
        const response = await api.post<AuthResponse>("/auth/signin", {
          signInId: email,
          password: dummyPassword,
        });
        
        // If somehow this succeeds (shouldn't happen with dummy password), 
        // check the response for role info
        if (response.data && response.data.success) {
          console.log("🎯 Unexpected successful auth with dummy password");
          return { role: 'admin', exists: true }; // Safe default
        }
        
      } catch (authError: any) {
        console.log("🔍 Auth attempt response:", authError.response?.status, authError.response?.data);
        
        // Analyze the error response to determine user type
        if (authError.response) {
          const status = authError.response.status;
          const errorData = authError.response.data;
          
          // Different error responses indicate different user types:
          
          // 401 with specific messages usually means user exists but wrong password
          if (status === 401) {
            // Check if error message indicates user type
            const errorMessage = errorData?.message || errorData?.error || '';
            console.log("🔍 Auth error message:", errorMessage);
            
            // Common patterns in auth error responses:
            if (errorMessage.toLowerCase().includes('user') || 
                errorMessage.toLowerCase().includes('admin') ||
                errorMessage.toLowerCase().includes('invalid credentials') ||
                errorMessage.toLowerCase().includes('password')) {
              
              console.log("✅ Email exists in users table (admin/group_lead)");
              // Email exists in users table, default to group_lead
              // The actual login will determine if admin or group_lead
              return { role: 'group_lead', exists: true };
            }
          }
          
          // 404 or user not found usually means check employees table
          if (status === 404 || 
              (errorData?.message && errorData.message.toLowerCase().includes('not found'))) {
            console.log("🔍 User not found in users table, assuming employee");
            return { role: 'employee', exists: true };
          }
          
          // 400 might indicate different validation errors
          if (status === 400) {
            console.log("🔍 Bad request - checking error details");
            // Still assume employee if we can't determine otherwise
            return { role: 'employee', exists: true };
          }
        }
        
        // If we can't determine from auth errors, assume employee
        console.log("🔄 Could not determine from auth response, assuming employee");
        return { role: 'employee', exists: true };
      }
      
      // Fallback if no error was thrown (shouldn't happen)
      console.log("🔄 No auth error thrown, assuming employee");
      return { role: 'employee', exists: true };
      
    } catch (error) {
      console.error("Error in role checking:", error);
      
      // Final fallback - assume employee for valid emails
      console.log("🔄 Final fallback: assuming employee role for valid email");
      return { role: 'employee', exists: true };
    }
  },
