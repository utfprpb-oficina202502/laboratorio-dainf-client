import {CrudService, PageResponse} from '../framework/service/crud.service';
import {Item} from './item';
import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ItemImage} from './itemImage';

@Injectable()
export class ItemService extends CrudService<Item, number> {

  constructor() {
    const http = inject<HttpClient>(HttpClient);

    super(`${environment.api_url}item/`, http);
  }

  /**
   * Busca de itens para autocomplete com filtro de disponibilidade
   * @param query Texto para filtro por nome
   * @param hasEstoque Se true, filtra apenas itens disponiveis para emprestimo
   * @returns Observable de Item[]
   */
  completeItem(query: string, hasEstoque: boolean): Observable<Item[]> {
    const endpoint = hasEstoque ? 'complete-disponivel' : 'complete';
    const params = new HttpParams()
    .set('query', query || '')
    .set('size', '20');
    return this.http.get<PageResponse<Item>>(`${this.url}${endpoint}`, {params}).pipe(
      map((page: PageResponse<Item>) => page?.content ?? [])
    );
  }

  /**
   * Busca paginada de itens para autocomplete com filtro de disponibilidade
   * @param query Texto para filtro por nome
   * @param hasEstoque Se true, filtra apenas itens disponiveis
   * @param page Numero da pagina (0-indexed)
   * @param size Tamanho da pagina (default: 10)
   * @returns Observable de PageResponse<Item>
   */
  completeItemPaged(query: string, hasEstoque: boolean, page = 0, size = 10): Observable<PageResponse<Item>> {
    const endpoint = hasEstoque ? 'complete-disponivel' : 'complete';
    const params = new HttpParams()
    .set('query', query || '')
    .set('page', String(page))
    .set('size', String(size));
    return this.http.get<PageResponse<Item>>(`${this.url}${endpoint}`, {params});
  }

  findAllImagesItem(idItem: number): Observable<ItemImage[]> {
    return this.http.get<ItemImage[]>(this.url + `imagens/${idItem}`);
  }

  deleteImage(itemImage: ItemImage, idItem: number): Observable<void> {
    return this.http.post<void>(`${this.url}delete-image/${idItem}`, itemImage);
  }

  /**
   * Define uma imagem como capa do item
   * @param itemId ID do item
   * @param imageId ID da imagem a ser definida como capa
   * @returns Observable<void>
   */
  setCoverImage(itemId: number, imageId: number): Observable<void> {
    return this.http.post<void>(`${this.url}set-cover-image/${itemId}/${imageId}`, {});
  }

  /**
   * Busca paginada de itens com filtro opcional por grupo.
   * Permite filtrar itens no servidor por grupo específico, melhorando performance.
   *
   * @param page Número da página (0-indexed)
   * @param size Tamanho da página
   * @param filter Filtro de busca textual (id, nome, localização, grupo)
   * @param grupoId ID do grupo para filtrar (opcional)
   * @param sort Parâmetro de ordenação no formato 'field,direction' (ex: 'nome,asc')
   * @returns Observable de PageResponse<Item>
   *
   * @example
   * ```typescript
   * // Buscar todos os itens do grupo 5
   * itemService.findAllPagedByGrupo(0, 100, '', 5).subscribe(response => {
   *   const items = response.content;
   * });
   * ```
   */
  findAllPagedByGrupo(page: number, size: number, filter = '', grupoId?: number, sort?: string): Observable<PageResponse<Item>> {
    page = Math.max(0, Number(page));
    size = Math.max(1, Number(size));

    let params = new HttpParams()
    .set('page', String(page))
    .set('size', String(size))
    .set('filter', filter);

    if (grupoId) {
      params = params.set('grupoId', String(grupoId));
    }

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<PageResponse<Item>>(`${this.url}page`, {params});
  }
}
