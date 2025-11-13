'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRouter } from 'next/navigation';
import { groupLeadService } from '../../services/api';
import { User } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/Input';
import { Plus, UserCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupLeadUsersPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'group_lead' as const
  });

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/group-lead');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchGroupLeads();
    }
  }, [user]);

  // Don't render anything if user is not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Unauthorized access</div>
        </div>
      </div>
    );
  }
  const fetchGroupLeads = async () => {
    try {
      setLoading(true);
      const usersData = await groupLeadService.getUsers();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load group leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('All fields are required');
      return;
    }    try {
      const newUser = await groupLeadService.createUser(formData);
      setUsers([...users, newUser]);
      setFormData({ name: '', email: '', password: '', role: 'group_lead' });
      setShowCreateModal(false);
      toast.success('Group lead created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group lead');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'group_lead' });
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading group leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Group Leads</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage other group lead accounts
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Group Lead
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-destructive/70 hover:text-destructive"
          >
            ✕
          </button>
        </div>
      )}

      {/* Group Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck size={20} className="text-blue-500" />
                  {user.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-medium">
                    Group Lead
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Created:</span>
                  <span className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Last Updated:</span>
                  <span className="text-muted-foreground">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Group Leads Found</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  No group leads have been created yet.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create First Group Lead
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Group Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Group Lead</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter group lead's full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter group lead's email address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 px-4 py-3 rounded-lg text-sm">
                <strong>Note:</strong> This account will be created with Group Lead permissions and will be able to manage onboarding tasks.
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Group Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupLeadUsersPage;
