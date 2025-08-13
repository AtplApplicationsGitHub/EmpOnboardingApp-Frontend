'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import ThemeToggle from '../../components/ThemeToggle';
import { useAnimation, animationClasses } from '../../lib/animations';

interface LoginFormInputs {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login, error, isLoading, user} = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [loginError, setLoginError] = useState<string | null>(null);
  const isVisible = useAnimation();
  
  // Redirect if already logged in
  useEffect(() => {
    // console.log('User Refresh', user);
    if (user) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/group-lead';
      // const redirectPath = '/admin';
      router.push(redirectPath);
    }
  }, [user, router]);
  
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setLoginError(null);
      console.log('Attempting login with:', data.email);
      await login(data.email, data.password);
      console.log('Login successful');
      // Navigation will happen automatically via useEffect above
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.response?.data?.message || error.message || 'Login failed');
    }
  };
  
  return (
    <div className={`min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Theme toggle in top right corner */}
      <div className={`absolute top-4 right-4 ${isVisible ? animationClasses.slideInRight : 'opacity-0'}`}>
        <ThemeToggle />
      </div>
      
      <Card className={`w-full max-w-md ${animationClasses.hoverLift} ${isVisible ? animationClasses.scaleIn : 'opacity-0'}`}>
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold">Employee Onboarding</CardTitle>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        
        <CardContent>
          {(error || loginError) && (
            <div className={`bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 ${animationClasses.slideInUp}`}>
              {error || loginError}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className={`${isVisible ? animationClasses.slideInLeft : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <Input
                id="email"
                label="Email address"
                type="email"
                required
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>
            
            <div className={`${isVisible ? animationClasses.slideInLeft : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
              <Input
                id="password"
                label="Password"
                type="password"
                required
                error={errors.password?.message}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
            </div>
            
            <div className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
              <Button
                type="submit"
                variant="primary"
                className={`w-full ${isLoading ? animationClasses.pulse : animationClasses.hoverScale}`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>

          {/* Demo Accounts
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-4">Demo Accounts:</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span>admin@example.com / admin123</span>
              </div>
              <div className="flex justify-between">
                <span>Group Lead:</span>
                <span>gl1@example.com / password</span>
              </div>
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
