// // src/app/services/products.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
// import { Observable, throwError, BehaviorSubject, forkJoin, of } from 'rxjs';
// import { catchError, tap, retry, timeout, map } from 'rxjs/operators';

// export interface Variant {
//   _id?: string;
//   color: string;
//   size: string;
//   price: number;
//   stock: number;
// }

// export interface  {
//   _id: string;
//   ten: string;
//   image?: string;
// }

// export interface AuthorRef {
//   _id?: string;
//   ten?: string;
//   email?: string;
// }

// export interface Product {
//   _id?: string;
//   ten: string;
//   desc?: string;
//   :  | { _id: string; ten: string } | string;
//   image: string[]; // backend uses array of filetens
//   variants: Variant[]; // IMPORTANT: price & stock live here
//   minStock?: number;
//   tab?: string;
//   describe?: string;
//   status?: 'instock' | 'lowstock' | 'outofstock';
//   author?: AuthorRef;
//   __v?: number;
//     price: number;       // thêm
//   quantity: number;    // thêm
//   colors: string[];    // thêm
//   sizes: string[];     // thêm
//   images: string[];    // thêm
//   selected?: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface ProductStats {
//   totalProducts: number;
//   inStockProducts: number;
//   lowStockProducts: number;
//   outOfStockProducts: number;
// }

// export interface ApiProductsResponse {
//   products: Product[];
//   total: number;
// }

// export interface SearchParams {
//   keyword?: string;
//   ?: string;
//   status?: string;
//   limit?: number;
//   page?: number;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class ProductsService {
//   private apiUrl = 'https://backend-funsport-6e9i.onrender.com/v1/category';
//   private ApiUrl = 'https://backend-funsport-6e9i.onrender.com/v1/product';
//   private readonly REQUEST_TIMEOUT = 30000;
//   private readonly MAX_RETRIES = 2;

//   private productAddedSubject = new BehaviorSubject<Product | null>(null);
//   public productAdded$ = this.productAddedSubject.asObservable();

//   private productsUpdatedSubject = new BehaviorSubject<boolean>(false);
//   public productsUpdated$ = this.productsUpdatedSubject.asObservable();

//   private productsLoadingSubject = new BehaviorSubject<boolean>(false);
//   public productsLoading$ = this.productsLoadingSubject.asObservable();

//   constructor(private http: HttpClient) {}

//   // --- Products list (backend returns { products, total })
//   getProducts(params?: SearchParams): Observable<ApiProductsResponse> {
//     let queryParams = '';
//     if (params) {
//       const queryArray: string[] = [];
//       if (params.keyword) queryArray.push(`keyword=${encodeURIComponent(params.keyword)}`);
//       if (params.) queryArray.push(`=${params.}`);
//       if (params.status) queryArray.push(`status=${params.status}`);
//       if (params.limit) queryArray.push(`limit=${params.limit}`);
//       if (params.page) queryArray.push(`page=${params.page}`);
//       queryParams = queryArray.length > 0 ? `?${queryArray.join('&')}` : '';
//     }

//     this.productsLoadingSubject.next(true);

//     return this.http.get<ApiProductsResponse>(`${this.apiUrl}${queryParams}`).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       retry(this.MAX_RETRIES),
//       tap(resp => {
//         console.log('Products loaded:', resp);
//         this.productsLoadingSubject.next(false);
//       }),
//       catchError(error => {
//         this.productsLoadingSubject.next(false);
//         return this.handleError(error);
//       })
//     );
//   }

//   getProductsByUser(userId: string, limit?: number): Observable<ApiProductsResponse | Product[]> {
//     const queryParams = limit ? `?limit=${limit}` : '';
//     return this.http.get<ApiProductsResponse | Product[]>(`${this.apiUrl}/user/${userId}${queryParams}`).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       retry(this.MAX_RETRIES),
//       tap(result => console.log('User products loaded:', result)),
//       catchError(this.handleError)
//     );
//   }

//   getProductById(productId: string): Observable<Product> {
//     if (!productId || productId.trim() === '') {
//       return throwError(() => new Error('Product ID is required'));
//     }

