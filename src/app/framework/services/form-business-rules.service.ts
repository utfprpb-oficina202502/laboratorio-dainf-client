import {inject, Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MessageService} from 'primeng/api';
import {LoginService} from '../../login/login.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * Serviço responsável por regras de negócio comuns em formulários do laboratório.
 *
 * Funcionalidades:
 * - Definição de usuário atual como responsável em formulários
 * - Cálculo de quantidades totais em listas de itens
 * - Validação de saldo de itens para empréstimos
 * - Remoção de itens de arrays por ID (com suporte a campos aninhados)
 * - Mensagens padronizadas de validação de negócio
 * - Definição de data atual como padrão em campos de data
 *
 * Uso em componentes:
 * ```typescript
 * export class EmprestimoFormComponent {
 *   private businessRules = inject(FormBusinessRulesService);
 *
 *   ngOnInit(): void {
 *     this.businessRules.setCurrentUserAsResponsible(this.form).subscribe(updated => {
 *       if (updated) {
 *         console.log('Usuário definido como responsável');
 *       }
 *     });
 *   }
 *
 *   addItem(item: Item, qtde: number): void {
 *     if (!this.businessRules.validateItemSaldo(item, qtde)) {
 *       return; // Mensagem já foi exibida
 *     }
 *
 *     this.items.push({item, qtde});
 *     this.totalQtde = this.businessRules.calculateTotalQuantity(this.items);
 *   }
 *
 *   removeItem(itemId: number): void {
 *     this.items = this.businessRules.removeItemById(this.items, itemId, 'item.id');
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FormBusinessRulesService {
  private readonly messageService = inject(MessageService);
  private readonly loginService = inject(LoginService);

  /**
   * Define o usuário atual como responsável no formulário
   *
   * Busca o usuário logado e atualiza o campo especificado no formulário.
   * Útil para formulários de empréstimo, reserva, manutenção onde o responsável
   * é automaticamente o usuário logado.
   *
   * @param formGroup Formulário a ser atualizado
   * @param fieldName Nome do campo que receberá o usuário (padrão: 'usuario')
   * @returns Observable que emite true se o usuário foi definido, false caso contrário
   *
   * @example
   * ```typescript
   * // Em ngOnInit de formulário de empréstimo
   * this.businessRules.setCurrentUserAsResponsible(this.form).subscribe(updated => {
   *   if (updated) {
   *     console.log('Usuário definido automaticamente');
   *   }
   * });
   *
   * // Com campo customizado
   * this.businessRules.setCurrentUserAsResponsible(this.form, 'responsavel').subscribe();
   * ```
   *
   * @remarks
   * Este método retorna um Observable que deve ser subscrito.
   * O usuário é obtido através do LoginService.
   * Se o formulário for null/undefined ou não houver usuário logado, retorna false.
   */
  setCurrentUserAsResponsible(formGroup: FormGroup | null | undefined, fieldName = 'usuario'): Observable<boolean> {
    if (!formGroup) {
      return new Observable(subscriber => {
        subscriber.next(false);
        subscriber.complete();
      });
    }

    return this.loginService.getCurrentUser().pipe(
      map(user => {
        if (user) {
          formGroup.patchValue({[fieldName]: user});
          return true;
        }
        return false;
      })
    );
  }

  /**
   * Calcula a quantidade total de itens em um array
   *
   * Soma os valores da propriedade 'qtde' de todos os itens.
   * Útil para exibir total de itens em empréstimos, reservas, etc.
   *
   * @param items Array de itens com propriedade qtde
   * @returns Soma total das quantidades, ou 0 se array vazio/null
   *
   * @example
   * ```typescript
   * const items = [
   *   { item: {id: 1, nome: 'Laptop'}, qtde: 2 },
   *   { item: {id: 2, nome: 'Mouse'}, qtde: 5 }
   * ];
   *
   * const total = this.businessRules.calculateTotalQuantity(items);
   * // total = 7
   *
   * // Com array vazio
   * const emptyTotal = this.businessRules.calculateTotalQuantity([]);
   * // emptyTotal = 0
   * ```
   *
   * @remarks
   * Converte valores para Number antes de somar para evitar concatenação de strings.
   * Retorna 0 para arrays null, undefined ou vazios.
   */
  calculateTotalQuantity<K extends { qtde: number }>(items: K[] | null | undefined): number {
    if (!items || items.length === 0) {
      return 0;
    }

    return items
    .map(item => item.qtde)
    .reduce((acc, value) => Number(acc) + Number(value), 0);
  }

  /**
   * Valida se a quantidade solicitada não excede o saldo disponível do item
   *
   * Verifica se há saldo suficiente antes de permitir empréstimo/reserva.
   * Exibe mensagem de erro automaticamente se validação falhar.
   *
   * @param item Item com propriedade saldo
   * @param qtdeInserir Quantidade que se deseja inserir/emprestar
   * @returns true se válido (saldo suficiente), false se inválido
   *
   * @example
   * ```typescript
   * const item = { id: 1, nome: 'Laptop', saldo: 5 };
   *
   * // Tentativa válida
   * if (this.businessRules.validateItemSaldo(item, 3)) {
   *   this.addItemToEmprestimo(item, 3);
   * }
   *
   * // Tentativa inválida - exibe mensagem automaticamente
   * if (this.businessRules.validateItemSaldo(item, 10)) {
   *   // Não executado - saldo insuficiente
   * } else {
   *   // Mensagem já foi exibida pelo serviço
   * }
   * ```
   *
   * @remarks
   * Retorna false imediatamente se item for null/undefined.
   * Valida primeiro se qtdeInserir é um número finito e maior que 0.
   * Valida também se saldo é maior que 0 e se qtdeInserir não excede o saldo.
   * Mensagem de erro é exibida automaticamente via MessageService.
   */
  validateItemSaldo<K extends { saldo: number, disponivelEmprestimoCalculado:number }  >(
    item: K | null | undefined,
    qtdeInserir: number
  ): boolean {
    if (!item) {
      return false;
    }

    // Validar se qtdeInserir é um número finito e maior que 0
    if (!Number.isFinite(qtdeInserir) || qtdeInserir <= 0) {
      this.messageService.add({
        severity: 'info',
        detail: 'A quantidade deve ser um número válido maior que zero.'
      });
      return false;
    }

    // Validar se a quantidade não excede o saldo disponível
    let isValid = item.saldo > 0 && qtdeInserir <= item.saldo;
    if (item.disponivelEmprestimoCalculado != null) {
       isValid = item.saldo > 0 && qtdeInserir <= item.disponivelEmprestimoCalculado;
    }

    if (!isValid) {
      this.messageService.add({
        severity: 'info',
        detail: 'A quantidade informada é maior do que o saldo atual do item.'
      });
      return false;
    }

    return true;
  }

  /**
   * Remove item de um array por ID
   *
   * Suporta campos simples (id) e campos aninhados (item.id, produto.codigo, etc).
   * Útil para remover itens de listas de empréstimo, carrinho, etc.
   *
   * @param items Array de itens
   * @param itemId ID do item a ser removido
   * @param idField Nome do campo ID (padrão: 'id'). Suporta notação de ponto para campos aninhados
   * @returns Novo array sem o item removido
   *
   * @example
   * ```typescript
   * // Remoção com ID simples
   * const items = [{id: 1, nome: 'A'}, {id: 2, nome: 'B'}, {id: 3, nome: 'C'}];
   * const updated = this.businessRules.removeItemById(items, 2);
   * // updated = [{id: 1, nome: 'A'}, {id: 3, nome: 'C'}]
   *
   * // Remoção com ID aninhado
   * const emprestimoItems = [
   *   {item: {id: 1, nome: 'Laptop'}, qtde: 2},
   *   {item: {id: 2, nome: 'Mouse'}, qtde: 5}
   * ];
   * const updated2 = this.businessRules.removeItemById(emprestimoItems, 1, 'item.id');
   * // updated2 = [{item: {id: 2, nome: 'Mouse'}, qtde: 5}]
   * ```
   *
   * @remarks
   * Retorna array vazio se items for null/undefined.
   * Para campos aninhados, percorre o caminho completo (ex: 'item.produto.id').
   * Usa comparação estrita (!==) para verificar IDs.
   */
  removeItemById<K>(
    items: K[] | null | undefined,
    itemId: unknown,
    idField = 'id'
  ): K[] {
    if (!items) {
      return [];
    }

    return items.filter((item: K) => {
      const itemRecord = item as Record<string, unknown>;

      // Para campos aninhados (ex: 'item.id'), percorrer o caminho e extrair o valor final
      if (idField.includes('.')) {
        const keys = idField.split('.');
        let current: unknown = itemRecord;

        for (const key of keys) {
          current = (current as Record<string, unknown>)?.[key];
        }

        return current !== itemId;
      }

      // Para campos simples, comparação direta
      return itemRecord[idField] !== itemId;
    });
  }

  /**
   * Exibe mensagem informativa sobre item e quantidade obrigatórios
   *
   * Mensagem padronizada para validação de formulários de empréstimo/reserva
   * onde o usuário precisa selecionar um item e informar a quantidade.
   *
   * @example
   * ```typescript
   * addItem(): void {
   *   if (!this.selectedItem || !this.quantidade) {
   *     this.businessRules.showItemRequiredMessage();
   *     return;
   *   }
   *
   *   // Processar adição do item
   * }
   * ```
   *
   * @remarks
   * Exibe mensagem com severity 'info'.
   * Mensagem: "Necessário informar o item e a quantidade."
   */
  showItemRequiredMessage(): void {
    this.messageService.add({
      severity: 'info',
      detail: 'Necessário informar o item e a quantidade.'
    });
  }

  /**
   * Exibe mensagem informativa sobre necessidade de adicionar itens
   *
   * Mensagem padronizada para validação de formulários que requerem ao menos
   * um item na lista antes de salvar (empréstimos, pedidos, etc).
   *
   * @param customMessage Mensagem customizada opcional
   *
   * @example
   * ```typescript
   * save(): void {
   *   if (this.items.length === 0) {
   *     this.businessRules.showMinimumItemsMessage();
   *     return;
   *   }
   *
   *   // Processar salvamento
   * }
   *
   * // Com mensagem customizada
   * save(): void {
   *   if (this.selectedEquipments.length < 2) {
   *     this.businessRules.showMinimumItemsMessage(
   *       'Necessário selecionar ao menos 2 equipamentos!'
   *     );
   *     return;
   *   }
   * }
   * ```
   *
   * @remarks
   * Exibe mensagem com severity 'info' e summary 'Atenção'.
   * Mensagem padrão: "Necessário adicionar ao menos um item!"
   */
  showMinimumItemsMessage(customMessage?: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Atenção',
      detail: customMessage || 'Necessário adicionar ao menos um item!'
    });
  }

  /**
   * Define a data de hoje como valor padrão em um campo de data do formulário
   *
   * Formata a data no padrão brasileiro (dd/MM/yyyy).
   * Útil para campos de data de empréstimo, reserva, manutenção onde a data
   * padrão é sempre a data atual.
   *
   * @param formGroup Formulário a ser atualizado
   * @param fieldName Nome do campo de data a receber o valor (padrão: 'data')
   *
   * @example
   * ```typescript
   * ngOnInit(): void {
   *   this.form = this.buildForm();
   *
   *   // Define data de hoje em campo 'dataEmprestimo'
   *   this.businessRules.setTodayAsDefaultDate(this.form, 'dataEmprestimo');
   *
   *   // Define data de hoje em campo padrão 'data'
   *   this.businessRules.setTodayAsDefaultDate(this.form);
   * }
   * ```
   *
   * @remarks
   * Formato de data: dd/MM/yyyy (padrão brasileiro).
   * Usa padStart para garantir dois dígitos em dia e mês.
   * Não faz nada se formGroup for null/undefined.
   */
  setTodayAsDefaultDate(formGroup: FormGroup | null | undefined, fieldName = 'data'): void {
    if (!formGroup) {
      return;
    }

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    formGroup.patchValue({
      [fieldName]: `${dia}/${mes}/${ano}`
    });
  }

  /**
   * Valida se há itens suficientes em uma lista
   *
   * Verifica se o número de itens atende ao mínimo requerido.
   * Exibe mensagem de erro automaticamente se validação falhar.
   *
   * @param items Array de itens a validar
   * @param minItems Número mínimo de itens requeridos (padrão: 1)
   * @param customMessage Mensagem customizada opcional
   * @returns true se válido (tem itens suficientes), false se inválido
   *
   * @example
   * ```typescript
   * save(): void {
   *   // Validação padrão (mínimo 1 item)
   *   if (!this.businessRules.validateMinimumItems(this.items)) {
   *     return; // Mensagem já foi exibida
   *   }
   *
   *   // Validação com mínimo customizado
   *   if (!this.businessRules.validateMinimumItems(this.equipments, 2, 'Selecione ao menos 2 equipamentos')) {
   *     return;
   *   }
   *
   *   // Processar salvamento
   * }
   * ```
   *
   * @remarks
   * Retorna false para arrays null, undefined ou com length menor que minItems.
   * Mensagem de erro é exibida automaticamente via showMinimumItemsMessage().
   */
  validateMinimumItems<K>(
    items: K[] | null | undefined,
    minItems = 1,
    customMessage?: string
  ): boolean {
    if (!items || items.length < minItems) {
      this.showMinimumItemsMessage(customMessage);
      return false;
    }

    return true;
  }
}
