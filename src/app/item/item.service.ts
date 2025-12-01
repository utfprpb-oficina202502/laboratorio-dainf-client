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
}