//     return this.http.get<Product>(`${this.apiUrl}/${productId}`).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       retry(this.MAX_RETRIES),
//       tap(product => console.log('Product loaded:', product)),
//       catchError(this.handleError)
//     );
//   }

//   // Backend: returns { total, inStock, lowStock, outOfStock }
//   getProductStats(): Observable<ProductStats> {
//     return this.http.get<ProductStats>(`${this.apiUrl}/stats`).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       retry(this.MAX_RETRIES),
//       tap(stats => console.log('Product stats loaded:', stats)),
//       catchError(this.handleError)
//     );
//   }

//   getCategories(): Observable<[]> {
//     return this.http.get<[]>(this.ApiUrl).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       retry(this.MAX_RETRIES),
//       tap(categories => console.log('Categories loaded:', categories)),
//       catchError(this.handleError)
//     );
//   }

//   // --- Add product
//   // Backend expects variants[] (each has color, size, price, stock)
//   addProduct(productData: Partial<Product>): Observable<Product> {
//     console.log('Adding product with data:', productData);

//     // Basic validations (frontend guard)
//     if (!productData.ten) {
//       return throwError(() => new Error('ten is required'));
//     }
//     if (!productData.) {
//       return throwError(() => new Error(' is required'));
//     }

//     // Ensure variants exists. If client used old UI (price, quantity, colors),
//     // convert to a single variant as fallback. Prefer productData.variants if present.
//     const payload: any = { ...productData };

//     if (!payload.variants || !Array.isArray(payload.variants) || payload.variants.length === 0) {
//       // Try to build from price/quantity/colors/size if provided
//       const fallbackPrice = (productData as any).price;
//       const fallbackQty = (productData as any).quantity;
//       const fallbackColors = (productData as any).colors;
//       const fallbackSize = (productData as any).size || 'M';

//       if (fallbackPrice !== undefined && fallbackQty !== undefined && Array.isArray(fallbackColors) && fallbackColors.length > 0) {
//         payload.variants = fallbackColors.map((c: string) => ({
//           color: this.isValidHexColor(c) ? c : '#000000',
//           size: fallbackSize,
//           price: fallbackPrice,
//           stock: fallbackQty
//         }));
//       } else {
//         // If variants not provided and we can't build fallback, throw error to force correct payload
//         return throwError(() => new Error('Backend requires variants[] with color,size,price,stock. Please provide variants.'));
//       }
//     }

//     // ensure image is array
//     if (!payload.image) payload.image = [];

//     payload.minStock = payload.minStock ?? 5;

//     return this.http.post<Product>(this.apiUrl, payload, {
//       headers: new HttpHeaders({ 'Content-Type': 'application/json' })
//     }).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       tap(newProduct => {
//         console.log('Product added successfully:', newProduct);
//         this.productAddedSubject.next(newProduct);
//         this.productsUpdatedSubject.next(true);
//       }),
//       catchError(this.handleError)
//     );
//   }

//   // --- Update product
//   updateProduct(id: string, productData: Partial<Product>): Observable<Product> {
//     if (!id || id.trim() === '') {
//       return throwError(() => new Error('Product ID is required'));
//     }

//     console.log(`Updating product ${id} with data:`, productData);

//     const payload: any = { ...productData };

//     // If client still uses price/quantity/colors => convert to variants as fallback
//     if ((!payload.variants || !Array.isArray(payload.variants)) &&
//         ( (productData as any).price !== undefined || (productData as any).quantity !== undefined || (productData as any).colors )) {
//       const fallbackPrice = (productData as any).price ?? 0;
//       const fallbackQty = (productData as any).quantity ?? 0;
//       const fallbackColors = (productData as any).colors ?? [];
//       const fallbackSize = (productData as any).size || 'M';
//       if (fallbackColors.length > 0) {
//         payload.variants = fallbackColors.map((c: string) => ({
//           color: this.isValidHexColor(c) ? c : '#000000',
//           size: fallbackSize,
//           price: fallbackPrice,
//           stock: fallbackQty
//         }));
//       }
//     }

