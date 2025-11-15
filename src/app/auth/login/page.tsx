'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import { authService } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import OtpInput from '../../components/OtpInput';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import ThemeToggle from '../../components/ThemeToggle';
import { useAnimation, animationClasses } from '../../lib/animations';

// Login step types
type LoginStep = 'email' | 'password' | 'otp';

interface EmailFormInputs {
  emailOrUsername: string;
}

interface PasswordFormInputs {
  password: string;
}

interface OtpFormInputs {
  otp: string;
}

const LoginPage: React.FC = () => {
  const { login, loginWithOtp, error, isLoading, user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<LoginStep>('email');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string>('');
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const isVisible = useAnimation();

  // Form configurations for each step
  const emailForm = useForm<EmailFormInputs>();
  const passwordForm = useForm<PasswordFormInputs>();
  const otpForm = useForm<OtpFormInputs>();


  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      let redirectPath = '/';
      switch (user.role) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'group_lead':
          redirectPath = '/group-lead';
          break;
        case 'employee':
          redirectPath = '/employee';
          break;
        default:
          redirectPath = '/';
      }
      router.push(redirectPath);
    }
  }, [user, router]);

  // Helper to start the resend countdown
  const startResendTimer = () => {
    setIsResendDisabled(true);
    setResendTimer(30);

    const timerId = setInterval(() => {
      setResendTimer((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          setIsResendDisabled(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (currentStep === 'otp') {
      startResendTimer();
    }
  }, [currentStep]);


  const onEmailSubmit = async (data: EmailFormInputs) => {
  try {
    setLoginError(null);
    setIsEmailLoading(true);

    const roleResponse = await authService.checkUserRole(data.emailOrUsername);

    // ===== ADD THIS DEBUG LOG =====
    console.log(' DEBUG - Role Response:', roleResponse);
    console.log(' DEBUG - Role:', roleResponse.role);
    console.log(' DEBUG - Exists:', roleResponse.exists);
    // ==============================

    if (!roleResponse.exists) {
      setLoginError('Email or Username not found. Please check your credentials.');
      return;
    }

    setUserEmail(data.emailOrUsername);

    // ===== ADD THIS DEBUG LOG =====
    console.log(' DEBUG - Checking role condition...');
    console.log(' DEBUG - Is admin?', roleResponse.role === 'admin');
    console.log('DEBUG - Is group_lead?', roleResponse.role === 'group_lead');
    // ==============================

    if (roleResponse.role === 'admin' || roleResponse.role === 'group_lead') {
      console.log('Going to PASSWORD step'); // DEBUG
      setCurrentStep('password');
    } else {
      console.log(' Going to OTP step'); // DEBUG
      try {
        const otpResponse = await authService.sendOtp(data.emailOrUsername);
        setOtpMessage(otpResponse.message);
        setOtpSent(true);
        setCurrentStep('otp');
      } catch (error: any) {
        setLoginError(error.message || 'Failed to send OTP');
      }
    }
  } catch (error: any) {
    setLoginError(error.message || 'Failed to verify email');
  }
  finally {
    setIsEmailLoading(false);
  }
};


  // Handle password submission (Step 2a - Admin/Group Lead)
  const onPasswordSubmit = async (data: PasswordFormInputs) => {
    try {
      setLoginError(null);

      // Basic client-side validation
      if (!data.password || data.password.trim().length < 1) {
        setLoginError('Password is required');
        return;
      }

      await login(userEmail, data.password);
    } catch (error: any) {
      setLoginError(error.response?.data?.message || error.message || 'Invalid email or password');
    }
  };

  const onOtpSubmit = async (data: OtpFormInputs) => {
    try {
      setLoginError(null);
      await loginWithOtp(userEmail, data.otp);
    } catch (error: any) {
      setLoginError(error.message || 'OTP verification failed');
    }
  };

  // Handle OTP completion from OtpInput component
  const handleOtpComplete = (otp: string) => {
    otpForm.setValue('otp', otp);
    onOtpSubmit({ otp });
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep === 'password' || currentStep === 'otp') {
      setCurrentStep('email');
      setUserEmail('');
      setOtpSent(false);
      setOtpMessage('');
      setLoginError(null);
      passwordForm.reset();
      otpForm.reset();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      startResendTimer();
      setLoginError(null);
      // TODO: API - Resend OTP to employee email
      // POST /api/auth/send-otp
      const otpResponse = await authService.sendOtp(userEmail);
      setOtpMessage(otpResponse.message);
    } catch (error: any) {
      setLoginError(error.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Theme toggle in top right corner */}
      <div className={`absolute top-4 right-4 ${isVisible ? animationClasses.slideInRight : 'opacity-0'}`}>
        {/* <ThemeToggle /> */}
      </div>

      <Card className={`w-full max-w-md ${animationClasses.hoverLift} ${isVisible ? animationClasses.scaleIn : 'opacity-0'}`}>
        <CardHeader className="text-center pb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/Logo_Login.jpg" 
              alt="Company Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Employee Onboarding</CardTitle>
          <p className="mt-2 text-muted-foreground">
            {currentStep === 'email' && 'Enter your email or username to continue'}
            {currentStep === 'password' && `Welcome back! Enter your password`}
            {currentStep === 'otp' && 'Enter the OTP sent to your email'}
          </p>
          {currentStep !== 'email' && (
            <div className="mt-2">
              <button
                onClick={handleBack}
                className="text-sm text-primary hover:underline"
              >
                ← Back to login
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {(error || loginError) && (
            <div className={`bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 ${animationClasses.slideInUp}`}>
              {error || loginError}
            </div>
          )}

          {currentStep === 'otp' && otpMessage && (
            <div className={`bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 ${animationClasses.slideInUp}`}>
              {otpMessage}
            </div>
          )}

          {/* Step 1: Email Input */}
          {currentStep === 'email' && (
            <form className="space-y-6" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <div className={`${isVisible ? animationClasses.slideInLeft : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
                <Input
                  id="emailOrUsername"
                  label="Email address or Username"
                  type="text"
                  required
                  autoFocus
                  error={emailForm.formState.errors.emailOrUsername?.message}
                  {...emailForm.register('emailOrUsername', {
                    required: 'Email or Username is required',
                    minLength: {
                      value: 3,
                      message: 'Must be at least 3 characters'
                    }
                  })}
                />
              </div>

              <div className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
                <Button
                  type="submit"
                  variant="primary"
                  className={`w-full ${isLoading ? animationClasses.pulse : animationClasses.hoverScale}`}
                  disabled={isEmailLoading}                >
                  {isEmailLoading ? 'Checking...' : 'Continue'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 2a: Password Input (Admin/Group Lead) */}
          {currentStep === 'password' && (
            <form className="space-y-6" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Email:</strong> {userEmail}
              </div>

              <div className={`${isVisible ? animationClasses.slideInLeft : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  required
                  autoFocus
                  error={passwordForm.formState.errors.password?.message}
                  {...passwordForm.register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
              </div>

              <div className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
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
          )}

          {/* Step 2b: OTP Input (Employee) */}
          {currentStep === 'otp' && (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Email:</strong> {userEmail}
              </div>

              <div className={`${isVisible ? animationClasses.slideInLeft : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
                <label className="block text-sm font-medium mb-4 text-center">
                  Enter the 6-digit OTP sent to your email
                </label>
                <OtpInput
                  length={6}
                  onComplete={handleOtpComplete}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <div className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
                  <Button
                    type="button"
                    variant="primary"
                    className={`w-full ${isLoading ? animationClasses.pulse : animationClasses.hoverScale}`}
                    onClick={() => {
                      const currentOtp = otpForm.getValues('otp');
                      if (currentOtp && currentOtp.length === 6) {
                        onOtpSubmit({ otp: currentOtp });
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-primary hover:underline"
                    disabled={isLoading || isResendDisabled}
                  >
                    {isResendDisabled ? `Resend OTP in ${resendTimer}s` : "Didn't receive OTP? Resend"}                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
