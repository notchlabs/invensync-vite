export interface ApiResponse<T> {
  code: number;
  success: boolean;
  message: string;
  systemMessage: string;
  data: T;
}
