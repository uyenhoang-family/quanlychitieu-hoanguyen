export interface Transaction {
  id?: number | string;
  created_at?: string;
  spender: 'Hoàng' | 'Uyên';
  category: string;
  amount: number;
  notes: string;
  image_url?: string;
  transaction_type?: 'thu' | 'chi';
}

export interface Budget {
  hoang: number;
  uyen: number;
}

export interface Category {
  id?: number | string;
  created_at?: string;
  name: string;
  type: 'chung' | 'hoang' | 'uyen'; // 'all' (Danh mục chung), 'hoang' (Hoàng), 'uyen' (Uyên)
}
