import {inject, Injectable} from '@angular/core';
import {LoginService} from '../../login/login.service';

export interface UserPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  isReadOnly: boolean;
  userRole: string;
  isAlunoOrProfessor: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly loginService = inject(LoginService);

  /**
   * Get comprehensive user permissions based on their role
   */
  async getUserPermissions(): Promise<UserPermissions> {
    const isAlunoOrProfessor = await this.loginService.userLoggedIsAlunoOrProfessor();
    const loggedUser = JSON.parse(localStorage.getItem('userLogged') || '{}');

    const permissions: UserPermissions = {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
      isReadOnly: true,
      userRole: 'GUEST',
      isAlunoOrProfessor: isAlunoOrProfessor
    };

    // Check if user has authorities or permissoes
    const userRoles = loggedUser?.authorities || loggedUser?.permissoes || [];
    if (userRoles && Array.isArray(userRoles) && userRoles.length > 0) {

      // Admin has full access to everything
      if (this.loginService.hasAnyRole(['ROLE_ADMINISTRADOR'])) {
        permissions.canCreate = true;
        permissions.canEdit = true;
        permissions.canDelete = true;
        permissions.canExport = true;
        permissions.isReadOnly = false;
        permissions.userRole = 'ADMINISTRADOR';
      }
      // Laboratorista has full CRUD but may have some restrictions in future
      else if (this.loginService.hasAnyRole(['ROLE_LABORATORISTA'])) {
        permissions.canCreate = true;
        permissions.canEdit = true;
        permissions.canDelete = true;
        permissions.canExport = true;
        permissions.isReadOnly = false;
        permissions.userRole = 'LABORATORISTA';
      }

      else if (this.loginService.hasAnyRole(['ROLE_PROFESSOR'])) {
        permissions.canCreate = false;
        permissions.canEdit = false;
        permissions.canDelete = false;
        permissions.canExport = true;
        permissions.isReadOnly = true;
        permissions.userRole = 'PROFESSOR';
      }
      // Aluno is most restricted - view only
      else if (this.loginService.hasAnyRole(['ROLE_ALUNO'])) {
        permissions.canCreate = false;
        permissions.canEdit = false;
        permissions.canDelete = false;
        permissions.canExport = true;
        permissions.isReadOnly = true;
        permissions.userRole = 'ALUNO';
      }
    }

    return permissions;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return this.loginService.hasAnyRole(roles);
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(): boolean {
    return this.loginService.hasAnyRole(['ROLE_ADMINISTRADOR']);
  }

  /**
   * Check if user has laboratorista privileges
   */
  isLaboratorista(): boolean {
    return this.loginService.hasAnyRole(['ROLE_LABORATORISTA']);
  }

  /**
   * Check if user has professor privileges
   */
  isProfessor(): boolean {
    return this.loginService.hasAnyRole(['ROLE_PROFESSOR']);
  }

  /**
   * Check if user has student privileges
   */
  isAluno(): boolean {
    return this.loginService.hasAnyRole(['ROLE_ALUNO']);
  }

  /**
   * Check if user can perform CRUD operations (Admin or Laboratorista)
   */
  canPerformCrud(): boolean {
    return this.loginService.hasAnyRole(['ROLE_ADMINISTRADOR', 'ROLE_LABORATORISTA']);
  }

  /**
   * Get user role display name in Portuguese
   */
  getUserRoleDisplayName(userRole: string): string {
    const roleNames: { [key: string]: string } = {
      'ADMINISTRADOR': 'Administrador',
      'LABORATORISTA': 'Laboratorista',
      'PROFESSOR': 'Professor',
      'ALUNO': 'Aluno',
      'GUEST': 'Convidado'
    };

    return roleNames[userRole] || 'Desconhecido';
  }
}
