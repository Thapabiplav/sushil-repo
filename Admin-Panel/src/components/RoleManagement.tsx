import { useEffect, useState } from 'react';
import { Search, BadgeCheck, Save } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useThemeStyles } from './useThemeStyles';
import { useSchoolSettings } from './SchoolSettingsContext';
import { toast } from 'sonner';

interface RoleDto {
  id: number;
  name: string;
}

interface TeacherWithRolesDto {
  id: number;
  name: string;
  email: string;
  teacherId?: string | null;
  baseRole: string;
  roles: RoleDto[];
}

export function RoleManagement() {
  const theme = useThemeStyles();
  const { t } = useSchoolSettings();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherWithRolesDto[]>([]);
  const [selectedRoleIdsByUser, setSelectedRoleIdsByUser] = useState<Record<number, number[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiFetch<RoleDto[]>('/admin/roles'),
      apiFetch<TeacherWithRolesDto[]>('/admin/role-assignments'),
    ])
      .then(([rolesRes, teachersRes]) => {
        setRoles(rolesRes);
        setTeachers(teachersRes);
        const initial: Record<number, number[]> = {};
        teachersRes.forEach((t) => {
          initial[t.id] = t.roles.map((r) => r.id);
        });
        setSelectedRoleIdsByUser(initial);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load roles');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleRoleForUser = (userId: number, roleId: number) => {
    setSelectedRoleIdsByUser((prev) => {
      const current = prev[userId] ?? [];
      const exists = current.includes(roleId);
      const next = exists ? current.filter((id) => id !== roleId) : [...current, roleId];
      return { ...prev, [userId]: next };
    });
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const created = await apiFetch<RoleDto>('/admin/roles', {
        method: 'POST',
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      setRoles((prev) => [...prev, created]);
      setNewRoleName('');
      toast.success('Role created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleSaveAssignments = async () => {
    setIsSaving(true);
    try {
      const assignments = Object.entries(selectedRoleIdsByUser).map(([userId, roleIds]) => ({
        userId: Number(userId),
        roleIds,
      }));
      await apiFetch('/admin/role-assignments', {
        method: 'PUT',
        body: JSON.stringify({ assignments }),
      });
      toast.success('Roles updated successfully');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save roles');
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedQuery = searchQuery.toLowerCase();
  const filteredTeachers = teachers.filter((t) => {
    const roleNames = (selectedRoleIdsByUser[t.id] ?? [])
      .map((id) => roles.find((r) => r.id === id)?.name ?? '')
      .join(' ')
      .toLowerCase();
    return (
      t.name.toLowerCase().includes(normalizedQuery) ||
      (t.teacherId ?? '').toLowerCase().includes(normalizedQuery) ||
      roleNames.includes(normalizedQuery)
    );
  });

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className={`${theme.textColor} mb-2`}>{t('roles') ?? 'Role Management'}</h1>
        <p className={theme.subtextColor}>
          Assign roles like Teacher and other admin-created roles to all teachers.
        </p>
      </div>

      <div
        className={`${theme.bgColor} rounded-xl p-4 sm:p-6 shadow-sm border ${theme.borderColor} mb-4 sm:mb-6 space-y-4`}
      >
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.subtextColor}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.inputBg}`}
              placeholder="Search by Teacher ID, name, or role..."
            />
          </div>
          <button
            onClick={handleSaveAssignments}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t('loading') : t('saveChanges')}</span>
          </button>
        </div>

        <div className="border-t border-dashed pt-4 mt-2">
          <p className={`${theme.subtextColor} text-sm mb-2`}>Available Roles</p>
          <div className="flex flex-wrap gap-2 items-center">
            {roles.map((role) => (
              <span
                key={role.id}
                className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 flex items-center gap-1"
              >
                <BadgeCheck className="w-3 h-3" />
                {role.name}
              </span>
            ))}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                placeholder="New role name"
              />
              <button
                type="button"
                onClick={handleCreateRole}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <p className={theme.subtextColor}>{t('loading')}</p>
        </div>
      ) : (
        <div className={`${theme.bgColor} rounded-xl shadow-sm border ${theme.borderColor} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`${theme.bgColorAlt} border-b ${theme.borderColor}`}>
                <tr>
                  <th className={`px-4 sm:px-6 py-3 text-left ${theme.textColor}`}>Teacher ID</th>
                  <th className={`px-4 sm:px-6 py-3 text-left ${theme.textColor}`}>Name</th>
                  <th className={`px-4 sm:px-6 py-3 text-left ${theme.textColor}`}>Email</th>
                  <th className={`px-4 sm:px-6 py-3 text-left ${theme.textColor}`}>Roles</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderColor}`}>
                {filteredTeachers.map((teacher) => {
                  const selectedIds = selectedRoleIdsByUser[teacher.id] ?? [];
                  return (
                    <tr key={teacher.id} className={theme.hoverColor + ' transition-colors'}>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={theme.textColor}>{teacher.teacherId ?? '-'}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex flex-col">
                          <span className={theme.textColor}>{teacher.name}</span>
                          <span className="text-xs text-gray-500">Base: {teacher.baseRole}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`${theme.subtextColor} block truncate`}>{teacher.email}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          {roles.map((role) => {
                            const checked = selectedIds.includes(role.id);
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => toggleRoleForUser(teacher.id, role.id)}
                                className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                                  checked
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {role.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 sm:px-6 py-6 text-center">
                      <span className={theme.subtextColor}>{t('noDataFound')}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

