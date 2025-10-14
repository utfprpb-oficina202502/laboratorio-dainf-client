import {computed, inject, Injectable, Signal} from '@angular/core';
import {LoginService} from '../../login/login.service';
import {Permissao} from '../../usuario/permissao';

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
   * Computed signal para permissões baseadas no usuário atual
   * Atualiza automaticamente quando o usuário muda
   */
  readonly permissions: Signal<UserPermissions> = computed(() => {
    const user = this.loginService.currentUser();
    if (!user) {
      return this.getGuestPermissions();
    }

    const userRoles = user.authorities || user.permissoes || [];
    return this.computePermissionsFromRoles(userRoles);
  });

  // Computed signals para checks individuais de permissão
  readonly canCreate = computed(() => this.permissions().canCreate);
  readonly canEdit = computed(() => this.permissions().canEdit);
  readonly canDelete = computed(() => this.permissions().canDelete);
  readonly canExport = computed(() => this.permissions().canExport);
  readonly isReadOnly = computed(() => this.permissions().isReadOnly);
  readonly userRole = computed(() => this.permissions().userRole);
  readonly isAlunoOrProfessor = computed(() => this.permissions().isAlunoOrProfessor);

  /**
   * @deprecated Use o signal `permissions` diretamente
   * Mantido para compatibilidade temporária
   */
  async getUserPermissions(): Promise<UserPermissions> {
    return this.permissions();
  }

  /**
   * Calcula permissões baseadas nas roles do usuário
   */
  private computePermissionsFromRoles(roles: Permissao[] | string[]): UserPermissions {
    // Normaliza roles para array de strings (pode vir como string[] ou Permissao[])
    const roleNames = new Set(
      roles
      .map(r => typeof r === 'string' ? r : (r.nome || ''))
      .map(name => name.trim())
      .filter(name => name.length > 0)
    );

    // Admin has full access to everything
    if (roleNames.has('ROLE_ADMINISTRADOR')) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        isReadOnly: false,
        userRole: 'ADMINISTRADOR',
        isAlunoOrProfessor: false
      };
    }

    // Laboratorista has full CRUD but may have some restrictions in future
    if (roleNames.has('ROLE_LABORATORISTA')) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        isReadOnly: false,
        userRole: 'LABORATORISTA',
        isAlunoOrProfessor: false
      };
    }

    // Professor - view only with export
    if (roleNames.has('ROLE_PROFESSOR')) {
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: true,
        isReadOnly: true,
        userRole: 'PROFESSOR',
        isAlunoOrProfessor: true
      };
    }

    // Aluno is most restricted - view only
    if (roleNames.has('ROLE_ALUNO')) {
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: true,
        isReadOnly: true,
        userRole: 'ALUNO',
        isAlunoOrProfessor: true
      };
    }

    // Default to guest permissions
    return this.getGuestPermissions();
  }

  /**
   * Retorna permissões padrão para usuários não autenticados
   */
  private getGuestPermissions(): UserPermissions {
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
      isReadOnly: true,
      userRole: 'GUEST',
      isAlunoOrProfessor: true
    };
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
    const roleNames: Record<string, string> = {
      'ADMINISTRADOR': 'Administrador',
      'LABORATORISTA': 'Laboratorista',
      'PROFESSOR': 'Professor',
      'ALUNO': 'Aluno',
      'GUEST': 'Convidado'
    };

    return roleNames[userRole] || 'Desconhecido';
  }
}
