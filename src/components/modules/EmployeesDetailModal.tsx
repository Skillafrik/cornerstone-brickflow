import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: string;
  address?: string;
  department?: string;
  position?: string;
  salary?: number;
  hire_date?: string;
  is_active: boolean;
}

interface OvertimeHour {
  id: string;
  date: string;
  hours_worked: number;
  hourly_rate: number;
  total_amount: number;
  description?: string;
}

interface EmployeesDetailModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => void;
}

const EmployeesDetailModal = ({ employee, isOpen, onClose, onSave }: EmployeesDetailModalProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [overtimeHours, setOvertimeHours] = useState<OvertimeHour[]>([]);
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [overtimeFormData, setOvertimeFormData] = useState({
    date: '',
    hours_worked: '',
    hourly_rate: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role,
        address: employee.address || '',
        department: employee.department || '',
        position: employee.position || '',
        salary: employee.salary || 0,
        hire_date: employee.hire_date || '',
        is_active: employee.is_active
      });
      loadOvertimeHours();
    }
  }, [employee]);

  const loadOvertimeHours = async () => {
    if (!employee) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('overtime_hours')
        .select('*')
        .eq('employee_id', employee.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setOvertimeHours(data || []);
    } catch (error) {
      console.error('Error loading overtime hours:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleOvertimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const overtimeData = {
        employee_id: employee?.id,
        date: overtimeFormData.date,
        hours_worked: parseFloat(overtimeFormData.hours_worked),
        hourly_rate: parseFloat(overtimeFormData.hourly_rate),
        description: overtimeFormData.description || null
      };

      const { error } = await (supabase as any)
        .from('overtime_hours')
        .insert(overtimeData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Heures supplémentaires enregistrées",
      });

      setOvertimeFormData({
        date: '',
        hours_worked: '',
        hourly_rate: '',
        description: ''
      });
      setShowOvertimeForm(false);
      loadOvertimeHours();
    } catch (error) {
      console.error('Error saving overtime:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les heures supplémentaires",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalOvertimeForMonth = (year: number, month: number) => {
    return overtimeHours
      .filter(overtime => {
        const overtimeDate = new Date(overtime.date);
        return overtimeDate.getFullYear() === year && overtimeDate.getMonth() === month;
      })
      .reduce((total, overtime) => total + overtime.total_amount, 0);
  };

  const getCurrentMonthOvertime = () => {
    const now = new Date();
    return getTotalOvertimeForMonth(now.getFullYear(), now.getMonth());
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'employé - {employee.first_name} {employee.last_name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee details form */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name || ''}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name || ''}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Adresse complète de l'employé"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="ex: Production"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Poste</Label>
                    <Input
                      id="position"
                      value={formData.position || ''}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      placeholder="ex: Opérateur"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salary">Salaire (FCFA)</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary || ''}
                      onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hire_date">Date d'embauche</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date || ''}
                      onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    Sauvegarder
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Overtime hours management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Heures supplémentaires</span>
                </span>
                <Button 
                  size="sm" 
                  onClick={() => setShowOvertimeForm(!showOvertimeForm)}
                  className="gradient-brick"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Current month summary */}
              <div className="mb-4 p-4 bg-muted rounded">
                <h4 className="font-medium mb-2">Ce mois-ci</h4>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(getCurrentMonthOvertime())}
                </p>
                <p className="text-sm text-muted-foreground">Total heures supplémentaires</p>
              </div>

              {/* Overtime form */}
              {showOvertimeForm && (
                <form onSubmit={handleOvertimeSubmit} className="space-y-4 mb-4 p-4 border rounded">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ot_date">Date</Label>
                      <Input
                        id="ot_date"
                        type="date"
                        value={overtimeFormData.date}
                        onChange={(e) => setOvertimeFormData({...overtimeFormData, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hours_worked">Heures travaillées</Label>
                      <Input
                        id="hours_worked"
                        type="number"
                        step="0.5"
                        value={overtimeFormData.hours_worked}
                        onChange={(e) => setOvertimeFormData({...overtimeFormData, hours_worked: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="hourly_rate">Taux horaire (FCFA)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={overtimeFormData.hourly_rate}
                      onChange={(e) => setOvertimeFormData({...overtimeFormData, hourly_rate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ot_description">Description</Label>
                    <Input
                      id="ot_description"
                      value={overtimeFormData.description}
                      onChange={(e) => setOvertimeFormData({...overtimeFormData, description: e.target.value})}
                      placeholder="Raison des heures supplémentaires"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowOvertimeForm(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" size="sm">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              )}

              {/* Overtime history */}
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Heures</TableHead>
                      <TableHead>Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overtimeHours.map((overtime) => (
                      <TableRow key={overtime.id}>
                        <TableCell>
                          {new Date(overtime.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{overtime.hours_worked}h</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(overtime.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeesDetailModal;