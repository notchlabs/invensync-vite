export interface PaginatedResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;

    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    nextPage: number;
    previousPage: number;
}