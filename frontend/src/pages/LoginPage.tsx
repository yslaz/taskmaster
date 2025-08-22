import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/images/logo.png';

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError(null);
      await login(data.email, data.password);
      navigate('/analytics');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container">
        <div className="flex justify-center">
          <div className="w-full max-w-md lg:max-w-sm xl:max-w-xs">
            <div className="card login-card">
              <div className="text-center mb-8">
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg overflow-hidden">
                    <img src={logoImage} alt="TaskMaster Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-primary-700 mb-2">TaskMaster</h1>
                <p className="text-muted">Welcome back! Please sign in to continue.</p>
              </div>

              {error && (
                <div className="alert alert-error mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label htmlFor="email" className="label required">
                    Email
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    id="email"
                    className={`input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <div className="form-error">{errors.email.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="label required">
                    Password
                  </label>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                    type="password"
                    id="password"
                    className={`input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <div className="form-error">{errors.password.message}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-muted">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};