//     if (payload.image && !Array.isArray(payload.image)) {
//       payload.image = [payload.image];
//     }

//     return this.http.put<Product>(`${this.apiUrl}/${id}`, payload, {
//       headers: new HttpHeaders({ 'Content-Type': 'application/json' })
//     }).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       tap(response => {
//         console.log('Product updated successfully:', response);
//         this.productsUpdatedSubject.next(true);
//       }),
//       catchError(this.handleError)
//     );
//   }

//   deleteProduct(id: string): Observable<any> {
//     if (!id || id.trim() === '') {
//       return throwError(() => new Error('Product ID is required'));
//     }

//     return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       tap(response => {
//         console.log(`Product ${id} deleted successfully:`, response);
//         this.productsUpdatedSubject.next(true);
//       }),
//       catchError(this.handleError)
//     );
//   }

//   // bulk delete using forkJoin for parallel deletion
//   deleteProducts(productIds: string[]): Observable<any> {
//     if (!productIds || productIds.length === 0) {
//       return throwError(() => new Error('Product IDs are required'));
//     }

//     const observables = productIds.map(id => this.deleteProduct(id).pipe(
//       catchError(err => {
//         console.error(`Failed to delete product ${id}:`, err);
//         // return a fallback so forkJoin continues; you can change to throw if you prefer fail-fast
//         return of({ error: true, id, detail: err });
//       })
//     ));

//     return forkJoin(observables).pipe(
//       tap(results => {
//         console.log('Products bulk delete results:', results);
//         this.productsUpdatedSubject.next(true);
//       }),
//       catchError(this.handleError)
//     );
//   }

//   // --- Search / helpers
//   searchProducts(query: string, limit?: number): Observable<ApiProductsResponse> {
//     if (!query || query.trim() === '') {
//       return this.getProducts({ limit });
//     }
//     const params: SearchParams = { keyword: query };
//     if (limit) params.limit = limit;
//     return this.getProducts(params);
//   }

//   getProductsBy(Id: string, limit?: number): Observable<ApiProductsResponse> {
//     if (!Id || Id.trim() === '') {
//       return throwError(() => new Error(' ID is required'));
//     }
//     const params: SearchParams = { : Id };
//     if (limit) params.limit = limit;
//     return this.getProducts(params);
//   }

//   // backend: /v1/product/random?limit=10
//   getRandomProducts(limit: number = 4, exclude?: string, ?: string): Observable<Product[]> {
//     const queryArray: string[] = [`limit=${limit}`];
//     if (exclude) queryArray.push(`exclude=${exclude}`);
//     if () queryArray.push(`=${}`);
//     const queryParams = `?${queryArray.join('&')}`;

//     return this.http.get<Product[]>(`${this.apiUrl}/random${queryParams}`).pipe(
//       timeout(this.REQUEST_TIMEOUT),
//       retry(this.MAX_RETRIES),
//       tap(products => console.log('Random products loaded:', products)),
//       catchError(this.handleError)
//     );
//   }

//   getProductsByStatus(status: 'instock' | 'lowstock' | 'outofstock'): Observable<ApiProductsResponse> {
//     return this.getProducts({ status });
//   }

//   getLowStockProducts(): Observable<ApiProductsResponse> {
//     return this.getProductsByStatus('lowstock');
//   }

//   getOutOfStockProducts(): Observable<ApiProductsResponse> {
//     return this.getProductsByStatus('outofstock');
//   }

//   notifyStatsUpdate(): void {
//     this.productsUpdatedSubject.next(true);
//   }

//   testConnection(): Observable<any> {
//     return this.http.get(`${this.apiUrl}`).pipe(
//       timeout(5000),
//       tap(() => console.log('API connection successful')),
//       catchError(this.handleError)
//     );
//   }

//   validateProductData(productData: Partial<Product>): string[] {
//     const errors: string[] = [];

//     if (!productData.ten || productData.ten.trim() === '') {
//       errors.push('Tên sản phẩm là bắt buộc');
//     }

