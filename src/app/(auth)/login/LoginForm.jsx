'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
    email: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    // Check for verification success
    if (searchParams?.get('verified') === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
    }
    // Check for verification error
    if (searchParams?.get('error') === 'invalid_token') {
      setError('Invalid or expired verification link.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (showVerification) {
        // Handle verification code submission
        const result = await signIn('credentials', {
          redirect: false,
          identifier: isAdmin ? formData.email : formData.studentId,
          password: formData.password,
          verificationCode: formData.verificationCode,
          isAdmin: isAdmin.toString()
        });

        if (result.error) {
          setError(result.error);
        } else {
          if (isAdmin) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        }
      } else {
        // Initial login attempt
        const result = await signIn('credentials', {
          redirect: false,
          identifier: isAdmin ? formData.email : formData.studentId,
          password: formData.password,
          isAdmin: isAdmin.toString()
        });

        if (result.error === 'VERIFICATION_REQUIRED') {
          setShowVerification(true);
          setSuccess('Please enter the verification code sent to your email.');
        } else if (result.error) {
          setError(result.error);
        } else {
          if (isAdmin) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserType = () => {
    setIsAdmin(!isAdmin);
    setFormData({
      studentId: '',
      email: '',
      password: '',
      verificationCode: ''
    });
    setError('');
    setShowVerification(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1>{isAdmin ? 'Admin Login' : 'Welcome Back'}</h1>
        <p className={styles.subtitle}>
          {isAdmin ? 'Access CST Votes Admin Panel' : 'Login to access CST Votes'}
        </p>

        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleButton} ${!isAdmin ? styles.active : ''}`}
            onClick={() => !isAdmin || toggleUserType()}
          >
            Student
          </button>
          <button
            className={`${styles.toggleButton} ${isAdmin ? styles.active : ''}`}
            onClick={() => isAdmin || toggleUserType()}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor={isAdmin ? "email" : "studentId"}>
              {isAdmin ? "Email" : "Student ID"}
            </label>
            <input
              type={isAdmin ? "email" : "text"}
              id={isAdmin ? "email" : "studentId"}
              name={isAdmin ? "email" : "studentId"}
              value={isAdmin ? formData.email : formData.studentId}
              onChange={handleChange}
              pattern={isAdmin ? undefined : "\\d{8}"}
              placeholder={isAdmin ? "Enter your admin email" : "Enter your 8-digit student ID"}
              required
              className={styles.input}
              disabled={showVerification}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.input}
              disabled={showVerification}
            />
          </div>

          {showVerification && !isAdmin && (
            <div className={styles.formGroup}>
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                placeholder="Enter the code sent to your email"
                required
                className={styles.input}
                autoFocus
              />
            </div>
          )}

          <div className={styles.forgotPassword}>
            <Link href="/forgot-password">
              Forgot your password?
            </Link>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Signing in...' : showVerification ? 'Verify & Sign In' : 'Sign In'}
          </button>
        </form>

        {!isAdmin && !showVerification && (
          <>
            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className={styles.googleButton}
            >
              <img 
                src="/google-icon.svg" 
                alt="Google" 
                className={styles.googleIcon}
              />
              Continue with Google
            </button>

            <p className={styles.register}>
              Don't have an account?{' '}
              <Link href="/register">
                Register now
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}