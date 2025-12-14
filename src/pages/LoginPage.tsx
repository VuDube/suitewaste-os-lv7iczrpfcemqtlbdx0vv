import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Power } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login Successful');
        navigate('/');
      } else {
        toast.error('Invalid Credentials', { description: 'Please check your email and password.' });
      }
    } catch (error) {
      toast.error('Login Failed', { description: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex items-center justify-center min-h-screen bg-industrial-black p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Power className="w-10 h-10 text-neon-green" />
              <h1 className="text-4xl font-bold font-display text-neon-green">SUITEWASTE</h1>
            </div>
            <CardTitle className="text-2xl text-off-white">Operator Login</CardTitle>
            <CardDescription>Enter your credentials to access the OS.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="demo@operator.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="pw123"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" variant="industrial" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Login'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}