//     // validate variants presence
//     if (!productData.variants || productData.variants.length === 0) {
//       errors.push('Phải có ít nhất 1 variant (size, color, price, stock)');
//     } else {
//       productData.variants.forEach((v, i) => {
//         if (v.price === undefined || v.price < 0) errors.push(`Variant ${i + 1}: Giá phải là số dương`);
//         if (v.stock === undefined || v.stock < 0) errors.push(`Variant ${i + 1}: Stock phải là số không âm`);
//         if (!v.color || !this.isValidHexColor(v.color)) errors.push(`Variant ${i + 1}: Color phải là hex hợp lệ`);
//         if (!v.size) errors.push(`Variant ${i + 1}: Size là bắt buộc`);
//       });
//     }

//     if (!productData.) {
//       errors.push('Danh mục là bắt buộc');
//     }

//     if (productData.minStock !== undefined && productData.minStock < 0) {
//       errors.push('Số lượng tối thiểu phải là số không âm');
//     }

//     return errors;
//   }

//   private isValidHexColor(color: string): boolean {
//     return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
//   }

//   private handleError = (error: HttpErrorResponse | any) => {
//     console.error('ProductsService error details:', {
//       error,
//       message: error?.message,
//       stack: error instanceof Error ? error.stack : 'No stack trace'
//     });

//     let errorMessage = 'Lỗi xử lý sản phẩm';

//     if (error instanceof HttpErrorResponse) {
//       console.error('HTTP Error Response:', {
//         status: error.status,
//         statusText: error.statusText,
//         url: error.url,
//         headers: error.headers,
//         error: error.error
//       });

//       switch (error.status) {
//         case 0:
//           errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Kết nối mạng\n2. Server backend\n3. URL API\n4. CORS';
//           break;
//         case 400:
//           errorMessage = `Yêu cầu không hợp lệ: ${this.extractErrorMessage(error)}`;
//           break;
//         case 401:
//           errorMessage = 'Không có quyền truy cập. Vui lòng đăng nhập lại.';
//           break;
//         case 403:
//           errorMessage = 'Không có quyền thực hiện thao tác này.';
//           break;
//         case 404:
//           errorMessage = `Không tìm thấy tài nguyên. URL: ${this.apiUrl}`;
//           break;
//         case 422:
//           errorMessage = `Dữ liệu không hợp lệ: ${this.extractErrorMessage(error)}`;
//           break;
//         case 500:
//           if (error.error?.message?.includes('product validation failed')) {
//             errorMessage = `Dữ liệu sản phẩm không hợp lệ: ${this.extractErrorMessage(error)}`;
//           } else {
//             errorMessage = `Lỗi server nội bộ: ${this.extractErrorMessage(error)}`;
//           }
//           break;
//         case 502:
//           errorMessage = 'Lỗi gateway. Server có thể đang tải hoặc không khả dụng.';
//           break;
//         case 503:
//           errorMessage = 'Server đang bảo trì hoặc quá tải. Vui lòng thử lại sau.';
//           break;
//         case 504:
//           errorMessage = 'Server phản hồi quá chậm. Vui lòng thử lại.';
//           break;
//         default:
//           errorMessage = `Lỗi HTTP ${error.status}: ${this.extractErrorMessage(error)}`;
//       }

//       return throwError(() => new HttpErrorResponse({
//         error: { message: errorMessage, originalError: error },
//         status: error.status,
//         statusText: error.statusText,
//         url: error.url || undefined
//       }));
//     } else {
//       if (error?.message?.includes('timeout')) {
//         errorMessage = 'Kết nối quá chậm. Vui lòng thử lại.';
//       } else {
//         errorMessage = error?.message || 'Lỗi ứng dụng không xác định';
//       }
//       return throwError(() => new Error(errorMessage));
//     }
//   }

//   private extractErrorMessage(error: HttpErrorResponse): string {
//     if (error.error && typeof error.error === 'object') {
//       return error.error.message ||
//              error.error.error ||
//              error.error.details ||
//              JSON.stringify(error.error) ||
//              'Lỗi không xác định';
//     }
//     return error.error || error.message || error.statusText || 'Lỗi không xác định';
//   }
// }
