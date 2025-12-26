import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { User, AccountStatus, UserRole } from '../types';
import { Button } from './Button';

interface AdminPanelProps {
  currentUser: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = () => {
    setUsers(StorageService.getUsers());
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = (user: User, newStatus: AccountStatus) => {
    const updatedUser = { ...user, status: newStatus };
    StorageService.updateUser(updatedUser);
    fetchUsers();
  };

  const handleRoleChange = (user: User, newRole: UserRole) => {
    if (user.id === currentUser.id && newRole !== UserRole.ADMIN) {
      if (!confirm('Sie ändern Ihre eigene Rolle. Möchten Sie fortfahren? Sie könnten dadurch Admin-Rechte verlieren.')) {
        return;
      }
    }
    const updatedUser = { ...user, role: newRole };
    StorageService.updateUser(updatedUser);
    fetchUsers();
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Sie können sich selbst nicht löschen.');
      return;
    }
    if (confirm(`Möchten Sie ${user.fullName} wirklich löschen? Alle Buchungen dieses Benutzers werden ebenfalls gelöscht.`)) {
      StorageService.removeUser(user.id);
      fetchUsers();
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin/Vorstand';
      case UserRole.TRAINER:
        return 'Trainer';
      case UserRole.MEMBER:
        return 'Mitglied';
      default:
        return 'Gast';
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.TRAINER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.MEMBER:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingUsers = users.filter(u => u.status === AccountStatus.PENDING);
  const activeUsers = users.filter(u => u.status === AccountStatus.APPROVED);

  return (
    <div className="space-y-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-3 sm:px-4 py-4 sm:py-5 flex justify-between items-center bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 truncate">Ausstehende Registrierungen</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Diese Benutzer warten auf Freigabe.</p>
          </div>
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-yellow-800 bg-yellow-200 rounded-full flex-shrink-0">
            {pendingUsers.length}
          </span>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {pendingUsers.length === 0 && (
              <li className="px-4 py-4 text-sm text-gray-500 text-center">Keine offenen Anfragen.</li>
            )}
            {pendingUsers.map(user => (
              <li key={user.id} className="px-3 sm:px-4 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-tennis-600 truncate">{user.fullName}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-600 whitespace-nowrap">Rolle:</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                        className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-tennis-500 focus:border-tennis-500 min-w-[120px]"
                      >
                        <option value={UserRole.MEMBER}>Mitglied</option>
                        <option value={UserRole.TRAINER}>Trainer</option>
                        <option value={UserRole.ADMIN}>Admin/Vorstand</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="primary" onClick={() => handleStatusChange(user, AccountStatus.APPROVED)} className="text-xs sm:text-sm px-3 py-1.5 sm:py-2 flex-1 sm:flex-none">Freigeben</Button>
                      <Button variant="danger" onClick={() => handleStatusChange(user, AccountStatus.REJECTED)} className="text-xs sm:text-sm px-3 py-1.5 sm:py-2 flex-1 sm:flex-none">Ablehnen</Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-3 sm:px-4 py-4 sm:py-5">
          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">Aktive Mitglieder</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Bereits freigeschaltete Benutzer.</p>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {activeUsers.map(user => (
              <li key={user.id} className="px-3 sm:px-4 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-600 whitespace-nowrap">Rolle:</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                        className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-tennis-500 focus:border-tennis-500 min-w-[120px]"
                      >
                        <option value={UserRole.MEMBER}>Mitglied</option>
                        <option value={UserRole.TRAINER}>Trainer</option>
                        <option value={UserRole.ADMIN}>Admin/Vorstand</option>
                      </select>
                    </div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                    <Button 
                      variant="danger" 
                      onClick={() => handleDeleteUser(user)}
                      className="text-xs sm:text-sm px-3 py-1.5 sm:py-2 w-full sm:w-auto"
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};