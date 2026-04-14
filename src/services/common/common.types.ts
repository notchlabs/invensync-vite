export interface PaginatedResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;

    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    nextPage: number;
    previousPage: number;
}