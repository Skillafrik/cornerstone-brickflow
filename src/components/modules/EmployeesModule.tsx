import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Plus, Search, Edit2, Trash2, UserCheck, Info } from 'lucide-react';
import EmployeesDetailModal from './EmployeesDetailModal';
import EmployeeFormDialog from './EmployeeFormDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmployeesModuleProps {
  onBack: () => void;
}

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  salary?: number;
  hire_date?: string;
  role: 'admin' | 'production' | 'vente' | 'livraison' | 'comptabilite' | 'user';
  is_active: boolean;
}

const EmployeesModule = ({ onBack }: EmployeesModuleProps) => {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'user' as 'admin' | 'production' | 'vente' | 'livraison' | 'comptabilite' | 'user',
    is_active: true
  });

  const roleLabels = {
    admin: 'Administrateur',
    production: 'Production',
    vente: 'Vente',
    livraison: 'Livraison',
    comptabilite: 'Comptabilité',
    user: 'Utilisateur'
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      
      // Map data to ensure correct typing
      const typedEmployees = (data || []).map(emp => ({
        ...emp,
        role: emp.role as 'admin' | 'production' | 'vente' | 'livraison' | 'comptabilite' | 'user'
      }));
      
      setEmployees(typedEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const employeeData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        is_active: formData.is_active,
      };

      if (editingEmployee) {
        const { error } = await (supabase as any)
          .from('profiles')
          .update(employeeData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Employé mis à jour avec succès",
        });
      } else {
        // For new employees, we would need to create a user account first
        // This is a simplified version - in reality, you'd need proper user creation
        toast({
          title: "Information",
          description: "La création d'employés nécessite une gestion d'authentification complète",
          variant: "destructive",
        });
        return;
      }

      setIsDialogOpen(false);
      setEditingEmployee(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'user',
        is_active: true
      });
      loadEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'employé",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (employee: Profile) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      is_active: employee.is_active
    });
    setIsDialogOpen(true);
  };

  const toggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !currentStatus })
        .eq('id', employeeId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: `Employé ${!currentStatus ? 'activé' : 'désactivé'}`,
      });
      
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (employee: Profile) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const handleSaveEmployeeDetails = async (employeeData: Partial<Profile>) => {
    if (!selectedEmployee) return;
    
    try {
      const { error } = await (supabase as any)
        .from('employees')
        .update(employeeData)
        .eq('id', selectedEmployee.id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Informations employé mises à jour",
      });
      
      setIsDetailModalOpen(false);
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'employé",
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roleLabels[employee.role]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeesByRole = () => {
    const roleCounts: { [key: string]: number } = {};
    employees.forEach(employee => {
      if (employee.is_active) {
        roleCounts[employee.role] = (roleCounts[employee.role] || 0) + 1;
      }
    });
    return roleCounts;
  };

  const roleStats = getEmployeesByRole();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Employés</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Employee stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.filter(e => e.is_active).length}</div>
              <p className="text-xs text-muted-foreground">employés actifs</p>
            </CardContent>
          </Card>
          
          {Object.entries(roleLabels).map(([role, label]) => (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleStats[role] || 0}</div>
                <p className="text-xs text-muted-foreground">actifs</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          <Button 
            className="gradient-brick"
            onClick={() => {
              setEmployeeFormData(null);
              setIsEmployeeFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvel employé
          </Button>
        </div>

        {/* Employees table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des employés</CardTitle>
            <CardDescription>
              Tous les employés et leurs informations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {roleLabels[employee.role]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          employee.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </TableCell>
                      <TableCell>
                         <div className="flex space-x-2">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => {
                               setEmployeeFormData(employee);
                               setIsEmployeeFormOpen(true);
                             }}
                           >
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => handleViewDetails(employee)}
                             title="Voir détails"
                           >
                             <Info className="h-4 w-4" />
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => toggleEmployeeStatus(employee.id, employee.is_active)}
                           >
                             <UserCheck className="h-4 w-4" />
                           </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Employee Form Dialog */}
        <EmployeeFormDialog
          isOpen={isEmployeeFormOpen}
          onClose={() => setIsEmployeeFormOpen(false)}
          employee={employeeFormData}
          onEmployeeCreated={loadEmployees}
        />

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <EmployeesDetailModal
            employee={selectedEmployee}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            onSave={handleSaveEmployeeDetails}
          />
        )}
      </main>
    </div>
  );
};

export default EmployeesModule;